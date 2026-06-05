-- Table wishlist (favoris utilisateurs connectés)
CREATE TABLE IF NOT EXISTS wishlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  villa_id UUID NOT NULL REFERENCES villas(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, villa_id)
);

ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_own_wishlist_select ON wishlist;
DROP POLICY IF EXISTS user_own_wishlist_insert ON wishlist;
DROP POLICY IF EXISTS user_own_wishlist_delete ON wishlist;

CREATE POLICY user_own_wishlist_select ON wishlist
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY user_own_wishlist_insert ON wishlist
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_own_wishlist_delete ON wishlist
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_wishlist_user_id ON wishlist(user_id);
