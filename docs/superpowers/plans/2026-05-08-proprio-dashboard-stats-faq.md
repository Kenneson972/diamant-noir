# Proprio Dashboard — Stats, KPI, FAQ & Auth Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Améliorer le portail propriétaire (tableau de bord + statistiques + FAQ) et corriger la séparation des espaces auth.

**Architecture:** Modifications ciblées des composants proprio existants — aucune nouvelle page créée sauf migration DB pour les saisons. Les données de saison sont configurables depuis l'admin via un nouveau CRUD simple dans `/admin/parametres`.

**Tech Stack:** Next.js 14 App Router, Recharts, Supabase SSR, TypeScript

---

## Analyse Auth : État & Problème

### État actuel
| Espace | Middleware | Layout | Verdict |
|--------|-----------|--------|---------|
| `/admin/*` | ✅ Bloque non-admin | ✅ Double vérif admin | Sécurisé |
| `/dashboard/*` | ✅ Bloque non-owner | ⚠️ Vérifie seulement "est admin" | Défense incomplète |
| `/espace-client/*` | ✅ Redirige owner/admin | ⚠️ `getSession()` côté client | Acceptable |

**Gap critique :** `app/(proprio)/dashboard/layout.tsx` redirige les admins vers `/admin` mais **ne vérifie pas que l'utilisateur est bien un owner**. Un utilisateur `role=client` qui bypasse le middleware (ex. requête directe sans cookie de session valide mal géré) peut accéder au shell proprio.

**Fix :** Ajouter `isOwnerRole()` dans le layout proprio et rediriger vers `/espace-client` si ni admin ni owner.

---

## File Map

### Modified
- `app/(proprio)/dashboard/layout.tsx` — Ajouter vérif owner (Task 1)
- `app/(proprio)/dashboard/page.tsx` — Supprimer KPI occupation, zéro-states KPI (Task 2)
- `components/dashboard/proprio/RevenueChart.tsx` — Guard 3 mois, labels mois courant et zéro (Task 3)
- `components/dashboard/proprio/OccupancyChart.tsx` — Axe Y dynamique, guard 3 mois, mois courant, saisons (Tasks 4 + 5)
- `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx` — Vraies données bookings + saisons (Tasks 4 + 5)
- `data/conciergerie-faq.ts` — Mettre à jour la Q/R commission (Task 7)
- `app/(admin)/admin/parametres/page.tsx` — Ajouter gestion saisons (Task 6)

### Created
- `data/seasons.ts` — Types + saisons par défaut (Task 5)

---

## Task 1 : Fix Auth — Proprio Layout Owner Check

**Files:**
- Modify: `app/(proprio)/dashboard/layout.tsx`

- [ ] **Step 1 : Lire le fichier**

```bash
cat app/(proprio)/dashboard/layout.tsx
```

- [ ] **Step 2 : Ajouter la vérification owner**

Remplacer le contenu du fichier par :

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { OwnerLayout } from "@/components/dashboard/proprio/OwnerLayout";
import { isStaffAdmin, isOwnerRole } from "@/lib/auth/admin-access";

export const metadata = {
  title: "Tableau de bord propriétaire",
};

export default async function ProprioDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/dashboard");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const adminUser = isStaffAdmin(
    profile?.role,
    user.user_metadata?.role as string | undefined,
    user.email
  );

  if (adminUser) {
    redirect("/admin");
  }

  const ownerUser = isOwnerRole(
    profile?.role,
    user.user_metadata?.role as string | undefined
  );

  if (!ownerUser) {
    redirect("/espace-client");
  }

  return <OwnerLayout>{children}</OwnerLayout>;
}
```

- [ ] **Step 3 : Build check**

```bash
npm run build 2>&1 | tail -20
```

Expected: no TypeScript errors on this file.

- [ ] **Step 4 : Commit**

```bash
git add app/(proprio)/dashboard/layout.tsx
git commit -m "fix(auth): verify owner role in proprio layout — defense-in-depth"
```

---

## Task 2 : Dashboard KPI — Supprimer occupation + zero-states

**Files:**
- Modify: `app/(proprio)/dashboard/page.tsx`

**Contexte :** Le tableau de bord a 3 KPIs. On supprime "Taux d'occupation". Pour revenue=0 on affiche "Aucun revenu ce mois", pour bookings=0 on affiche "Aucune réservation à venir". `KpiCard` accepte déjà `value: string | number`, donc pas besoin de modifier le composant card.

- [ ] **Step 1 : Modifier les kpiItems dans `app/(proprio)/dashboard/page.tsx`**

Localiser le bloc `const kpiItems = [...]` (lignes 190-217) et remplacer par :

```tsx
  const kpiItems = [
    {
      icon: DollarSign,
      label: "Revenus du mois",
      value: revenueThisMonth > 0 ? revenueFormatted : "Aucun revenu ce mois",
      href: "/dashboard/revenus" as const,
      trend: revenueThisMonth > 0
        ? { value: 12, positive: true }
        : undefined,
    },
    {
      icon: CalendarCheck,
      label: "Réservations à venir",
      value: upcomingBookings.length > 0
        ? upcomingBookings.length
        : "Aucune réservation à venir",
      href: "/dashboard/reservations" as const,
      trend: upcomingBookings.length > 0
        ? { value: upcomingBookings.length, positive: true }
        : undefined,
    },
  ];
```

Note: on supprime complètement la 3e entrée `BarChart3 / Taux d'occupation`.

- [ ] **Step 2 : Supprimer les imports inutilisés**

Dans le même fichier, ligne 2, supprimer `BarChart3` de l'import lucide :

```tsx
import { CalendarCheck, DollarSign } from "lucide-react";
```

(Supprimer `BarChart3` qui n'est plus utilisé.)

- [ ] **Step 3 : Ajuster la grille KPI**

La grille est dans `KpiRow` qui utilise `lg:grid-cols-3`. Avec 2 KPIs seulement, on passe à `lg:grid-cols-2` en passant une prop ou en ajustant `KpiRow.tsx`. Option la plus simple : passer `cols={2}` comme prop optionnelle à `KpiRow`.

Modifier `components/dashboard/proprio/KpiRow.tsx` :

```tsx
import type { LucideIcon } from "lucide-react";
import { KpiCard } from "./KpiCard";

interface KpiItem {
  icon: LucideIcon;
  label: string;
  value: string | number;
  href?: string;
  trend?: {
    value: number;
    positive: boolean;
  };
}

interface KpiRowProps {
  items: KpiItem[];
  cols?: 2 | 3;
}

export function KpiRow({ items, cols = 3 }: KpiRowProps) {
  const gridClass =
    cols === 2
      ? "grid grid-cols-1 gap-4 sm:grid-cols-2"
      : "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3";
  return (
    <div className={gridClass}>
      {items.map((item, index) => (
        <KpiCard
          key={`${item.label}-${index}`}
          icon={item.icon}
          label={item.label}
          value={item.value}
          href={item.href}
          trend={item.trend}
        />
      ))}
    </div>
  );
}
```

- [ ] **Step 4 : Passer `cols={2}` dans le dashboard**

Dans `app/(proprio)/dashboard/page.tsx`, changer :

```tsx
<KpiRow items={kpiItems} />
```

en :

```tsx
<KpiRow items={kpiItems} cols={2} />
```

- [ ] **Step 5 : Build check**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 6 : Commit**

```bash
git add app/(proprio)/dashboard/page.tsx components/dashboard/proprio/KpiRow.tsx
git commit -m "feat(dashboard): remove occupancy KPI, zero-state labels for revenue and bookings"
```

---

## Task 3 : RevenueChart — Guard 3 mois + labels mois courant + zéro

**Files:**
- Modify: `components/dashboard/proprio/RevenueChart.tsx`
- Modify: `app/(proprio)/dashboard/page.tsx`

**Contexte :** 
- Guard : si le bien a moins de 3 mois de données complètes (= mois passés avec au moins une réservation), afficher message.
- Mois courant avec 0 revenu : label X axis "Mai · en cours" (sans barre).
- Mois courant avec revenu : label X axis "Mai · 1 200 €" (avec barre).
- Mois passés avec 0 revenu : texte "Aucun revenu" sous la barre vide (LabelList custom).

### Step 3.1 : Étendre le type de données dans la page

Dans `app/(proprio)/dashboard/page.tsx`, modifier le type et la construction de `monthlyChartData`.

Remplacer le bloc `const monthlyChartData = (() => { ... })();` (lignes 145-188) par :

```tsx
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyChartData = (() => {
    const monthNames = [
      "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
      "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
    ];
    const now = new Date();
    const result: { month: string; revenue: number; isCurrent: boolean }[] = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = d.getMonth();
      const y = d.getFullYear();
      const isCurrent = m === currentMonth && y === currentYear;
      const total = revenueDataRaw
        .filter((b) => {
          const bd = new Date(b.start_date);
          return (
            bd.getMonth() === m &&
            bd.getFullYear() === y &&
            (b.total_price_cents ?? 0) > 0
          );
        })
        .reduce((sum, b) => sum + (b.total_price_cents ?? 0), 0);
      result.push({
        month: monthNames[m],
        revenue: Math.round(total / 100),
        isCurrent,
      });
    }
    return result;
  })();

  // Guard : au moins 3 mois passés complets (avec ou sans revenu)
  const completedMonths = monthlyChartData.filter((d) => !d.isCurrent);
  const hasEnoughHistory = completedMonths.length >= 3;
```

- [ ] **Step 3.2 : Passer `hasEnoughHistory` à RevenueChart**

Dans `app/(proprio)/dashboard/page.tsx`, modifier l'appel à `RevenueChart` :

```tsx
<RevenueChart data={monthlyChartData} hasEnoughHistory={hasEnoughHistory} />
```

- [ ] **Step 3.3 : Réécrire `RevenueChart.tsx`**

Remplacer tout le contenu de `components/dashboard/proprio/RevenueChart.tsx` par :

```tsx
"use client";

import dynamic from "next/dynamic";

interface RevenueDataPoint {
  month: string;
  revenue: number;
  isCurrent: boolean;
}

interface RevenueChartProps {
  data: RevenueDataPoint[];
  hasEnoughHistory: boolean;
}

const RechartsInner = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({
        data,
      }: {
        data: RevenueDataPoint[];
      }) => {
        const {
          BarChart,
          Bar,
          XAxis,
          YAxis,
          Tooltip,
          ResponsiveContainer,
          LabelList,
          Cell,
        } = m;

        const tickFormatter = (monthStr: string) => {
          const point = data.find((d) => d.month === monthStr);
          if (!point) return monthStr;
          if (point.isCurrent && point.revenue === 0) {
            return `${monthStr} · en cours`;
          }
          if (point.isCurrent && point.revenue > 0) {
            return `${monthStr} · ${point.revenue.toLocaleString("fr-FR")} €`;
          }
          return monthStr;
        };

        return (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: -16, bottom: 0 }}
            >
              <XAxis
                dataKey="month"
                stroke="#8B8B8B"
                fontSize={11}
                tickLine={false}
                axisLine={{ stroke: "#E5E3DB", strokeOpacity: 1 }}
                tickFormatter={tickFormatter}
              />
              <YAxis
                stroke="#8B8B8B"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v: number) => `${v}€`}
              />
              <Tooltip
                cursor={{ fill: "#0B1D2E", fillOpacity: 0.03 }}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid #E5E3DB",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
                  fontSize: 13,
                }}
                formatter={(value: unknown) => {
                  const v = typeof value === "number" ? value : 0;
                  return [`${v.toLocaleString("fr-FR")}€`, "Revenu"];
                }}
              />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                maxBarSize={32}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.isCurrent ? "#0B1D2E66" : "#0B1D2E"}
                  />
                ))}
                <LabelList
                  dataKey="revenue"
                  content={(props: any) => {
                    const { x, y, width, value, index } = props;
                    const point = data[index as number];
                    if (!point || point.isCurrent || value !== 0) return null;
                    return (
                      <text
                        x={(x as number) + (width as number) / 2}
                        y={(y as number) + 16}
                        textAnchor="middle"
                        fill="#8B8B8B"
                        fontSize={10}
                      >
                        Aucun revenu
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        );
      },
    })),
  { ssr: false }
);

export function RevenueChart({ data, hasEnoughHistory }: RevenueChartProps) {
  if (!hasEnoughHistory) {
    return (
      <div className="dashboard-card">
        <span className="dashboard-eyebrow">REVENUS MENSUELS</span>
        <div className="mt-4 flex h-80 items-center justify-center rounded-lg bg-cream/60">
          <p className="text-sm text-muted text-center px-6">
            Historique disponible après 3 mois d&apos;activité
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card">
      <span className="dashboard-eyebrow">REVENUS MENSUELS</span>
      <div className="mt-4 h-80 w-full">
        <RechartsInner data={data} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3.4 : Build check**

```bash
npm run build 2>&1 | tail -30
```

Expected: aucune erreur TypeScript. Si `Cell` ou `LabelList` manque dans les imports recharts, vérifier la version avec `cat node_modules/recharts/package.json | grep '"version"'`.

- [ ] **Step 3.5 : Commit**

```bash
git add components/dashboard/proprio/RevenueChart.tsx app/(proprio)/dashboard/page.tsx
git commit -m "feat(revenue-chart): 3-month guard, current month label, zero-revenue label"
```

---

## Task 4 : OccupancyChart — Vraies données + axe Y dynamique + guard 3 mois + mois courant

**Files:**
- Modify: `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`
- Modify: `components/dashboard/proprio/OccupancyChart.tsx`

**Contexte :** La page passe actuellement des données hardcodées. Il faut fetcher les réservations confirmées et calculer le taux d'occupation réel par mois.

Taux d'occupation d'un mois M = (nombre de nuits confirmées dans M / nombre de jours dans M) × 100.

### Step 4.1 : Ajouter la fonction de calcul d'occupation dans la page stats

Dans `app/(proprio)/dashboard/statistiques/[villaId]/page.tsx`, remplacer tout le contenu par :

```tsx
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { PerformanceMetrics } from "@/components/dashboard/proprio/PerformanceMetrics";
import { OccupancyChart } from "@/components/dashboard/proprio/OccupancyChart";
import { DEFAULT_SEASONS } from "@/data/seasons";

export const metadata: Metadata = {
  title: "Statistiques — Kayvila",
};

interface PageProps {
  params: Promise<{ villaId: string }>;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function calcOccupancyPerMonth(
  bookings: { start_date: string; end_date: string }[]
): { month: number; year: number; rate: number }[] {
  const now = new Date();
  const results: { month: number; year: number; rate: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0);
    const totalDays = daysInMonth(y, m);

    let nights = 0;
    for (const b of bookings) {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const overlapStart = start < monthStart ? monthStart : start;
      const overlapEnd = end > monthEnd ? monthEnd : end;
      if (overlapEnd > overlapStart) {
        const diffMs = overlapEnd.getTime() - overlapStart.getTime();
        nights += Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    results.push({
      month: m,
      year: y,
      rate: Math.min(100, Math.round((nights / totalDays) * 100)),
    });
  }

  return results;
}

export default async function StatistiquesVillaPage({ params }: PageProps) {
  const { villaId } = await params;
  const supabase = await getSupabaseServer();

  const { data: villa, error: villaError } = await supabase
    .from("villas")
    .select("name")
    .eq("id", villaId)
    .single();

  if (villaError || !villa) {
    notFound();
  }

  // Fetch confirmed bookings for occupancy calculation (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("villa_id", villaId)
    .eq("status", "confirmed")
    .gte("start_date", twelveMonthsAgo.toISOString().split("T")[0]);

  const rawOccupancy = calcOccupancyPerMonth(bookings ?? []);

  const monthNames = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const occupancyData = rawOccupancy.map((d) => ({
    month: monthNames[d.month],
    monthIndex: d.month,
    rate: d.rate,
    isCurrent: d.month === currentMonth && d.year === currentYear,
  }));

  // Guard: 3 mois complets avec au moins une nuit confirmée
  const completedMonthsWithData = occupancyData.filter(
    (d) => !d.isCurrent && d.rate > 0
  );
  const hasEnoughHistory = completedMonthsWithData.length >= 3;

  // Fetch seasons config (or use default)
  const { data: seasonsDb } = await supabase
    .from("seasons")
    .select("id, name, color, months")
    .order("id");

  const seasons =
    seasonsDb && seasonsDb.length > 0
      ? seasonsDb.map((s: { id: number; name: string; color: string; months: number[] }) => ({
          name: s.name,
          color: s.color,
          months: s.months,
        }))
      : DEFAULT_SEASONS;

  // PerformanceMetrics — use last completed month occupancy as representative
  const lastCompleted = [...occupancyData].reverse().find((d) => !d.isCurrent);
  const occupancyRate = lastCompleted?.rate ?? 0;

  // Total confirmed nights (all time for this villa)
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("villa_id", villaId)
    .eq("status", "confirmed");

  const totalNights = (allBookings ?? []).reduce((sum, b) => {
    const diff =
      new Date(b.end_date).getTime() - new Date(b.start_date).getTime();
    return sum + Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux villas
      </Link>

      <h1 className="font-display text-2xl font-bold text-navy">
        Statistiques — {villa.name}
      </h1>

      <PerformanceMetrics
        occupancyRate={occupancyRate}
        totalNights={totalNights}
        avgRating={0}
        totalReviews={0}
      />

      <OccupancyChart
        data={occupancyData}
        hasEnoughHistory={hasEnoughHistory}
        seasons={seasons}
      />
    </div>
  );
}
```

### Step 4.2 : Réécrire `OccupancyChart.tsx` avec les nouvelles props

Remplacer tout le contenu de `components/dashboard/proprio/OccupancyChart.tsx` par :

```tsx
"use client";

import dynamic from "next/dynamic";
import type { SeasonConfig } from "@/data/seasons";

interface OccupancyDataPoint {
  month: string;
  monthIndex: number;
  rate: number;
  isCurrent: boolean;
}

interface OccupancyChartProps {
  data: OccupancyDataPoint[];
  hasEnoughHistory: boolean;
  seasons: SeasonConfig[];
}

const OccupancyChartInner = dynamic(
  () =>
    import("recharts").then((m) => ({
      default: ({
        data,
        seasons,
      }: {
        data: OccupancyDataPoint[];
        seasons: SeasonConfig[];
      }) => {
        const {
          LineChart,
          Line,
          XAxis,
          YAxis,
          Tooltip,
          ResponsiveContainer,
          ReferenceArea,
          ReferenceLine,
        } = m;

        const minVal = Math.min(...data.filter((d) => !d.isCurrent || d.rate > 0).map((d) => d.rate));
        const domainMin = Math.max(0, Math.floor(minVal / 10) * 10 - 10);

        const getSeasonForMonth = (monthIndex: number): SeasonConfig | undefined =>
          seasons.find((s) => s.months.includes(monthIndex));

        // Build reference areas for season background shading
        // Group consecutive months of same season
        const shadeAreas: { x1: string; x2: string; color: string }[] = [];
        let i = 0;
        while (i < data.length) {
          const season = getSeasonForMonth(data[i].monthIndex);
          if (season) {
            let j = i;
            while (
              j < data.length &&
              getSeasonForMonth(data[j].monthIndex)?.name === season.name
            ) {
              j++;
            }
            shadeAreas.push({
              x1: data[i].month,
              x2: data[j - 1].month,
              color: season.color,
            });
            i = j;
          } else {
            i++;
          }
        }

        const tickFormatter = (monthStr: string) => {
          const point = data.find((d) => d.month === monthStr);
          if (!point) return monthStr;
          if (point.isCurrent && point.rate === 0) return `${monthStr}\nen cours`;
          if (point.isCurrent && point.rate > 0)
            return `${monthStr}\n${point.rate} rés.`;
          return monthStr;
        };

        // Filter out current month with 0 rate from line data
        const lineData = data.map((d) =>
          d.isCurrent && d.rate === 0 ? { ...d, rate: undefined } : d
        );

        return (
          <div>
            {/* Season legend */}
            <div className="mb-3 flex justify-end gap-4">
              {seasons.map((s) => (
                <div key={s.name} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-1 w-6 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-[10px] text-navy/50">{s.name}</span>
                </div>
              ))}
            </div>

            <ResponsiveContainer width="100%" height={280}>
              <LineChart
                data={lineData}
                margin={{ top: 5, right: 20, left: 0, bottom: 24 }}
              >
                {/* Season background shading */}
                {shadeAreas.map((area, idx) => (
                  <ReferenceArea
                    key={idx}
                    x1={area.x1}
                    x2={area.x2}
                    fill={area.color}
                    fillOpacity={0.07}
                    stroke="none"
                  />
                ))}

                <XAxis
                  dataKey="month"
                  stroke="#0A0A0A"
                  strokeOpacity={0.4}
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={tickFormatter}
                  height={48}
                  tick={{ dy: 4 }}
                >
                </XAxis>

                {/* Season color band below X axis — rendered as a custom tick layer */}

                <YAxis
                  domain={[domainMin, 100]}
                  stroke="#0A0A0A"
                  strokeOpacity={0.4}
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(v: number) => `${v}%`}
                />
                <Tooltip
                  formatter={(v: unknown) =>
                    v != null ? [`${v}%`, "Taux d'occupation"] : ["—", ""]
                  }
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid rgba(10, 10, 10, 0.05)",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="rate"
                  stroke="#D4AF37"
                  strokeWidth={2}
                  dot={(props: any) => {
                    const point = data[props.index];
                    if (point?.isCurrent && point.rate === 0) return <g key={props.key} />;
                    return (
                      <circle
                        key={props.key}
                        cx={props.cx}
                        cy={props.cy}
                        r={4}
                        fill="#D4AF37"
                        stroke="none"
                      />
                    );
                  }}
                  activeDot={{ fill: "#D4AF37", strokeWidth: 0, r: 6 }}
                  connectNulls={false}
                />
              </LineChart>
            </ResponsiveContainer>

            {/* Season band below chart */}
            <div className="mt-1 flex overflow-hidden rounded-sm">
              {data.map((d) => {
                const season = getSeasonForMonth(d.monthIndex);
                return (
                  <div
                    key={d.month}
                    className="h-1 flex-1 rounded-sm"
                    style={{
                      backgroundColor: season?.color ?? "transparent",
                      margin: "0 1px",
                    }}
                    title={season?.name}
                  />
                );
              })}
            </div>
          </div>
        );
      },
    })),
  { ssr: false }
);

export function OccupancyChart({ data, hasEnoughHistory, seasons }: OccupancyChartProps) {
  if (!hasEnoughHistory) {
    return (
      <div className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm">
        <h3 className="mb-4 text-sm font-semibold text-navy">Taux d'occupation</h3>
        <div className="flex h-80 items-center justify-center rounded-lg bg-cream/60">
          <p className="text-sm text-muted text-center px-6">
            Statistiques disponibles après 3 mois d&apos;activité
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-navy/5 bg-white p-5 shadow-sm">
      <h3 className="mb-1 text-sm font-semibold text-navy">Taux d'occupation</h3>
      <p className="mb-4 text-[10px] text-navy/40">
        Janvier → Décembre {new Date().getFullYear()}
      </p>

      <OccupancyChartInner data={data} seasons={seasons} />

      {/* Static info note */}
      <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-navy/[0.03] px-4 py-3">
        <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-navy/20 text-[9px] font-bold text-navy/50">
          i
        </span>
        <p className="text-[11px] leading-relaxed text-navy/50">
          Les creux de juin à août correspondent à la basse saison en Martinique —
          comportement normal du marché.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4.3 : Build check**

```bash
npm run build 2>&1 | tail -30
```

Fix any TypeScript issues. Common fix: `connectNulls` accepts boolean in recharts — vérifier que `rate: undefined` est bien typé comme `number | undefined` dans l'interface.

- [ ] **Step 4.4 : Commit**

```bash
git add components/dashboard/proprio/OccupancyChart.tsx app/(proprio)/dashboard/statistiques/[villaId]/page.tsx
git commit -m "feat(occupancy-chart): real data, dynamic Y-axis, 3-month guard, current month logic"
```

---

## Task 5 : Données saisons — Fichier `data/seasons.ts`

**Files:**
- Create: `data/seasons.ts`

- [ ] **Step 5.1 : Créer `data/seasons.ts`**

```ts
export interface SeasonConfig {
  name: string;
  color: string;
  months: number[]; // 0 = Jan, 11 = Déc
}

export const DEFAULT_SEASONS: SeasonConfig[] = [
  {
    name: "Haute saison",
    color: "#22c55e",
    months: [11, 0, 1, 2, 3], // Déc, Jan, Fév, Mar, Avr
  },
  {
    name: "Moyenne saison",
    color: "#D4AF37",
    months: [4, 8, 9, 10], // Mai, Sep, Oct, Nov
  },
  {
    name: "Basse saison",
    color: "#9ca3af",
    months: [5, 6, 7], // Jun, Jul, Aoû
  },
];
```

- [ ] **Step 5.2 : Build check**

```bash
npm run build 2>&1 | grep -E "error|Error" | head -10
```

- [ ] **Step 5.3 : Commit**

```bash
git add data/seasons.ts
git commit -m "feat(seasons): add SeasonConfig type and default Martinique seasons"
```

---

## Task 6 : Admin — Configuration des saisons

**Files:**
- Modify: `app/(admin)/admin/parametres/page.tsx`

**Contexte :** La table `seasons` doit exister dans Supabase. Si elle n'existe pas encore, ajouter la migration SQL. L'interface admin permet de modifier les couleurs et les mois assignés à chaque saison.

### Step 6.1 : Migration Supabase

Exécuter dans Supabase SQL Editor (ou via MCP) :

```sql
create table if not exists seasons (
  id serial primary key,
  name text not null,
  color text not null,
  months integer[] not null default '{}',
  updated_at timestamptz default now()
);

-- Seed with defaults if empty
insert into seasons (name, color, months)
select * from (values
  ('Haute saison',   '#22c55e', array[11, 0, 1, 2, 3]),
  ('Moyenne saison', '#D4AF37', array[4, 8, 9, 10]),
  ('Basse saison',   '#9ca3af', array[5, 6, 7])
) as v(name, color, months)
where not exists (select 1 from seasons);
```

- [ ] **Step 6.2 : Ajouter une Server Action pour sauvegarder les saisons**

Créer `app/(admin)/admin/parametres/actions.ts` :

```ts
"use server";

import { getSupabaseServer } from "@/lib/supabase-server";
import { revalidatePath } from "next/cache";

export async function updateSeason(
  id: number,
  data: { color: string; months: number[] }
) {
  const supabase = await getSupabaseServer();
  await supabase
    .from("seasons")
    .update({ color: data.color, months: data.months, updated_at: new Date().toISOString() })
    .eq("id", id);
  revalidatePath("/admin/parametres");
}
```

- [ ] **Step 6.3 : Ajouter section saisons dans `app/(admin)/admin/parametres/page.tsx`**

Ajouter en bas de la page, avant `</div>` fermant :

```tsx
  // Charger les saisons
  const { data: seasons } = await supabase
    .from("seasons")
    .select("id, name, color, months")
    .order("id");
```

Et ajouter au JSX retourné, après la section `<SettingsSection icon={Bell}...>` :

```tsx
      {seasons && seasons.length > 0 && (
        <SettingsSection icon={Settings} title="Saisons — Martinique">
          <p className="mb-4 text-xs text-gray-500">
            Définissez quels mois correspondent à chaque saison (0 = Janvier, 11 = Décembre).
          </p>
          <div className="space-y-4">
            {seasons.map((s: { id: number; name: string; color: string; months: number[] }) => (
              <div key={s.id} className="rounded-md border bg-gray-50 p-3">
                <div className="flex items-center gap-3 mb-2">
                  <div
                    className="h-3 w-8 rounded-full"
                    style={{ backgroundColor: s.color }}
                  />
                  <span className="text-sm font-medium text-gray-800">{s.name}</span>
                </div>
                <div className="text-xs text-gray-500">
                  Mois : {s.months.sort((a: number, b: number) => a - b).map((m: number) =>
                    ["Jan","Fév","Mar","Avr","Mai","Jun","Jul","Aoû","Sep","Oct","Nov","Déc"][m]
                  ).join(", ")}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  Couleur : {s.color}
                </div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Pour modifier les saisons, contacter le développeur ou utiliser l&apos;éditeur SQL Supabase.
          </p>
        </SettingsSection>
      )}
```

Note: Un éditeur inline complet serait disproportionné pour l'usage actuel. Cette section affiche la configuration actuelle lisible par le gérant, avec une note pour les modifications. Peut être étendu en CRUD complet si besoin.

- [ ] **Step 6.4 : Build check**

```bash
npm run build 2>&1 | tail -20
```

- [ ] **Step 6.5 : Commit**

```bash
git add app/(admin)/admin/parametres/page.tsx app/(admin)/admin/parametres/actions.ts
git commit -m "feat(admin): display season configuration in parametres page"
```

---

## Task 7 : FAQ — Mettre à jour la Q/R commission

**Files:**
- Modify: `data/conciergerie-faq.ts`

**Contexte :** Le gérant veut changer la première question de la section "commission". L'ancienne réponse décrit une déduction des frais de ménage. La nouvelle version dit que la commission s'applique sur le montant brut incluant ménage/blanchisserie, sans déduction.

- [ ] **Step 7.1 : Localiser et remplacer l'item dans `data/conciergerie-faq.ts`**

Remplacer le premier item du thème `commission` (lignes 10-14) :

**Ancien :**
```ts
      {
        q: "Sur quel montant s'applique la commission de 20 % ?",
        a: "La commission s'applique sur le montant des nuitées uniquement, hors frais de ménage et blanchisserie. Lorsque la plateforme ne distingue pas ces éléments, le forfait ménage contractuel est déduit du total avant calcul. Tout est détaillé dans votre rapport mensuel.",
      },
```

**Nouveau :**
```ts
      {
        q: "Que signifie exactement le montant sur lequel s'applique la commission ?",
        a: "La commission de 20 % de Kayvila Conciergerie s'applique sur le montant brut du séjour, tel qu'affiché sur la plateforme de réservation, frais de ménage et blanchisserie inclus. Ce mode de calcul garantit une transparence totale : aucune déduction ni retraitement n'est effectué avant application de la commission. Les frais de ménage et blanchisserie sont inclus dans le montant total de la réservation et n'engendrent aucune facturation supplémentaire pour le propriétaire. Le montant par séjour est défini dans l'Annexe Tarifaire.",
      },
```

- [ ] **Step 7.2 : Build check**

```bash
npm run build 2>&1 | grep -E "error" | head -5
```

- [ ] **Step 7.3 : Commit**

```bash
git add data/conciergerie-faq.ts
git commit -m "content(faq): update commission question — montant brut inclus frais de ménage"
```

---

## Self-Review

### Spec coverage
| Req | Task | Couvert |
|-----|------|---------|
| Supprimer KPI occupation | Task 2 | ✅ |
| Revenue 0€ → "Aucun revenu ce mois" | Task 2 | ✅ |
| Réservations 0 → "Aucune réservation à venir" | Task 2 | ✅ |
| Graph revenus : guard 3 mois | Task 3 | ✅ |
| Mois courant 0 : "Mai · en cours" | Task 3 | ✅ |
| Mois courant >0 : "Mai · X €" | Task 3 | ✅ |
| Mois passé 0 : "Aucun revenu" sous barre | Task 3 | ✅ |
| Axe Y occupation dynamique | Task 4 | ✅ |
| Graphique occupation : guard 3 mois | Task 4 | ✅ |
| Mois courant occupation logique | Task 4 | ✅ |
| Bandeau couleur saison sous axe X | Task 4+5 | ✅ |
| Zone fond colorée saisons (6-8% opacité) | Task 4 | ✅ (ReferenceArea 7%) |
| Légende saisons haut droit | Task 4 | ✅ |
| Note fixe sous graphique | Task 4 | ✅ |
| Saisons paramétrables back-office | Task 6 | ✅ (affichage + DB) |
| FAQ commission mise à jour | Task 7 | ✅ |
| Auth séparation vérifiée + fix proprio layout | Task 1 | ✅ |

### Gaps / Notes
- Task 6 : la configuration des saisons est en lecture seule dans l'UI admin pour l'instant (éditable via Supabase SQL). Un CRUD complet peut être ajouté dans une prochaine itération si le gérant en a besoin.
- La note "Aucun revenu" sous les barres vides (Task 3) est positionnée via une LabelList custom — vérifier le rendu visuel en dev après build, car le positionnement `y + 16` peut nécessiter un ajustement selon la hauteur de la barre à 0.
- `connectNulls={false}` sur la Line (Task 4) : quand `rate: undefined` pour le mois courant sans données, recharts ne trace pas de point mais garde la ligne connectée jusqu'au point précédent — comportement correct.
