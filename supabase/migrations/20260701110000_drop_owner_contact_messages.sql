-- Migration : suppression de owner_contact_messages (0 ligne en prod)
-- Remplacée par owner_messages (voir 20260701_owner_messages.sql) — sens unique
-- devenu obsolète avec le nouveau fil à deux sens propriétaire <-> admin.
drop table if exists public.owner_contact_messages;
