# PROMPTS CURSOR — Kayvilla Corrections 28 Mai 2026
# Source: clients/kayvilla/audit-global-28mai (gbrain)

---

## LOT 1 — CRITIQUE : Photos admin déconnectées

**Prompt :**
```
Dans le projet Kayvilla, corrige les 3 bugs critiques de l'édition admin des villas :

1. CONNECTE VillaImageManagerWrapper à VillaEditorForm :
   - Dans AdminVillaEditClient.tsx, crée un photosRef (useRef<string[]>)
   - Passe-le à VillaEditorForm via la prop photosRef
   - Passe-le aussi à VillaImageManagerWrapper pour qu'il le mette à jour
   - Quand VillaImageManagerWrapper upload/supprime une photo, mets à jour photosRef.current

2. REMPLACE villa.photos par villa.image_urls :
   - VillaEditorForm.tsx ligne 22 : remplace `villa.photos` par `villa.image_urls`
   - AdminVillaEditClient.tsx ligne 144 : idem
   - ATTENTION : image_urls est TEXT[] ou JSONB. Si c'est JSONB, parse-le.

3. SYNCHRONISE image_url avec image_urls[0] au save :
   - Dans VillaEditorForm.tsx, au moment de construire le payload (ligne ~118),
     après `payload.image_urls = photosRef.current`, ajoute :
     `payload.image_url = photosRef.current[0] || null`
   - Comme ça la check-list "Photo principale" sera mise à jour.

RÈGLES :
- NE touche PAS aux RLS Supabase
- NE modifie PAS le schéma de la base
- Tous les changements côté frontend uniquement
- Le owner doit continuer à utiliser sa page photos dédiée (/dashboard/villas/[id]/photos)
```

---

## LOT 2 — HAUTE : Colonnes et tables fantômes

**Prompt :**
```
Dans le projet Kayvilla, corrige les colonnes et tables fantômes :

1. API reviews cassée (app/api/reviews/route.ts) :
   - Supprime les 5 colonnes fantômes du SELECT : cleanliness_rating, location_rating, 
     communication_rating, value_rating, checkin_rating
   - Garde uniquement : id, villa_id, booking_id, guest_name, rating, comment, created_at
   - Vérifie que le type TypeScript correspondant est aussi corrigé

2. Crée une migration SQL pour les 5 colonnes manquantes sur villas :
   - wifi_name TEXT
   - wifi_password TEXT
   - emergency_contacts JSONB DEFAULT '[]'
   - checkout_instructions TEXT
   - local_recommendations JSONB DEFAULT '[]'
   - Fichier : supabase/migrations/20260528_add_missing_villa_columns.sql
   - Utilise ALTER TABLE IF EXISTS avec ADD COLUMN IF NOT EXISTS

3. Vérifie l'existence des tables tasks et ota_sync_logs :
   - Cherche dans TOUTES les migrations si ces tables sont créées
   - Si elles n'existent pas, NE LES CRÉE PAS — documente juste où elles sont référencées
   - Ajoute un commentaire dans le code aux endroits où elles sont utilisées :
     "// TODO: table tasks non créée par migration — à créer manuellement si nécessaire"

RÈGLES :
- Les migrations SQL doivent être idempotentes (IF NOT EXISTS)
- NE touche PAS aux RLS
```

---

## LOT 3 — MOYENNE : Sécurité API

**Prompt :**
```
Dans le projet Kayvilla, corrige les failles de sécurité API :

1. /api/import-airbnb/route.ts :
   - Ajoute requireAuth (comme dans les autres routes dashboard)
   - Vérifie que l'utilisateur est admin (user_metadata.role === 'admin')
   - Tu peux t'inspirer de app/api/dashboard/create-villa/route.ts

2. /api/dashboard/analytics-villas/route.ts :
   - Ajoute un filtre par owner_id si l'utilisateur n'est pas admin
   - Un owner ne doit voir que les analytics de SES villas
   - Un admin voit tout

3. /api/dashboard/update-villa/route.ts :
   - Ajoute une whitelist des champs modifiables par l'owner
   - L'owner peut modifier : name, description, price_per_night, capacity, location,
     amenities, image_urls, house_rules, check_in_time, check_out_time, min_nights,
     bathrooms_count, surface_m2, latitude, longitude, map_embed_url, airbnb_url,
     equipment_interior, equipment_exterior, safety_info
   - L'admin peut tout modifier (pas de whitelist)
   - Filtre le payload avant l'UPDATE Supabase

RÈGLES :
- Utilise auth.jwt() -> 'user_metadata' ->> 'role' pour vérifier le rôle admin
- Le token JWT est passé dans le header Authorization: Bearer <token>
- supabaseAdmin() est déjà importé
```

---

## LOT 4 — MAJEUR : Champs manquants dans l'éditeur

**Prompt :**
```
Dans le projet Kayvilla, ajoute les champs manquants dans l'édition admin des villas :

1. Dans AdminVillaEditClient.tsx, ajoute une section "Paramètres admin" avec :
   - Toggle is_published (publier/dépublier)
   - Input commission_rate (pourcentage, défaut 25)
   - Select owner_id (dropdown des propriétaires depuis /api/admin/users)
   - Select collection_tier (signature/premium/standard)

2. Dans VillaEditorForm.tsx (ou un nouveau composant VillaPremiumFields.tsx), ajoute 
   les champs pour les 18 colonnes orphelines :
   - Équipements intérieurs (equipment_interior) : tableau de strings
   - Équipements extérieurs (equipment_exterior) : tableau de strings
   - Services inclus — Home (included_services_home) : tableau de strings
   - Services inclus — Collection (included_services_collection) : tableau de strings
   - Services à la carte (a_la_carte_services) : tableau de strings
   - Points d'intérêt proches (nearby_points) : tableau de strings
   - Environnement (environment) : text
   - Conditions de réservation (booking_terms) : JSONB éditeur
   - Politique d'annulation (cancellation_policy) : text
   - Règles de la maison (house_rules) : textarea
   - Infos sécurité (safety_info) : textarea
   - WiFi nom (wifi_name) : input
   - WiFi mot de passe (wifi_password) : input
   - Contacts urgence (emergency_contacts) : JSONB éditeur
   - Recommandations locales (local_recommendations) : JSONB éditeur
   - Consignes check-out (checkout_instructions) : textarea
   - Détail des chambres (rooms_details) : JSONB éditeur
   - Prix saisonniers (seasonal_prices) : JSONB éditeur

3. Organise en sections pliables (collapsible) :
   - 🏠 Informations générales (existant)
   - 🛋️ Équipements & Services
   - 📋 Règles & Sécurité
   - 📍 Localisation & Environs
   - 💰 Prix & Conditions
   - 🔧 Paramètres admin (admin only)

RÈGLES :
- Les champs admin (section 1) ne doivent être visibles QUE pour l'admin
- Le owner ne voit PAS les paramètres admin
- Consulte le schéma réel des colonnes avant d'écrire (utilise le fichier types/database.ts)
- Pour les JSONB, utilise un textarea avec format JSON valide
