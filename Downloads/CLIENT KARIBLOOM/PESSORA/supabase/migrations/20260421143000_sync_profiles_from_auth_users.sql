-- Utilisateurs créés à la main dans Authentication (dashboard Supabase) : souvent
-- pas de ligne dans public.profiles, ou email / prénom / nom vides car le trigger
-- n’a pas tourné ou les métadonnées sont vides.
-- Ce script :
--  0) ajoute la colonne email si le schéma est plus ancien (sans email sur profiles) ;
--  1) insère un profil pour chaque auth.users sans profil (déclenche aussi l’abonnement free si trigger OK) ;
--  2) met à jour email et noms depuis auth.users + user_metadata ;
--  3) crée un abonnement « free » manquant pour tout profil orphelin.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text;

-- 1) Profils manquants
INSERT INTO public.profiles (id, email, first_name, last_name, phone, role)
SELECT
  u.id,
  u.email,
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'first_name', '')), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'last_name', '')), ''),
  NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'phone', '')), ''),
  'member'::text
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = u.id);

-- 2) Compléter / corriger les profils existants (e-mail et noms vides ou obsolètes)
UPDATE public.profiles AS p
SET
  email = COALESCE(NULLIF(TRIM(p.email), ''), u.email),
  first_name = COALESCE(
    NULLIF(TRIM(p.first_name), ''),
    NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'first_name', '')), '')
  ),
  last_name = COALESCE(
    NULLIF(TRIM(p.last_name), ''),
    NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'last_name', '')), '')
  ),
  phone = COALESCE(NULLIF(TRIM(p.phone), ''), NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'phone', '')), ''), p.phone)
FROM auth.users AS u
WHERE p.id = u.id
  AND (
    p.email IS DISTINCT FROM u.email
    OR NULLIF(TRIM(p.email), '') IS NULL
    OR (NULLIF(TRIM(p.first_name), '') IS NULL AND NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'first_name', '')), '') IS NOT NULL)
    OR (NULLIF(TRIM(p.last_name), '') IS NULL AND NULLIF(TRIM(COALESCE(u.raw_user_meta_data->>'last_name', '')), '') IS NOT NULL)
  );

-- 3) Abonnements manquants (si trigger insert profile n’était pas actif à l’époque)
INSERT INTO public.subscriptions (user_id, plan, status)
SELECT p.id, 'free', 'active'
FROM public.profiles p
WHERE NOT EXISTS (SELECT 1 FROM public.subscriptions s WHERE s.user_id = p.id);
