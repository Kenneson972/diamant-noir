# Cartographie Icônes PNG Kayvila — Pack 2 (Équipements · Marque · Dashboard)

**Date** : 2026-06-22
**Pack** : 32 nouvelles icônes PNG Higgsfield (monoline noir, fond transparent, ~1024px)
**Composant** : `components/icons/KayvilaPngIcon.tsx` (`<KayvilaPngIcon name=… size=… invert? />`)
**Règle de rendu** : net à **≥16px** ; sur fond sombre → prop `invert`.

> Pré-requis : ajouter ces 32 slugs à `public/brand/icons-png/` (table de renommage en bas)
> + au registre `ICONS` de `KayvilaPngIcon.tsx`.

---

## Table de renommage (Higgsfield → slug web)

| Nom téléchargé | slug | Cluster |
|---|---|---|
| WIFI | `wifi` | équipement |
| PISCINE / POOL | `pool` | équipement |
| CLIM / AC | `ac` | équipement |
| VOITURE / CAR | `car` | équipement |
| CUISINE / KITCHEN | `kitchen` | équipement |
| TV | `tv` | équipement |
| LAVELINGE / WASHER | `washer` | équipement |
| CHEF | `chef` | équipement |
| BATEAU / BOAT | `boat` | équipement |
| LIT / BED | `bed` | équipement |
| GYM | `gym` | équipement |
| CHEMINEE / FIREPLACE | `fireplace` | équipement |
| ARBRE / TREE | `tree` | équipement |
| AVION / PLANE | `plane` | équipement |
| GEM | `gem` | marque |
| COMPASS | `compass` | marque |
| ANCHOR | `anchor` | marque |
| SHOPPINGBAG | `shopping-bag` | marque |
| BOOK | `book` | marque |
| TRENDINGUP | `trending-up` | dashboard |
| TRENDINGDOWN | `trending-down` | dashboard |
| CHART | `chart` | dashboard |
| CREDITCARD | `credit-card` | dashboard |
| DOLLAR | `dollar` | dashboard |
| DOCUMENT | `document` | dashboard |
| DOWNLOAD | `download` | dashboard |
| UPLOAD | `upload` | dashboard |
| LOCK | `lock` | dashboard |
| BOT | `bot` | dashboard |
| DOOR | `door` | dashboard |
| LOGIN | `login` | dashboard |
| LOGOUT | `logout` | dashboard |

---

## 🎯 EMPLACEMENT 1 — Fiche villa : équipements ⭐ (le plus gros gain visuel)

`app/villas/[id]/page.tsx` — fonction d'icône d'aménité (≈ lignes 157-173) + import ligne 3.
Actuellement lucide @16px `strokeWidth={1}`. **Passer à 18-20px** pour la netteté PNG.

| Ligne | Mot-clé aménité | lucide actuel | → slug |
|---|---|---|---|
| 157 | wifi | `Wifi` | `wifi` |
| 158 | climatisation/clim | `Wind` | `ac` |
| 159 | piscine | `Waves` | `pool` |
| 162 | jardin/terrasse/extérieur | `TreePine` | `tree` |
| 163 | parking/garage | `Car` | `car` |
| 164 | cuisine/réfrigérateur | `Utensils` | `kitchen` |
| 165 | tv/télé/écran | `Tv` | `tv` |
| 166 | machine à laver/lave-linge | `Shirt` | `washer` |
| 167 | chef/restauration | `ChefHat` | `chef` |
| 168 | bateau/nautique/mer/plage | `Ship` | `boat` |
| 171 | ménage/draps/serviettes/linge | `Bed` | `bed` |
| 173 | salle de sport/fitness/gym | `Dumbbell` | `gym` |
| (import) | cheminée | `Flame` | `fireplace` |
| (import) | aéroport/transfert | `Plane` | `plane` |

⚠️ Aussi @569 `<Bed>` (détail chambre) et @573 `<Wind> Climatisation` → `bed` / `ac`.
GARDER en lucide : `Check`, `Key`, `ShieldCheck`, `Zap`, `User`, `Heart`, `UserCheck` (déjà mappés pack 1 ou UI).

---

## 🎯 EMPLACEMENT 2 — Page « À propos » : banc ADN ⭐

`app/qui-sommes-nous/page.tsx` — const `ADN` (lignes 29-35), rendu via `EditorialServiceGrid` @28px (taille idéale).

| Ligne | label | lucide | → slug |
|---|---|---|---|
| 30 | Exigence & discrétion | `Shield` | `shield-check` (pack 1) |
| 31 | Patrimoine & valeur | `Gem` | `gem` |
| 32 | Ancrage martiniquais | `MapPin` | `location` (pack 1) |
| 33 | Ouverture sur l'île | `Compass` | `compass` |
| 34 | Détail & finition | `Sparkles` | `sparkle` (pack 1) |
| 35 | Confiance & relation | `Heart` | `heart` (pack 1) |

⚠️ Pré-requis : faire évoluer `EditorialServiceGrid` (`components/marketing/editorial-blocks.tsx`) pour accepter `KayvilaPngName | LucideIcon` (cf. audit pack 1, point 1). Une fois fait → les 6 items passent en brandé.

---

## 🎯 EMPLACEMENT 3 — Homepage « La conciergerie autrement »

`components/home/HomeConciergeHighlight.tsx` — const `SERVICES` (lignes 6-11) @20px.

| Ligne | label | lucide | → slug |
|---|---|---|---|
| 6 | Transferts & accueil | `Car` | `car` |
| 7 | Chef & art de la table | `UtensilsCrossed` | `chef` |
| 8 | Nautisme & escapades | `Anchor` | `anchor` |
| 9 | Courses & bienvenue | `ShoppingBag` | `shopping-bag` |
| 10 | Entretien & linge | `Sparkles` | `sparkle` (pack 1) |
| 11 | Pilotage des séjours | `Calendar` | `calendar` (pack 1) |

→ Cluster 100 % brandé d'un coup.

---

## 🎯 EMPLACEMENT 4 — Dashboard propriétaire (assistant-views, KPI ≥16px)

### `components/dashboard/assistant-views/FinancesView.tsx` (import ligne 3)
`TrendingUp` → `trending-up` · `TrendingDown` → `trending-down` · `BarChart2` → `chart`
(`Euro` → `euro` pack 1 · `Clock` → `clock` pack 1)

### `components/dashboard/assistant-views/BookingsView.tsx` (ligne 3)
`CreditCard` → `credit-card` (`Calendar` → `calendar` · `Clock` → `clock`, pack 1). `ChevronRight` = UI.

### `components/dashboard/assistant-views/PlanningView.tsx` (ligne 3)
`LogIn` → `login` · `LogOut` → `logout` · `Home` → `home`/`villa` (`Calendar` → `calendar` pack 1). `ArrowRight` = UI.

### `components/dashboard/assistant-views/VillasView.tsx` (ligne 4)
`MapPin` → `location` · `Users` → `users` · `Star` → `star` (tous pack 1). `LayoutGrid`/`ArrowRight` = UI.

### `components/dashboard/NotificationBell.tsx` (ligne 21)
`DoorOpen` → `door` (`Bell` → `bell` · `Key` → `key` · `MessageCircle` → `message` · `Calendar` → `calendar`, pack 1).
NON générés → garder lucide : `Info`, `AlertTriangle`, `Building2`, `ExternalLink`, `CheckCheck`, `X`.

---

## 🎯 EMPLACEMENT 5 — Copilot / assistant IA

`components/dashboard/admin/AdminCopilotChat.tsx` + `…/DashboardCopilotChat.tsx`
- Avatar de l'assistant (`Sparkles` @72) → **`bot`** (plus parlant pour un copilot IA)
- `ShieldCheck` (@56) → `shield-check` (pack 1)
- `Sparkles` en-tête (@31,42) → `sparkle` (pack 1) — ou `bot` pour cohérence
GARDER lucide : `ArrowUp` (envoi), `RotateCcw` (reset) = contrôles UI.

---

## 🎯 EMPLACEMENT 6 — Espace client & documents (icônes restantes)

Brancher au fil des écrans concernés :
- `book` → livret d'accueil / welcome book (guide locataire, `CheckinGuide` ou page guide).
- `document` → contrats, devis, mentions (espace client documents).
- `download` → boutons téléchargement PDF (factures, devis).
- `upload` → envoi de photos / `app/soumettre-une-villa` (dépôt propriétaire).
- `lock` → page Confidentialité, sécurité du compte, champs mot de passe.
- `door` → check-in/check-out (déjà cité en 4, réutilisable espace client).

---

## ⚪ Icône générée mais sans emplacement immédiat
- `dollar` : le site est en euro (`euro` pack 1 couvre déjà). Garder en réserve (tarifs USD éventuels / dashboard multi-devises). Non prioritaire.

---

## 🚫 NON générées — à garder en lucide (ou générer plus tard si besoin)
`Info`, `AlertTriangle` (statut/alerte), `Building2`, `ExternalLink`, `CheckCheck`, `Zap`, `UserCheck`, `LayoutGrid`, `BarChart` variantes — + tous les contrôles UI (chevrons, X, Menu, Search, Loader, flèches de navigation).

---

## Ordre recommandé d'intégration
1. **Fiche villa équipements** (emplacement 1) — gros impact, 1 seul fichier, 14 icônes.
2. **Homepage conciergerie** (emplacement 3) — cluster complet, simple.
3. **Banc ADN** (emplacement 2) — après évolution `EditorialServiceGrid`.
4. **Dashboard assistant-views** (emplacement 4) — clusters ≥16px.
5. **Copilot + espace client** (emplacements 5-6) — finitions.
