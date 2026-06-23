# Audit Icônes PNG Kayvila — État & emplacements à pousser

**Date** : 2026-06-22 (mis à jour)
**Pack** : 69 icônes PNG Higgsfield dans `public/brand/icons-png/`
**Composant** : `components/icons/KayvilaPngIcon.tsx` (`<KayvilaPngIcon name=… size=… invert? />`)
**Règle de rendu** : PNG = raster ~1024px → net à **≥16px**, flou en dessous. Sur fond sombre → prop `invert` (noir → blanc).

---

## 📊 État du pack — 45 noms canoniques dans le composant

### Équipements villa (14) — ✅ TOUS DISPONIBLES
`ac`, `anchor`, `bed`, `boat`, `car`, `chef`, `fireplace`, `gym`, `kitchen`, `plane`, `pool`, `tree`, `tv`, `wash`, `wifi`

### Concepts marque (5) — ✅ TOUS DISPONIBLES
`gem`, `compass`, `shopping-bag`, `book`, `handshake`

### Dashboard / data (11) — ✅ TOUS DISPONIBLES
`chart`, `credit-card`, `doc`, `door`, `download`, `euro`/`euros`, `lock`, `login`, `logout`, `trend-down`, `trending-up`, `upload`

### Piliers (5) — ✅ TOUS DISPONIBLES
`pilier-finance`, `pilier-marketing`, `pilier-menage`, `pilier-operations`, `pilier-voyageurs`

### UI / statut / génériques (10) — ✅ TOUS DISPONIBLES
`arrow-right`, `bell`, `calendar`, `check-circle`, `clock`, `clock-247`, `heart`, `home`, `key`, `location`, `mail`, `message`, `phone`, `shield-check`, `sparkle`, `star`, `users`, `villa`, `maison`, `camera`

---

## ✅ Déjà branché (live en prod)

| Fichier | Emplacement | Icônes |
|---|---|---|
| `components/home/HomeServicesSection.tsx` | Homepage — 5 cartes piliers (en-tête) | `pilier-marketing/operations/voyageurs/menage/finance` @36 |
| `app/contact/page.tsx` | Titre FAQ + note chatbot | `message` @28, `mail` @20 |
| `app/prestations/PrestationsPageClient.tsx` | Bloc réassurances | `shield-check`, `clock`, `star` @22 |
| `app/prestations/services/[slug]/page.tsx` | Eyebrow hero (par pilier) | `pilier-*` @20 invert |
| `components/espace-client/CheckinGuide.tsx` | Carte check-in locataire | `clock`, `location`, `phone` @16-18 |
| `components/home/HomeLifestyleAudience.tsx` | (section non montée actuellement) | `shield-check`, `calendar` invert |

---

## 🎯 À POUSSER — emplacements identifiés (priorité haute → basse)

### 1. Page « À propos » — banc d'icônes ADN ⭐
`app/qui-sommes-nous/page.tsx` (const `ADN`) → rendu via `EditorialServiceGrid` (`components/marketing/editorial-blocks.tsx:59`, **@28px `h-7 w-7`**).
6 items : Shield, **Gem**, MapPin, **Compass**, Sparkles, Heart.
- `shield-check` ✅, `location` ✅, `sparkle` ✅, `heart` ✅
- `gem` ✅ (NOUVEAU), `compass` ✅ (NOUVEAU)
- **Action** : faire évoluer `EditorialServiceGrid` pour accepter `KayvilaPngName | LucideIcon`, puis brancher les 6.

### 2. Pages piliers — liste « Ce que nous incluons » ⭐
`app/prestations/services/[slug]/page.tsx:203-213` — remplacer la puce dorée par `check-circle` @18-20.

### 3. Homepage — « La conciergerie autrement » (Nos services)
`components/home/HomeConciergeHighlight.tsx` — 6 items @20px.
- Sparkles→`sparkle` ✅, Calendar→`calendar` ✅
- Car→`car` ✅, UtensilsCrossed→`chef` ✅, Anchor→`anchor` ✅, ShoppingBag→`shopping-bag` ✅
- **Action** : brancher les 6.

### 4. Fiche villa — équipements ⭐ (plus gros gain visuel)
`app/villas/[id]/page.tsx` — bloc équipements.
- `wifi` ✅, `pool` ✅, `ac` ✅, `car` ✅, `kitchen` ✅, `tv` ✅, `wash` ✅, `chef` ✅, `boat` ✅, `bed` ✅, `gym` ✅, `fireplace` ✅, `tree` ✅, `plane` ✅

### 5. Espace client — conciergerie / contact
`app/espace-client/conciergerie/page.tsx` — `phone` ✅, `mail` ✅, `clock` ✅

### 6. Espace client — favoris / réservations
- `app/espace-client/favoris/page.tsx` — `heart` ✅, `location` ✅
- `app/espace-client/reservations/[id]/page.tsx` — `calendar` ✅, `location` ✅
- `app/espace-client/page.tsx` — `message` ✅

### 7. Booking — cartes de sélection villa
`components/booking/VillaSelectionCard.tsx` — `star` ✅, `users` ✅, `calendar` ✅
`components/booking/CheckoutView.tsx` — `calendar` ✅, `users` ✅, `shield-check` ✅, `mail` ✅

### 8. Dashboard proprio — assistant-views (≥16px)
- `VillasView.tsx` — `location` ✅, `users` ✅, `star` ✅
- `PlanningView.tsx` — `calendar` ✅, `home` ✅, `login` ✅, `logout` ✅
- `BookingsView.tsx` — `calendar` ✅, `clock` ✅, `credit-card` ✅
- `FinancesView.tsx` — `euro` ✅, `clock` ✅, `trending-up` ✅, `trend-down` ✅, `chart` ✅
- `NotificationBell.tsx` — `bell` ✅, `calendar` ✅, `key` ✅, `message` ✅

### 9. Dashboard — en-têtes & copilot
`components/dashboard/admin/AdminCopilotChat.tsx` & `DashboardCopilotChat.tsx` — `sparkle` ✅, `shield-check` ✅

---

## 🔍 Mappables mais TROP PETITS (<14px)

| Fichier | Icône | Taille |
|---|---|---|
| `components/villas/VillaHostCard.tsx` | ShieldCheck, Mail | 11, 12px |
| `components/villas/VillaListingCard.tsx` | Users | 14px |
| `components/espace-client/BookingCard.tsx` | MapPin, Calendar | 10, 13px |
| `app/(admin)/admin/...` | Star, User, Calendar (tableaux) | 11-14px |

---

## ❌ Icônes encore MANQUANTES

### Statut / feedback
`alert`/`warning`, `info`, `x-circle`, `refresh`/`sync`, `external-link`

### Dashboard
`bot`/`ai` (copilot)

### Équipements
`garden`/`yard` (jardin distinct de tree)

---

## 🚫 Gardés en lucide (NE PAS toucher) — contrôles UI

Chevrons (`ChevronLeft/Right/Up/Down`), `X` (fermeture), `Menu` (burger), `Search`, `Plus`/`Minus`, `Loader2`, `ArrowLeft/Right/Up/Down` (navigation/affordance), `Heart` interactif (état rempli/vide au clic — wishlist), `Eye`/`EyeOff` (toggle mot de passe), `Copy`, `Share2`, `Save`, `Trash2`, `Edit3`, `Filter`, `ArrowUpDown`, `SlidersHorizontal`.

---

## Prochaine session — ordre recommandé
1. Brancher le banc ADN « à propos » (gem + compass dispo)
2. Pages piliers : puces → `check-circle` (5 pages d'un coup)
3. Fiche villa : brancher les 14 équipements (plus gros gain visuel)
4. Homepage : `HomeConciergeHighlight` (6 icônes brandées)
5. Espace client + dashboard (clusters ≥16px)
6. Générer les 6-7 icônes manquantes (alert, info, x-circle, refresh, external-link, bot)
