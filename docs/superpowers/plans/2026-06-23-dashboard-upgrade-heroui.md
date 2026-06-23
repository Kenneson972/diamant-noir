# Dashboard Upgrade HeroUI Pro — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Unifier les overviews admin et proprio avec KPI enrichis (sparkline, progress), KPIGroup, Timeline Pro et widgets actionnables — sans shadcn, sans migration DB.

**Architecture:** Kit partagé dans `components/dashboard/shared/` ; extension `KpiItem`/`KpiCard` ; pages overview consomment les mêmes briques ; fetch SSR existant + calculs sparkline/occupation côté serveur.

**Tech Stack:** Next.js 15 App Router, HeroUI Pro (`KPI`, `KPIGroup`, `Timeline`, `Widget`), Tailwind v4, TypeScript strict, KayvilaPngIcon

**Spec:** `docs/superpowers/specs/2026-06-23-dashboard-upgrade-heroui-design.md`

## Global Constraints

- 21st.dev = inspiration visuelle uniquement — **pas** de `npx shadcn add`, pas Radix/Ark UI
- API HeroUI Pro vérifiée via MCP `get_component_docs` avant usage
- Charte Kayvila : navy/offwhite/gold, `font-display`, PNG Kayvila pour icônes structurelles
- Texte informatif ≥ 11px — pas de `text-[10px]` pour contenu lisible
- Imports `@heroui-pro/react` limités aux wrappers dashboard et `components/ui/pro/`
- Aucune migration Supabase — calculs serveur uniquement
- Vérif TypeScript : `npx tsc --noEmit` (pas `npm run build` local si erreur BigInt pré-existante)
- Documenter chaque lot dans `docs/ACTIONS_LOG.md`

---

## Task 1 — Étendre KpiItem + KpiCard v2

**Files:**
- Modify: `components/dashboard/proprio/KpiRow.tsx`
- Modify: `components/dashboard/proprio/KpiCard.tsx`

**Interfaces:**
- Produces: `KpiItem` avec `subtitle?`, `chartData?`, `progress?`
- Produces: `KpiCard` rend `KPI.Chart` si `chartData`, `KPI.Progress` si `progress`, subtitle sous value

---

- [ ] **Step 1: Étendre le type KpiItem dans KpiRow.tsx**

```ts
export type KpiItem = {
  icon: KpiIconName;
  label: string;
  value: string | number;
  href?: string;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  chartData?: number[];
  progress?: number;
};
```

- [ ] **Step 2: Passer les nouvelles props dans KpiRow**

```tsx
<KpiCard
  key={`${item.label}-${index}`}
  icon={item.icon}
  label={item.label}
  value={item.value}
  href={item.href}
  trend={item.trend}
  subtitle={item.subtitle}
  chartData={item.chartData}
  progress={item.progress}
/>
```

- [ ] **Step 3: Enrichir KpiCard.tsx**

Ajouter props optionnelles et rendu conditionnel après `KPI.Content` :

```tsx
interface KpiCardProps {
  // ... existant
  subtitle?: string;
  chartData?: number[];
  progress?: number;
}

// Dans KPI.Content, après trend :
{subtitle ? (
  <p className="text-[11px] font-medium text-muted">{subtitle}</p>
) : null}
{chartData && chartData.length >= 2 ? (
  <KPI.Chart
    color="var(--color-accent)"
    data={chartData}
    height={48}
    strokeWidth={1.5}
  />
) : null}
{progress != null ? (
  <KPI.Progress value={progress} className="mt-2" />
) : null}
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
cd diamant-noir && npx tsc --noEmit 2>&1 | grep -E "KpiCard|KpiRow" || true
```

Attendu : 0 erreur sur ces fichiers.

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/proprio/KpiRow.tsx components/dashboard/proprio/KpiCard.tsx
git commit -m "feat(dashboard): étend KpiItem avec sparkline, progress et subtitle"
```

---

## Task 2 — DashboardKpiGroup (wrapper KPIGroup)

**Files:**
- Create: `components/dashboard/shared/dashboard-kpi-group.tsx`

**Interfaces:**
- Consumes: `KpiItem[]`, `KpiCard` (Task 1)
- Produces: `DashboardKpiGroup({ items, className? })`

---

- [ ] **Step 1: Créer dashboard-kpi-group.tsx**

```tsx
"use client";

import { KPIGroup } from "@heroui-pro/react";
import { KpiCard } from "@/components/dashboard/proprio/KpiCard";
import type { KpiItem } from "@/components/dashboard/proprio/KpiRow";
import { cn } from "@/lib/utils";

type DashboardKpiGroupProps = {
  items: KpiItem[];
  className?: string;
};

export function DashboardKpiGroup({ items, className }: DashboardKpiGroupProps) {
  if (items.length === 0) return null;

  return (
    <KPIGroup className={cn("rounded-xl border border-border-subtle bg-white p-1 shadow-sm", className)}>
      {items.map((item, index) => (
        <div key={`${item.label}-${index}`} className="contents">
          {index > 0 ? <KPIGroup.Separator /> : null}
          <KpiCard
            {...item}
            className="border-0 shadow-none hover:shadow-none"
          />
        </div>
      ))}
    </KPIGroup>
  );
}
```

- [ ] **Step 2: Vérifier rendu KPIGroup via MCP si props inattendues**

Appeler MCP `get_component_docs` components `["kpi-group"]` et ajuster classes si nécessaire.

- [ ] **Step 3: tsc**

```bash
npx tsc --noEmit 2>&1 | grep dashboard-kpi-group || true
```

- [ ] **Step 4: Commit**

```bash
git add components/dashboard/shared/dashboard-kpi-group.tsx
git commit -m "feat(dashboard): ajoute DashboardKpiGroup wrapper HeroUI Pro"
```

---

## Task 3 — DashboardWidget + DashboardTimeline + DashboardAlertList

**Files:**
- Create: `components/dashboard/shared/dashboard-widget.tsx`
- Create: `components/dashboard/shared/dashboard-timeline.tsx`
- Create: `components/dashboard/shared/dashboard-alert-list.tsx`

**Interfaces:**
- Produces: `DashboardWidget({ title, description?, actionHref?, actionLabel?, children })`
- Produces: `DashboardTimeline({ items: DashboardTimelineItem[] })`
- Produces: `DashboardAlertList({ alerts: { href, label, severity }[] })`

---

- [ ] **Step 1: dashboard-widget.tsx**

Wrapper autour de `KayvilaWidget` avec slot action Link optionnel :

```tsx
import Link from "next/link";
import { KayvilaWidget } from "@/components/ui/pro";

type DashboardWidgetProps = {
  title: string;
  description?: string;
  actionHref?: string;
  actionLabel?: string;
  children: React.ReactNode;
  className?: string;
};

export function DashboardWidget({ title, description, actionHref, actionLabel = "Voir tout →", children, className }: DashboardWidgetProps) {
  return (
    <KayvilaWidget title={title} description={description} className={className}>
      {actionHref ? (
        <div className="mb-4 flex justify-end">
          <Link href={actionHref} className="text-[11px] font-semibold uppercase tracking-wider text-gold hover:underline">
            {actionLabel}
          </Link>
        </div>
      ) : null}
      {children}
    </KayvilaWidget>
  );
}
```

- [ ] **Step 2: dashboard-timeline.tsx**

```tsx
"use client";

import Link from "next/link";
import { Timeline } from "@heroui-pro/react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

export type DashboardTimelineItem = {
  id: string;
  title: string;
  subtitle?: string;
  timestamp?: string;
  icon?: "calendar" | "message" | "star" | "login" | "logout";
  status?: "success" | "warning" | "default";
  href?: string;
};

export function DashboardTimeline({ items }: { items: DashboardTimelineItem[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-muted">Aucune activité récente.</p>;
  }

  return (
    <Timeline>
      {items.map((item) => (
        <Timeline.Item key={item.id} align="center" status={item.status ?? "default"}>
          <Timeline.Marker aria-hidden="true">
            {item.icon ? <KayvilaPngIcon name={item.icon} size={20} alt="" /> : null}
          </Timeline.Marker>
          <Timeline.Content>
            {item.href ? (
              <Link href={item.href} className="block no-underline hover:opacity-80">
                <p className="text-sm font-medium text-navy">{item.title}</p>
                {item.subtitle ? <p className="text-[11px] text-muted">{item.subtitle}</p> : null}
              </Link>
            ) : (
              <>
                <p className="text-sm font-medium text-navy">{item.title}</p>
                {item.subtitle ? <p className="text-[11px] text-muted">{item.subtitle}</p> : null}
              </>
            )}
            {item.timestamp ? (
              <p className="text-[11px] text-navy/40">{item.timestamp}</p>
            ) : null}
          </Timeline.Content>
        </Timeline.Item>
      ))}
    </Timeline>
  );
}
```

- [ ] **Step 3: dashboard-alert-list.tsx**

```tsx
import Link from "next/link";
import { DashboardWidget } from "./dashboard-widget";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

export type DashboardAlert = {
  href: string;
  label: string;
  severity?: "high" | "medium" | "low";
};

export function DashboardAlertList({ alerts, title = "Alertes" }: { alerts: DashboardAlert[]; title?: string }) {
  return (
    <DashboardWidget title={title}>
      {alerts.length === 0 ? (
        <p className="text-sm text-muted">Aucune alerte.</p>
      ) : (
        <ul className="space-y-2">
          {alerts.map((a) => (
            <li key={a.href + a.label}>
              <Link
                href={a.href}
                className="flex items-center gap-2 text-sm text-amber-700 no-underline hover:underline"
              >
                <KayvilaPngIcon name="message" size={18} alt="" />
                {a.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardWidget>
  );
}
```

- [ ] **Step 4: tsc + commit**

```bash
npx tsc --noEmit 2>&1 | grep "dashboard/shared" || true
git add components/dashboard/shared/dashboard-widget.tsx \
        components/dashboard/shared/dashboard-timeline.tsx \
        components/dashboard/shared/dashboard-alert-list.tsx
git commit -m "feat(dashboard): widgets shared timeline, alertes et widget action"
```

---

## Task 4 — DashboardOccupancyList

**Files:**
- Create: `components/dashboard/shared/dashboard-occupancy-list.tsx`

**Interfaces:**
- Consumes: `{ id, name, rate: number }[]`
- Produces: `DashboardOccupancyList({ title, items })`

---

- [ ] **Step 1: Créer le composant**

```tsx
"use client";

import { KPI } from "@heroui-pro/react";
import { DashboardWidget } from "./dashboard-widget";

type OccupancyItem = { id: string; name: string; rate: number };

export function DashboardOccupancyList({ title, items }: { title: string; items: OccupancyItem[] }) {
  return (
    <DashboardWidget title={title}>
      <div className="space-y-4">
        {items.map((v) => (
          <div key={v.id} className="space-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-sm text-navy/80">{v.name}</span>
              <span className="text-sm font-semibold text-navy">{v.rate}%</span>
            </div>
            <KPI.Progress value={Math.min(v.rate, 100)} />
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/shared/dashboard-occupancy-list.tsx
git commit -m "feat(dashboard): occupation par villa via KPI.Progress"
```

---

## Task 5 — Admin overview re-layout

**Files:**
- Modify: `app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `DashboardKpiGroup`, `DashboardWidget`, `DashboardTimeline`, `DashboardAlertList`, `DashboardOccupancyList`
- Consumes: counts existants `pendingRequests`, `pendingReviews`, etc.

---

- [ ] **Step 1: Helper sparkline 7 jours (inline dans page ou `lib/dashboard/sparkline.ts`)**

```ts
function buildDailyCounts(
  rows: { created_at: string }[],
  days = 7
): number[] {
  const out: number[] = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    out.push(rows.filter((r) => r.created_at.startsWith(key)).length);
  }
  return out;
}
```

Ajouter fetch parallèle léger : `bookings` des 7 derniers jours avec `created_at` uniquement.

- [ ] **Step 2: Construire 2 groupes KPI**

Groupe priorité :
```ts
const priorityKpis: KpiItem[] = [
  { icon: "calendar", label: "Réservations", value: bookingCount ?? 0, href: "/admin/reservations", chartData: bookingSparkline },
  { icon: "message", label: "Demandes", value: pendingRequests ?? 0, href: "/admin/demandes", subtitle: pendingRequests ? `${pendingRequests} en attente` : undefined },
  { icon: "star", label: "Avis", value: pendingReviews ?? 0, href: "/admin/avis", subtitle: pendingReviews ? `${pendingReviews} à modérer` : undefined },
  { icon: "trendingUp", label: "Note moyenne", value: avgRating !== "—" ? `${avgRating}/5` : avgRating },
];
```

Groupe secondaire : villas, propriétaires, clients, conversion (existant).

- [ ] **Step 3: Remplacer KpiRow doubles par 2× DashboardKpiGroup**

- [ ] **Step 4: Migrer arrivées/départs vers DashboardWidget**

- [ ] **Step 5: Fusionner activité récente → DashboardTimeline**

Mapper `recentRequests`, `recentBookings`, `recentReviews` en `DashboardTimelineItem[]`, tri desc, slice 8.

- [ ] **Step 6: Alertes → DashboardAlertList**

```ts
const adminAlerts = [
  ...(pendingRequests ? [{ href: "/admin/demandes", label: `${pendingRequests} demande(s) en attente` }] : []),
  ...(pendingReviews ? [{ href: "/admin/avis", label: `${pendingReviews} avis en attente` }] : []),
];
```

- [ ] **Step 7: Occupation → DashboardOccupancyList**

Mapper `allVillas` + `occupancyByVilla` + `daysInMonth` en `{ id, name, rate }[]`.

- [ ] **Step 8: Grille finale**

```tsx
<DashboardKpiGroup items={priorityKpis} />
<DashboardKpiGroup items={secondaryKpis} className="mt-4" />
{/* arrivées / départs grid */}
<div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
  <div className="lg:col-span-8"><DashboardWidget title="Activité récente">...</DashboardWidget></div>
  <div className="lg:col-span-4 space-y-6">...</div>
</div>
<DashboardOccupancyList ... />
```

- [ ] **Step 9: tsc + ACTIONS_LOG + commit**

```bash
npx tsc --noEmit 2>&1 | grep "admin/page" || true
git add app/(admin)/admin/page.tsx
git commit -m "feat(admin): overview unifié KPI group, timeline et alertes Pro"
```

---

## Task 6 — Proprio overview aligné

**Files:**
- Modify: `app/(proprio)/dashboard/page.tsx`
- Modify: `components/dashboard/proprio/DashboardPageClient.tsx`
- Delete or deprecate: `components/dashboard/proprio/TodayTimeline.tsx` (après migration)

---

- [ ] **Step 1: Calculer occupation proprio (page.tsx)**

Réutiliser algo chevauchement admin sur `villaIds` ; `occupancyRate = Math.round(totalNights / (villaIds.length * daysInMonth) * 100)`.

- [ ] **Step 2: Étendre kpiItems à 4**

```ts
const kpiItems: KpiItem[] = [
  {
    icon: "dollarSign",
    label: "Revenus du mois",
    value: revenueThisMonth > 0 ? revenueFormatted : "0 €",
    href: "/dashboard/revenus",
    trend: revenueLastMonth > 0 ? { value: Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100), positive: revenueThisMonth >= revenueLastMonth } : undefined,
    chartData: monthlyChartData.map((d) => d.revenue),
  },
  {
    icon: "calendar",
    label: "Réservations à venir",
    value: upcomingBookings.length,
    href: "/dashboard/reservations",
    subtitle: upcomingBookings.length === 1 ? "1 séjour" : `${upcomingBookings.length} séjours`,
  },
  {
    icon: "clipboard",
    label: "Tâches en attente",
    value: pendingTasks.length,
    href: "/dashboard/taches",
    subtitle: pendingTasks.length ? "À traiter" : "Rien en attente",
  },
  {
    icon: "percent",
    label: "Occupation du mois",
    value: `${occupancyRate}%`,
    progress: occupancyRate,
  },
];
```

Retirer le trend faux sur réservations.

- [ ] **Step 3: Mapper todayEventsList → DashboardTimelineItem[]**

Passer `timelineItems` en prop à `DashboardPageClient`.

- [ ] **Step 4: DashboardPageClient — remplacer KpiRow par DashboardKpiGroup**

```tsx
import { DashboardKpiGroup } from "@/components/dashboard/shared/dashboard-kpi-group";
import { DashboardTimeline } from "@/components/dashboard/shared/dashboard-timeline";
import { DashboardAlertList } from "@/components/dashboard/shared/dashboard-alert-list";

// Remplacer <KpiRow items={kpiItems} cols={2} /> par :
<DashboardKpiGroup items={kpiItems} />

// Remplacer TodayTimeline par DashboardTimeline
// Déplacer DashboardCopilotChat sous la grille timeline/alerts (lot optionnel Task 7)
```

- [ ] **Step 5: Supprimer import TodayTimeline si unused**

- [ ] **Step 6: tsc + commit**

```bash
git add app/(proprio)/dashboard/page.tsx \
        components/dashboard/proprio/DashboardPageClient.tsx
git commit -m "feat(proprio): overview 4 KPIs, timeline Pro, fix trend réservations"
```

---

## Task 7 (optionnel) — Copilot accordéon + fix a11y sidebar

**Files:**
- Modify: `components/dashboard/proprio/DashboardPageClient.tsx`
- Modify: `components/dashboard/shared/DashboardSidebar.tsx`

---

- [ ] **Step 1: Wrapper Copilot dans `<details>` ou composant Accordion Kayvila**

Copilot visible but collapsed by default on mobile ; open on desktop optional.

- [ ] **Step 2: Ajouter `aria-current="page"` sur NavItem actif**

Dans `DashboardSidebar.tsx`, sur le lien actif : `aria-current={isActive ? "page" : undefined}`.

- [ ] **Step 3: Commit**

```bash
git commit -m "fix(dashboard): copilot repliable + aria-current sidebar"
```

---

## Task 8 — Documentation session

**Files:**
- Modify: `docs/ACTIONS_LOG.md`
- Modify: `docs/logs/2026-06-23.md` (créer si absent)

---

- [ ] **Step 1: Entrée ACTIONS_LOG**

```markdown
### 2026-06-23T… — Dashboard upgrade HeroUI Pro (admin + proprio)
- **type:** ui
- **summary:** KPI group sparkline/progress, timeline Pro, alertes actionnables, admin/proprio overviews unifiés
- **files:** components/dashboard/shared/*, KpiCard, admin/page, dashboard/page, DashboardPageClient
- **why:** Option C polish + efficacité ops, cohérence HeroUI Pro Kayvila
- **impact:** Overviews admin/proprio alignés, liens directs vers files pending
- **verify:** tsc --noEmit, preview /admin et /dashboard
```

---

## Self-Review (plan vs spec)

| Exigence spec | Task |
|---|---|
| KpiItem étendu | Task 1 |
| DashboardKpiGroup | Task 2 |
| DashboardWidget/Timeline/AlertList | Task 3 |
| DashboardOccupancyList | Task 4 |
| Admin re-layout | Task 5 |
| Proprio 4 KPIs + timeline | Task 6 |
| Copilot reposition + a11y | Task 7 (optionnel) |
| Phase 2 espace client | Hors plan — spec only |
| Pas migration DB | Toutes tasks |
| MCP HeroUI Pro | Task 2 step 2 |

**Gaps:** Lot 4 admin mini-chart revenus (`area-chart` Pro) laissé optionnel post-MVP — ajouter Task 9 si demandé.

---

## Execution Handoff

Plan saved to `docs/superpowers/plans/2026-06-23-dashboard-upgrade-heroui.md`.

**Two execution options:**

1. **Subagent-Driven (recommended)** — un subagent par task, review entre tasks
2. **Inline Execution** — implémentation dans cette session, lots 1→6 séquentiels

Which approach?
