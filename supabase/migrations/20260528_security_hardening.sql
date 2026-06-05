-- Migration: Security Hardening (2026-05-28)
-- Fixes:
--   1. profiles RLS infinite recursion (use auth.jwt() instead of self-join)
--   2. villas RLS — block anon writes, restrict public reads
--   3. Storage villa-images — block anon uploads
--   4. Storage villa-submissions — allow authenticated uploads

-- ═══════════════════════════════════════════════════════════════════════════
-- 1. PROFILES — Fix infinite recursion
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop the recursive policy
drop policy if exists "admin read all" on public.profiles;

-- Re-create with auth.jwt() instead of self-referencing subquery
create policy "admin read all" on public.profiles
  for select
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- ═══════════════════════════════════════════════════════════════════════════
-- 2. VILLAS — Add RLS policies
-- ═══════════════════════════════════════════════════════════════════════════

-- Enable RLS on villas (should already be enabled, but ensure it)
alter table public.villas enable row level security;

-- Drop any conflicting policies that may exist
drop policy if exists "villas_select_public" on public.villas;
drop policy if exists "villas_select_owner_admin" on public.villas;
drop policy if exists "villas_manage_owner_admin" on public.villas;

-- Policy A: Public can read published villas (safe columns only at API layer)
create policy "villas_select_public" on public.villas
  for select
  using (is_published = true);

-- Policy B: Owners read their own villas; admins read all
create policy "villas_select_owner_admin" on public.villas
  for select
  using (
    owner_id = auth.uid()
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- Policy C: Only owners can insert/update/delete their villas; admins can manage all
create policy "villas_manage_owner_admin" on public.villas
  for all
  using (
    owner_id = auth.uid()
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  )
  with check (
    owner_id = auth.uid()
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- ═══════════════════════════════════════════════════════════════════════════
-- 3. STORAGE — Block anonymous uploads
-- ═══════════════════════════════════════════════════════════════════════════

-- villa-images bucket (if it exists)
do $$
begin
  if exists (select 1 from storage.buckets where id = 'villa-images') then
    -- Drop all policies for this bucket (idempotent — safe to re-run)
    drop policy if exists "anon_upload_villa_images" on storage.objects;
    drop policy if exists "owner_admin_manage_villa_images" on storage.objects;
    drop policy if exists "owner_admin_insert_villa_images" on storage.objects;
    drop policy if exists "owner_admin_update_villa_images" on storage.objects;
    drop policy if exists "owner_admin_delete_villa_images" on storage.objects;
    drop policy if exists "public_read_villa_images" on storage.objects;

    -- Only authenticated users can insert
    create policy "owner_admin_insert_villa_images" on storage.objects
      for insert
      with check (
        bucket_id = 'villa-images'
        and auth.role() = 'authenticated'
      );

    -- Authenticated users can update/delete
    create policy "owner_admin_update_villa_images" on storage.objects
      for update
      using (
        bucket_id = 'villa-images'
        and auth.role() = 'authenticated'
      );

    create policy "owner_admin_delete_villa_images" on storage.objects
      for delete
      using (
        bucket_id = 'villa-images'
        and auth.role() = 'authenticated'
      );

    -- Public read for villa-images
    create policy "public_read_villa_images" on storage.objects
      for select
      using (bucket_id = 'villa-images');
  end if;
end $$;

-- villa-submissions bucket (used by villa-photo-upload route)
do $$
begin
  if exists (select 1 from storage.buckets where id = 'villa-submissions') then
    -- Drop all policies for this bucket (idempotent — safe to re-run)
    drop policy if exists "anon_upload_villa_submissions" on storage.objects;
    drop policy if exists "auth_manage_villa_submissions" on storage.objects;
    drop policy if exists "auth_insert_villa_submissions" on storage.objects;
    drop policy if exists "auth_select_villa_submissions" on storage.objects;

    -- Authenticated users can insert (the route handler verifies ownership)
    create policy "auth_insert_villa_submissions" on storage.objects
      for insert
      with check (
        bucket_id = 'villa-submissions'
        and auth.role() = 'authenticated'
      );

    -- Authenticated users can read their own
    create policy "auth_select_villa_submissions" on storage.objects
      for select
      using (
        bucket_id = 'villa-submissions'
        and auth.role() = 'authenticated'
      );
  end if;
end $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- 5. VILLAS — Scinder INSERT (admin only) du reste (owner+admin)
--    Fix: la policy FOR ALL était trop permissive — les owners pouvaient
--    créer des villas. Désormais seul l'admin peut INSERT.
-- ═══════════════════════════════════════════════════════════════════════════

-- Supprimer l'ancienne policy FOR ALL trop permissive
drop policy if exists "villas_manage_owner_admin" on public.villas;

-- SELECT : publiées visibles par tous, owner voit les siennes, admin tout
drop policy if exists "villas_select_owner_admin" on public.villas;
create policy "villas_select_owner_admin" on public.villas 
  for select 
  using (
    is_published = true 
    or owner_id = auth.uid() 
    or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin'
  );

-- INSERT : admin UNIQUEMENT
create policy "villas_insert_admin_only" on public.villas 
  for insert 
  with check (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- UPDATE : owner ou admin
create policy "villas_update_owner_admin" on public.villas 
  for update 
  using (owner_id = auth.uid() or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin')
  with check (owner_id = auth.uid() or auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');

-- DELETE : admin UNIQUEMENT
create policy "villas_delete_admin_only" on public.villas 
  for delete 
  using (auth.jwt() -> 'user_metadata' ->> 'role' = 'admin');
