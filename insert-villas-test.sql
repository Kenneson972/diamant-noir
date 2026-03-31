-- Script d'insertion de villas de test pour Diamant Noir
-- À exécuter dans le SQL Editor de Supabase

-- IMPORTANT : Remplacez 'VOTRE_USER_ID' par l'UUID d'un utilisateur authentifié
-- Pour obtenir votre user_id :
-- 1. Allez dans Authentication > Users dans Supabase
-- 2. Créez un utilisateur ou copiez l'UUID d'un utilisateur existant
-- 3. Remplacez 'VOTRE_USER_ID' ci-dessous

-- Si vous n'avez pas encore d'utilisateur, créez-en un d'abord :
-- INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, created_at, updated_at)
-- VALUES (
--   gen_random_uuid(),
--   'admin@diamantnoir.com',
--   crypt('votre_mot_de_passe', gen_salt('bf')),
--   now(),
--   now(),
--   now()
-- );

-- Puis récupérez l'UUID généré et utilisez-le ci-dessous

-- ============================================
-- INSERTION DES VILLAS DE TEST
-- ============================================

-- Villa 1 : Diamant Noir (la principale)
INSERT INTO public.villas (
  owner_id,
  name,
  description,
  price_per_night,
  capacity,
  image_url,
  location,
  created_at
) VALUES (
  'VOTRE_USER_ID'::uuid, -- ⚠️ REMPLACEZ PAR VOTRE UUID
  'Villa Diamant Noir',
  'Nichée sur les falaises de la côte méditerranéenne, Diamant Noir offre un mélange inégalé de minimalisme moderne et de beauté côtière brute. Ce chef-d''œuvre architectural dispose de parois de verre du sol au plafond, d''une piscine à débordement chauffée de 25 mètres et d''un chemin privé menant directement à une crique isolée.',
  1000,
  8,
  '/villa-hero.jpg',
  'Côte d''Azur, France',
  now()
);

-- Villa 2 : Villa Azur
INSERT INTO public.villas (
  owner_id,
  name,
  description,
  price_per_night,
  capacity,
  image_url,
  location,
  created_at
) VALUES (
  'VOTRE_USER_ID'::uuid, -- ⚠️ REMPLACEZ PAR VOTRE UUID
  'Villa Azur',
  'Une villa élégante avec vue imprenable sur la baie. Parfaite pour des vacances en famille ou entre amis, avec un jardin méditerranéen et une terrasse ensoleillée face à la mer.',
  1200,
  6,
  '/villa-hero.jpg',
  'Saint-Tropez, France',
  now()
);

-- Villa 3 : Villa Émeraude
INSERT INTO public.villas (
  owner_id,
  name,
  description,
  price_per_night,
  capacity,
  image_url,
  location,
  created_at
) VALUES (
  'VOTRE_USER_ID'::uuid, -- ⚠️ REMPLACEZ PAR VOTRE UUID
  'Villa Émeraude',
  'Entourée par le maquis corse, cette villa offre calme et sérénité. Accès privé à une plage de sable blanc et eaux cristallines. Un véritable joyau de la Méditerranée.',
  900,
  10,
  '/villa-hero.jpg',
  'Corse, France',
  now()
);

-- ============================================
-- VÉRIFICATION
-- ============================================

-- Pour vérifier que les villas ont été insérées :
-- SELECT id, name, location, price_per_night, capacity FROM public.villas;

-- Pour voir toutes les colonnes :
-- SELECT * FROM public.villas ORDER BY created_at DESC;
