-- Aligne owner_messages sur le helper is_staff_admin() (source unique admin,
-- cf. 20260606200000_admin_supabase_standardize.sql) plutôt que le check JWT
-- inline utilisé dans la migration initiale (20260701_owner_messages.sql).

drop policy if exists owner_messages_select_admin on public.owner_messages;
create policy owner_messages_select_admin
  on public.owner_messages for select
  using (public.is_staff_admin());

drop policy if exists owner_messages_insert_admin on public.owner_messages;
create policy owner_messages_insert_admin
  on public.owner_messages for insert
  with check (
    public.is_staff_admin()
    and sender_id = auth.uid()
    and sender_role = 'admin'
  );

drop policy if exists owner_messages_update_admin on public.owner_messages;
create policy owner_messages_update_admin
  on public.owner_messages for update
  using (public.is_staff_admin())
  with check (public.is_staff_admin());
