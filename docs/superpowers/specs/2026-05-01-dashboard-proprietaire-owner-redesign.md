# Dashboard Propriétaire — Réécriture complète

> **Date**: 2026-05-01
> **Projet**: Kayvila / Diamant Noir — conciergerie de luxe
> **Contexte**: Le dashboard propriétaire actuel (`app/dashboard/proprio/[villaId]/page.tsx`, ~2100 lignes) est un monolithe fonctionnel mais difficile à maintenir, sans séparation claire entre les sections. Cette spec propose une réécriture complète en pages Next.js 15 App Router distinctes, avec un layout dédié et une navigation propre.

---

## 1. Objectifs

1. **Séparer dashboard admin (gérant) et dashboard propriétaire** — deux route groups distincts avec des permissions RLS différentes
2. **Découper le monolithe de ~2100 lignes** en pages indépendantes et maintenables (< 300 lignes chacune)
3. **Cohérence visuelle** avec la charte du projet (navy, or, blanc, tons luxe)
4. **Server Components par défaut** — les données chargées côté serveur, les mutations via Server Actions
5. **TypeScript strict** — tous les appels DB typés via `types/domain.ts`

---

## 2. Architecture routes

### 2.1 Dashboard Propriétaire

```
app/(proprio)/dashboard/
├── layout.tsx                    # Layout proprio : sidebar nav + header
├── page.tsx                      # Accueil : KPIs + dernières résas + alertes
├── villas/
│   ├── page.tsx                  # Liste des villas du proprio
│   └── [villaId]/
│       ├── page.tsx              # Édition villa (infos, prix, équipements)
│       └── photos/
│           └── page.tsx          # Gestion photos villa
├── reservations/
│   └── [villaId]/
│       ├── page.tsx              # Calendrier + liste réservations
│       └── [bookingId]/
│           └── page.tsx          # Détail d'une réservation
├── revenus/
│   └── page.tsx                  # Graphiques revenus, historique paiements
├── taches/
│   ├── page.tsx                  # Tâches de maintenance (toutes villas)
│   └── [taskId]/
│       └── page.tsx              # Détail d'une tâche
└── statistiques/
    └── [villaId]/
        └── page.tsx              # Taux d'occupation, avis, performance
```

### 2.2 Dashboard Admin (gérant)

```
app/(admin)/admin/
├── layout.tsx                    # Layout admin : sidebar + header
├── page.tsx                      # Vue globale : KPIs, alertes, activité récente
├── villas/
│   ├── page.tsx                  # Toutes les villas (CRUD complet)
│   └── [villaId]/
│       └── page.tsx              # Détail / édition villa
├── proprietaires/
│   ├── page.tsx                  # Liste des propriétaires
│   └── [ownerId]/
│       └── page.tsx              # Détail propriétaire (ses villas, revenus)
├── reservations/
│   ├── page.tsx                  # Toutes les réservations (filtrée, paginée)
│   └── [bookingId]/
│       └── page.tsx              # Détail réservation
├── clients/
│   └── page.tsx                  # Base clients
├── revenus/
│   └── page.tsx                  # Revenus globaux, déclarations
└── parametres/
    └── page.tsx                  # Configuration générale
```

---

## 3. Design visuel

### 3.1 Charte appliquée au dashboard

- **Fond**: blanc cassé (`bg-offwhite`) ou blanc pur selon les sections
- **Sidebar**: fond navy profond (`bg-navy-900`), texte blanc, items actifs avec accent or
- **KPIs**: cartes blanches avec bordure subtile, icône or, valeur en texte large navy
- **Graphiques**: Recharts avec palette personnalisée (or, navy, vert pour positif, rouge pour alerte)
- **Boutons**: primaires en or (`bg-gold`), secondaires outline navy
- **Typo**: `font-heading` (Playfair Display) pour les titres, `font-body` pour le contenu
- **Liens navigation**: `border-l-2 border-transparent hover:border-gold` avec transition

### 3.2 Page d'accueil proprio (layout)

```
┌─────────────────────────────────────┐
│  [Sidebar]              [Header]    │
│  ┌─────────┐   ┌─────────────────┐ │
│  │ ○ Accueil    │  Bonjour [Nom]  │ │
│  │ ○ Villas     │  [Période]      │ │
│  │ ○ Réservas   │                 │ │
│  │ ○ Revenus    │  [KPI Row]      │ │
│  │ ○ Tâches     │  ┌────┐┌────┐  │ │
│  │ ○ Stats      │  │Revs││TxOcc│  │ │
│  │              │  └────┘└────┘  │ │
│  │              │  ┌────┐┌────┐  │ │
│  │              │  │Tâch││Avis│  │ │
│  │              │  └────┘└────┘  │ │
│  │              │                 │ │
│  │              │  [Prochaines    │ │
│  │              │   réservations]  │ │
│  │              │                 │ │
│  │              │  [Alertes /     │ │
│  │              │   Tâches en     │ │
│  │              │   retard]       │ │
│  └─────────┘   └─────────────────┘ │
└─────────────────────────────────────┘
```

---

## 4. Composants prévus

### 4.1 Layout & navigation

| Composant | Rôle |
|---|---|
| `OwnerLayout` | Layout racine avec sidebar + header. Vérifie que l'utilisateur est bien un proprio. |
| `OwnerSidebar` | Navigation verticale avec liens actifs |
| `OwnerHeader` | Barre supérieure : nom, notifications, bouton déconnexion |
| `AdminLayout` | Layout racine admin avec sidebar + header |
| `AdminSidebar` | Navigation admin (villas, proprio, clients, revenus, paramètres) |

### 4.2 Dashboard

| Composant | Rôle |
|---|---|
| `KpiCard` | Carte métrique (icône + valeur + label + tendance) |
| `KpiRow` | Rangée de 4 KpiCards |
| `QuickReservationsList` | Liste des 5 prochaines réservations |
| `AlertBanner` | Bannière d'alerte (tâches en retard, résas sans acompte) |
| `EmptyDashboard` | État vide si aucune villa / donnée |

### 4.3 Villas

| Composant | Rôle |
|---|---|
| `VillaCard` | Carte villa dans la liste |
| `VillaForm` | Formulaire complet d'édition (infos, prix, équipements) |
| `VillaImageManager` *(déjà extrait)* | Upload, reorder, delete photos |
| `VillaAmenitiesEditor` *(déjà extrait)* | Gestion équipements |
| `VillaPricingEditor` | Tarifs saisonniers, week-end, minimum stay |

### 4.4 Réservations

| Composant | Rôle |
|---|---|
| `BookingCalendar` | Calendrier visuel avec résas colorées |
| `BookingList` | Tableau des réservations (dates, client, montant, statut) |
| `BookingDetailCard` | Carte détaillée d'une réservation |
| `BookingStatusBadge` | Badge de statut (confirmée, en attente, annulée, etc.) |

### 4.5 Revenus

| Composant | Rôle |
|---|---|
| `RevenueChart` | Graphique Recharts (barres / lignes) |
| `RevenueSummary` | Résumé (total mois, année, comparaison) |
| `PaymentHistoryTable` | Tableau des paiements reçus |

### 4.6 Tâches

| Composant | Rôle |
|---|---|
| `TaskList` | Liste des tâches (toutes villas) |
| `TaskCard` | Carte tâche (titre, villa, date, priorité, statut) |
| `TaskForm` | Formulaire création / édition tâche |
| `TaskStatusBadge` | Badge statut (à faire, en cours, fait) |

### 4.7 Statistiques

| Composant | Rôle |
|---|---|
| `OccupancyChart` | Graphique taux d'occupation (Recharts) |
| `ReviewsSummary` | Résumé des avis (note moyenne, distribution étoiles) |
| `PerformanceMetrics` | Métriques clés (nuits réservées, revenu/nuit, etc.) |

---

## 5. Data flow

### 5.1 RLS et permissions

- **Propriétaire** : voit uniquement ses villas (`owner_id = auth.uid()` dans la table `villas`)
- **Admin** : voit tout (via `service_role` ou claim admin)
- Les pages utilisent `createServerClient()` pour charger les données côté serveur
- Les mutations passent par des **Server Actions** typées

### 5.2 Types déjà existants (ne pas dupliquer)

Les types métier sont déjà définis dans `types/domain.ts` :
- `Villa`, `VillaFormData`, `Owner`, `Booking`, `BookingStatus`, `Task`, `TaskStatus`, `TaskPriority`
- `Payment`, `PaymentStatus`, `Review`, `IncomeSummary`
- `CalendarSlot`, `AvailabilityAlert`

### 5.3 Server Actions

```
lib/actions/
├── villa.ts         # createVilla, updateVilla, deleteVilla, uploadPhoto, deletePhoto
├── booking.ts       # createBooking, updateBookingStatus, cancelBooking
├── task.ts          # createTask, updateTask, completeTask, deleteTask
├── payment.ts       # getPaymentHistory, markPaymentReceived
└── review.ts        # getReviews, respondToReview
```

---

## 6. Calendrier d'implémentation

### Phase 1 — Fondations (prioritaire)
1. Créer `app/(proprio)/dashboard/layout.tsx` — layout proprio avec sidebar + header
2. Créer `app/(admin)/admin/layout.tsx` — layout admin avec sidebar + header
3. Middleware : rediriger `/dashboard/*` → `/(proprio)/dashboard/*` et `/admin/*` → `/(admin)/admin/*`
4. Composants UI de base : `KpiCard`, `VillaCard`, `BookingStatusBadge`, `TaskStatusBadge`

### Phase 2 — Pages proprio
5. Page accueil proprio : KPIs + prochaines réservations + alertes
6. Page villas : liste + édition VillaForm
7. Page réservations : calendrier + liste
8. Page tâches : liste + création
9. Page revenus : graphiques + historique
10. Page statistiques : occupation + avis

### Phase 3 — Pages admin
11. Page accueil admin : KPIs globaux + activité récente
12. Page villas admin : CRUD complet
13. Page propriétaires : liste + détail
14. Page réservations admin : toutes résas filtrées
15. Page clients : base clients

### Phase 4 — Nettoyage
16. Supprimer l'ancien fichier monolithe `app/dashboard/proprio/[villaId]/page.tsx`
17. Rediriger les anciennes routes
18. Ajouter metadata SEO sur chaque page

---

## 7. Critères de validation

- [ ] `npm run build` passe sans erreur
- [ ] Navigation sidebar fonctionnelle sur mobile (hamburger)
- [ ] Les données proprio sont bien filtrées par RLS
- [ ] Le calendrier s'affiche correctement
- [ ] Les graphiques Recharts se rendent (pas de SSR fail)
- [ ] L'admin voit toutes les villas, le proprio voit les siennes
- [ ] Les anciennes routes `/dashboard/proprio/*` redirigent correctement

---

## 8. Notes techniques

- **Chakra UI** pour les composants denses (DataTable, Tabs, NumberInput) sur le dashboard
- **HeroUI** pour les composants modernes (Skeleton, Card, Dropdown) si disponible et souhaité
- **Tailwind** pour le layout général
- **next/dynamic** pour les graphiques Recharts (éviter SSR)
- **Lucide** pour les icônes (déjà dans le projet)
- **@dnd-kit** pour le drag & drop des photos (déjà dans le projet)
