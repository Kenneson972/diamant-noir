# Récap — Copilot Propriétaire : Migration SQL + Workflow n8n v2

---

## 1. Migration SQL à appliquer

**Fichier :** `supabase/migrations/owner_chat_history.sql`

```sql
CREATE TABLE IF NOT EXISTS owner_chat_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text        NOT NULL,
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_owner_chat_history_lookup
  ON owner_chat_history (owner_id, session_id, created_at DESC);

ALTER TABLE owner_chat_history ENABLE ROW LEVEL SECURITY;

-- Owner voit uniquement ses propres messages
CREATE POLICY "owner_chat_history_select"
  ON owner_chat_history FOR SELECT
  USING (owner_id = auth.uid());

-- Insertions via n8n (service role, connexion directe Postgres)
CREATE POLICY "owner_chat_history_service_insert"
  ON owner_chat_history FOR INSERT
  WITH CHECK (true);
```

**Comment appliquer :**
→ Supabase Dashboard → SQL Editor → coller et exécuter
*(ou `supabase db push` si CLI configurée)*

---

## 2. Workflow n8n v2 — Fonctionnement

**Fichier :** `docs/n8n/owner-copilot-workflow-v2.json`

### Chaîne de nœuds

```
Webhook (POST)
  → Code — Sécurité & Extraction
  → IF — owner_id valide ?
      ✅ OUI →
          → Postgres — Lire historique           (SELECT 12 derniers messages par owner_id + session_id)
          → Code — Préparer contexte LLM         (portfolio, today, alerts, tasks_open)
          → Code — Construire messages Claude    (DB history > payload history, tool défini)
          → HTTP — Anthropic Claude Tool Use     (claude-opus-4-6, tool_choice: "any")
          → Code — Parser réponse Tool Use       (extrait tool_use.input)
          → Respond — 200 OK                     ← réponse envoyée ici
          → Code — Préparer sauvegarde           (2 items : user + assistant)
          → Postgres — Sauvegarder échange       (INSERT dans owner_chat_history)
      ❌ NON →
          → Respond — 401 Unauthorized
      ⚠️ ERREUR Claude →
          → Code — Fallback
          → Respond — 200 Fallback
```

### L'outil Claude (`respond_to_owner`)

Claude **doit** répondre via cet outil — `tool_choice: "any"` le force :

```json
{
  "name": "respond_to_owner",
  "input_schema": {
    "properties": {
      "response": { "type": "string" },
      "action": { "enum": ["SHOW_STATS", "SHOW_BOOKINGS", "SHOW_VILLAS", "SHOW_TASKS"] },
      "strategic_alert": { "type": ["object", "null"] }
    },
    "required": ["response", "action"]
  }
}
```

### Mémoire multi-tour

- **DB history** (persistant, survit à la fermeture du navigateur) : priorité si disponible
- **Payload history** (session en cours, envoyé par l'UI) : fallback si DB vide
- Logique dans "Build Messages" : `dbHistory.length > 0 ? dbHistory : payloadHistory`

---

## 3. Checklist de mise en service

| # | Action | Où |
|---|--------|----|
| 1 | Appliquer la migration SQL | Supabase → SQL Editor |
| 2 | Importer `owner-copilot-workflow-v2.json` | n8n → Import from file |
| 3 | Créer credential Postgres dans n8n | Host: `db.[project-ref].supabase.co`, Port: 5432 |
| 4 | Créer credential Anthropic dans n8n | HTTP Header Auth → `x-api-key` |
| 5 | Ajouter les variables Vercel | `N8N_OWNER_WEBHOOK_URL` + `N8N_OWNER_WEBHOOK_SECRET` |
| 6 | Activer le workflow | Toggle ON dans n8n |
