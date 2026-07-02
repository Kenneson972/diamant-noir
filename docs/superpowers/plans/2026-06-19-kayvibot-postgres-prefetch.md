# Migration Kayvibot — Pré-fetch Postgres Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remplacer les `ai_tool` non fonctionnels des agents Kayvibot B et C par un pré-fetch Postgres dans le flux principal (pattern CieloBot), gaté par l'auth API, sans régression de sécurité.

**Architecture:** Pour chaque agent authentifié (B, C) : `Fetch Context (API = portail d'auth)` → `Check Auth (nœud dédié)` → IF → branche autorisée → `Fetch Data (Postgres)` → `Build Context (merge)` → `AI Agent (modèle + mémoire, zéro tool)`. L'agent A reste inchangé (HTTP context-fetch qui calcule la dispo). L'API `owner-context` renvoie désormais le `userId` vérifié pour que le filtre Postgres de B ne dépende jamais d'une valeur client.

**Tech Stack:** n8n (nodes: webhook, set, code, if, postgres, langchain.agent, langchain.lmChatOpenAi, langchain.memoryPostgresChat, respondToWebhook), Next.js App Router (route handler), Supabase Postgres.

## Global Constraints

- Credentials Postgres n8n : `{ "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" }` — INCHANGÉS, réutilisés tels quels.
- Modèle LLM : `deepseek-chat` via `lmChatOpenAi` baseURL `https://api.deepseek.com/v1` — INCHANGÉ.
- Schéma live (source de vérité) : villas(`id,owner_id,name,description,price_per_night,capacity,location,image_url,created_at,is_published`) ; bookings(`id,villa_id,start_date,end_date,status,source,guest_name,guest_email,price,total_price_cents,guests,payment_status,created_at`) ; tasks(`id,villa_id,title,content,type,status,due_date,assigned_to,created_at`) ; ota_sync_logs(`id,villa_id,source,synced_at,inserted,deleted,error,duration_ms`) ; profiles(`id,email,full_name,phone,role,created_at,suspended`).
- Revenu = `COALESCE(total_price_cents, price*100)` (centimes), sur `status='confirmed'`.
- Colonnes à NE JAMAIS exposer : `access_token, ical_url, wifi_password, wifi_name, stripe_*, id_document_url`.
- Aucune connexion `ai_tool` ne doit subsister dans B et C.
- Agent B : le filtre Postgres utilise le `userId` renvoyé par `Fetch Owner Context` (vérifié), JAMAIS `body.userId`. Requête paramétrée `$1`.
- Agent C : le nœud Postgres est sur la branche AUTORISÉE de l'IF (donc jamais exécuté si `requireAdmin` échoue).
- Validation après chaque tâche : `node -e "require('./docs/n8n/<fichier>.json')"` doit réussir.

---

### Task 1: `owner-context` renvoie le `userId` vérifié

**Files:**
- Modify: `app/api/agent/owner-context/route.ts` (bloc `return NextResponse.json({ context, systemPrompt })`)

**Interfaces:**
- Produces: la réponse JSON de `GET /api/agent/owner-context` contient désormais `userId: string` (l'ID résolu/validé serveur). Consommé par le nœud Postgres `Fetch Owner Data` de l'agent B (Task 2) via `queryReplacement`.

- [ ] **Step 1: Lire le bloc return actuel**

Le fichier contient (vers la ligne 43) :
```ts
  const admin = supabaseAdmin();
  const context = await buildOwnerContextPackCached(admin, resolvedUserId);

  return NextResponse.json({
    context,
    systemPrompt: `Tu es Kayvibot Owner, ...`,
  });
```

- [ ] **Step 2: Ajouter `userId` au top-level de la réponse**

Remplacer `return NextResponse.json({` + `    context,` par :
```ts
  return NextResponse.json({
    context,
    userId: resolvedUserId,
```
(garder `systemPrompt` et la fermeture inchangés). `resolvedUserId` est déjà calculé plus haut dans la fonction et est non-null à ce point (les cas null retournent en 401 avant).

- [ ] **Step 3: Vérifier le build**

Run: `npm run build`
Expected: build réussit (warnings ESLint pré-existants tolérés, aucune erreur TypeScript).

- [ ] **Step 4: Commit**

```bash
git add app/api/agent/owner-context/route.ts
git commit -m "feat(owner-context): expose verified userId pour pré-fetch Postgres agent B"
```

---

### Task 2: Agent B — remplacer les 5 ai_tool par un nœud Postgres pré-fetch

**Files:**
- Modify (réécriture complète) : `docs/n8n/kayvibot-agent-b-proprietaire-fusion.json`

**Interfaces:**
- Consumes: `GET /api/agent/owner-context` renvoie `{ context, userId, systemPrompt }` (Task 1).
- Produces: webhook `kayvibot-owner` au comportement inchangé côté réponse (`{ reply, action, alerts, suggestedPrompts, sessionId, userId }`).

**Changements vs fichier actuel :**
1. Supprimer les 5 nœuds `toolHttpRequest` : `myVillas` (b-tool-villas), `myBookings` (b-tool-bookings), `myStats` (b-tool-stats), `myTasks` (b-tool-tasks), `otaStatus` (b-tool-ota) et leurs connexions `ai_tool`.
2. Ajouter un nœud code `Check Auth` (b-auth) après `Fetch Owner Context`.
3. Déplacer l'IF auth pour qu'il précède le Postgres ; brancher Postgres sur la branche autorisée uniquement.
4. Ajouter le nœud Postgres `Fetch Owner Data` (b-data).
5. `Build Context` (b-build) ne fait plus le check auth (déplacé dans Check Auth) et fusionne le JSON Postgres ; retirer la ligne « Utiliser tes outils ... ».

- [ ] **Step 1: Écrire le fichier complet**

Écrire `docs/n8n/kayvibot-agent-b-proprietaire-fusion.json` avec EXACTEMENT ce contenu :

```json
{
  "name": "Kayvibot B — Propriétaire (Fusion v4 — Postgres pré-fetch)",
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "kayvibot-owner", "responseMode": "responseNode", "options": {} },
      "id": "b-webhook", "name": "Webhook Trigger", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0], "webhookId": "kayvibot-owner"
    },
    {
      "parameters": { "assignments": { "assignments": [
        { "id": "b-s1", "name": "chatInput", "value": "={{ $json.body.chatInput || $json.body.message }}", "type": "string" },
        { "id": "b-s2", "name": "sessionId", "value": "={{ $json.body.sessionId || ('session-' + Date.now()) }}", "type": "string" },
        { "id": "b-s3", "name": "userId", "value": "={{ $json.body.userId || $json.body.user_id || '' }}", "type": "string" },
        { "id": "b-s4", "name": "token", "value": "={{ $json.body.token || $json.headers?.authorization?.replace('Bearer ', '') || '' }}", "type": "string" }
      ] } },
      "id": "b-set", "name": "Edit Fields", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [220, 0]
    },
    {
      "parameters": { "url": "={{ $env.KAYVILA_URL || 'https://kayvila.vercel.app' }}/api/agent/owner-context?userId={{ $json.userId }}&token={{ $json.token }}", "options": { "timeout": 10000 } },
      "id": "b-fetch", "name": "Fetch Owner Context", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [440, 0], "continueOnFail": true
    },
    {
      "parameters": { "jsCode": "const ctxRes = $('Fetch Owner Context').first().json;\nconst unauthorized = ctxRes.statusCode === 401 || ctxRes.error === 'Unauthorized' || ctxRes.error === 'Forbidden' || ctxRes.error === 'Utilisateur non trouvé' || ctxRes.error === 'userId ou token requis';\nreturn [{ json: { __unauthorized: unauthorized, sessionId: $('Edit Fields').first().json.sessionId, chatInput: $('Edit Fields').first().json.chatInput, userId: $('Edit Fields').first().json.userId } }];" },
      "id": "b-auth", "name": "Check Auth", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [640, 0]
    },
    {
      "parameters": {
        "conditions": { "options": { "caseSensitive": true, "typeValidation": "strict", "version": 1 }, "conditions": [{ "id": "b-c-unauth", "leftValue": "={{ $json.__unauthorized }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } }], "combinator": "and" }
      },
      "id": "b-if-auth", "name": "IF - Non Autorisé ?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [840, 0]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={{ JSON.stringify({ reply: \"Accès non autorisé. Veuillez vous reconnecter à votre espace propriétaire Kayvila.\", action: \"error\", alerts: [], suggestedPrompts: [] }) }}", "options": { "responseCode": 401 } },
      "id": "b-resp-unauth", "name": "Respond - Non Autorisé", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [1060, 200]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT json_build_object('villas', (SELECT json_agg(v) FROM (SELECT id,name,price_per_night,capacity,location,is_published,created_at FROM villas WHERE owner_id=$1 ORDER BY created_at DESC) v), 'bookings', (SELECT json_agg(b) FROM (SELECT b.id,b.villa_id,b.start_date,b.end_date,b.status,b.guests,b.price,b.total_price_cents FROM bookings b JOIN villas v ON b.villa_id=v.id WHERE v.owner_id=$1 ORDER BY b.start_date DESC LIMIT 50) b), 'tasks', (SELECT json_agg(t) FROM (SELECT id,villa_id,title,status,due_date FROM tasks WHERE villa_id IN (SELECT id FROM villas WHERE owner_id=$1) ORDER BY due_date ASC LIMIT 20) t), 'ota', (SELECT json_agg(o) FROM (SELECT o.villa_id,o.source,o.synced_at,o.error FROM ota_sync_logs o JOIN villas v ON o.villa_id=v.id WHERE v.owner_id=$1 ORDER BY o.synced_at DESC LIMIT 20) o), 'revenue_confirmed_cents', (SELECT COALESCE(SUM(COALESCE(b.total_price_cents,b.price*100)),0) FROM bookings b JOIN villas v ON b.villa_id=v.id WHERE v.owner_id=$1 AND b.status='confirmed')) AS data",
        "options": { "queryReplacement": "={{ $('Fetch Owner Context').first().json.userId }}" }
      },
      "id": "b-data", "name": "Fetch Owner Data", "type": "n8n-nodes-base.postgres", "typeVersion": 2.4, "position": [1060, -160],
      "alwaysOutputData": true, "continueOnFail": true,
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "jsCode": "const ctxRes = $('Fetch Owner Context').first().json;\nconst ctx = ctxRes.context || {};\nconst alerts = ctx.alerts || [];\nconst dataItem = $('Fetch Owner Data').first().json;\nconst data = (dataItem && dataItem.data) || {};\n\nconst now = new Date();\nconst mqStr = (opts) => now.toLocaleString('fr-FR', { timeZone: 'America/Martinique', ...opts });\nconst timeContext = `Date/heure Martinique : ${mqStr({ weekday: 'long' })} ${mqStr({ day: 'numeric', month: 'long', year: 'numeric' })}, ${mqStr({ hour: '2-digit', minute: '2-digit' })}`;\n\nconst basePrompt = ctxRes.systemPrompt || '';\nconst systemMessage = basePrompt\n  + `\\n\\nRAPPEL FORMAT : le champ reply doit etre du texte brut, sans markdown ni emoji.`\n  + `\\n\\n=============================\\n${timeContext}\\nALERTES : ${alerts.length} active(s)\\nDONNEES PROPRIETAIRE (temps reel, source Supabase) :\\n${JSON.stringify(data).slice(0, 6000)}\\n=============================`;\n\nreturn { json: { chatInput: $('Edit Fields').first().json.chatInput, sessionId: $('Edit Fields').first().json.sessionId, userId: $('Edit Fields').first().json.userId, systemMessage } };" },
      "id": "b-build", "name": "Build Context", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1280, -160]
    },
    {
      "parameters": { "promptType": "define", "text": "={{ $json.chatInput }}", "options": { "systemMessage": "={{ $json.systemMessage }}" } },
      "id": "b-agent", "name": "AI Agent DeepSeek", "type": "@n8n/n8n-nodes-langchain.agent", "typeVersion": 3.1, "position": [1500, -160]
    },
    {
      "parameters": { "model": { "__rl": true, "value": "deepseek-chat", "mode": "list" }, "options": { "baseURL": "https://api.deepseek.com/v1", "temperature": 0.3 } },
      "id": "b-model", "name": "DeepSeek Chat Model", "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi", "typeVersion": 1.3, "position": [1340, 40],
      "credentials": { "openAiApi": { "id": "DEEPSEEK_CRED", "name": "DeepSeek API" } }
    },
    {
      "parameters": { "sessionIdType": "customKey", "sessionKey": "={{ $('Edit Fields').first().json.sessionId }}", "contextWindowLength": 10 },
      "id": "b-memory", "name": "Postgres Chat Memory", "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat", "typeVersion": 1.3, "position": [1660, 40],
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "jsCode": "function stripMarkdown(t) {\n  return String(t || '')\n    .replace(/\\*\\*(.*?)\\*\\*/g, '$1')\n    .replace(/\\*(.*?)\\*/g, '$1')\n    .replace(/_{2}(.*?)_{2}/g, '$1')\n    .replace(/_(.*?)_/g, '$1')\n    .replace(/^[ \\t]*#{1,6}[ \\t]+/gm, '')\n    .replace(/^[ \\t]*[-*+][ \\t]+/gm, '')\n    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')\n    .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')\n    .replace(/^-{3,}$/gm, '')\n    .replace(/\\n{3,}/g, '\\n\\n')\n    .trim();\n}\nconst ai = $input.first().json.output || $input.first().json.text || '';\nlet reply = ai, action = 'reply', alerts = [], prompts = [];\ntry {\n  const p = typeof ai === 'string' ? JSON.parse(ai) : ai;\n  if (p && typeof p === 'object') {\n    reply = p.reply || ai;\n    action = p.action || 'reply';\n    alerts = Array.isArray(p.alerts) ? p.alerts : [];\n    prompts = Array.isArray(p.suggestedPrompts) ? p.suggestedPrompts : [];\n  }\n} catch {}\nreply = stripMarkdown(reply);\nreturn { json: { reply, action, alerts, suggestedPrompts: prompts, sessionId: $('Edit Fields').first().json.sessionId, userId: $('Edit Fields').first().json.userId } };" },
      "id": "b-parse", "name": "Parse Response", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1720, -160]
    },
    {
      "parameters": {
        "schema": { "__rl": true, "value": "public", "mode": "list" },
        "table": { "__rl": true, "value": "conversation_memory", "mode": "list" },
        "columns": { "mappingMode": "defineBelow", "value": {
          "session_id": "={{ $json.sessionId }}",
          "conversation_data": "={{ { \"user\": $('Edit Fields').first().json.chatInput, \"assistant\": $json.reply } }}",
          "metadata": "={{ { \"agent\": \"proprietaire\", \"action\": $json.action, \"userId\": $json.userId } }}"
        }, "matchingColumns": [], "schema": [], "attemptToConvertTypes": false, "convertFieldsToString": false }
      },
      "id": "b-save", "name": "Save Memory", "type": "n8n-nodes-base.postgres", "typeVersion": 2.4, "position": [1940, -160],
      "continueOnFail": true,
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={{ JSON.stringify($('Parse Response').first().json) }}", "options": { "responseCode": 200 } },
      "id": "b-respond", "name": "Respond to Webhook", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [2160, -160]
    },
    {
      "parameters": {
        "conditions": { "options": { "caseSensitive": false, "typeValidation": "loose", "version": 2 }, "conditions": [{ "id": "b-urg", "leftValue": "={{ ($('Edit Fields').first().json.chatInput || '').toLowerCase() }}", "rightValue": "\\b(urgent|retard|annul|conflit|probl[eè]me|panne|litige|check-in|checkin|aujourd|ce soir|demain|m[eé]nage pas fait)\\b", "operator": { "type": "string", "operation": "regex" } }], "combinator": "and" }
      },
      "id": "b-if-urg", "name": "IF - Urgent ?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [1940, -380]
    },
    {
      "parameters": {
        "method": "POST",
        "url": "https://api.resend.com/emails",
        "sendHeaders": true,
        "headerParameters": { "parameters": [{ "name": "Authorization", "value": "=Bearer {{ $vars.RESEND_API_KEY }}" }] },
        "sendBody": true,
        "bodyContentType": "json",
        "jsonBody": "={{ JSON.stringify({ from: 'Kayvila <noreply@kayvila.com>', to: [$vars.ADMIN_ALERT_EMAIL || 'admin@kayvila.com'], subject: 'Kayvila — Demande urgente propriétaire', html: '<p><strong>Propriétaire :</strong> ' + $('Edit Fields').first().json.userId + '</p><p><strong>Message :</strong> ' + $('Edit Fields').first().json.chatInput + '</p>' }) }}",
        "options": {}
      },
      "id": "b-resend", "name": "Resend - Alerte Proprio", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [2160, -380],
      "continueOnFail": true
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Edit Fields", "type": "main", "index": 0 }]] },
    "Edit Fields": { "main": [[{ "node": "Fetch Owner Context", "type": "main", "index": 0 }]] },
    "Fetch Owner Context": { "main": [[{ "node": "Check Auth", "type": "main", "index": 0 }]] },
    "Check Auth": { "main": [[{ "node": "IF - Non Autorisé ?", "type": "main", "index": 0 }]] },
    "IF - Non Autorisé ?": { "main": [[{ "node": "Respond - Non Autorisé", "type": "main", "index": 0 }], [{ "node": "Fetch Owner Data", "type": "main", "index": 0 }]] },
    "Fetch Owner Data": { "main": [[{ "node": "Build Context", "type": "main", "index": 0 }]] },
    "Build Context": { "main": [[{ "node": "AI Agent DeepSeek", "type": "main", "index": 0 }]] },
    "AI Agent DeepSeek": { "main": [[{ "node": "Parse Response", "type": "main", "index": 0 }]] },
    "DeepSeek Chat Model": { "ai_languageModel": [[{ "node": "AI Agent DeepSeek", "type": "ai_languageModel", "index": 0 }]] },
    "Postgres Chat Memory": { "ai_memory": [[{ "node": "AI Agent DeepSeek", "type": "ai_memory", "index": 0 }]] },
    "Parse Response": { "main": [[{ "node": "Save Memory", "type": "main", "index": 0 }, { "node": "IF - Urgent ?", "type": "main", "index": 0 }]] },
    "Save Memory": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] },
    "IF - Urgent ?": { "main": [[{ "node": "Resend - Alerte Proprio", "type": "main", "index": 0 }]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }, "pinData": {}, "versionId": "4.0.0-postgres",
  "meta": { "instanceId": "kayvibot-b-fusion-v4" }, "id": "kayvibot-b-fusion-v4",
  "tags": [{ "name": "Kayvibot" }, { "name": "Fusion" }, { "name": "v4" }]
}
```

- [ ] **Step 2: Valider le JSON**

Run: `node -e "const d=require('./docs/n8n/kayvibot-agent-b-proprietaire-fusion.json'); const tools=d.nodes.filter(n=>n.type&&n.type.includes('toolHttpRequest')); const pg=d.nodes.find(n=>n.name==='Fetch Owner Data'); const aiToolConns=Object.values(d.connections).some(c=>c.ai_tool); console.log('JSON OK | toolHttpRequest restants:', tools.length, '| Fetch Owner Data:', pg?'OUI':'NON', '| connexions ai_tool:', aiToolConns?'PRESENTES':'absentes');"`
Expected: `JSON OK | toolHttpRequest restants: 0 | Fetch Owner Data: OUI | connexions ai_tool: absentes`

- [ ] **Step 3: Vérifier la sécurité du filtre (queryReplacement utilise l'userId vérifié)**

Run: `node -e "const d=require('./docs/n8n/kayvibot-agent-b-proprietaire-fusion.json'); const pg=d.nodes.find(n=>n.name==='Fetch Owner Data'); const qr=pg.parameters.options.queryReplacement; console.log('queryReplacement:', qr); console.log('utilise Fetch Owner Context (verifie):', qr.includes(\"Fetch Owner Context\")?'OUI':'NON — DANGER');"`
Expected: `utilise Fetch Owner Context (verifie): OUI`

- [ ] **Step 4: Commit**

```bash
git add docs/n8n/kayvibot-agent-b-proprietaire-fusion.json
git commit -m "feat(n8n/agent-b): pré-fetch Postgres gaté auth, suppression des 5 ai_tool"
```

---

### Task 3: Agent C — remplacer les 6 ai_tool par un nœud Postgres pré-fetch (gaté admin)

**Files:**
- Modify (réécriture complète) : `docs/n8n/kayvibot-agent-c-admin-fusion.json`

**Interfaces:**
- Consumes: `GET /api/agent/admin-context` (auth `requireAdmin`, renvoie `{ context, analytics, systemPrompt }`). Inchangé.
- Produces: webhook `kayvibot-admin`, réponse `{ response, action, action_data, suggested_prompts, sessionId }`.

**Changements vs fichier actuel :**
1. Supprimer les 6 nœuds `toolHttpRequest` : `allVillas`, `allBookings`, `submissions`, `globalStats`, `otaAll`, `users` et leurs connexions `ai_tool`.
2. Ajouter `Check Auth` (c-auth) après `Fetch Admin Context`.
3. IF auth précède le Postgres ; Postgres sur la branche autorisée uniquement (gate admin).
4. Ajouter le nœud Postgres `Fetch Admin Data` (c-data), sans filtre owner.
5. `Build Context` ne fait plus le check auth et fusionne le JSON Postgres.

- [ ] **Step 1: Écrire le fichier complet**

Écrire `docs/n8n/kayvibot-agent-c-admin-fusion.json` avec EXACTEMENT ce contenu :

```json
{
  "name": "Kayvibot C — Admin (Fusion v4 — Postgres pré-fetch)",
  "nodes": [
    {
      "parameters": { "httpMethod": "POST", "path": "kayvibot-admin", "responseMode": "responseNode", "options": {} },
      "id": "c-webhook", "name": "Webhook Trigger", "type": "n8n-nodes-base.webhook", "typeVersion": 2, "position": [0, 0], "webhookId": "kayvibot-admin"
    },
    {
      "parameters": { "assignments": { "assignments": [
        { "id": "c-s1", "name": "chatInput", "value": "={{ $json.body.chatInput || $json.body.message }}", "type": "string" },
        { "id": "c-s2", "name": "sessionId", "value": "={{ $json.body.sessionId || ('session-' + Date.now()) }}", "type": "string" },
        { "id": "c-s3", "name": "token", "value": "={{ $json.body.token || $json.headers?.authorization?.replace('Bearer ', '') || '' }}", "type": "string" }
      ] } },
      "id": "c-set", "name": "Edit Fields", "type": "n8n-nodes-base.set", "typeVersion": 3.4, "position": [220, 0]
    },
    {
      "parameters": { "url": "={{ $env.KAYVILA_URL || 'https://kayvila.vercel.app' }}/api/agent/admin-context", "sendHeaders": true, "headerParameters": { "parameters": [{ "name": "Authorization", "value": "=Bearer {{ $json.token }}" }] }, "options": { "timeout": 15000 } },
      "id": "c-fetch", "name": "Fetch Admin Context", "type": "n8n-nodes-base.httpRequest", "typeVersion": 4.2, "position": [440, 0], "continueOnFail": true
    },
    {
      "parameters": { "jsCode": "const ctxRes = $('Fetch Admin Context').first().json;\nconst unauthorized = ctxRes.statusCode === 401 || ctxRes.statusCode === 403 || ctxRes.error === 'Unauthorized' || ctxRes.error === 'Forbidden' || ctxRes.error === 'Erreur serveur';\nreturn [{ json: { __unauthorized: unauthorized, sessionId: $('Edit Fields').first().json.sessionId, chatInput: $('Edit Fields').first().json.chatInput } }];" },
      "id": "c-auth", "name": "Check Auth", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [640, 0]
    },
    {
      "parameters": {
        "conditions": { "options": { "caseSensitive": true, "typeValidation": "strict", "version": 1 }, "conditions": [{ "id": "c-c-unauth", "leftValue": "={{ $json.__unauthorized }}", "rightValue": true, "operator": { "type": "boolean", "operation": "equals" } }], "combinator": "and" }
      },
      "id": "c-if-auth", "name": "IF - Non Autorisé ?", "type": "n8n-nodes-base.if", "typeVersion": 2, "position": [840, 0]
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={{ JSON.stringify({ response: \"Accès refusé. Cette interface est réservée aux administrateurs Kayvila.\", action: \"error\", action_data: {}, suggested_prompts: [] }) }}", "options": { "responseCode": 401 } },
      "id": "c-resp-unauth", "name": "Respond - Non Autorisé", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [1060, 200]
    },
    {
      "parameters": {
        "operation": "executeQuery",
        "query": "SELECT json_build_object('villas', (SELECT json_agg(v) FROM (SELECT id,name,price_per_night,capacity,location,is_published FROM villas ORDER BY created_at DESC) v), 'bookings', (SELECT json_agg(b) FROM (SELECT b.id,b.villa_id,b.start_date,b.end_date,b.status,b.guest_name,b.price,b.total_price_cents FROM bookings b ORDER BY b.created_at DESC LIMIT 100) b), 'submissions', (SELECT json_agg(s) FROM (SELECT id,villa_name,name,email,status,created_at FROM villa_submissions WHERE status='pending' ORDER BY created_at DESC) s), 'ota', (SELECT json_agg(o) FROM (SELECT o.villa_id,o.source,o.synced_at,o.error FROM ota_sync_logs o ORDER BY o.synced_at DESC LIMIT 50) o), 'users', (SELECT json_agg(p) FROM (SELECT id,email,full_name,role,created_at FROM profiles ORDER BY created_at DESC LIMIT 50) p), 'total_revenue_cents', (SELECT COALESCE(SUM(COALESCE(total_price_cents,price*100)),0) FROM bookings WHERE status='confirmed')) AS data",
        "options": {}
      },
      "id": "c-data", "name": "Fetch Admin Data", "type": "n8n-nodes-base.postgres", "typeVersion": 2.4, "position": [1060, -160],
      "alwaysOutputData": true, "continueOnFail": true,
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "jsCode": "const ctxRes = $('Fetch Admin Context').first().json;\nconst analytics = ctxRes.analytics || {};\nconst briefing = analytics.daily_briefing || {};\nconst alerts = analytics.admin_alerts || [];\nconst dataItem = $('Fetch Admin Data').first().json;\nconst data = (dataItem && dataItem.data) || {};\n\nconst now = new Date();\nconst mqStr = (opts) => now.toLocaleString('fr-FR', { timeZone: 'America/Martinique', ...opts });\nconst timeContext = `Date/heure Martinique : ${mqStr({ weekday: 'long' })} ${mqStr({ day: 'numeric', month: 'long', year: 'numeric' })}, ${mqStr({ hour: '2-digit', minute: '2-digit' })}`;\n\nconst basePrompt = ctxRes.systemPrompt || '';\nconst systemMessage = basePrompt\n  + `\\n\\nRAPPEL FORMAT : le champ response doit etre du texte brut, sans markdown ni emoji.`\n  + `\\n\\n=============================\\n${timeContext}\\nBRIEFING : checkins=${briefing.checkins_today||0}, checkouts=${briefing.checkouts_today||0}, soumissions=${briefing.submissions_pending||0}\\n${alerts.length} alerte(s) active(s)\\nDONNEES PLATEFORME (temps reel, source Supabase) :\\n${JSON.stringify(data).slice(0, 6000)}\\n=============================`;\n\nreturn { json: { chatInput: $('Edit Fields').first().json.chatInput, sessionId: $('Edit Fields').first().json.sessionId, systemMessage } };" },
      "id": "c-build", "name": "Build Context", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1280, -160]
    },
    {
      "parameters": { "promptType": "define", "text": "={{ $json.chatInput }}", "options": { "systemMessage": "={{ $json.systemMessage }}" } },
      "id": "c-agent", "name": "AI Agent DeepSeek", "type": "@n8n/n8n-nodes-langchain.agent", "typeVersion": 3.1, "position": [1500, -160]
    },
    {
      "parameters": { "model": { "__rl": true, "value": "deepseek-chat", "mode": "list" }, "options": { "baseURL": "https://api.deepseek.com/v1", "temperature": 0.2 } },
      "id": "c-model", "name": "DeepSeek Chat Model", "type": "@n8n/n8n-nodes-langchain.lmChatOpenAi", "typeVersion": 1.3, "position": [1340, 40],
      "credentials": { "openAiApi": { "id": "DEEPSEEK_CRED", "name": "DeepSeek API" } }
    },
    {
      "parameters": { "sessionIdType": "customKey", "sessionKey": "={{ $('Edit Fields').first().json.sessionId }}", "contextWindowLength": 10 },
      "id": "c-memory", "name": "Postgres Chat Memory", "type": "@n8n/n8n-nodes-langchain.memoryPostgresChat", "typeVersion": 1.3, "position": [1660, 40],
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "jsCode": "function stripMarkdown(t) {\n  return String(t || '')\n    .replace(/\\*\\*(.*?)\\*\\*/g, '$1')\n    .replace(/\\*(.*?)\\*/g, '$1')\n    .replace(/_{2}(.*?)_{2}/g, '$1')\n    .replace(/_(.*?)_/g, '$1')\n    .replace(/^[ \\t]*#{1,6}[ \\t]+/gm, '')\n    .replace(/^[ \\t]*[-*+][ \\t]+/gm, '')\n    .replace(/`{1,3}([^`]*)`{1,3}/g, '$1')\n    .replace(/\\[([^\\]]+)\\]\\([^)]+\\)/g, '$1')\n    .replace(/^-{3,}$/gm, '')\n    .replace(/\\n{3,}/g, '\\n\\n')\n    .trim();\n}\nconst ai = $input.first().json.output || $input.first().json.text || '';\nlet response = ai, action = 'SHOW_STATS', action_data = {}, prompts = [];\ntry {\n  const p = typeof ai === 'string' ? JSON.parse(ai) : ai;\n  if (p && typeof p === 'object') {\n    response = p.response || p.reply || ai;\n    action = p.action || 'SHOW_STATS';\n    action_data = p.action_data || {};\n    prompts = Array.isArray(p.suggested_prompts) ? p.suggested_prompts : [];\n  }\n} catch {}\nresponse = stripMarkdown(response);\nreturn { json: { response, action, action_data, suggested_prompts: prompts, sessionId: $('Edit Fields').first().json.sessionId } };" },
      "id": "c-parse", "name": "Parse Response", "type": "n8n-nodes-base.code", "typeVersion": 2, "position": [1720, -160]
    },
    {
      "parameters": {
        "schema": { "__rl": true, "value": "public", "mode": "list" },
        "table": { "__rl": true, "value": "conversation_memory", "mode": "list" },
        "columns": { "mappingMode": "defineBelow", "value": {
          "session_id": "={{ $json.sessionId }}",
          "conversation_data": "={{ { \"user\": $('Edit Fields').first().json.chatInput, \"assistant\": $json.response } }}",
          "metadata": "={{ { \"agent\": \"admin\", \"action\": $json.action } }}"
        }, "matchingColumns": [], "schema": [], "attemptToConvertTypes": false, "convertFieldsToString": false }
      },
      "id": "c-save", "name": "Save Memory", "type": "n8n-nodes-base.postgres", "typeVersion": 2.4, "position": [1940, -160],
      "continueOnFail": true,
      "credentials": { "postgres": { "id": "szSBC134iAZHEyPA", "name": "DIAMANT NOIR" } }
    },
    {
      "parameters": { "respondWith": "json", "responseBody": "={{ JSON.stringify($('Parse Response').first().json) }}", "options": { "responseCode": 200 } },
      "id": "c-respond", "name": "Respond to Webhook", "type": "n8n-nodes-base.respondToWebhook", "typeVersion": 1.1, "position": [2160, -160]
    }
  ],
  "connections": {
    "Webhook Trigger": { "main": [[{ "node": "Edit Fields", "type": "main", "index": 0 }]] },
    "Edit Fields": { "main": [[{ "node": "Fetch Admin Context", "type": "main", "index": 0 }]] },
    "Fetch Admin Context": { "main": [[{ "node": "Check Auth", "type": "main", "index": 0 }]] },
    "Check Auth": { "main": [[{ "node": "IF - Non Autorisé ?", "type": "main", "index": 0 }]] },
    "IF - Non Autorisé ?": { "main": [[{ "node": "Respond - Non Autorisé", "type": "main", "index": 0 }], [{ "node": "Fetch Admin Data", "type": "main", "index": 0 }]] },
    "Fetch Admin Data": { "main": [[{ "node": "Build Context", "type": "main", "index": 0 }]] },
    "Build Context": { "main": [[{ "node": "AI Agent DeepSeek", "type": "main", "index": 0 }]] },
    "AI Agent DeepSeek": { "main": [[{ "node": "Parse Response", "type": "main", "index": 0 }]] },
    "DeepSeek Chat Model": { "ai_languageModel": [[{ "node": "AI Agent DeepSeek", "type": "ai_languageModel", "index": 0 }]] },
    "Postgres Chat Memory": { "ai_memory": [[{ "node": "AI Agent DeepSeek", "type": "ai_memory", "index": 0 }]] },
    "Parse Response": { "main": [[{ "node": "Save Memory", "type": "main", "index": 0 }]] },
    "Save Memory": { "main": [[{ "node": "Respond to Webhook", "type": "main", "index": 0 }]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }, "pinData": {}, "versionId": "4.0.0-postgres",
  "meta": { "instanceId": "kayvibot-c-fusion-v4" }, "id": "kayvibot-c-fusion-v4",
  "tags": [{ "name": "Kayvibot" }, { "name": "Fusion" }, { "name": "v4" }]
}
```

- [ ] **Step 2: Valider le JSON + le gate admin**

Run: `node -e "const d=require('./docs/n8n/kayvibot-agent-c-admin-fusion.json'); const tools=d.nodes.filter(n=>n.type&&n.type.includes('toolHttpRequest')); const authBranch=d.connections['IF - Non Autorisé ?'].main[1][0].node; console.log('JSON OK | toolHttpRequest restants:', tools.length, '| branche autorisée IF ->', authBranch, '(doit être Fetch Admin Data)');"`
Expected: `JSON OK | toolHttpRequest restants: 0 | branche autorisée IF -> Fetch Admin Data (doit être Fetch Admin Data)`

- [ ] **Step 3: Commit**

```bash
git add docs/n8n/kayvibot-agent-c-admin-fusion.json
git commit -m "feat(n8n/agent-c): pré-fetch Postgres gaté admin, suppression des 6 ai_tool"
```

---

### Task 4: Agent A — vérifier l'absence d'ai_tool (no-op de fond)

**Files:**
- Verify only (aucune modification attendue) : `docs/n8n/kayvibot-agent-a-visiteur-fusion.json`

**Interfaces:**
- Consumes: rien de nouveau.
- Produces: rien de nouveau. Confirme que A respecte le pattern « zéro tool ».

- [ ] **Step 1: Vérifier l'absence de tool et la présence du fetch HTTP**

Run: `node -e "const d=require('./docs/n8n/kayvibot-agent-a-visiteur-fusion.json'); const tools=d.nodes.filter(n=>n.type&&n.type.includes('toolHttpRequest')); const fetch=d.nodes.find(n=>n.name==='Fetch Visitor Context'); const aiTool=Object.values(d.connections).some(c=>c.ai_tool); console.log('toolHttpRequest:', tools.length, '| Fetch Visitor Context:', fetch?'OUI':'NON', '| connexions ai_tool:', aiTool?'PRESENTES — A CORRIGER':'absentes');"`
Expected: `toolHttpRequest: 0 | Fetch Visitor Context: OUI | connexions ai_tool: absentes`

- [ ] **Step 2: Si une connexion ai_tool ou un toolHttpRequest subsiste, le supprimer**

Si Step 1 montre des tools/connexions ai_tool restants (ne devrait pas — `searchVillas` a déjà été retiré), supprimer le(s) nœud(s) `toolHttpRequest` et la (les) connexion(s) `ai_tool` correspondantes, en gardant le reste du fichier identique. Sinon, aucune action.

- [ ] **Step 3: Pas de commit si aucune modification**

Si aucune modification n'a été faite, ne rien committer. Sinon :
```bash
git add docs/n8n/kayvibot-agent-a-visiteur-fusion.json
git commit -m "chore(n8n/agent-a): confirmer zéro ai_tool (pattern CieloBot)"
```

---

## Vérification finale (après les 4 tâches)

- [ ] **Build complet**

Run: `npm run build`
Expected: build réussit (seule modif code = `owner-context/route.ts` en Task 1).

- [ ] **Validité des 3 JSON**

Run: `for f in a-visiteur b-proprietaire c-admin; do node -e "require('./docs/n8n/kayvibot-agent-$f-fusion.json'); console.log('$f: JSON OK');"; done`
Expected: les 3 lignes `... : JSON OK`.
