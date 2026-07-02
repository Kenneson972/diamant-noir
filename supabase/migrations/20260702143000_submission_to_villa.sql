-- Capture propre des champs du formulaire de soumission + lien vers la villa créée
alter table public.villa_submissions
  add column if not exists equipements jsonb not null default '[]'::jsonb,
  add column if not exists surface text,
  add column if not exists villa_type text,
  add column if not exists photo_urls jsonb not null default '[]'::jsonb,
  add column if not exists villa_id uuid references public.villas(id) on delete set null;

comment on column public.villa_submissions.villa_id is 'Villa créée automatiquement à l''acceptation (idempotence)';
