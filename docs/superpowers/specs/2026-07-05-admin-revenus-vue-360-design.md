# Vue 360 revenus/historique — page /admin/revenus

**Date** : 2026-07-05
**Périmètre** : dashboard admin, page `/admin/revenus` uniquement

## Contexte / diagnostic

Exploration de l'existant admin avant conception :

- `/admin/revenus` : KPIs (mois/année/total), commission plateforme vs reversement
  propriétaires, graphique 12 mois **fixe (non cliquable)**, tableau de ventilation
  par villa (all-time), export CSV. **Aucune sélection de mois, aucun détail
  réservation par réservation, aucune comparaison N-1.**
- `/admin/reservations` : liste/kanban/calendrier des réservations avec filtres
  statut/villa et actions (confirmer/annuler), mais **aucun chiffre de CA affiché**,
  pas de filtre par mois.
- `/admin` (accueil) : KPIs généraux, occupation par villa du mois courant, arrivées/
  départs du jour, activité récente — séparé des revenus, pas d'historique.

Les chiffres et le détail réservation existent donc déjà dans deux pages disjointes.
Objectif : unifier dans `/admin/revenus`, en ajoutant un vrai drill-down par mois.

## Décision

Enrichir la page existante (pas de nouvelle route, pas de nouvelle entrée de menu) :
le graphique 12 mois devient interactif (clic sur une barre **ou** menu déroulant,
les deux pilotent le même état) et affiche en dessous un panneau détail complet pour
le mois sélectionné. La section "Ventilation par villa" (all-time) actuelle reste
inchangée en bas de page.

Pas de round-trip réseau pour le drill-down : le serveur envoie déjà toutes les
réservations nécessaires en un seul fetch ; on étend ce fetch pour couvrir aussi les
statuts `pending`/`cancelled`/`refunded` sur la fenêtre 12 mois, et le client filtre/
regroupe localement par mois. Volume attendu (activité boutique, pas une plateforme
de masse) : envoi de tout l'historique 12 mois en une fois reste léger.

## Architecture & flux de données

```
app/(admin)/admin/revenus/page.tsx (Server Component)
   │
   ├─ Query 1 (existante, inchangée) : bookings confirmed/paid, tout l'historique
   │    → alimente les KPIs all-time et la ventilation par villa all-time (inchangés)
   │
   ├─ Query 2 (NOUVELLE) : bookings pending/cancelled/refunded,
   │    start_date dans les 12 derniers mois, colonnes minimales
   │    → alimente uniquement les widgets "Annulé"/"Pipeline" du panneau détail
   │
   ├─ lib/revenue/monthly-detail.ts :: buildMonthlyDetails(bookings, cancelled, pending, villas)
   │    → fonction pure, retourne Record<monthKey, MonthDetail> pour les 12 mois
   │
   ▼
AdminRevenusClient (Client Component)
   │  state: selectedMonthKey (défaut = mois courant)
   │  - BarChart cliquable (recharts, onClick sur <Bar>)
   │  - <select> mois, synchronisé au même state
   │
   ▼
RevenueMonthDetail (nouveau Client Component)
   → reçoit monthlyDetails[selectedMonthKey], pur props-in / rendu, pas de fetch
```

## Modèle de données — `MonthDetail`

Nouveau fichier `lib/revenue/monthly-detail.ts`, fonction pure et testable
indépendamment du Server Component :

```ts
type MonthDetail = {
  monthKey: string;           // "2026-07"
  label: string;              // "Juillet 2026"
  gross: number;               // CA brut (cents), nuitées+ménage+service
  platformTotal: number;       // commission Kayvila totale (cents)
  platformOnStay: number;      // dont commission % sur nuitées
  platformCleaning: number;    // dont frais de ménage (100%)
  platformService: number;     // dont frais de service (100%)
  ownerNet: number;             // reversement propriétaires (cents)
  bookingCount: number;         // résas confirmées/payées
  nightsSold: number;
  adr: number;                  // prix moyen/nuit (cents) = stayRevenue / nightsSold
  occupancyRate: number;        // % moyen toutes villas (nuits occupées / nuits dispo)
  avgBasket: number;             // panier moyen par résa (cents)
  cancelled: { count: number; lostGross: number };
  pending: { count: number; potentialGross: number };
  byVilla: VillaMonthRow[];     // cf. ci-dessous
  byChannel: ChannelMonthRow[];
  bookings: MonthBookingRow[];  // niveau réservation, confirmées/payées uniquement
};

type VillaMonthRow = {
  villaId: string; name: string;
  gross: number; nightsSold: number; occupancyRate: number; adr: number;
  platformTotal: number; ownerNet: number; bookingCount: number;
  shareOfMonthPct: number;
};

type ChannelMonthRow = {
  channel: string;              // libellé normalisé, cf. channelLabel()
  gross: number; sharePct: number; commissionRate: number;
};

type MonthBookingRow = {
  id: string; villaId: string; villaName: string;
  guestName: string; startDate: string; endDate: string; nights: number;
  channel: string; gross: number; platform: number; owner: number;
};
```

Helpers associés :
- `channelLabel(source: string | null): string` (extension de
  `lib/revenue/booking-revenue.ts`, réutilise `OTA_SOURCES`) → normalise
  `airbnb`/`booking`/`expedia`/`vrbo`/`trivago`/`ical` en libellés affichables,
  tout le reste (`direct`/`manual`/`admin`/`null`) → "Direct".
- `computeMomChange(current: number, previous: number): number | null` (nouveau
  fichier `lib/revenue/monthly-comparison.ts`) → retourne `null` si
  `previous === 0` (affiché "Nouveau" côté UI plutôt qu'un pourcentage infini).

## Deux conventions de rattachement au mois (documenté explicitement)

Le CA/commission/ADR/nuitées vendues/annulé/pipeline sont rattachés au **mois de la
date d'arrivée (`start_date`)** de la réservation — même convention que le graphique
12 mois existant (`monthBuckets` dans le code actuel). Une réservation à cheval sur
deux mois compte entièrement dans le mois de son check-in.

Le **taux d'occupation** utilise en revanche le découpage nuit par nuit avec
chevauchement (même logique que `occupancyByVilla` déjà présente dans
`app/(admin)/admin/page.tsx`) : une réservation à cheval sur juillet/août compte ses
nuits dans chacun des deux mois, au prorata.

Ce sont deux conventions différentes mais chacune déjà utilisée ailleurs dans le
code — pas d'invention d'une troisième règle. À documenter en commentaire dans
`monthly-detail.ts` pour éviter toute confusion future.

Précision pour lever toute ambiguïté sur le mot "nuits" : le champ `nightsSold`
(carte "Nuitées vendues" et `ADR = stayRevenue / nightsSold`) additionne les nuits
**entières** des réservations rattachées au mois par `start_date` — même convention
que le CA, pour que le calcul de l'ADR reste cohérent (même numérateur/dénominateur
issus du même ensemble de réservations). C'est un nombre **différent** des "nuits
occupées" utilisées en interne pour `occupancyRate`, qui lui vient du découpage avec
chevauchement décrit ci-dessus. Le dénominateur de `occupancyRate` est
`joursDuMois × nombre de villas` au niveau global, et `joursDuMois` au niveau d'une
seule villa dans `VillaMonthRow`.

## UI — panneau détail du mois (`RevenueMonthDetail`)

Ordre d'affichage, du plus synthétique au plus détaillé :

**A. En-tête** — "Détail — {label}" + badge "vs {mois précédent}" + badge
"vs {même mois année dernière}" (couleur verte/rouge selon signe, "Nouveau" si
comparaison à 0).

**B. Cartes de synthèse** (grid responsive) : CA brut · Commission Kayvila (sous-texte
détaillant nuitées/ménage/service) · Reversement propriétaires · Réservations
confirmées · Nuitées vendues · ADR · Taux d'occupation · Panier moyen.

**C. Deux widgets secondaires côte à côte**, visuellement séparés des cartes de CA
pour ne jamais laisser penser qu'ils sont inclus dans les totaux :
- Annulé ce mois : nombre + CA perdu (teinte ambre/rouge)
- En attente (pipeline) : nombre + CA potentiel non confirmé (teinte neutre/bleu)

**D. Tableau récap par villa** : villa · CA brut · nuitées · occupation % · ADR ·
commission · reversement · résas · % du CA du mois, avec ligne "Total" en pied de
tableau. Pas de pagination (nombre de villas limité à l'échelle du portefeuille).

**E. Répartition par canal** : canal · CA brut · % du mois · taux de commission.

**F. Détail réservation par réservation**, groupé par villa en accordéon replié par
défaut (en-tête de groupe = nom villa + sous-total CA/reversement + lien
`/admin/reservations?villa={id}` réutilisant le filtre déjà existant sur cette page).
Confirmées/payées uniquement — cohérent avec les totaux de la section B.

**G. Bouton "Exporter ce mois"** (CSV) — désactivé/masqué si `bookings.length === 0`
pour le mois sélectionné.

**État vide** : si `bookingCount === 0` pour le mois sélectionné, afficher un message
simple à la place des sections D/E/F (les cartes B et widgets C restent visibles avec
des zéros, pour rester cohérent avec le sélecteur/comparaisons).

## Fichiers touchés

- `app/(admin)/admin/revenus/page.tsx` (modifié) — ajoute la Query 2, appelle
  `buildMonthlyDetails`, passe `monthlyDetails` en prop à `AdminRevenusClient` en plus
  des props existantes (inchangées).
- `lib/revenue/monthly-detail.ts` (nouveau) — `buildMonthlyDetails()` + types
  `MonthDetail`/`VillaMonthRow`/`ChannelMonthRow`/`MonthBookingRow`.
- `lib/revenue/monthly-comparison.ts` (nouveau) — `computeMomChange()`.
- `lib/revenue/booking-revenue.ts` (étendu) — ajoute `channelLabel()`.
- `components/dashboard/admin/AdminRevenusClient.tsx` (modifié) — état
  `selectedMonthKey`, graphique cliquable, `<select>` mois, rend
  `<RevenueMonthDetail>`.
- `components/dashboard/admin/RevenueMonthDetail.tsx` (nouveau) — tout le panneau
  détail (sections A à G ci-dessus).

## Erreurs

Le `try/catch` existant dans `page.tsx` reste la seule ligne de défense : en cas
d'erreur sur la Query 2 (pending/cancelled), les widgets "Annulé"/"Pipeline" tombent
à zéro plutôt que de faire échouer toute la page (la Query 1 et les KPIs all-time
restent prioritaires). Pas de nouvelle gestion d'erreur créée côté client :
`RevenueMonthDetail` est un composant pur (props-in), aucun fetch, donc aucun état
d'erreur réseau à gérer à ce niveau.

## Tests

- **Vitest** — `channelLabel()` : toutes les sources connues (`airbnb`, `booking`,
  `expedia`, `vrbo`, `trivago`, `ical`) + fallback "Direct" (`direct`/`manual`/
  `admin`/`null`/valeur inconnue).
- **Vitest** — `computeMomChange()` : cas normal (hausse/baisse), `previous === 0`
  → `null`, `current === 0 && previous === 0` → `null`.
- **Vitest** — `buildMonthlyDetails()` : cas central du feature.
  - Rattachement correct au mois de `start_date` pour CA/commission/nuitées.
  - Répartition nuit-par-nuit correcte pour l'occupation (résa à cheval sur 2 mois).
  - Décomposition commission (nuitées/ménage/service) = somme cohérente avec
    `platformFeeCents()` existant (test de non-régression croisé).
  - `cancelled`/`pending` comptés séparément, jamais inclus dans `gross`/`platformTotal`.
  - Mois sans aucune réservation → `MonthDetail` avec tous les champs à 0, pas
    d'exception.
- **Playwright** — un test bout-en-bout sur `/admin/revenus` : cliquer une barre du
  graphique, vérifier que le panneau détail affiche les groupes par villa et la
  répartition canal, vérifier que le `<select>` mois produit le même résultat, et que
  l'export CSV du mois se déclenche (interception du download).

## Hors périmètre

- Pas de sélecteur d'année ni d'historique au-delà de 12 mois glissants (décision
  explicite de l'utilisateur).
- Pas de comparaison configurable (l'utilisateur a validé mois précédent + même mois
  année dernière, pas d'autre période).
- Pas de modification de `/admin/reservations` ni de `/admin` (accueil) — la
  réutilisation du filtre `?villa=` sur `/admin/reservations` est un lien sortant
  uniquement, aucune modification de cette page.
- Pas de changement du modèle de commission ni de `calculateTransferAmounts()` —
  uniquement de la lecture/agrégation de données existantes.
