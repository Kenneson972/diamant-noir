# Automatisation n8n — Copilot propriétaire Diamant Noir

Ce document explique **comment le copilot fonctionne**, pourquoi n8n a été **optionnel** au MVP, et comment brancher une **automatisation réelle** (LLM) aujourd’hui.

---

## 1. Comment le copilot fonctionne (clair)

```
Propriétaire (page /dashboard/proprio/assistant)
        │
        ▼
POST /api/dashboard/owner-assistant  +  Authorization: Bearer <JWT>
        │
        ├─► 1) Supabase vérifie l’utilisateur
        ├─► 2) buildOwnerContextPack(owner_id)  →  villas, réservations, tâches, alertes **uniquement pour ce propriétaire**
        ├─► 3) Insert ai_action_logs (audit)
        │
        └─► 4) Variable d’environnement N8N_OWNER_WEBHOOK_URL ?
                    │
                    NON  →  Réponse **locale** (texte construit en Node.js à partir du même contexte — pas d’IA générative)
                    │
                    OUI  →  POST JSON vers **n8n** avec message + contexte → n8n appelle **OpenAI / autre LLM** → renvoie JSON à Next.js → affichage UI
```

**Pourquoi on disait « n8n pas obligatoire » :**  
Sans URL de webhook, l’app **ne plante pas** : elle affiche quand même un résumé **factuel** (chiffres du portefeuille, « aujourd’hui », etc.) généré **dans le code**. Ce n’est pas une conversation IA fluide, mais **les données sont vraies**.  
Avec n8n + LLM, tu ajoutes la **couche langage** (explications, ton, priorités) **en restant ancré** sur le `context` envoyé par l’API.

---

## 2. Variables d’environnement (Vercel / `.env.local`)

| Variable | Rôle |
|----------|------|
| `N8N_OWNER_WEBHOOK_URL` | URL **POST** du Webhook n8n (workflow actif). **Prioritaire** sur `N8N_WEBHOOK_URL` pour cette route uniquement. |
| `N8N_OWNER_WEBHOOK_SECRET` | (Optionnel) Secret partagé ; envoyé en header `X-Webhook-Secret` pour que n8n rejette les appels non autorisés. |
| `N8N_WEBHOOK_URL` | Repli si `N8N_OWNER_WEBHOOK_URL` est vide (même instance n8n, autre chemin possible). |

---

## 3. Corps JSON envoyé par Next.js → n8n (POST)

Champs utiles pour ton workflow :

| Champ | Description |
|--------|-------------|
| `message` | Dernière question du propriétaire (texte). |
| `sessionid` | Corrélation de session (peut être vide). |
| `role` | Toujours `"owner"`. |
| `owner_id` | UUID Supabase Auth du propriétaire. |
| `source` | `"owner_dashboard"`. |
| `context` | Objet **source de vérité** pour le LLM (voir ci-dessous). |

### Objet `context` (enrichi pour l’automatisation)

- `current_date_iso` : horodatage serveur.
- `portfolio` : `total_villas`, `published_villas`, `total_revenue_paid`, `upcoming_bookings_count`, `pending_tasks_count`.
- `today` : évènements du jour (arrivées, séjours, départs).
- `alerts` : lignes `owner_alerts` (titre, corps, sévérité…).
- `tasks_open` : tâches `pending` avec `villa_name` + `content`.
- `villas` : liste courte `{ id, name, slug, is_published }`.
- `stats` : charge utile complète pour les vues (métriques, `rawVillas`, etc.) — voir `ownerContextToStatsPayload` côté code.

**Règle produit :** le LLM doit **s’appuyer uniquement** sur ce JSON. S’il manque une info, il le dit au lieu d’inventer.

---

## 4. Réponse JSON attendue de n8n → Next.js

Le workflow doit répondre en **HTTP 200** avec un JSON **objet** (pas une chaîne seule) :

```json
{
  "response": "Texte affiché dans le chat (français, ton premium, concis).",
  "action": "SHOW_STATS",
  "action_data": {
    "context": {},
    "strategic_alert": null
  }
}
```

| Champ | Obligatoire | Description |
|--------|-------------|-------------|
| `response` | Oui | Texte principal pour le propriétaire. |
| `action` | Non | Défaut côté API : `SHOW_STATS`. Autres valeurs possibles selon tes vues : `SHOW_VILLAS`, `SHOW_BOOKINGS`, etc. |
| `action_data` | Non | Si absent, l’API remplit avec le contexte stats déjà calculé côté serveur. Tu peux surcharger `strategic_alert` : `{ "severity": "high"|"medium"|"low", "description": "..." }`. |

Exemple de fichier : [`owner-copilot-n8n-response.example.json`](owner-copilot-n8n-response.example.json).

---

## 5. Importer le workflow `owner-copilot-workflow-v2.json`

Le fichier est versionné ici : [`owner-copilot-workflow-v2.json`](owner-copilot-workflow-v2.json) (Claude Tool Use + mémoire multi-tour + secret optionnel).

### Option A — Import dans l’UI n8n (le plus simple)

1. n8n → **Workflows** → **⋯** → **Import from File** (ou **Import from URL**).
2. Sélectionner `docs/n8n/owner-copilot-workflow-v2.json` depuis le repo.
3. Ouvrir le nœud **HTTP — Anthropic** : attacher une credential **HTTP Header Auth** avec la clé Anthropic (`x-api-key` ou selon votre config — le workflow utilise le modèle défini dans le nœud).
4. Variables d’environnement **n8n** (Settings → Variables) : optionnellement `N8N_OWNER_WEBHOOK_SECRET` aligné sur Next.js.
5. **Activer** le workflow, puis copier l’URL **Production** du Webhook (path `diamant-owner-copilot`) → la mettre dans **`N8N_OWNER_WEBHOOK_URL`** sur Vercel / `.env.local`.

### Option B — Import via API (script)

1. n8n → **Settings** → **n8n API** → créer une **API Key**.
2. Depuis la racine `diamant-noir` :

```bash
N8N_BASE_URL=https://VOTRE-SOUS-DOMAINE.app.n8n.cloud \
N8N_API_KEY=n8n_api_xxxxxxxx \
node scripts/import-owner-copilot-n8n.mjs
```

*(Remplace l’URL par votre instance : self-hosted ou Cloud.)*

Le script affiche l’`id` du workflow créé. En cas d’erreur credential, importez l’UI et liez la clé Anthropic à la main.

---

## 6. Montage n8n recommandé (minimal « vrai » copilot)

1. **Webhook** — méthode `POST`, path ex. `/webhook/diamant-owner-copilot`, **Respond: Using Respond to Webhook Node**.
2. **IF** (optionnel) — si `N8N_OWNER_WEBHOOK_SECRET` est utilisé : comparer `{{ $json.headers["x-webhook-secret"] }}` ou le header normalisé selon ta version n8n.
3. **OpenAI** (ou **OpenAI Chat Model** + **Agent**, ou **Anthropic**) —  
   - **System** : instructions strictes (voir section 7).  
   - **User** : concaténer `message` + `JSON.stringify(context)` (ou un résumé produit par un nœud **Code**).
4. **Code** — formater la sortie du modèle en `{ response, action, action_data }` si le modèle renvoie du JSON.
5. **Respond to Webhook** — renvoyer le JSON final, `Content-Type: application/json`.

Tester avec **Execute workflow** puis depuis l’app en configurant `N8N_OWNER_WEBHOOK_URL` sur l’URL complète du webhook n8n (prod ou tunnel type ngrok en dev).

---

## 7. Prompt système (exemple FR — à adapter)

```
Tu es l’assistant conciergerie Diamant Noir pour UN propriétaire de villas de luxe en Martinique.

Données FIABLES : uniquement l’objet JSON "context" fourni dans ce message. Tu n’as aucun autre accès à la base.
- Ne invente pas de chiffres, de réservations ou de noms qui ne figurent pas dans context.
- Si une information manque, dis-le clairement.
- Réponds en français, ton professionnel et rassurant, court sauf si le propriétaire demande du détail.
- Priorise : séjour du jour, alertes, tâches ouvertes, puis portefeuille et revenus.

Réponds au format JSON strict :
{"response":"...","action":"SHOW_STATS","action_data":{"strategic_alert":null}}
action_data.context est optionnel ; si omis, le front utilisera les données déjà calculées par l’API.
```

(Affiner selon ton modèle : certains préfèrent une seule sortie texte + nœud Code pour envelopper le JSON.)

---

## 8. Sécurité

- L’API **ne envoie le contexte qu’après** validation JWT ; n8n ne doit **pas** exposer le webhook sans secret en production si l’URL fuite.
- Utiliser **HTTPS** et idéalement **`N8N_OWNER_WEBHOOK_SECRET`** + vérification dans n8n.

---

## 9. Fichiers code liés

- [`app/api/dashboard/owner-assistant/route.ts`](../../app/api/dashboard/owner-assistant/route.ts) — POST vers n8n, repli local si échec.
- [`lib/owner-assistant-context.ts`](../../lib/owner-assistant-context.ts) — construction du pack métier.

---

*Mise à jour : payload `context` enrichi pour automatisation LLM (alertes, tâches, villas, stats complètes).*
