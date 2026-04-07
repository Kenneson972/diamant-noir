# Prompt Claude Code — n8n MCP : workflow « Listing Import Enrich » (vraie automatisation LLM)

> **Usage** : coller le bloc **« PROMPT À COPIER »** dans Claude Code (session avec **MCP n8n** activé). Objectif : **modifier le workflow** `DIAMANT NOIR — Listing Import Enrich` pour que le LLM **enrichisse et corrige** réellement les annonces, pas seulement combler les champs vides.

---

## Contexte côté app (ne pas casser le contrat)

| Élément | Détail |
|--------|--------|
| **Route** | `POST /api/import-airbnb` → `lib/listing-import-ai.ts` → `callN8nEnrich()` |
| **URL webhook attendue** | Variable serveur `LISTING_IMPORT_N8N_WEBHOOK_URL` (ex. `…/webhook/diamant-noir-listing-import`) |
| **Secret** | Header `X-Webhook-Secret` si `LISTING_IMPORT_N8N_WEBHOOK_SECRET` est défini côté Next — **aligner** la vérif n8n sur la même valeur (idéalement via **variable d’environnement n8n**, pas secret en dur dans le JSON exporté). |
| **Body POST** | `source: "listing_import_enrich"`, `pageUrl`, `pageText` (snippet HTML stripé, max ~28k chars), `extractionInstructions` (texte strict Next), `parsed` (objet pré-extrait par parser HTML). |
| **Réponse HTTP 200** | JSON **objet plat** de champs villa, ou enveloppes acceptées par `unwrapN8nListingBody` : `listing`, `data`, `body`, `json`, `result`, ou clés texte `output`, `text`, `response`, `content`, `message` contenant du JSON. **Interdit** dans le JSON renvoyé : `image_url`, `image_urls` (supprimés côté n8n ou ignorés côté Next). |
| **Champs utiles** | `name`, `description`, `location`, `capacity`, `price_per_night`, `bathrooms_count`, `surface_m2`, `check_in_time`, `check_out_time`, `latitude`, `longitude`, `house_rules`, `amenities` (voir `lib/listing-import-types.ts`). |

Réf. doc projet : `docs/n8n/PROMPT_CLAUDE_CODE_LISTING_IMPORT_N8N.md`.

---

## Problème actuel (à corriger dans n8n)

1. **Trop conservateur** : si `parsed` remplit une clé avec une valeur médiocre, le workflow ne la met pas dans `missingKeys` → le prompt pousse le LLM à **ne pas contredire** → peu de corrections.
2. **Instructions système** : `extractionInstructions` doit être en **message système** clair, pas noyé comme second message user.
3. **Un seul passage** sans **audit qualité** (cohérence prix / capacité / texte).
4. **Secret hardcodé** dans un nœud IF → risque sécurité ; préférer comparaison à une variable d’environnement n8n.
5. **Erreurs LLM / parse** : s’assurer que les branches mènent à `respondToWebhook` avec **4xx/5xx** pour que Next remonte `ai_note` utile.

---

## Objectifs d’implémentation (checklist pour Claude Code + MCP n8n)

- [ ] Ouvrir le workflow **« DIAMANT NOIR — Listing Import Enrich »** (id connu du projet : `c8TfAwgSVSsy7iH0`, path webhook : `diamant-noir-listing-import`).
- [ ] **System prompt** (ou équivalent n8n) : fusionner les règles de `extractionInstructions` + règles métier ci-dessous.
- [ ] **User prompt** : `pageUrl`, `parsed` (JSON stringifié), `missingKeys` **et** liste optionnelle `suspectKeys` (voir nœud Code ci-dessous).
- [ ] Ajouter un nœud **Code** avant le LLM qui calcule :
  - `missingKeys` (comme aujourd’hui) ;
  - **`suspectKeys`** : clés où la valeur est remplie mais **courte**, **générique**, ou **incohérente** avec des regex simples (ex. `price_per_night` si &lt; 10 ou &gt; 50000, `capacity` si &gt; 30, description &lt; 40 caractères) — à affiner sans sur-ingénierie.
- [ ] Prompt : inviter le modèle à **corriger** les `suspectKeys` **si** le texte de page apporte une preuve ; sinon laisser ou mettre `null`.
- [ ] **Paramètres DeepSeek** (ou modèle branché) : `maxTokens` suffisant (ex. **3000–4096** pour sortie JSON complète), température basse (**0.2–0.35**).
- [ ] **Réponse 200** : body = objet JSON parsable seul (idéalement `{ "listing": { ... } }` ou plat — compatible avec `unwrapN8nListingBody`).
- [ ] **Sécurité** : remplacer le secret figé par **`{{ $env.LISTING_WEBHOOK_SECRET }}`** ou variable d’instance n8n documentée.
- [ ] **Tester** : exécution manuelle dans n8n avec un payload d’exemple aligné sur `callN8nEnrich` ; puis `curl` depuis la machine dev avec le même body.

---

## Règles métier à ajouter au system prompt (résumé)

- Tu extrais un **objet JSON** décrivant une location ; **aucune clé** `image_url` / `image_urls`.
- **Ne pas inventer** de faits absents du `TEXTE_PAGE` ; utiliser `null` ou omettre la clé si inconnu.
- **Tu peux corriger** une valeur déjà dans `parsed` si le texte prouve qu’elle est erronée ou incomplète (prix, capacité, surface, horaires, titre).
- **Description** : si le texte permet, produire une description **propre** (2–6 phrases) ; sinon garder ou raccourcir selon le texte.
- **Amenities** : liste de chaînes courtes, déduites du texte (pas de HTML).
- Sortie : **un seul objet JSON**, pas de markdown.

---

## PROMPT À COPIER (Claude Code)

```
Tu as accès au MCP **n8n**. Tu travailles pour le projet **Diamant Noir** (repo Next.js `diamant-noir`).

## Mission
Améliorer le workflow n8n **« DIAMANT NOIR — Listing Import Enrich »** (webhook path `diamant-noir-listing-import`, workflow id de référence `c8TfAwgSVSsy7iH0`) pour que l’automatisation d’import d’annonce soit **réellement utile** : le LLM doit compléter les champs vides **et** corriger / enrichir les champs déjà remplis par le parser quand le texte de page le permet — pas seulement remplir `missingKeys`.

## Contrat technique (NE PAS CASSER)
- Le body entrant est celui envoyé par Next : `source`, `pageUrl`, `pageText`, `extractionInstructions`, `parsed`.
- La réponse HTTP 200 doit être du JSON interprétable par le merge côté Next (`unwrapN8nListingBody` dans `lib/listing-import-ai.ts`) : objet plat ou `listing` / `data` / etc.
- Ne jamais renvoyer `image_url` ni `image_urls` dans le JSON final (tu peux les supprimer dans un nœud Code après le LLM).
- Si erreur : répondre avec `respondToWebhook` et code **500** (ou 400) + `{ "error": "..." }` pour que l’API Next remonte une erreur claire.

## Modifications attendues dans n8n (via MCP)
1. **Sécurité** : supprimer tout secret en dur dans un nœud IF ; utiliser une variable d’environnement n8n (ex. `LISTING_WEBHOOK_SECRET`) et documenter que Next doit utiliser la même valeur dans `LISTING_IMPORT_N8N_WEBHOOK_SECRET`.
2. **Nœud Code « Calculer les champs manquants »** : le renforcer pour produire aussi `suspectKeys` (champs remplis mais suspects : description trop courte, prix hors bornes, capacité irréaliste, etc.). Passer `missingKeys`, `suspectKeys` et chaînes lisibles au LLM.
3. **Nœud LLM (chain)** : séparer clairement **System** = règles strictes JSON + règles métier (corriger si preuve dans le texte) + texte de `extractionInstructions` ; **User** = URL, `parsed`, `missingKeys`, `suspectKeys`, `TEXTE_PAGE`. Vérifier la doc n8n pour le nœud `chainLlm` / Basic LLM Chain afin que le rôle system soit bien appliqué.
4. **Paramètres du modèle** (DeepSeek ou autre) : augmenter **max tokens** (≥ 3000 si disponible), température **0.2–0.35**.
5. **Option A (préférée si stable)** : un seul appel LLM avec prompt enrichi. **Option B** : chaîne courte « audit » en second nœud LLM (révision des incohérences) — seulement si une seule passe reste insuffisante ; documenter le surcoût.
6. **Branchements d’erreur** : depuis l’échec du LLM ou du parse JSON, renvoyer **500** avec message explicite.
7. À la fin : décrire les changements (nœuds ajoutés/modifiés), comment tester avec un **POST** identique à `callN8nEnrich` (voir `lib/listing-import-ai.ts`), et rappeler de synchroniser `.env` / Vercel avec le secret webhook.

Ne modifie le code Next.js **que si** tu identifies un écart de contrat indispensable ; sinon concentre-toi sur n8n.
```

---

## Après livraison (humain)

1. Exporter le workflow mis à jour et, si pertinent, le commiter sous `docs/n8n/` (sans secrets).
2. Aligner `LISTING_IMPORT_N8N_WEBHOOK_URL` et `LISTING_IMPORT_N8N_WEBHOOK_SECRET` sur Vercel.
3. Tester depuis le dashboard propriétaire : **Importer les détails** avec la case IA cochée.

---

## Traçabilité

- Journal global : `docs/ACTIONS_LOG.md`
- Journal du jour : `docs/logs/YYYY-MM-DD.md`
