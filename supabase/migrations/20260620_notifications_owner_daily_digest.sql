-- ═══════════════════════════════════════════════════════════════════
-- Migration : ajout type owner_daily_digest — Kayvila
-- ───────────────────────────────────────────────────────────────────
-- Permet au cron Agent B (n8n) d'insérer un digest journalier
-- chaleureux par propriétaire dans la table notifications.
-- ═══════════════════════════════════════════════════════════════════

alter table public.notifications drop constraint if exists notifications_type_check;

alter table public.notifications add constraint notifications_type_check
  check (type = any (array[
    'villa_submission','booking_new','booking_confirmed','ical_error',
    'availability_alert','system','request_update','checkin_reminder',
    'checkout_reminder','new_message',
    'pre_booking','hot_lead','owner_lead','admin_alert',
    'owner_daily_digest'
  ]));
