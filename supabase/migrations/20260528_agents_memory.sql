-- ============================================================================
-- Agents Kayvila (n8n) — tables de mémoire conversationnelle + bannissement
-- Communes aux 3 agents (A Visiteur, B Propriétaire, C Admin)
-- ============================================================================

-- Historique conversationnel (20-50 derniers messages selon l'agent)
CREATE TABLE IF NOT EXISTS conversation_memory (
  id BIGSERIAL PRIMARY KEY,
  session_id TEXT NOT NULL,
  conversation_data JSONB NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_conversation_memory_session
  ON conversation_memory (session_id, created_at);

-- Sessions bannies (sécurité : bloque les abuseurs en amont du LLM)
CREATE TABLE IF NOT EXISTS banned_sessions (
  session_id TEXT PRIMARY KEY,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- RLS : ces tables sont écrites/lues uniquement par n8n via la connexion
-- Postgres directe (service-level). On active RLS et on n'ouvre AUCUNE policy
-- publique : seul le rôle Postgres utilisé par n8n (propriétaire / service)
-- y accède. Aucun accès via la clé anon du navigateur.
-- ----------------------------------------------------------------------------
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_sessions ENABLE ROW LEVEL SECURITY;
