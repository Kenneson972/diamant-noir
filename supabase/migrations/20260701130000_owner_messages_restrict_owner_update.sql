-- Ferme une lacune RLS trouvée en revue finale : owner_messages_update_owner
-- autorisait un propriétaire à modifier N'IMPORTE QUELLE colonne de ses
-- propres lignes (y compris les messages écrits par l'admin), pas seulement
-- read_at. RLS ne peut pas restreindre par colonne — on ajoute donc un
-- trigger qui rejette toute mise à jour "owner" touchant autre chose que
-- read_at.

create or replace function public.owner_messages_restrict_owner_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Les admins (via is_staff_admin()) ne sont pas concernés par cette règle :
  -- la policy owner_messages_update_admin gère déjà leur cas séparément.
  if public.is_staff_admin() then
    return new;
  end if;

  -- Pour un propriétaire, seul read_at peut changer ; tout le reste doit
  -- rester identique à l'ancienne ligne.
  if new.id is distinct from old.id
    or new.owner_id is distinct from old.owner_id
    or new.villa_id is distinct from old.villa_id
    or new.subject is distinct from old.subject
    or new.content is distinct from old.content
    or new.sender_role is distinct from old.sender_role
    or new.sender_id is distinct from old.sender_id
    or new.created_at is distinct from old.created_at
  then
    raise exception 'owner_messages: un propriétaire ne peut modifier que read_at';
  end if;

  return new;
end;
$$;

drop trigger if exists owner_messages_restrict_owner_update on public.owner_messages;
create trigger owner_messages_restrict_owner_update
  before update on public.owner_messages
  for each row
  execute function public.owner_messages_restrict_owner_update();
