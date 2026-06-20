-- ═══════════════════════════════════════════════════════════════════
-- Migration : Admin Copilot Phase 1 — tracking modifs villa + audit log
-- ═══════════════════════════════════════════════════════════════════

-- 1) Journal des modifications de villas (attribué au propriétaire de la villa)
create table if not exists public.villa_changes (
  id          uuid primary key default gen_random_uuid(),
  villa_id    uuid not null references public.villas(id) on delete cascade,
  owner_id    uuid,
  field       text not null,
  old_value   text,
  new_value   text,
  changed_at  timestamptz not null default now()
);
create index if not exists idx_villa_changes_recent on public.villa_changes (changed_at desc);
alter table public.villa_changes enable row level security;
create policy "villa_changes_service_all" on public.villa_changes for all using (true) with check (true);

-- 2) Trigger : logge les champs suivis quand ils changent
create or replace function public.log_villa_change() returns trigger
language plpgsql security definer as $$
begin
  if new.price_per_night is distinct from old.price_per_night then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'price_per_night', old.price_per_night::text, new.price_per_night::text);
  end if;
  if new.name is distinct from old.name then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'name', old.name, new.name);
  end if;
  if new.is_published is distinct from old.is_published then
    insert into public.villa_changes(villa_id, owner_id, field, old_value, new_value)
    values (new.id, new.owner_id, 'is_published', old.is_published::text, new.is_published::text);
  end if;
  return new;
end $$;

drop trigger if exists trg_log_villa_change on public.villas;
create trigger trg_log_villa_change after update on public.villas
  for each row execute function public.log_villa_change();

-- 3) Journal d'audit des actions admin
create table if not exists public.admin_action_log (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid not null,
  action      text not null,
  action_data jsonb default '{}',
  result      jsonb default '{}',
  created_at  timestamptz not null default now()
);
create index if not exists idx_admin_action_log_recent on public.admin_action_log (created_at desc);
alter table public.admin_action_log enable row level security;
create policy "admin_action_log_service_all" on public.admin_action_log for all using (true) with check (true);
