# Spec — Refonte responsive mobile des dashboards Kayvila

**Date** : 2026-07-01
**Statut** : validé (brainstorming avec Kenneson)
**Origine** : mission `fable-responsive-mobile.md` (5 écrans) + balayage repo (écran 6 ajouté)

## Objectif

Rendre les dashboards Kayvila impeccables sur mobile (< 768 px, testé jusqu'à 360 px) via un **design adaptatif unique** : un seul design par écran qui s'adapte au breakpoint. Les améliorations de contenu (actions rapides, filtres, infos pratiques…) profitent aussi au desktop.

## Décisions actées

1. **Bottom navigation mobile** pour les 3 rôles (admin, proprio, client) — 4 destinations + « Plus » (ouvre le tiroir sidebar existant).
2. **Design adaptatif unique** — pas de couche mobile séparée. Double rendu (`hidden md:block` / `md:hidden`) UNIQUEMENT pour les DataGrids (villas admin, réservations admin) : grille gardée desktop, cartes en mobile.
3. **Pas d'actions de statut côté proprio** sur les réservations (règle métier : seul l'admin confirme/annule ; une annulation payée implique un remboursement Stripe). Les cartes restent cliquables vers la fiche détail.
4. **Architecture A — adaptatif in-place** : refactor des composants existants avec breakpoints Tailwind + petits composants partagés nouveaux. Zéro duplication de logique, une seule source de données.
5. **Pas d'infinite scroll** villas (catalogue de quelques dizaines max, déjà chargé côté serveur).

## Périmètre

### Écrans traités (6)

| # | Page | Route |
|---|------|-------|
| 1 | Dashboard admin | `/admin` |
| 2 | Liste villas admin | `/admin/villas` |
| 3 | Dashboard proprio | `/dashboard` |
| 4 | Mon Séjour client | `/espace-client` |
| 5 | Réservations proprio | `/dashboard/reservations` |
| 6 | Réservations admin | `/admin/reservations` |

### Hors périmètre (backlog noté, bénéficient quand même du socle)

`/admin/proprietaires`, `/admin/clients`, `/admin/documents`, `/dashboard/documents`, `/dashboard/revenus`, `/admin/revenus` — leurs tables ont déjà `overflow-x-auto` (scroll horizontal acceptable, trafic mobile faible). Le CRUD villa (éditeur) est un chantier séparé qui suivra cette spec.

### Ne PAS casser

- DataGrids desktop (villas, réservations, proprios, clients) — inchangés ≥ 768 px.
- `VillaPastBookingsDrawer`, `AdminReservationsKanban` (desktop), routes API, auth/RLS.
- Sidebar HeroUI Pro + hamburger + header sticky existants (`DashboardShell`) — on s'appuie dessus.

## Socle partagé

### `MobileBottomNav` (nouveau — `components/dashboard/shared/MobileBottomNav.tsx`)

- Client component, `md:hidden`, `position: fixed bottom-0`, `pb-[env(safe-area-inset-bottom)]`, fond blanc, bordure haute `border-navy/8`, z-index sous les modals/bottom sheets.
- 4 destinations + « Plus ». « Plus » ouvre le tiroir sidebar existant (même mécanisme que `Sidebar.Trigger`).
- Entrées dérivées des définitions de menu existantes (`AdminMenuItems.ts`, `ProprioMenuItems.ts`, `components/espace-client/TenantMenuItems.ts`) — icônes en **noms string** (règle Server→Client).
- Entrée active : icône + label gold (détection par `usePathname`, préfixe le plus long).
- Zones toucher ≥ 44×44 px, labels ≥ 11 px.

| Rôle | Entrées |
|------|---------|
| Admin | Dashboard · Réservations · Villas · Messages · Plus |
| Proprio | Dashboard · Réservations · Villas · Revenus · Plus |
| Client | Séjour · Demandes · Livret · Messagerie · Plus |

### Intégration `DashboardShell`

- `<MobileBottomNav role menu />` rendu après `<main>`.
- `<main>` reçoit un padding bas mobile : `pb-[calc(5rem+env(safe-area-inset-bottom))] md:pb-8` pour ne jamais masquer le contenu.

### Règles globales (tous écrans)

- Inputs `text-base` (16 px — anti-zoom iOS). Texte informatif ≥ 11 px (`text-[10px]` toléré uniquement pour badges/eyebrows décoratifs).
- Padding conteneurs : 16 px mobile (`px-4`), 24 px+ desktop (`md:px-6`/`md:px-8`).
- Empty states : icône + phrase utile + CTA (jamais un simple « Aucune activité »).
- Aucun overflow horizontal de page sous 400 px.
- `font-display-dashboard` pour les titres, `font-body-dashboard` pour les données.

## Écran 1 — `/admin` (dashboard admin)

- **KPI 2 colonnes mobile** : les deux `DashboardKpiGroup` (4+4 KPI) passent en grille `grid-cols-2` sous 768 px — icône + chiffre XXL (`text-3xl`+) + label ; cartes cliquables (les `href` existent). Desktop : `KPIGroup` horizontal inchangé (sparklines conservées).
- **Nouvelle section « Actions rapides »** (mobile ET desktop), sous les KPI : 3 boutons larges ≥ 44 px — « Ajouter une villa » (`/admin/villas/ajouter`), « Réservations » (`/admin/reservations`), « Messages » (`/admin/messages`).
- **Empty states** arrivées/départs du jour uniformisés (icône + phrase utile via `DashboardStayList`).
- Widgets (timeline, alertes, occupation) : déjà en 1 colonne mobile — ajustement densité/padding seulement.

## Écran 2 — `/admin/villas`

- **Desktop ≥ 768 px : `AdminVillasDataGrid` inchangé** (`hidden md:block`).
- **Mobile (`md:hidden`) : liste de cartes** (nouveau `AdminVillaCardList`), mêmes `rows` que le DataGrid :
  - photo (ratio 16:9 ou vignette 80 px), nom + localisation, prix/nuit + capacité, badge Publié (vert/gris), tier, lien proprio, compteur résas (ouvre le même `VillaPastBookingsDrawer`) + revenus ;
  - 3 actions larges ≥ 44 px : Modifier / Calendrier / Voir ↗.
- **Barre recherche sticky** sous le header + bouton « Filtres » ouvrant un **bottom sheet** (réutilise le pattern `BookingBottomSheet` : overlay + focus trap `useFocusTrap`).
- Pagination : aucune (liste courte, déjà chargée entière).

## Écran 3 — `/dashboard` (proprio)

- **Banner Stripe compact** quand connecté : une ligne, check vert + « Paiements automatiques activés » (remplace le gros banner actuel). Le banner d'incitation (non connecté) garde sa taille.
- **KPI mobile 2×2** (même mécanique que l'écran 1) ; « Revenus du mois » = gros chiffre + sous-titre, tendance conservée.
- **Réservations** : mini-liste des 3 prochaines si > 0 (`UpcomingBookings` existant), sinon CTA « Voir mes villas ».
- **Sections vides remplacées** : si « Aujourd'hui » ET « Tâches » sont vides, elles disparaissent au profit d'une **carte onboarding « Configurer ma villa »** — liens statiques : compléter les photos, vérifier les tarifs, synchroniser le calendrier iCal, ajouter le livret d'accueil (vers les pages d'édition existantes). Si l'une a du contenu, elle s'affiche normalement.
- **Carte « Mes villas »** avec lien `/dashboard/villas` (réutilise `VillaCard`).

## Écran 4 — `/espace-client` (Mon Séjour)

- **Bannière photo 16:9** : évolution de `UpcomingStayHero` — photo de la villa avec nom + localisation superposés (dégradé bas), hauteur contenue mobile.
- **Infos séjour compactes** en chips sous la bannière : dates, durée (nuits), prix.
- **CTA large « RE-RÉSERVER »** (gold, pleine largeur mobile) pour les séjours passés + secondaire « Contacter la conciergerie » (`/espace-client/messagerie`).
- **Nouvelle section « Infos pratiques »** : WiFi (`wifi_name` / `wifi_password` avec bouton copier), instructions d'accès, lien livret (`welcome_booklet_url`). **Affichée uniquement pour une réservation confirmée et ≤ 24 h avant l'arrivée ou pendant le séjour** (même règle de sécurité que `CheckinGuide` — jamais de WiFi pour une résa pending ou lointaine).
- **Carte « À faire »** : heure de check-out + instructions, visible la veille du départ (réutilise la logique `CheckoutInstructions`, remontée en surface Séjour).
- Ton chaleureux, premium (design tokens existants gold/navy).

## Écran 5 — `/dashboard/reservations` (proprio) — le plus cassé

- **Refonte de la liste** : les lignes flex 7 colonnes (`page.tsx` actuel) deviennent des **cartes** — nom client en gros (`text-base font-semibold`), villa + dates + nuits, prix visible, badge statut couleur (`BookingStatusBadge` : orange attente / vert confirmé / rouge annulé), source (Airbnb/Direct/…) + statut paiement. Carte entière cliquable vers `/dashboard/reservations/[villaId]/[bookingId]`.
- **Regroupement par mois** (en-têtes sticky, ordre antéchronologique).
- **Filtres segmentés** « Toutes | En attente | Confirmées | Annulées » + **recherche par nom de client** + select villa (affiché seulement si plusieurs villas). La page passe en client component pour le filtrage (les données sont déjà toutes chargées côté serveur → split Server fetch / Client filtre, props objets simples uniquement).
- **Pas de boutons Confirmer/Annuler** (décision actée). La fiche détail reçoit un bouton « Contacter Kayvila » qui pointe vers le fil « Notre équipe » de Mon concierge (`/dashboard/concierge`).
- Empty state : icône + « Aucune réservation » + CTA « Voir mes villas ».

## Écran 6 — `/admin/reservations` (ajouté au périmètre)

- **Desktop : `AdminReservationsDataGrid` + Kanban inchangés** (`hidden md:block`).
- **Mobile : cartes** (même patron que l'écran 5) — voyageur, villa, dates, montant, badge statut, source. Les actions admin existantes (confirmer/annuler) restent accessibles depuis la carte ou la fiche, en boutons ≥ 44 px.
- Les filtres existants de la page passent dans la même barre sticky + bottom sheet que l'écran 2.
- Le Kanban reste desktop-only (drag & drop inadapté au tactile étroit).

## Composants — création / modification

**Nouveaux** (petits, une responsabilité chacun) :
- `shared/MobileBottomNav.tsx` — nav basse par rôle.
- `admin/AdminVillaCardList.tsx` — cartes villas mobile (mêmes rows que le DataGrid).
- `admin/AdminReservationCardList.tsx` — cartes résas admin mobile.
- `proprio/BookingGroupedList.tsx` — cartes résas proprio groupées par mois + filtres + recherche (client component).
- `shared/QuickActions.tsx` — boutons d'actions rapides (réutilisé écran 1, réutilisable ailleurs).
- `espace-client/PracticalInfoCard.tsx` — infos pratiques WiFi/accès/livret (gating 24 h).
- `proprio/OnboardingCard.tsx` — carte « Configurer ma villa ».
- `shared/FilterBottomSheet.tsx` — bottom sheet de filtres partagé (écrans 2 et 6).

**Modifiés** : `DashboardShell` (bottom nav + padding), `DashboardKpiGroup` (grille 2 col mobile), `DashboardPageClient` (banner compact, onboarding, mini-liste), `UpcomingStayHero` (bannière 16:9 + chips), pages des 6 écrans.

## Données & sécurité

- **Zéro nouvelle route API, zéro migration DB.** Toutes les données affichées existent déjà dans les requêtes des pages (une exception possible : `wifi_name`/`wifi_password`/`welcome_booklet_url` à ajouter au select de la page espace-client — colonnes existantes de `villas`).
- WiFi/code : exposés uniquement à une réservation **confirmée** et dans la fenêtre ≤ 24 h avant → fin de séjour (aligné `CheckinGuide`). Jamais dans le HTML d'une résa pending.
- Aucune fonction en props Server→Client (règle dure) — objets simples uniquement.

## Tests & vérifications

- **Playwright mobile** (`tests/responsive-dashboards.spec.ts`) : viewports 390×844 et 360×740, comptes `admin@diamantnoir.com` / `proprio1@test.com` / `locataire@test.com`, `--workers=1`, navigation directe par URL. Assertions par écran :
  1. bottom nav visible + navigation vers 2 destinations ;
  2. DataGrid non visible / cartes visibles sous 768 px (écrans 2 et 6) — sélecteurs `:visible` (double rendu) ;
  3. aucun overflow horizontal : `document.documentElement.scrollWidth <= clientWidth` ;
  4. filtres écran 5 : cliquer « Confirmées » réduit la liste ; recherche par nom filtre ;
  5. desktop 1280 px : DataGrids toujours présents, bottom nav absente (non-régression).
- **`npx tsc --noEmit`** avant chaque push (build local cassé pré-existant — validation via tsc + déploiement Vercel).
- **Gestion d'erreur** : aucune nouvelle surface d'erreur ; les sections conditionnelles (Infos pratiques, onboarding) dégradent en « non affiché » si données absentes, jamais en crash.
- Zéro nouvelle dépendance npm.

## Direction design — impeccable (obligatoire pour tous les nouveaux composants)

Contexte `.impeccable.md` : Kayvila = portail de club privé, pas un dashboard SaaS. Autorité calme. Note : la direction « thème sombre » de `.impeccable.md` est antérieure au design system actuel (offwhite/navy/gold) — on reste sur le thème clair existant, seuls les principes s'appliquent.

**La donnée parle par la typographie, pas par les conteneurs.**
- KPI mobile 2×2 : chiffre en `font-display-dashboard` grand (≥ `text-3xl`), label en eyebrow caps letter-spaced (pattern existant `tracking-[0.25em]`). Pas de chrome de carte lourd, pas d'icône géante au-dessus de chaque chiffre.
- En-têtes de mois (écran 5) : eyebrow caps fines + espacement généreux au-dessus, serré en dessous — la hiérarchie vient du rythme d'espacement, pas de bordures.

**L'or est un signal, jamais une décoration.**
- Bottom nav : icônes/labels en `text-navy/55`, **seule l'entrée active est gold**. Pas de fond gold, pas de glow.
- Un seul CTA gold par écran (RE-RÉSERVER, Ajouter une villa). Les actions secondaires = ghost/outline navy. Jamais 3 boutons primaires côte à côte dans Actions rapides.

**Interdits absolus (tells IA — déjà règles du projet depuis l'audit 2026-05-10) :**
- Zéro side-stripe (`border-left/right` > 1 px coloré) sur cartes, alertes, groupes — remplacer par bordure complète + fond teinté (`border-gold/30 bg-gold/[0.08]`).
- Zéro texte en dégradé, zéro glassmorphism décoratif (et `backdrop-filter` désactivé mobile — règle perf existante).
- Pas de cartes imbriquées dans des cartes : les cartes résa/villa mobiles sont plates (bordure `border-navy/8`, fond blanc, c'est tout).

**Rythme et espacement.**
- Espacement varié, pas un padding uniforme : groupes serrés (infos d'une même résa), séparations généreuses (entre mois, entre sections). `gap` plutôt que margins.
- Asymétrie assumée : texte aligné à gauche, pas de tout-centré.

**Interaction et mouvement.**
- Bottom sheets : `transform` + `opacity` uniquement, easing déccélérant (ease-out), `prefers-reduced-motion` respecté. Pas de bounce.
- Optimistic UI sur les filtres (déjà côté client, instantané).
- Empty states qui enseignent : « Aucune arrivée aujourd'hui — vos check-ins apparaîtront ici la veille » plutôt que « Aucune donnée ». Chaque empty state des 6 écrans est rédigé, pas générique.
- Zones interactives : feedback tactile discret (`active:scale-[0.98]`, pattern existant).

**Test anti-slop avant merge** : chaque nouvel écran mobile doit passer la question « est-ce qu'on dirait un template IA ? » — si un composant pourrait sortir tel quel d'un starter admin générique, retravailler la typographie et le rythme avant de livrer.

## Risques identifiés

- **Double rendu DataGrid/cartes** : poids DOM double sur ces 2 pages — acceptable (listes bornées), et les tests Playwright doivent cibler `:visible`.
- **Bottom nav vs éléments flottants** : vérifier z-index avec modals, bottom sheets et le chat concierge ; le padding bas du `<main>` doit couvrir tous les écrans.
- **KPIGroup HeroUI Pro** : si le composant ne se laisse pas mettre en grille 2 col par CSS, fallback = rendu grid custom mobile dans `DashboardKpiGroup` (le markup interne de `KpiCard` reste unique).
