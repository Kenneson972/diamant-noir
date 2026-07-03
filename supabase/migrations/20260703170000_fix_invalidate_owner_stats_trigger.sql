-- Fix P0 : invalidate_owner_stats_snapshot faisait SET computed_at = NULL
-- alors que owner_stats_snapshots.computed_at est NOT NULL → tout
-- INSERT/UPDATE/DELETE sur bookings échouait ("null value in column
-- computed_at") dès qu'un snapshot de stats existait pour la villa/année
-- concernée = blocage total de la création de réservations.
-- Invalidation par suppression du snapshot : la fonction edge
-- recompute-owner-stats le reconstruit au prochain passage.
-- (Appliquée en prod via MCP le 2026-07-03.)
CREATE OR REPLACE FUNCTION invalidate_owner_stats_snapshot()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  DELETE FROM owner_stats_snapshots
  WHERE villa_id = COALESCE(NEW.villa_id, OLD.villa_id)
    AND year = EXTRACT(year FROM COALESCE(NEW.start_date, OLD.start_date))::int;
  RETURN NULL;
END;
$$;
