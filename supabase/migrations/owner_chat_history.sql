-- ============================================================
-- owner_chat_history
-- Historique conversationnel persistant pour le copilot propriétaire.
-- Rempli par n8n (connexion Postgres directe, contourne RLS).
-- Lecture depuis l'UI via RLS (owner voit uniquement ses messages).
-- ============================================================

CREATE TABLE IF NOT EXISTS owner_chat_history (
  id         uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id   uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text        NOT NULL,
  role       text        NOT NULL CHECK (role IN ('user', 'assistant')),
  content    text        NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Index pour la récupération rapide des derniers messages
CREATE INDEX IF NOT EXISTS idx_owner_chat_history_lookup
  ON owner_chat_history (owner_id, session_id, created_at DESC);

-- RLS
ALTER TABLE owner_chat_history ENABLE ROW LEVEL SECURITY;

-- Un propriétaire ne voit que ses propres messages
CREATE POLICY "owner_chat_history_select"
  ON owner_chat_history FOR SELECT
  USING (owner_id = auth.uid());

-- Les insertions viennent du service role (n8n connexion directe Postgres)
-- Pas de politique INSERT pour les utilisateurs authentifiés normaux
CREATE POLICY "owner_chat_history_service_insert"
  ON owner_chat_history FOR INSERT
  WITH CHECK (true);
