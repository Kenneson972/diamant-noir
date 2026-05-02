-- Migration : Création de la table profiles
-- La table n'existait pas en base, pourtant utilisée par tout le code.

-- 1. Créer la table profiles
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  phone text,
  role text not null default 'tenant' check (role in ('admin', 'proprio', 'owner', 'tenant')),
  avatar_url text,
  created_at timestamptz default now()
);

-- 2. Activer RLS
alter table public.profiles enable row level security;

-- 3. Policies RLS
-- Un utilisateur voit et modifie son propre profil
drop policy if exists "own profile read" on profiles;
create policy "own profile read" on profiles
  for select using (auth.uid() = id);

drop policy if exists "own profile update" on profiles;
create policy "own profile update" on profiles
  for update using (auth.uid() = id);

-- Les admins voient tout
drop policy if exists "admin read all" on profiles;
create policy "admin read all" on profiles
  for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'
  ));

-- Insertion auto du profil à la création d'un utilisateur (trigger)
-- Utile pour l'inscription via le site
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data ->> 'role', 'tenant')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Trigger à la création d'un user auth
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. Index
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_email on profiles(email);
