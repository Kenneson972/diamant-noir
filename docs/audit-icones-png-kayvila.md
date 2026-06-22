# Audit Icônes PNG Kayvila — État & emplacements à pousser

**Date** : 2026-06-21
**Pack** : 26 icônes PNG Higgsfield dans `public/brand/icons-png/`
**Composant** : `components/icons/KayvilaPngIcon.tsx` (`<KayvilaPngIcon name=… size=… invert? />`)
**Règle de rendu** : PNG = raster ~1024px → net à **≥16px**, flou en dessous. Sur fond sombre → prop `invert` (noir → blanc).

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

### 1. Page « À propos » — banc d'icônes ADN ⭐ (cité par Kenneson)
`app/qui-sommes-nous/page.tsx` (const `ADN`) → rendu via `EditorialServiceGrid` (`components/marketing/editorial-blocks.tsx:59`, **@28px `h-7 w-7`** — taille idéale PNG).
6 items : Shield, **Gem**, MapPin, **Compass**, Sparkles, Heart.
- Mappent : `shield-check`, `location`, `sparkle`, `heart`
- **MANQUENT** : `gem` (rareté/patrimoine), `compass` (ouverture sur l'île)
- ⚠️ Nécessite : soit générer gem+compass, soit le grid accepte un mix png/lucide.
- **Action** : faire évoluer `EditorialServiceGrid` pour accepter `KayvilaPngName | LucideIcon`, puis brancher les 4 mappables (+ gem/compass une fois générés).

### 2. Pages piliers — liste « Ce que nous incluons » ⭐ (cité par Kenneson)
`app/prestations/services/[slug]/page.tsx:203-213` — la liste `d.items` utilise des **puces dorées** (`<span> rounded-full bg-gold`), pas d'icônes.
- **Action** : remplacer la puce par `check-circle` @18-20 (ou l'icône `pilier-*` du service en filigrane). Gros gain visuel, 5 pages d'un coup.

### 3. Homepage — « La conciergerie autrement » (Nos services)
`components/home/HomeConciergeHighlight.tsx` — 6 items @20px (`text-navy/30`).
- Mappent : Sparkles→`sparkle`, Calendar→`calendar`
- **MANQUENT** : Car, UtensilsCrossed, Anchor, ShoppingBag (transferts/chef/nautisme/courses)
- **Action** : générer `car`, `chef`/`utensils`, `anchor`/`boat`, `shopping` → cluster 100% brandé.

### 4. Espace client — bloc conciergerie / contact
`app/espace-client/conciergerie/page.tsx` — Phone, Mail, Clock (+ AlertTriangle manquant). Les 3 premiers mappent → `phone`, `mail`, `clock`.

### 5. Espace client — favoris / réservations
- `app/espace-client/favoris/page.tsx` — Heart, MapPin → `heart`, `location` (ArrowRight=UI).
- `app/espace-client/reservations/[id]/page.tsx` — Calendar, MapPin → `calendar`, `location` (AlertTriangle manquant, ArrowLeft=UI).
- `app/espace-client/page.tsx` — MessageCircle → `message` (CalendarX, BookOpen manquants).

### 6. Booking — cartes de sélection villa
`components/booking/VillaSelectionCard.tsx` — Star, Users, CalendarDays → `star`, `users`, `calendar` (BedDouble manquant, ArrowRight=UI). Vérifier les tailles (souvent 12-14px).
`components/booking/CheckoutView.tsx` — Calendar, Users, ShieldCheck, Mail, User → `calendar`, `users`, `shield-check`, `mail` (User→`users`).

### 7. Dashboard proprio — assistant-views (cartes KPI, ≥16px)
- `VillasView.tsx` — MapPin, Users, Star → `location`, `users`, `star`.
- `PlanningView.tsx` — Calendar, Home → `calendar`, `home`/`villa` (LogIn/LogOut manquants).
- `BookingsView.tsx` — Calendar, Clock → `calendar`, `clock` (CreditCard manquant).
- `FinancesView.tsx` — Euro, Clock → `euro`, `clock` (TrendingUp/Down, BarChart manquants).
- `NotificationBell.tsx` — Bell, Calendar, Key, MessageCircle → `bell`, `calendar`, `key`, `message` (mais taille ~16px en menu, à vérifier).

### 8. Dashboard — en-têtes & copilot
`components/dashboard/admin/AdminCopilotChat.tsx` & `DashboardCopilotChat.tsx` — Sparkles→`sparkle`, ShieldCheck→`shield-check` (Bot, ArrowUp, RotateCcw manquants/UI).

---

## 🔍 Mappables mais TROP PETITS (<14px) — à forcer seulement si Kenneson l'accepte (flou)

| Fichier | Icône | Taille |
|---|---|---|
| `components/villas/VillaHostCard.tsx` | ShieldCheck, Mail | 11, 12px |
| `components/villas/VillaListingCard.tsx` | Users | 14px (+ Maximize2 non mappé) |
| `components/espace-client/BookingCard.tsx` | MapPin, Calendar | 10, 13px |
| `app/(admin)/admin/...` | Star, User, Calendar (tableaux) | 11-14px |

---

## ❌ Icônes MANQUANTES à générer (Higgsfield) pour couvrir le reste

Regroupées par usage, par ordre d'utilité :

### Équipements villa (fiche villa `app/villas/[id]/page.tsx` — gros bloc visible)
`wifi`, `pool`/`waves` (piscine), `ac`/`wind` (climatisation), `parking`/`car`, `kitchen`/`utensils`, `tv`, `washer`/`laundry`, `chef`, `boat`/`ship`, `bed`, `gym`/`dumbbell`, `fireplace`/`flame`, `tree`/`garden`, `plane`/`airport`

### Concepts marque
`gem` (rareté/patrimoine), `compass` (exploration/île), `anchor` (nautisme), `shopping-bag` (courses), `book`/`livret` (welcome book)

### Dashboard / data
`trending-up`, `trending-down`, `chart`/`stats`, `credit-card`, `dollar`, `file-document`, `download`, `upload`, `lock`, `bot`/`ai` (copilot), `door` (check-in/out), `login`/`logout`

### Statut / feedback
`alert`/`warning`, `info`, `x-circle` (erreur), `refresh`/`sync`, `external-link`

---

## 🚫 Gardés en lucide (NE PAS toucher) — contrôles UI

Chevrons (`ChevronLeft/Right/Up/Down`), `X` (fermeture), `Menu` (burger), `Search`, `Plus`/`Minus`, `Loader2`, `ArrowLeft/Right/Up/Down` (navigation/affordance), `Heart` interactif (état rempli/vide au clic — wishlist), `Eye`/`EyeOff` (toggle mot de passe), `Copy`, `Share2`, `Save`, `Trash2`, `Edit3`, `Filter`, `ArrowUpDown`, `SlidersHorizontal`.

---

## Prochaine session — ordre recommandé
1. Générer le pack manquant (équipements + concepts) via Higgsfield (mêmes specs : monoline noir, fond transparent, ~1024px).
2. Faire évoluer `EditorialServiceGrid` (mix png/lucide) → brancher banc ADN « à propos ».
3. Pages piliers : puces → `check-circle` (5 pages).
4. Fiche villa : brancher les équipements (le plus gros gain visuel).
5. Espace client + dashboard assistant-views (clusters ≥16px).
