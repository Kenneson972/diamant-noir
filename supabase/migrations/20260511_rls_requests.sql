alter table public.requests enable row level security;

-- Le guest voit/modifie ses propres demandes
create policy "guest_own_requests"
  on public.requests for all
  to authenticated
  using (guest_id = auth.uid());

-- L'admin voit/modifie toutes les demandes
create policy "admin_all_requests"
  on public.requests for all
  to authenticated
  using (exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  ));
