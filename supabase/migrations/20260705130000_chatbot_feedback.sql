-- supabase/migrations/20260705130000_chatbot_feedback.sql
-- Questions chatbot sans réponse (fallback) — analyse des trous de la FAQ.

CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL CHECK (agent IN ('public', 'admin', 'proprio')),
  session_id TEXT,
  question TEXT NOT NULL,
  matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chatbot_feedback_created_idx ON chatbot_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_feedback_agent_idx ON chatbot_feedback (agent, matched);

-- RLS activée sans policy : accès service-role uniquement (comme admin_chat_logs).
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;
