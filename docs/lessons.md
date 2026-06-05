# Lessons learned — DIAMANTNOIR / Kayvila

## Supabase / PostgREST

- **PGRST201** : si deux FK pointent vers la même table (ex. `bookings_villa_id_fkey` + `fk_bookings_villa`), toujours utiliser l'embed explicite `villas!bookings_villa_id_fkey(name)` — constante `BOOKING_VILLA_EMBED` dans `lib/supabase/embeds.ts`.
- **Admin data** : pages RSC admin → `getAdminDb()` ; composants client interactifs → `/api/admin/*` + `requireAdmin` + `supabaseAdmin()`. Ne pas compter sur RLS browser pour listes cross-user.
- **RLS admin** : source unique `is_staff_admin()` (service_role | JWT metadata | `profiles.role`).
- **Migrations** : vérifier qu'elles sont appliquées en prod (ex. `wishlist` existait dans le repo mais pas en base → 404).
- **Schema drift** : migration SQL → appliquer prod → regen `types/supabase.ts` → `npm run check:schema`.

## Patterns à éviter

- `.select("..., slug, ...")` sans migration préalable en prod.
- `guest_email.eq.${uuid}` pour lier bookings à un client (utiliser `client_user_id` + email profil).
- Filtre `?villa=xxx` forcé en « passées » sur `/admin/reservations` (masque les pending).
