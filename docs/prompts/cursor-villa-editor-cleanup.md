# Prompt Cursor — Villa Editor : nettoyage doublons + import Airbnb

Tu travailles sur le projet Kayvilla (ex-Diamant Noir), une conciergerie de villa basée en Martinique.
Stack : Next.js 15 App Router, TypeScript, Supabase, Stripe Connect, Tailwind.

---

## PARTIE A — Supprimer le doublon équipements/services

Le formulaire d'édition de villa a DEUX sections équipements :
1. `VillaAmenitiesEditorWrapper` (ancien composant, chip-based, stocke dans `amenities[]`)
2. Les nouveaux champs tags dans `VillaFormFields.tsx` section "🛋️ Équipements & Services" (5 champs : equipment_interior, exterior, included_services_home, included_services_collection, a_la_carte_services)

**Action :** On garde les champs tags de VillaFormFields, on vire l'ancien.

### A1. `components/dashboard/proprio/VillaEditorForm.tsx`
- Supprimer l'import de `VillaAmenitiesEditorWrapper`
- Supprimer `amenitiesRef` et son usage
- Supprimer le `<VillaAmenitiesEditorWrapper .../>` du JSX
- Dans `handleSave` : supprimer `payload.amenities = amenitiesRef.current`
- AJOUTER au handleSave TOUS les champs du formulaire qui ne sont pas encore collectés (les 18 nouveaux champs) :
  - `vf-equipment-interior` → `payload.equipment_interior` (split virgules → array)
  - `vf-equipment-exterior` → `payload.equipment_exterior`
  - `vf-included-home` → `payload.included_services_home`
  - `vf-included-collection` → `payload.included_services_collection`
  - `vf-a-la-carte` → `payload.a_la_carte_services`
  - `vf-house-rules` → `payload.house_rules`
  - `vf-safety-info` → `payload.safety_info`
  - `vf-cancellation-policy` → `payload.cancellation_policy`
  - `vf-booking-terms` → `payload.booking_terms` (JSON.parse avec fallback)
  - `vf-wifi-name` → `payload.wifi_name`
  - `vf-wifi-password` → `payload.wifi_password`
  - `vf-emergency-contacts` → `payload.emergency_contacts` (JSON.parse avec fallback `[]`)
  - `vf-checkout-instructions` → `payload.checkout_instructions`
  - `vf-environment` → `payload.environment`
  - `vf-nearby-points` → `payload.nearby_points` (split virgules → array)
  - `vf-rooms-details` → `payload.rooms_details` (JSON.parse avec fallback `[]`)
  - `vf-seasonal-prices` → `payload.seasonal_prices` (JSON.parse avec fallback `[]`)

### A2. `components/dashboard/villa-editor/VillaAmenitiesEditorWrapper.tsx`
- NE PAS supprimer le fichier (l'ancien composant peut resservir). Juste ne plus l'utiliser dans VillaEditorForm.

---

## PARTIE B — Bouton "Importer depuis Airbnb"

À côté du champ URL Airbnb (`vf-airbnb`), ajouter un bouton qui importe automatiquement les infos.

### B1. `components/dashboard/villa-editor/VillaFormFields.tsx`
- Le composant a besoin d'accéder au state du form. Passer une prop `onImportStart` et `onImportComplete` depuis le parent, OU gérer l'import directement dans VillaEditorForm.
- **Option recommandée** : Gérer dans VillaEditorForm (plus simple, accès aux champs DOM + toast).

### B2. `components/dashboard/proprio/VillaEditorForm.tsx`
- Ajouter un bouton "📥 Importer depuis Airbnb" DANS la section "Informations générales", à droite du champ Airbnb URL.
- Au clic :
  1. Lire la valeur du champ `vf-airbnb`
  2. Si vide → toast "Veuillez entrer une URL Airbnb"
  3. Appeler `POST /api/import-airbnb` avec `{ url: airbnbUrl }`
  4. Pendant l'appel → bouton en loading "⏳ Import en cours..."
  5. Au retour → remplir automatiquement les champs :
     - `vf-name` ← data.name
     - `vf-desc` ← data.description
     - `vf-location` ← data.location
     - `vf-capacity` ← data.capacity
     - `vf-bathrooms` ← data.bathrooms
     - `vf-surface` ← data.surface
     - `vf-latitude` ← data.latitude
     - `vf-longitude` ← data.longitude
     - `vf-equipment-interior` ← data.equipment_interior (join ", ")
     - `vf-equipment-exterior` ← data.equipment_exterior
     - `vf-house-rules` ← data.house_rules
     - `vf-checkin` ← data.check_in_time
     - `vf-checkout` ← data.check_out_time
     - `image_urls` ← data.photos (via photosRef)
  6. Toast "✅ Import réussi — X champs remplis"
  7. En cas d'erreur → toast "❌ Échec de l'import : [message]"

**Note :** La route `/api/import-airbnb` est déjà sécurisée avec `requireAdmin`. Elle retourne un JSON structuré avec tous les champs.

---

## PARTIE C — Nettoyage fiche villa publique

### C1. `app/villas/[id]/page.tsx`
- La section "Les incontournables" (lignes 382-394) affiche l'ancien tableau `villa.amenities[]`. 
- La supprimer OU la fusionner avec "Ce que propose ce logement".
- **Recommandé :** Supprimer "Les incontournables" (basé sur `amenities[]`). Garder uniquement "Ce que propose ce logement" qui affiche déjà les nouveaux champs.
- Si `amenities` existe encore en fallback → le convertir et l'afficher dans la section equipment_interior pour pas perdre les données existantes.

### C2. Style — vérifier que la section "Ce que propose ce logement" est belle
- Les icônes doivent être cohérentes avec le ton luxe du site (couleur gold/navy)
- Le composant `EquipmentCategory` doit afficher les items avec des puces élégantes
- Si pas déjà fait, ajouter des icônes par catégorie (🏠 Intérieur, 🌴 Extérieur, 🏠 Services inclus, ✨ À la carte)

---

## RÈGLES
- Ne jamais supprimer de fichiers sans vérifier qu'ils ne sont pas importés ailleurs
- Tester que le build passe après chaque modification
- Utiliser les classes Tailwind existantes du projet (gold, navy, muted, border-subtle)
- Les toasts utilisent le système existant dans VillaEditorForm (`showToast`)
- Le bouton d'import doit être stylé comme le reste (rounded-xl, navy/gold)
