# Migration Kayvibot — Pré-fetch Postgres (pattern CieloBot)

**Date :** 2026-06-19
**Statut :** Design validé, prêt pour plan d'implémentation

## Objectif

Remplacer les `ai_tool` (toolHttpRequest) des agents n8n Kayvibot — qui ne fonctionnent pas de
manière fiable — par le pattern éprouvé de CieloBot : **pré-fetch des données dans le flux
principal → assemblage d'un bloc de contexte → injection dans le system prompt → l'agent raisonne
dessus**. Aucun `ai_tool` : l'AI Agent n'a que le modèle de langage et la mémoire.

## Contexte & justification

- Les `ai_tool` (`@n8n/n8n-nodes-langchain.toolHttpRequest`) échouent dans le n8n de Kayvila
  (même classe de bug que l'ancien `searchVillas`).
- CieloBot (référence validée en production) n'utilise **aucun** `ai_tool` : son `AI Agent` n'a que
  `ai_languageModel`. Toutes les données (menu, file d'attente, pizza du chef) sont pré-fetchées
  par des nœuds httpRequest dans le flux principal, puis injectées via un nœud "Build Live Context".
- Les routes API `/api/dashboard/*` (agent B) et `/api/admin/*` (agent C) ne sont **pas** de simples
  passe-plats : elles sont la **barrière d'autorisation** (`requireAuth` dérive `owner_id` du token ;
  `requireAdmin` exige le rôle admin). On les conserve comme **portail d'auth**.

## Décisions validées

1. **Portée :** Postgres pour A + B + C, gatés par l'auth API. Suppression de tous les `ai_tool`.
2. **Agent A reste sur HTTP** (`Fetch Visitor Context`) car cet endpoint calcule la disponibilité
   (croisement bookings + date_blocks + iCal), non reproductible en un seul SELECT. Aucun nœud
   Postgres ajouté à A.
3. **Un seul nœud Postgres consolidé** (JSON via `json_build_object`) par agent B et C : un seul
   aller-retour DB, plus propre que plusieurs nœuds.

## Schéma live vérifié (source de vérité — `information_schema`)

types/supabase.ts est périmé. Colonnes réelles confirmées via Supabase MCP :

- **villas** : `id, owner_id, name, description, price_per_night (int, euros), capacity, location,
  image_url, created_at, is_published`. PAS de colonne `status`.
- **bookings** : `id, villa_id, start_date, end_date, status, source, guest_name, guest_email,
  price (int), total_price_cents (int), guests, payment_status, created_at`. PAS de `check_in` ni
  `total_price`.
- **tasks** : `id, villa_id, title, content, type, status, due_date, assigned_to, created_at`.
- **ota_sync_logs** : `id, villa_id, source, synced_at, inserted, deleted, error, duration_ms`.
  PAS de `last_sync_at`.
- **profiles** : `id, email, full_name, phone, role, created_at, suspended`.

**Revenu** (logique `getBookingPriceCents`) : `COALESCE(total_price_cents, price*100)` en centimes,
sur `status = 'confirmed'`.

## Architecture par agent

### Agent A — `docs/n8n/kayvibot-agent-a-visiteur-fusion.json`
Aucune modification de fond. Vérifier qu'aucun `ai_tool` n'est présent (déjà le cas). Le flux reste :
`Fetch Visitor Context` (HTTP, public, calcule la dispo) → `Build Context` → `AI Agent`.

### Agent B — `docs/n8n/kayvibot-agent-b-proprietaire-fusion.json`
1. **Supprimer** les 5 nœuds `ai_tool` (b-tool-villas, b-tool-bookings, b-tool-stats, b-tool-tasks,
   b-tool-ota) et leurs connexions `ai_tool`.
2. **Conserver** `Fetch Owner Context` comme portail d'auth.
3. **Ajouter** 1 nœud Postgres `Fetch Owner Data` (`n8n-nodes-base.postgres`, executeQuery,
   credentials "DIAMANT NOIR", alwaysOutputData=true, continueOnFail=true) entre `IF - Non Autorisé`
   (branche autorisée) et `Build Context`. Requête **paramétrée** `$1` = userId **vérifié**
   (`queryReplacement`), pas `body.userId` :

```sql
SELECT json_build_object(
  'villas', (SELECT json_agg(v) FROM (SELECT id,name,price_per_night,capacity,location,is_published,created_at FROM villas WHERE owner_id=$1 ORDER BY created_at DESC) v),
  'bookings', (SELECT json_agg(b) FROM (SELECT b.id,b.villa_id,b.start_date,b.end_date,b.status,b.guests,b.price,b.total_price_cents FROM bookings b JOIN villas v ON b.villa_id=v.id WHERE v.owner_id=$1 ORDER BY b.start_date DESC LIMIT 50) b),
  'tasks', (SELECT json_agg(t) FROM (SELECT id,villa_id,title,status,due_date FROM tasks WHERE villa_id IN (SELECT id FROM villas WHERE owner_id=$1) ORDER BY due_date ASC LIMIT 20) t),
  'ota', (SELECT json_agg(o) FROM (SELECT o.villa_id,o.source,o.synced_at,o.error FROM ota_sync_logs o JOIN villas v ON o.villa_id=v.id WHERE v.owner_id=$1 ORDER BY o.synced_at DESC LIMIT 20) o),
  'revenue_confirmed_cents', (SELECT COALESCE(SUM(COALESCE(b.total_price_cents,b.price*100)),0) FROM bookings b JOIN villas v ON b.villa_id=v.id WHERE v.owner_id=$1 AND b.status='confirmed')
) AS data
```

4. **`Build Context`** : injecter le JSON Postgres dans le systemMessage (en plus du systemPrompt API
   et des alertes existantes), texte brut sans emoji.
5. **`owner-context/route.ts`** : ajouter `userId: resolvedUserId` au top-level de la réponse JSON,
   pour que n8n filtre sur l'identité vérifiée et non sur `body.userId`.

### Agent C — `docs/n8n/kayvibot-agent-c-admin-fusion.json`
1. **Supprimer** les 6 nœuds `ai_tool` (allVillas, allBookings, submissions, globalStats, otaAll,
   users) et leurs connexions.
2. **Conserver** `Fetch Admin Context` comme portail (`requireAdmin`).
3. **Ajouter** 1 nœud Postgres `Fetch Admin Data` (mêmes réglages), exécuté **après** le succès du
   fetch admin (donc déjà authentifié admin), sans filtre owner :

```sql
SELECT json_build_object(
  'villas', (SELECT json_agg(v) FROM (SELECT id,name,price_per_night,capacity,location,is_published FROM villas ORDER BY created_at DESC) v),
  'bookings', (SELECT json_agg(b) FROM (SELECT b.id,b.villa_id,b.start_date,b.end_date,b.status,b.guest_name,b.price,b.total_price_cents FROM bookings b ORDER BY b.created_at DESC LIMIT 100) b),
  'submissions', (SELECT json_agg(s) FROM (SELECT id,villa_name,name,email,status,created_at FROM villa_submissions WHERE status='pending' ORDER BY created_at DESC) s),
  'ota', (SELECT json_agg(o) FROM (SELECT o.villa_id,o.source,o.synced_at,o.error FROM ota_sync_logs o ORDER BY o.synced_at DESC LIMIT 50) o),
  'users', (SELECT json_agg(p) FROM (SELECT id,email,full_name,role,created_at FROM profiles ORDER BY created_at DESC LIMIT 50) p),
  'total_revenue_cents', (SELECT COALESCE(SUM(COALESCE(total_price_cents,price*100)),0) FROM bookings WHERE status='confirmed')
) AS data
```

4. **`Build Context`** : injecter le JSON Postgres dans le systemMessage.

## Sécurité

- **Agent B** : filtre sur `userId` **vérifié par l'API** (`owner-context` renvoie `resolvedUserId`),
  jamais `body.userId` → pas d'IDOR. Requête paramétrée `$1` (pas d'interpolation de chaîne).
- **Agent C** : le nœud Postgres ne s'exécute qu'après `Fetch Admin Context` réussi (`requireAdmin`)
  → pas de bypass admin.
- Tous les SELECT excluent les colonnes sensibles : `access_token`, `ical_url`, `wifi_password`,
  `stripe_*`, `id_document_url`.

## Flux de données (B et C, identique en structure)

```
Webhook → Edit Fields → Fetch Context (API, auth gate)
  ├─ non autorisé → Respond 401
  └─ autorisé → Fetch Data (Postgres, identité vérifiée) → Build Context (merge)
       → AI Agent (modèle + Postgres Chat Memory, ZÉRO ai_tool)
       → Parse Response (strip markdown) → Save Memory → Respond
```

## Gestion d'erreur

- Nœud Postgres : `continueOnFail=true` + `alwaysOutputData=true`. Si la requête échoue, `Build
  Context` dégrade en silence (bloc data vide) et l'agent répond sur la base du contexte API seul.
- Auth échouée : `Respond - Non Autorisé` (401) inchangé.

## Vérifications (definition of done)

- Les 3 fichiers JSON restent valides (`node -e "require(...)"`).
- `npm run build` passe (seule modif code : `owner-context/route.ts`).
- Aucune connexion `ai_tool` ne subsiste dans B et C.
- Credentials Postgres "DIAMANT NOIR" inchangés.
- Nœuds non concernés (webhook, memory, parse, save, respond, toxicité A) inchangés.

## Hors périmètre

- Agent A : pas de Postgres (garde le calcul de dispo via HTTP).
- Pas de modification des routes `/api/dashboard/*` ni `/api/admin/*` (elles restent le portail
  d'auth ; on ne les supprime pas).
- Pas de changement de modèle (DeepSeek conservé).
