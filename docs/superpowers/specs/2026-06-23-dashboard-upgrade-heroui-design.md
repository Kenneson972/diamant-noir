# Spec — Dashboard upgrade HeroUI Pro (Admin + Proprio)

**Date** : 2026-06-23 · **Statut** : Design validé — implémentation à venir  
**Décision produit** : Option C — polish visuel + efficacité opérationnelle ; **admin + proprio phase 1**, espace client phase 2.

---

## Objectif

Unifier et enrichir les **pages overview** `/admin` et `/dashboard` avec une couche dashboard partagée basée sur **HeroUI Pro** (via MCP + wrappers Kayvila), inspirée visuellement par **21st.dev** sans installer shadcn/Radix/Ark.

**Non-objectifs phase 1 :**
- Refonte sidebar (déjà livrée juin 2026)
- Refonte des pages listes (DataGrid, Kanban réservations)
- Nouveau schéma Supabase
- Migration espace client (phase 2)

---

## Contexte actuel

| Surface | Route | État |
|---|---|---|
| Admin overview | `app/(admin)/admin/page.tsx` | SSR riche ; 2× `KpiRow` ; widgets mixtes (`KayvilaWidget` + `div` bruts) ; barres occupation CSS ; activité/alertes hétérogènes |
| Proprio overview | `app/(proprio)/dashboard/page.tsx` → `DashboardPageClient` | Meilleure structure ; 2 KPIs ; `TodayTimeline` custom ; Copilot above-the-fold |
| Espace client | `app/espace-client/page.tsx` | Hub éditorial — **hors scope phase 1** |

**Stack UI imposée :**
- HeroUI Pro : `KPI`, `KPIGroup`, `Timeline`, `Widget` (wrappers existants dans `components/ui/pro/`)
- Charte Kayvila : navy / offwhite / gold, `KayvilaPngIcon`, `font-display`
- 21st.dev = **inspiration layout/densité uniquement** (stats cards, activity feed, alert lists)

---

## Approche retenue — Kit dashboard partagé (Option B)

Créer / étendre `components/dashboard/shared/` pour que admin et proprio consomment les mêmes briques.

**Alternatives écartées :**
- **A — Polish in-place** : dette UI fragmentée, admin/proprio divergent
- **C — Rebuild complet** : trop lourd, casse les patterns sidebar/badges récents

---

## Architecture composants

### Couche shared (nouveau / étendu)

| Composant | Fichier cible | Base HeroUI Pro | Rôle |
|---|---|---|---|
| `KpiCard` v2 | `components/dashboard/proprio/KpiCard.tsx` | `KPI` + `KPI.Trend` + `KPI.Chart` + `KPI.Progress` | KPI cliquable enrichi |
| `KpiItem` type | `components/dashboard/proprio/KpiRow.tsx` | — | `subtitle`, `chartData`, `progress` |
| `DashboardKpiGroup` | `components/dashboard/shared/dashboard-kpi-group.tsx` | `KPIGroup` | Rangée KPI connectée (style 21st stats row) |
| `DashboardWidget` | `components/dashboard/shared/dashboard-widget.tsx` | `Widget` | Header + description + action « Voir tout → » |
| `DashboardTimeline` | `components/dashboard/shared/dashboard-timeline.tsx` | `Timeline` | Feed activité / journée |
| `DashboardAlertList` | `components/dashboard/shared/dashboard-alert-list.tsx` | `Widget` + liens | Alertes actionnables |
| `DashboardOccupancyList` | `components/dashboard/shared/dashboard-occupancy-list.tsx` | `KPI.Progress` | Occupation par villa |

### Type `KpiItem` étendu

```ts
export type KpiItem = {
  icon: KpiIconName;
  label: string;
  value: string | number;
  href?: string;
  trend?: { value: number; positive: boolean };
  subtitle?: string;       // ex. "4 en attente" — sync badges sidebar
  chartData?: number[];    // sparkline → KPI.Chart (7 points max)
  progress?: number;       // 0–100 → KPI.Progress (occupation)
};
```

### Règles charte

- Couleurs sparkline : `var(--color-accent)` (gold) ou success/danger selon trend
- Texte informatif ≥ 11px — jamais `text-[10px]` pour du contenu lisible
- Icônes structurelles : `KayvilaPngIcon` ; Lucide fallback KPI uniquement (existant)
- Pas d'import vendor `@heroui-pro/react` hors `components/ui/pro/` et composants dashboard autorisés
- Vérifier API via **MCP HeroUI Pro** (`get_component_docs`) avant implémentation

---

## Phase 1 — Admin `/admin`

### Layout cible (grille)

```
AdminPageIntro

DashboardKpiGroup — priorité ops (4 KPIs)
  • Réservations (total + subtitle pending si dispo → /admin/reservations)
  • Demandes en attente (count → /admin/demandes)
  • Avis en attente (count → /admin/avis)
  • Note moyenne (value + trend optionnel)

DashboardKpiGroup — secondaire (4 KPIs)
  • Villas · Propriétaires · Clients · Conversion demandes (%)

[ Col 6: Arrivées du jour ]  [ Col 6: Départs du jour ]
  (DashboardWidget — contenu existant migré)

[ Col 8: DashboardTimeline activité ]  [ Col 4: DashboardAlertList + top favoris compact ]

DashboardOccupancyList (pleine largeur — remplace barres CSS)
```

### Données — aucune migration

Réutiliser le fetch SSR `Promise.all` existant dans `admin/page.tsx`.

**Ajouts serveur (calcul pur, pas de nouvelle table) :**
- `sparklineBookings7d` : counts réservations par jour sur 7 jours (query `bookings.created_at` ou agrégation en mémoire si dataset petit)
- KPIs cliquables : `href` alignés sur badges sidebar (`pendingRequests`, `pendingReviews`, etc.)

**Efficacité opérationnelle :**
- Chaque alerte = lien direct vers la vue de traitement
- Timeline fusionne demandes + réservations + avis (tri `created_at` desc, max 8 items)
- Subtitles KPI = mêmes counts que badges layout admin

---

## Phase 1 — Proprio `/dashboard`

### Layout cible

```
Intro + ProactiveNotification + StripeConnectButton

DashboardKpiGroup — 4 KPIs
  • Revenus du mois (trend MoM réel + chartData 6 mois)
  • Réservations à venir (count + href)
  • Tâches en attente (count pendingTasks → /dashboard/taches) — NOUVEAU
  • Taux occupation mois (progress %) — NOUVEAU

[ Col 6: DashboardTimeline aujourd'hui ]  [ Col 6: DashboardAlertList ]

DashboardCopilotChat — déplacé SOUS la grille ops (accordéon ou section repliable option lot 3)

[ Col 6: RevenueChart ]  [ Col 6: UpcomingBookings ]
```

### Corrections données

- **Trend réservations** : retirer le faux `%` basé sur `upcomingBookings.length` ; trend réservé aux KPIs avec delta calculé (revenus MoM)
- **Occupation proprio** : même algo chevauchement mois que admin, filtré `villaIds` du proprio
- **Tâches pending** : count déjà fetché (`pendingTasks`) — exposer dans `kpiItems`

### `TodayTimeline`

Remplacer `components/dashboard/proprio/TodayTimeline.tsx` par `DashboardTimeline` shared.  
Conserver le mapping `todayEventsList` côté serveur ; adapter le shape vers `TimelineItem` :

```ts
type DashboardTimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  status?: "success" | "warning" | "default";
  href?: string;
};
```

---

## Phase 2 — Espace client (plus tard)

- Migrer fetch client → **RSC** (pattern admin/proprio)
- KPI léger séjour : J-X, statut résa, messages non lus
- Conserver hub premium (`TenantQuickLinks`, `UpcomingStayHero`) — pas de copier dashboard ops
- Option : `ItemCard` Pro pour tuiles actions

---

## Phasing livraison

| Lot | Périmètre | Fichiers principaux |
|---|---|---|
| **1** | Types + `KpiCard` v2 + `DashboardKpiGroup` | `KpiRow.tsx`, `KpiCard.tsx`, `dashboard-kpi-group.tsx` |
| **2** | Admin overview re-layout | `app/(admin)/admin/page.tsx`, shared timeline/alerts/occupancy |
| **3** | Proprio overview aligné + fix trends | `dashboard/page.tsx`, `DashboardPageClient.tsx`, deprecate `TodayTimeline` |
| **4** (optionnel) | Copilot accordéon + `area-chart` Pro sur admin revenus | `DashboardPageClient`, `RevenueChart` |
| **Phase 2** | Espace client RSC + KPI séjour | `app/espace-client/page.tsx` |

---

## Inspirations 21st (référence visuelle)

- Stats row : [reui/statistics-card-7](https://21st.dev/community/components/reui/statistics-card-7/default), [reui/statistics-card-12](https://21st.dev/community/components/reui/statistics-card-12/default)
- Activity : layouts type dashboard analytics (densité modérée, badges sous valeur)
- **Interdit** : `npx shadcn add`, react-day-picker, Radix Themes sur dashboards

---

## Vérification

- [ ] `npx tsc --noEmit` sans erreur sur fichiers touchés
- [ ] Preview `/admin` : KPIs cliquables, timeline, alertes, occupation
- [ ] Preview `/dashboard` : 4 KPIs, timeline Pro, trend revenus cohérent
- [ ] Badges sidebar = subtitles KPI quand applicable
- [ ] `aria-current="page"` sur item sidebar actif (fix mineur review sidebar)
- [ ] Pas de régression Copilot proprio (toujours fonctionnel, position ajustée lot 3)

---

## Fichiers impactés (résumé)

**Créer :**
- `components/dashboard/shared/dashboard-kpi-group.tsx`
- `components/dashboard/shared/dashboard-widget.tsx`
- `components/dashboard/shared/dashboard-timeline.tsx`
- `components/dashboard/shared/dashboard-alert-list.tsx`
- `components/dashboard/shared/dashboard-occupancy-list.tsx`

**Modifier :**
- `components/dashboard/proprio/KpiCard.tsx`
- `components/dashboard/proprio/KpiRow.tsx`
- `app/(admin)/admin/page.tsx`
- `app/(proprio)/dashboard/page.tsx`
- `components/dashboard/proprio/DashboardPageClient.tsx`

**Déprécier (lot 3) :**
- `components/dashboard/proprio/TodayTimeline.tsx` → remplacé par shared

**Documenter :**
- `docs/ACTIONS_LOG.md` après chaque lot livré

---

## Références implémentation

- Plan détaillé : `docs/superpowers/plans/2026-06-23-dashboard-upgrade-heroui.md`
- HeroUI Pro MCP : `kpi`, `kpi-group`, `timeline`, `widget`
- Sidebar badges : layouts `app/(admin)/admin/layout.tsx`, `app/(proprio)/dashboard/layout.tsx`
