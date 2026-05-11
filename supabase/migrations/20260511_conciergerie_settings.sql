create table if not exists public.conciergerie_settings (
  id smallint primary key default 1 check (id = 1),
  emergency_phone text not null default '+596 696 00 00 00',
  contact_phone text not null default '+596 696 00 00 00',
  contact_email text not null default 'contact@kayvila.com',
  opening_hours jsonb default '[{"day":"Lundi – Vendredi","hours":"8h00 – 20h00"},{"day":"Samedi","hours":"9h00 – 18h00"},{"day":"Dimanche & jours fériés","hours":"Urgences uniquement"}]'::jsonb,
  services jsonb default '[{"label":"Ménage supplémentaire","price":"À partir de 80 €","desc":"Nettoyage complet en cours de séjour"},{"label":"Changement de linge","price":"À partir de 40 €","desc":"Draps, serviettes, torchons renouvelés"},{"label":"Remplissage gaz / eau","price":"Sur devis","desc":"Bouteille de gaz ou bonbonne d''eau remplacée"}]'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.conciergerie_settings enable row level security;

create policy "public_read"
  on public.conciergerie_settings for select
  using (true);

create policy "admin_update"
  on public.conciergerie_settings for update
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));
