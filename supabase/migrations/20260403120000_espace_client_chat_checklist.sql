-- Espace client: checklist JSONB on bookings + chat_messages persistence

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS checklist_state JSONB DEFAULT '{}';

CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chat_messages_session_idx ON chat_messages(session_id);

ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "chat_messages_own_session" ON chat_messages;
CREATE POLICY "chat_messages_own_session" ON chat_messages
  FOR ALL
  USING (
    user_id = (auth.jwt() ->> 'email')
    OR user_id = (auth.uid())::text
  )
  WITH CHECK (
    user_id = (auth.jwt() ->> 'email')
    OR user_id = (auth.uid())::text
  );
