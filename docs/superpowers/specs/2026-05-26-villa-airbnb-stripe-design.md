# Fiches villas Airbnb + Correctifs Stripe

**Date** : 2026-05-26
**Statut** : Validé

## Chantier 1 — Fiches villas style Airbnb

### A. Équipements catégorisés

**Fichier** : `app/villas/[id]/page.tsx`

Ajouter après la section "Les incontournables" (ligne ~327) une section "Ce que propose ce logement" qui affiche les colonnes déjà sélectionnées mais non rendues :

| Colonne | Label | Icônes |
|---------|-------|--------|
| `equipment_interior` | Intérieur | Climatisation→Wind, WiFi→Wifi, Cuisine→Utensils, TV→Tv, etc. |
| `equipment_exterior` | Extérieur | Piscine→Waves, Barbecue→Flame, Jardin→TreePine, Parking→Car |
| `included_services_home` | Services inclus (domicile) | Draps→Bed, Serviettes→ Droplets |
| `included_services_collection` | Services inclus (collection) | Concierge→UserCheck, Accueil→Handshake |
| `a_la_carte_services` | Services à la carte | Chef→ChefHat, Bateau→Ship, Massage→Heart |

- Chaque catégorie → un bloc avec titre et grid 2-4 colonnes d'items icône + label
- Catégorie vide → masquée
- Fonction `getEquipmentIcon()` étendant `getIcon()` existant avec plus de mots-clés
- Remplace le bloc services codé en dur (ligne 278 "Services à la carte") par les données réelles

### B. Section hôte

**Nouveau fichier** : `components/villas/VillaHostCard.tsx`

**Modification** : `app/villas/[id]/page.tsx`

- Modifier la query Supabase pour joindre `profiles` sur `villas.owner_id`
- Nouveau type `VillaHost` dans `types/supabase.ts` :
  ```ts
  type VillaHost = {
    full_name: string | null;
    avatar_url: string | null;
    email: string | null;
    role: string | null;
  };
  ```
- Ajouter `host: VillaHost | null` dans `VillaDetails`
- Composant serveur `VillaHostCard` :
  - Photo (avatar_url ou placeholder cercle avec initiales)
  - `full_name` + badge "Hôte vérifié"
  - Bio générée depuis les données existantes (pas de colonne bio en base, pas de migration)
  - Bouton "Contacter l'hôte" → `/contact`
- Inséré entre "Ce que propose ce logement" et "Avis des voyageurs"

### C. WishlistButton

**Fichier** : `app/villas/[id]/page.tsx`

- Ajouter `<WishlistButton villaId={villa.id} />` à côté du titre (ligne 243), en dehors de `VillaHeaderActions`
- Le composant existe déjà dans `components/villas/WishlistButton.tsx`

### D. Services à la carte dynamiques

- Le bloc "Services à la carte" dans "L'expérience Kayvila" (ligne 278) utilise un tableau codé en dur
- Remplacer par `villa.a_la_carte_services` si non vide, fallback générique sinon

---

## Chantier 2 — Stripe correctifs

### A. API Version

Remplacer `"2023-10-16"` par `"2025-01-27"` dans :
- `lib/stripe/connect.ts` (ligne 10)
- `app/api/booking/route.ts` (ligne 20)
- `app/api/webhooks/stripe/route.ts` (ligne 10)

### B. Stripe Customer

**Fichier** : `app/api/booking/route.ts`

Avant `stripeInstance.checkout.sessions.create()` :
1. Chercher un Customer existant par email (`stripe.customers.list({ email, limit: 1 })`)
2. Si aucun → créer avec `stripe.customers.create({ email, name, metadata })`
3. Dans `sessionParams`, remplacer `customer_email` par `customer: customerId`

### C. Idempotence booking

**Fichier** : `app/api/booking/route.ts`

Avant l'insert `bookings` :
1. Vérifier si un booking existe déjà pour le même `villa_id` + `start_date` + `end_date` + `guest_email` + `status = "pending"`
2. Si oui et qu'il a un `stripe_session_id` → récupérer la session Stripe et retourner son URL
3. Si oui sans session → retourner l'URL de succès existante
4. Sinon → créer normalement

---

## Règles communes

- **Style** : Tailwind existant (border-navy/10, font-display, text-navy, text-gold, arrondi minimal, uppercase tracking)
- **Icônes** : Lucide (déjà en dépendances)
- **TypeScript** : strict, pas de `any`
- **Pas de régression** : `npm run build` doit passer
- **Ne pas toucher** : BookingForm, galerie, calendrier, composants dashboard
- **Ne pas modifier** : migrations Supabase
- **Commits** : un par chantier
