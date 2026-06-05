-- ═══════════════════════════════════════════════════════════════════
-- Migration : adapter notifications pour les guests
-- ───────────────────────────────────────────────────────────────────
-- Ajoute user_id, nouveaux types, RLS pour utilisateurs authentifiés.
-- ═══════════════════════════════════════════════════════════════════

-- 1. Ajouter colonne user_id (nullable pour rétrocompatibilité admin)
alter table public.notifications
  add column if not exists user_id uuid references auth.users(id) on delete cascade;

-- 2. Remplacer le CHECK constraint sur type (ajouter types guest)
alter table public.notifications
  drop constraint if exists notifications_type_check;

alter table public.notifications
  add constraint notifications_type_check check (type in (
    'villa_submission',
    'booking_new',
    'booking_confirmed',
    'ical_error',
    'availability_alert',
    'system',
    'request_update',
    'checkin_reminder',
    'checkout_reminder',
    'new_message'
  ));

-- 3. RLS pour utilisateurs authentifiés (guests)
-- Lecture de ses propres notifications
create policy "authenticated_read_own"
  on public.notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Marquage comme lu de ses propres notifications
create policy "authenticated_update_own"
  on public.notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Insertion : tout utilisateur authentifié peut créer des notifs (admin → guest, guest → self)
create policy "authenticated_insert"
  on public.notifications for insert
  to authenticated
  with check (true);

-- 4. Index pour les queries guest
create index if not exists idx_notifications_user
  on public.notifications(user_id, is_read, created_at desc);
