# Responsive Mobile Dashboards — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rendre les 6 écrans dashboards Kayvila impeccables sur mobile (bottom nav, cartes à la place des DataGrids, KPI 2×2, refonte résas proprio) selon la spec `docs/superpowers/specs/2026-07-01-responsive-mobile-dashboards-design.md`.

**Architecture:** Design adaptatif in-place — breakpoints Tailwind sur les composants existants ; double rendu (`hidden md:block` / `md:hidden`) uniquement pour les 2 DataGrids (villas admin, résas admin) et la grille KPI. Nouveaux petits composants partagés (`MobileBottomNav`, `FilterBottomSheet`, `QuickActions`, cartes listes). Zéro nouvelle route API, zéro migration.

**Tech Stack:** Next.js 15.2 App Router, Tailwind v4, HeroUI Pro (Sidebar, KPI, DataGrid), lucide-react + KayvilaPngIcon, Playwright.

## Global Constraints

- **Branche** : `feat/responsive-mobile-dashboards` (créée depuis `main` à jour). Pousser la branche après chaque tâche committée.
- **Zéro nouvelle dépendance npm, zéro nouvelle route API, zéro migration DB.**
- **Gate par tâche** : `npx tsc --noEmit` doit passer (le `npm run build` local est cassé de façon PRÉ-EXISTANTE — ne pas s'en servir comme gate, ne pas essayer de le réparer).
- **Direction impeccable (obligatoire)** : jamais de `border-left`/`border-right` > 1px coloré (side-stripe) ; jamais de texte en dégradé ; pas de cartes imbriquées dans des cartes ; l'or (`gold`) = un seul CTA primaire par écran + états actifs, tout le reste en navy/ghost ; empty states rédigés et utiles.
- **Mobile** : zones tactiles ≥ 44px (`min-h-[44px]`+), inputs `text-base` (16px, anti-zoom iOS), texte informatif ≥ 11px (`text-[10px]` réservé aux eyebrows décoratifs), `pb-[env(safe-area-inset-bottom)]` sur les éléments fixés en bas.
- **Icônes** : passer des **noms string** (`DashboardNavIcon` / `KayvilaPngIcon name=`), jamais un composant Lucide en prop Server→Client. Jamais de fonction/callback en prop Server→Client.
- **Copy français** : dans les strings JS/TSX contenant une apostrophe (`d'accueil`), utiliser des double quotes `"..."`, jamais `'...'`.
- **Fichiers < 500 lignes.**
- **Playwright** : un dev server doit déjà tourner sur `:3000` (PAS de webServer auto). Ne JAMAIS killer un process sur :3000 — s'il n'y a pas de serveur, le lancer soi-même (`npm run dev`, SANS `--turbo` si worktree avec node_modules symlinké). Sélecteurs `:visible` obligatoires (double rendu desktop+mobile). Comptes : `admin@diamantnoir.com`/`Admin123!`, `proprio1@test.com`/`Test123456!`, tests avec `--workers=1`.
- **Commits** : message conventionnel français, footer :
  ```
  Co-Authored-By: claude-flow <ruv@ruv.net>
  Claude-Session: https://claude.ai/code/session_015Xz1Lttgy3Npwy6r1Z4RVs
  ```

---

### Task 1: MobileBottomNav + intégration DashboardShell

**Files:**
- Create: `components/dashboard/shared/MobileBottomNav.tsx`
- Modify: `components/dashboard/shared/DashboardShell.tsx` (main padding + rendu du composant)

**Interfaces:**
- Consumes: `DashboardNavIcon` (`components/dashboard/shared/dashboard-nav-icon.tsx`, prop `name: string, size: number`), `Sidebar`/`useSidebar` de `@heroui-pro/react/sidebar`, `cn` de `@/lib/utils`.
- Produces: `MobileBottomNav({ role }: { role: "admin" | "owner" | "tenant" })` — export nommé. `data-testid="mobile-bottom-nav"` (utilisé par la Task 10).

- [ ] **Step 1: Créer le composant**

```tsx
// components/dashboard/shared/MobileBottomNav.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@heroui-pro/react/sidebar";
import { MoreHorizontal } from "lucide-react";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import { cn } from "@/lib/utils";

type BottomNavRole = "admin" | "owner" | "tenant";

type BottomNavEntry = {
  label: string;
  href: string;
  icon: string; // nom DashboardNavIcon — toujours string, jamais un composant
  exact?: boolean;
};

const BOTTOM_NAV: Record<BottomNavRole, BottomNavEntry[]> = {
  admin: [
    { label: "Dashboard", href: "/admin", icon: "LayoutDashboard", exact: true },
    { label: "Résas", href: "/admin/reservations", icon: "CalendarDays" },
    { label: "Villas", href: "/admin/villas", icon: "Building2" },
    { label: "Messages", href: "/admin/messages", icon: "MessageCircle" },
  ],
  owner: [
    { label: "Dashboard", href: "/dashboard", icon: "LayoutDashboard", exact: true },
    { label: "Résas", href: "/dashboard/reservations", icon: "CalendarDays" },
    { label: "Villas", href: "/dashboard/villas", icon: "Building2" },
    { label: "Revenus", href: "/dashboard/revenus", icon: "DollarSign" },
  ],
  tenant: [
    { label: "Séjour", href: "/espace-client", icon: "Home", exact: true },
    { label: "Demandes", href: "/espace-client/demandes", icon: "ClipboardList" },
    { label: "Livret", href: "/espace-client/livret", icon: "BookOpen" },
    { label: "Messages", href: "/espace-client/messagerie", icon: "MessageCircle" },
  ],
};

function isEntryActive(entry: BottomNavEntry, pathname: string): boolean {
  return entry.exact ? pathname === entry.href : pathname.startsWith(entry.href);
}

export function MobileBottomNav({ role }: { role: BottomNavRole }) {
  const pathname = usePathname() ?? "";
  const { toggleSidebar } = useSidebar();
  const entries = BOTTOM_NAV[role];

  return (
    <nav
      aria-label="Navigation principale mobile"
      data-testid="mobile-bottom-nav"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/8 bg-white pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <div className="grid grid-cols-5">
        {entries.map((entry) => {
          const active = isEntryActive(entry, pathname);
          return (
            <Link
              key={entry.href}
              href={entry.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[56px] flex-col items-center justify-center gap-1 no-underline transition-transform active:scale-[0.98]",
                active ? "text-gold" : "text-navy/55"
              )}
            >
              <DashboardNavIcon name={entry.icon} size={22} />
              <span className="text-[11px] font-medium leading-none">{entry.label}</span>
            </Link>
          );
        })}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label="Plus d'options"
          className="flex min-h-[56px] flex-col items-center justify-center gap-1 text-navy/55 transition-transform active:scale-[0.98]"
        >
          <MoreHorizontal className="size-[22px]" aria-hidden />
          <span className="text-[11px] font-medium leading-none">Plus</span>
        </button>
      </div>
    </nav>
  );
}
```

⚠️ **Vérification `useSidebar`** : le hook vient de `@heroui-pro/react/sidebar` (déjà utilisé dans `kayvila-sidebar-panel.tsx:160` — `const { toggleSidebar, isOpen } = useSidebar()`). Si sur mobile `toggleSidebar` ne fait qu'agrandir/réduire la sidebar desktop au lieu d'ouvrir le tiroir `Sidebar.Mobile`, remplacer le `<button>` par `<Sidebar.Trigger className="...">` (le composant qui marche déjà dans `DashboardHeader.tsx:53`) avec les mêmes classes. Vérifier au navigateur (Step 3), pas seulement à la compilation.

- [ ] **Step 2: Intégrer dans DashboardShell**

Dans `components/dashboard/shared/DashboardShell.tsx` :

1. Ajouter l'import : `import { MobileBottomNav } from "./MobileBottomNav";`
2. Remplacer la classe du `<main>` (ligne ~87) :

```tsx
<main
  id={`${role}-main`}
  className="flex-1 px-4 py-6 pb-[calc(6rem+env(safe-area-inset-bottom))] md:px-8 md:py-8 md:pb-8"
>
  {children}
</main>
<MobileBottomNav role={role} />
```

(`MobileBottomNav` rendu juste après `</main>`, toujours DANS `<Sidebar.Main>` pour rester sous le `Sidebar.Provider`.)

- [ ] **Step 3: Vérifier en navigateur**

Dev server sur :3000, puis vérifier avec Playwright MCP ou manuellement (viewport 390×844) :
- `/admin` connecté admin : bottom nav visible, 5 items, entrée « Dashboard » gold.
- Tap « Plus » ouvre le tiroir sidebar mobile.
- `/espace-client` connecté locataire : bottom nav tenant visible.
- Viewport 1280 : bottom nav absente.
- Aucun contenu masqué en bas de page (scroller jusqu'en bas).

- [ ] **Step 4: Gate TypeScript**

Run: `npx tsc --noEmit`
Expected: 0 erreur nouvelle (les erreurs pré-existantes hors-scope type `tests/a11y.spec.ts` sont tolérées — vérifier qu'elles ne touchent pas les fichiers de la branche).

- [ ] **Step 5: Commit + push**

```bash
git add components/dashboard/shared/MobileBottomNav.tsx components/dashboard/shared/DashboardShell.tsx
git commit -m "feat(mobile): bottom navigation 3 rôles + padding main"
git push -u origin feat/responsive-mobile-dashboards
```

---

### Task 2: KPI mobile 2×2 (DashboardKpiGroup + KpiCard)

**Files:**
- Modify: `components/dashboard/shared/dashboard-kpi-group.tsx`
- Modify: `components/dashboard/proprio/KpiCard.tsx`

**Interfaces:**
- Consumes: `KpiCard` (props existantes : `icon, label, value, href, trend, subtitle, chartData, progress, className`).
- Produces: `KpiCard` accepte une nouvelle prop optionnelle `hideChart?: boolean`. `DashboardKpiGroup` rend une grille 2 colonnes `<md` et le `KPIGroup` HeroUI inchangé `≥md`.

- [ ] **Step 1: Ajouter `hideChart` à KpiCard**

Dans `components/dashboard/proprio/KpiCard.tsx` :
1. Ajouter `hideChart?: boolean;` à `KpiCardProps` et `hideChart,` à la destructuration.
2. Remplacer la condition du chart (ligne ~112) :

```tsx
{chartPoints && !hideChart ? (
  <KPI.Chart
    color="var(--color-accent)"
    data={chartPoints}
    height={48}
    strokeWidth={1.5}
  />
) : null}
```

- [ ] **Step 2: Grille mobile dans DashboardKpiGroup**

Remplacer le `return` de `components/dashboard/shared/dashboard-kpi-group.tsx` par :

```tsx
return (
  <>
    {/* Mobile : 2 colonnes, chiffre XXL — la donnée parle par la typographie */}
    <div className={cn("grid grid-cols-2 gap-2 md:hidden", className)}>
      {items.map((item, index) => (
        <KpiCard
          key={`m-${item.label}-${index}`}
          icon={item.icon}
          label={item.label}
          value={item.value}
          href={item.href}
          trend={item.trend}
          subtitle={item.subtitle}
          progress={item.progress}
          hideChart
        />
      ))}
    </div>

    {/* Desktop : KPIGroup HeroUI inchangé (sparklines conservées) */}
    <KPIGroup
      className={cn(
        "hidden rounded-xl border border-border-subtle bg-white p-1 shadow-sm md:flex",
        className
      )}
    >
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${index}`}>
          {index > 0 ? <KPIGroup.Separator /> : null}
          <KpiCard
            icon={item.icon}
            label={item.label}
            value={item.value}
            href={item.href}
            trend={item.trend}
            subtitle={item.subtitle}
            chartData={item.chartData}
            progress={item.progress}
            className="border-0 shadow-none hover:shadow-none"
          />
        </Fragment>
      ))}
    </KPIGroup>
  </>
);
```

⚠️ Si `KPIGroup` de `@heroui-pro/react` ne rend pas `hidden md:flex` correctement (display forcé en interne), envelopper : `<div className="hidden md:block"><KPIGroup className={...}>...</KPIGroup></div>`.

- [ ] **Step 3: Vérifier en navigateur**

Viewport 390 : `/admin` et `/dashboard` affichent les KPI en 2 colonnes, chiffres larges, pas de sparkline, cartes cliquables. Viewport 1280 : rendu identique à avant (groupe horizontal + sparklines).

- [ ] **Step 4: Gate + commit + push**

```bash
npx tsc --noEmit
git add components/dashboard/shared/dashboard-kpi-group.tsx components/dashboard/proprio/KpiCard.tsx
git commit -m "feat(mobile): KPI en grille 2 colonnes sous md, sparklines desktop only"
git push
```

---

### Task 3: QuickActions + dashboard admin (écran 1)

**Files:**
- Create: `components/dashboard/shared/QuickActions.tsx`
- Modify: `app/(admin)/admin/page.tsx`

**Interfaces:**
- Consumes: `DashboardNavIcon` (name string, size).
- Produces: `QuickActions({ actions }: { actions: { label: string; href: string; icon: string; primary?: boolean }[] })` — export nommé, composant server-safe (zéro hook).

- [ ] **Step 1: Créer QuickActions**

```tsx
// components/dashboard/shared/QuickActions.tsx
import Link from "next/link";
import { DashboardNavIcon } from "@/components/dashboard/shared/dashboard-nav-icon";
import { cn } from "@/lib/utils";

type QuickAction = {
  label: string;
  href: string;
  icon: string;
  /** Un seul primaire par écran — l'or est un signal, pas une décoration. */
  primary?: boolean;
};

export function QuickActions({ actions }: { actions: QuickAction[] }) {
  if (actions.length === 0) return null;
  return (
    <section aria-label="Actions rapides">
      <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-navy/45">
        Actions rapides
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row">
        {actions.map((action) => (
          <Link
            key={action.href}
            href={action.href}
            className={cn(
              "inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg px-5 text-sm font-semibold no-underline transition-transform active:scale-[0.98] sm:flex-1",
              action.primary
                ? "bg-gold text-white hover:bg-gold/90"
                : "border border-navy/15 bg-white text-navy hover:border-navy/30"
            )}
          >
            <DashboardNavIcon name={action.icon} size={18} />
            {action.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
```

⚠️ `dashboard-nav-icon.tsx` est un composant client (`"use client"`) — l'importer depuis une page serveur est valide (frontière client automatique). Vérifier qu'il connaît `Building2`, `CalendarDays`, `MessageCircle` (mêmes noms que la sidebar admin — c'est le même mapping).

- [ ] **Step 2: Intégrer dans /admin + empty states rédigés**

Dans `app/(admin)/admin/page.tsx` :
1. Import : `import { QuickActions } from "@/components/dashboard/shared/QuickActions";`
2. Après `<DashboardKpiGroup items={secondaryKpis} className="mt-4" />` (ligne ~306), insérer :

```tsx
<QuickActions
  actions={[
    { label: "Ajouter une villa", href: "/admin/villas/ajouter", icon: "Building2", primary: true },
    { label: "Réservations", href: "/admin/reservations", icon: "CalendarDays" },
    { label: "Messages", href: "/admin/messages", icon: "MessageCircle" },
  ]}
/>
```

3. Remplacer les deux `emptyLabel` (lignes ~312 et ~324) :
   - Arrivées : `emptyLabel="Aucune arrivée aujourd'hui — les check-ins du jour apparaîtront ici."`
   - Départs : `emptyLabel="Aucun départ aujourd'hui — les check-outs du jour apparaîtront ici."`

- [ ] **Step 3: Vérifier, gate, commit, push**

Viewport 390 : `/admin` montre « Actions rapides » (1 bouton gold + 2 ghost, empilés) sous les KPI ; 1280 : les 3 boutons en ligne.

```bash
npx tsc --noEmit
git add components/dashboard/shared/QuickActions.tsx "app/(admin)/admin/page.tsx"
git commit -m "feat(admin): actions rapides + empty states rédigés dashboard"
git push
```

---

### Task 4: FilterBottomSheet partagé

**Files:**
- Create: `components/dashboard/shared/FilterBottomSheet.tsx`

**Interfaces:**
- Consumes: `hooks/useFocusTrap.ts` (**lire le fichier d'abord** — créé Phase F audit 2026-06-18 ; adapter l'appel à sa signature réelle, attendu ≈ `useFocusTrap(ref, active)`).
- Produces: `FilterBottomSheet({ label, children }: { label?: string; children: React.ReactNode })` — bouton déclencheur + panneau bas mobile. `data-testid="filter-bottom-sheet-trigger"` et `data-testid="filter-bottom-sheet-panel"`. Les `children` sont du JSX serveur (Links) passés en children — sérialisation OK.

- [ ] **Step 1: Créer le composant**

```tsx
// components/dashboard/shared/FilterBottomSheet.tsx
"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useFocusTrap } from "@/hooks/useFocusTrap";

export function FilterBottomSheet({
  label = "Filtres",
  children,
}: {
  label?: string;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  useFocusTrap(panelRef, open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        data-testid="filter-bottom-sheet-trigger"
        onClick={() => setOpen(true)}
        className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-navy/15 bg-white px-4 text-sm font-semibold text-navy md:hidden"
      >
        <SlidersHorizontal className="size-4" aria-hidden />
        {label}
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label={label}>
          <button
            type="button"
            aria-label="Fermer"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-navy/40"
          />
          <div
            ref={panelRef}
            data-testid="filter-bottom-sheet-panel"
            className="absolute inset-x-0 bottom-0 max-h-[80dvh] overflow-y-auto rounded-t-2xl bg-white pb-[calc(1.5rem+env(safe-area-inset-bottom))] shadow-2xl motion-safe:animate-[sheet-up_0.25s_cubic-bezier(0.16,1,0.3,1)]"
          >
            <div className="sticky top-0 flex items-center justify-between border-b border-navy/8 bg-white px-4 py-3">
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-navy/45">{label}</p>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer les filtres"
                className="flex size-11 items-center justify-center text-navy/55"
              >
                <X className="size-5" aria-hidden />
              </button>
            </div>
            <div className="px-4 py-4">{children}</div>
          </div>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Keyframe d'entrée**

Dans `app/globals.css`, ajouter (près des autres `@keyframes` existants — chercher `@keyframes` dans le fichier) :

```css
@keyframes sheet-up {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
```

(`motion-safe:` sur la classe garantit le respect de `prefers-reduced-motion` ; animation en `transform` uniquement.)

- [ ] **Step 3: Gate + commit + push**

```bash
npx tsc --noEmit
git add components/dashboard/shared/FilterBottomSheet.tsx app/globals.css
git commit -m "feat(mobile): bottom sheet de filtres partagé (focus trap, reduced motion)"
git push
```

---

### Task 5: Écran 2 — cartes villas admin mobile

**Files:**
- Create: `components/dashboard/admin/AdminVillaCardList.tsx`
- Modify: `app/(admin)/admin/villas/page.tsx`

**Interfaces:**
- Consumes: `AdminVillaRow` (exporté par `AdminVillasDataGrid.tsx`), `VillaThumb`, `VillaPastBookingsDrawer`, `KayvilaPngIcon`, `FilterBottomSheet` (Task 4).
- Produces: `AdminVillaCardList({ rows }: { rows: AdminVillaRow[] })` — `data-testid="admin-villas-cards"`.

- [ ] **Step 1: Créer AdminVillaCardList**

```tsx
// components/dashboard/admin/AdminVillaCardList.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { VillaThumb } from "@/components/dashboard/admin/VillaThumb";
import { VillaPastBookingsDrawer } from "@/components/dashboard/VillaPastBookingsDrawer";
import type { AdminVillaRow } from "@/components/dashboard/admin/AdminVillasDataGrid";
import { cn } from "@/lib/utils";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

export function AdminVillaCardList({ rows }: { rows: AdminVillaRow[] }) {
  const [drawerVilla, setDrawerVilla] = useState<{ id: string; name: string } | null>(null);

  return (
    <>
      <ul className="space-y-3" data-testid="admin-villas-cards">
        {rows.map((villa) => (
          <li key={villa.id} className="border border-navy/8 bg-white">
            <div className="flex gap-3 p-4">
              <VillaThumb
                src={villa.image_url ?? villa.image_urls?.[0]}
                alt={villa.name}
                size={72}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-display-dashboard text-base font-semibold leading-snug text-navy">
                    {villa.name}
                  </p>
                  <span
                    className={cn(
                      "shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium",
                      villa.is_published
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-gray-100 text-gray-500"
                    )}
                  >
                    {villa.is_published ? "Publiée" : "Non publiée"}
                  </span>
                </div>
                <p className="mt-0.5 text-sm text-navy/55">{villa.location ?? "—"}</p>
                <p className="mt-1 text-sm font-medium text-navy">
                  {fmtEur.format(villa.price_per_night)} / nuit
                  {villa.capacity != null ? (
                    <span className="font-normal text-navy/45"> · {villa.capacity} pers.</span>
                  ) : null}
                </p>
                <p className="mt-1 text-[11px] text-navy/45">
                  {villa.owner_name ?? "Sans propriétaire"} · {fmtEur.format(villa.confirmedRevenue)} confirmés
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 divide-x divide-navy/8 border-t border-navy/8">
              <Link
                href={`/admin/villas/${villa.id}`}
                className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-gold no-underline active:scale-[0.98]"
              >
                Modifier
              </Link>
              <button
                type="button"
                onClick={() => setDrawerVilla({ id: villa.id, name: villa.name })}
                className="flex min-h-[48px] items-center justify-center text-sm text-navy/70 active:scale-[0.98]"
              >
                {villa.bookingCount} résa{villa.bookingCount > 1 ? "s" : ""}
              </button>
              <Link
                href={`/admin/reservations?villa=${villa.id}&view=calendar`}
                className="flex min-h-[48px] items-center justify-center gap-1.5 text-sm text-navy/70 no-underline active:scale-[0.98]"
              >
                <KayvilaPngIcon name="calendar" size={18} alt="" />
                Calendrier
              </Link>
            </div>
          </li>
        ))}
      </ul>
      {drawerVilla ? (
        <VillaPastBookingsDrawer
          villaId={drawerVilla.id}
          villaName={drawerVilla.name}
          open
          onClose={() => setDrawerVilla(null)}
        />
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Brancher dans la page villas**

Dans `app/(admin)/admin/villas/page.tsx` :

1. Imports : `AdminVillaCardList`, `FilterBottomSheet`.
2. Remplacer le rendu final (ligne ~307-309) :

```tsx
) : (
  <>
    <div className="hidden md:block">
      <AdminVillasDataGrid rows={villas} />
    </div>
    <div className="md:hidden">
      <AdminVillaCardList rows={villas} />
    </div>
  </>
)}
```

3. Extraire le bloc de chips filtres/tri (le `<div className="flex flex-wrap items-center gap-2">`, lignes ~215-286) dans une constante locale `const filterChips = (<div className="flex flex-wrap items-center gap-2">...contenu identique...</div>);` puis rendre :

```tsx
{/* Desktop : chips inline inchangées */}
<div className="hidden md:block">{filterChips}</div>
{/* Mobile : chips dans le bottom sheet */}
<FilterBottomSheet label="Filtres & tri">{filterChips}</FilterBottomSheet>
```

4. Barre de recherche : sur le `<form>` recherche (ligne ~192), rendre la barre sticky mobile et l'input 16px :
   - form : `className="sticky top-16 z-20 -mx-4 flex gap-2 bg-offwhite px-4 py-2 md:static md:z-auto md:mx-0 md:bg-transparent md:p-0"`
   - input : remplacer `text-sm` par `text-base md:text-sm` et ajouter `min-h-[44px]`.
   - bouton « Rechercher » : ajouter `min-h-[44px]`.

- [ ] **Step 3: Vérifier en navigateur**

Viewport 390, `/admin/villas` admin : cartes visibles (photo, badge, 3 actions), DataGrid absent, recherche sticky au scroll, bouton « Filtres & tri » ouvre le sheet et les chips filtrent (navigation par Link = URL). Tap sur « N résas » ouvre le drawer. Viewport 1280 : DataGrid + chips inline inchangés, pas de bouton Filtres.

- [ ] **Step 4: Gate + commit + push**

```bash
npx tsc --noEmit
git add components/dashboard/admin/AdminVillaCardList.tsx "app/(admin)/admin/villas/page.tsx"
git commit -m "feat(admin): liste villas en cartes mobile + filtres bottom sheet"
git push
```

---

### Task 6: Écran 3 — dashboard proprio (banner compact, onboarding, mes villas)

**Files:**
- Create: `components/dashboard/proprio/OnboardingCard.tsx`
- Modify: `components/dashboard/proprio/StripeConnectButton.tsx` (branche « connecté » uniquement)
- Modify: `components/dashboard/proprio/DashboardPageClient.tsx`
- Modify: `components/dashboard/proprio/UpcomingBookings.tsx` (empty state CTA)

**Interfaces:**
- Consumes: `DashboardWidget` (props `title`, `actionHref`, children), `KayvilaPngIcon`, `Villa` de `@/types/domain`.
- Produces: `OnboardingCard()` — sans props. `DashboardPageClient` : logique `hasTodayOrTasks`.

- [ ] **Step 1: Créer OnboardingCard**

```tsx
// components/dashboard/proprio/OnboardingCard.tsx
import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

const STEPS = [
  { label: "Compléter les photos de ma villa", href: "/dashboard/villas", icon: "home" },
  { label: "Vérifier mes tarifs et prix saisonniers", href: "/dashboard/villas", icon: "star" },
  { label: "Synchroniser mon calendrier (Airbnb, Booking)", href: "/dashboard/villas", icon: "calendar" },
  { label: "Ajouter le livret d'accueil", href: "/dashboard/villas", icon: "book" },
] as const;

export function OnboardingCard() {
  return (
    <section className="dashboard-card" data-testid="onboarding-card">
      <span className="dashboard-eyebrow">CONFIGURER MA VILLA</span>
      <p className="mt-2 text-sm text-navy/55">
        Votre espace est prêt. Quelques étapes pour maximiser vos réservations :
      </p>
      <ul className="mt-4 divide-y divide-navy/5">
        {STEPS.map((step) => (
          <li key={step.label}>
            <Link
              href={step.href}
              className="group flex min-h-[48px] items-center gap-3 py-2 text-sm text-navy no-underline transition-colors hover:text-gold"
            >
              <KayvilaPngIcon name={step.icon} size={18} alt="" className="shrink-0 opacity-60" />
              <span className="flex-1">{step.label}</span>
              <KayvilaPngIcon
                name="arrow-right"
                size={18}
                alt=""
                className="shrink-0 opacity-40 transition-opacity group-hover:opacity-80"
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
```

⚠️ Vérifier que les classes `dashboard-card` / `dashboard-eyebrow` existent dans `app/globals.css` (elles sont utilisées par `UpcomingBookings.tsx` — même patron). Vérifier que les noms PNG `home`, `star`, `calendar`, `book`, `arrow-right` existent dans `public/brand/icons-png/` ; sinon remplacer par un nom existant du même registre.

- [ ] **Step 2: Banner Stripe compact**

Dans `components/dashboard/proprio/StripeConnectButton.tsx`, localiser la branche « connecté » (le `return` vers la ligne ~110 qui contient `Compte bancaire connecté`) et remplacer TOUT son JSX par :

```tsx
return (
  <div
    data-testid="stripe-connected-banner"
    className="flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2.5"
  >
    <CheckCircle className="size-4 shrink-0 text-emerald-600" aria-hidden />
    <p className="min-w-0 truncate text-sm text-emerald-800">
      <span className="font-semibold">Compte bancaire connecté</span>
      <span className="hidden text-emerald-700 sm:inline"> — paiements automatiques activés</span>
    </p>
  </div>
);
```

Ajouter `CheckCircle` à l'import lucide-react existant du fichier s'il n'y est pas. Ne PAS toucher aux autres branches (non connecté, en vérification).

- [ ] **Step 3: DashboardPageClient — onboarding + mes villas**

Dans `components/dashboard/proprio/DashboardPageClient.tsx` :

1. Imports : `import { OnboardingCard } from "@/components/dashboard/proprio/OnboardingCard";` et ajouter `villas` à la destructuration des props (elle existe déjà dans le type).
2. Remplacer le premier grid « Aujourd'hui / Tâches » (lignes ~69-74) :

```tsx
{timelineItems.length > 0 || taskAlerts.length > 0 ? (
  <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
    <DashboardWidget title="Aujourd'hui">
      <DashboardTimeline items={timelineItems} />
    </DashboardWidget>
    <DashboardAlertList alerts={taskAlerts} title="Tâches & alertes" />
  </div>
) : (
  <OnboardingCard />
)}
```

3. Après le grid `RevenueChart / UpcomingBookings` (ligne ~79), ajouter :

```tsx
<DashboardWidget title="Mes villas" actionHref="/dashboard/villas">
  <ul className="divide-y divide-navy/5">
    {villas.slice(0, 3).map((villa) => (
      <li key={villa.id}>
        <Link
          href={`/dashboard/villas/${villa.id}`}
          className="flex min-h-[44px] items-center justify-between gap-3 py-2 text-sm text-navy no-underline transition-colors hover:text-gold"
        >
          <span className="truncate font-medium">{villa.name}</span>
          <span className="text-[11px] uppercase tracking-wider text-navy/40">Gérer</span>
        </Link>
      </li>
    ))}
  </ul>
</DashboardWidget>
```

Ajouter `import Link from "next/link";` en tête de fichier.

- [ ] **Step 4: Empty state UpcomingBookings avec CTA**

Dans `components/dashboard/proprio/UpcomingBookings.tsx`, dans le bloc `bookings.length === 0`, après le `<p>Aucune réservation à venir</p>`, ajouter :

```tsx
<Link
  href="/dashboard/villas"
  className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
>
  Voir mes villas
  <KayvilaPngIcon name="arrow-right" size={18} alt="" aria-hidden />
</Link>
```

- [ ] **Step 5: Vérifier, gate, commit, push**

Viewport 390, `/dashboard` avec `proprio1@test.com` : banner Stripe = 1 ligne compacte ; si aucune tâche/événement du jour → carte « CONFIGURER MA VILLA » à la place des 2 sections vides ; widget « Mes villas » listant les villas.

```bash
npx tsc --noEmit
git add components/dashboard/proprio/OnboardingCard.tsx components/dashboard/proprio/StripeConnectButton.tsx components/dashboard/proprio/DashboardPageClient.tsx components/dashboard/proprio/UpcomingBookings.tsx
git commit -m "feat(proprio): banner Stripe compact, onboarding villa, carte mes villas"
git push
```

---

### Task 7: Écran 5 — refonte réservations proprio (cartes groupées par mois + filtres)

**Files:**
- Create: `components/dashboard/proprio/BookingGroupedList.tsx`
- Modify: `app/(proprio)/dashboard/reservations/page.tsx`
- Modify: `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx` (bouton Contacter)

**Interfaces:**
- Consumes: `BookingStatusBadge` (prop `status: BookingStatus`), `formatCurrency`/`getBookingPriceCents` de `@/lib/utils`, `KayvilaPngIcon`.
- Produces: `BookingGroupedList({ items, villas })` avec :

```ts
export type OwnerBookingItem = {
  id: string;
  villa_id: string;
  villa_name: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price_cents: number | null;
  price?: number | null;
  source: string | null;
  payment_status: string | null;
  guests: number | null;
};
```

- [ ] **Step 1: Créer BookingGroupedList**

```tsx
// components/dashboard/proprio/BookingGroupedList.tsx
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BookingStatus } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency, getBookingPriceCents, cn } from "@/lib/utils";

export type OwnerBookingItem = {
  id: string;
  villa_id: string;
  villa_name: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price_cents: number | null;
  price?: number | null;
  source: string | null;
  payment_status: string | null;
  guests: number | null;
};

const STATUS_FILTERS = [
  { key: "all", label: "Toutes", statuses: null },
  { key: "pending", label: "En attente", statuses: ["pending"] },
  { key: "confirmed", label: "Confirmées", statuses: ["confirmed", "paid"] },
  { key: "cancelled", label: "Annulées", statuses: ["cancelled", "refunded"] },
] as const;

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  direct: "Direct",
  booking: "Booking",
  vrbo: "Vrbo",
  expedia: "Expedia",
  ical: "iCal",
};

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Payé",
  unpaid: "En attente",
  refunded: "Remboursé",
  partially_refunded: "Remb. partiel",
};

function nightsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7); // "2026-07"
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BookingGroupedList({
  items,
  villas,
}: {
  items: OwnerBookingItem[];
  villas: { id: string; name: string }[];
}) {
  const [statusKey, setStatusKey] = useState<(typeof STATUS_FILTERS)[number]["key"]>("all");
  const [search, setSearch] = useState("");
  const [villaId, setVillaId] = useState<string>("all");

  const filtered = useMemo(() => {
    const active = STATUS_FILTERS.find((f) => f.key === statusKey);
    const q = search.trim().toLowerCase();
    return items.filter((b) => {
      if (active?.statuses && !active.statuses.includes(b.status)) return false;
      if (villaId !== "all" && b.villa_id !== villaId) return false;
      if (q && !(b.guest_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, statusKey, search, villaId]);

  const groups = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    const map = new Map<string, OwnerBookingItem[]>();
    for (const b of sorted) {
      const key = monthKey(b.start_date);
      const bucket = map.get(key);
      if (bucket) bucket.push(b);
      else map.set(key, [b]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Filtres segmentés */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusKey(f.key)}
            aria-pressed={statusKey === f.key}
            className={cn(
              "min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors",
              statusKey === f.key
                ? "bg-navy text-white"
                : "border border-navy/10 bg-white text-navy/55 hover:border-navy/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recherche + villa */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un voyageur..."
            className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white pl-9 pr-4 text-base focus:border-gold/50 focus:outline-none md:text-sm"
          />
        </div>
        {villas.length > 1 ? (
          <select
            value={villaId}
            onChange={(e) => setVillaId(e.target.value)}
            aria-label="Filtrer par villa"
            className="min-h-[44px] rounded-lg border border-navy/10 bg-white px-3 text-base focus:border-gold/50 focus:outline-none md:text-sm"
          >
            <option value="all">Toutes les villas</option>
            {villas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {/* Groupes par mois */}
      {groups.length === 0 ? (
        <div className="dashboard-card flex flex-col items-center py-12 text-center">
          <KayvilaPngIcon name="calendar" size={24} className="mb-4 text-muted" />
          <p className="text-sm text-muted">
            {search || statusKey !== "all"
              ? "Aucune réservation ne correspond à ces filtres."
              : "Aucune réservation pour le moment."}
          </p>
          <Link
            href="/dashboard/villas"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold no-underline hover:text-navy"
          >
            Voir mes villas
          </Link>
        </div>
      ) : (
        groups.map(([key, bookings]) => (
          <section key={key} aria-label={monthLabel(key + "-01")}>
            <p className="sticky top-16 z-10 -mx-4 bg-offwhite px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-navy/45 md:static md:mx-0 md:bg-transparent md:px-0">
              {monthLabel(key + "-01")}
            </p>
            <ul className="mt-2 space-y-2">
              {bookings.map((b) => {
                const nights = nightsBetween(b.start_date, b.end_date);
                return (
                  <li key={b.id}>
                    <Link
                      href={`/dashboard/reservations/${b.villa_id}/${b.id}`}
                      className="block border border-navy/8 bg-white p-4 no-underline transition-colors hover:border-gold/30 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-base font-semibold text-navy">
                          {b.guest_name ?? "Voyageur"}
                        </p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="mt-1 text-sm text-navy/55">
                        {b.villa_name} ·{" "}
                        {new Date(b.start_date).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(b.end_date).toLocaleDateString("fr-FR")}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy/55">
                        <span className="text-sm font-semibold text-navy">
                          {formatCurrency(getBookingPriceCents(b))}
                        </span>
                        <span>
                          {nights} nuit{nights > 1 ? "s" : ""}
                        </span>
                        {b.guests != null ? <span>{b.guests} pers.</span> : null}
                        <span>{SOURCE_LABELS[b.source ?? ""] ?? b.source ?? "—"}</span>
                        <span
                          className={cn(
                            "font-medium",
                            b.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {PAYMENT_LABELS[b.payment_status ?? ""] ?? "En attente"}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
```

⚠️ Vérifier la signature réelle de `getBookingPriceCents` dans `lib/utils.ts` (elle est déjà appelée dans l'actuel `page.tsx` réservations avec l'objet booking entier — garder le même appel).

- [ ] **Step 2: Réécrire la page réservations proprio**

Remplacer intégralement le contenu de `app/(proprio)/dashboard/reservations/page.tsx` par :

```tsx
import { getCurrentUser, getOwnerVillas } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import type { BookingStatus } from "@/types/domain";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import {
  BookingGroupedList,
  type OwnerBookingItem,
} from "@/components/dashboard/proprio/BookingGroupedList";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Réservations — Kayvila",
};

export default async function ProprioReservationsIndexPage() {
  const {
    data: { user },
  } = await getCurrentUser();

  const { data: villas } = await getOwnerVillas(user!.id);

  if (!villas || villas.length === 0) {
    return (
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">Réservations</h1>
          <p className="text-sm text-muted">Gérez vos réservations</p>
        </div>
        <div className="dashboard-card flex flex-col items-center py-12 text-center">
          <KayvilaPngIcon name="calendar" size={24} className="mb-4 text-muted" />
          <p className="text-sm text-muted">Aucune réservation pour le moment.</p>
          <p className="mt-1 text-xs text-muted">
            Vos réservations apparaîtront ici dès qu&apos;un voyageur réservera votre villa.
          </p>
        </div>
      </div>
    );
  }

  const villaIds = villas.map((v) => v.id);
  const villaNames = new Map(villas.map((v) => [v.id, v.name]));

  const { data: allBookings } = await supabaseAdmin()
    .from("bookings")
    .select(
      "id, villa_id, guest_name, start_date, end_date, status, total_price_cents, price, source, payment_status, guests"
    )
    .in("villa_id", villaIds)
    .order("start_date", { ascending: false });

  const items: OwnerBookingItem[] = (allBookings ?? []).map((b) => ({
    id: b.id,
    villa_id: b.villa_id,
    villa_name: villaNames.get(b.villa_id) ?? "Villa",
    guest_name: b.guest_name,
    start_date: b.start_date,
    end_date: b.end_date,
    status: b.status as BookingStatus,
    total_price_cents: b.total_price_cents,
    price: b.price,
    source: b.source,
    payment_status: b.payment_status,
    guests: b.guests,
  }));

  return (
    <div className="mx-auto max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display text-2xl font-bold text-navy-900">Réservations</h1>
        <p className="text-sm text-muted">
          {items.length} réservation{items.length > 1 ? "s" : ""} sur {villas.length} villa
          {villas.length > 1 ? "s" : ""}
        </p>
      </div>
      <BookingGroupedList
        items={items}
        villas={villas.map((v) => ({ id: v.id, name: v.name }))}
      />
    </div>
  );
}
```

⚠️ Si la colonne `price` n'existe pas dans le select (erreur 42703 au runtime), la retirer du select ET du mapping — `getBookingPriceCents` doit alors se rabattre sur `total_price_cents` (vérifier son implémentation). L'ancien page.tsx sélectionnait déjà ces colonnes SAUF `price` — dans le doute, tester la page en navigateur immédiatement.

- [ ] **Step 3: Bouton Contacter Kayvila sur la fiche détail**

Dans `app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx`, après le rendu de `<BookingDetailCard ... />`, ajouter :

```tsx
<Link
  href="/dashboard/concierge"
  className="mt-6 inline-flex min-h-[48px] items-center justify-center gap-2 rounded-lg border border-navy/15 bg-white px-6 text-sm font-semibold text-navy no-underline transition-colors hover:border-navy/30"
>
  Contacter Kayvila
</Link>
```

(`Link` est déjà importé dans ce fichier.)

- [ ] **Step 4: Vérifier en navigateur**

`proprio1@test.com`, `/dashboard/reservations`, viewport 390 : cartes groupées par mois (en-tête sticky), badge statut coloré, filtre « Confirmées » réduit la liste, recherche par nom filtre, tap carte → fiche détail avec bouton « Contacter Kayvila ». Viewport 1280 : même liste (design adaptatif unique — c'est voulu, l'ancienne liste 7 colonnes disparaît aussi en desktop).

- [ ] **Step 5: Gate + commit + push**

```bash
npx tsc --noEmit
git add components/dashboard/proprio/BookingGroupedList.tsx "app/(proprio)/dashboard/reservations/page.tsx" "app/(proprio)/dashboard/reservations/[villaId]/[bookingId]/page.tsx"
git commit -m "feat(proprio): réservations en cartes groupées par mois + filtres + recherche"
git push
```

---

### Task 8: Écran 6 — cartes réservations admin mobile

**Files:**
- Create: `components/dashboard/admin/AdminReservationCardList.tsx`
- Modify: `app/(admin)/admin/reservations/page.tsx` (vue liste uniquement)

**Interfaces:**
- Consumes: `AdminBookingRow` (exporté par `AdminReservationsDataGrid.tsx`), handlers `onConfirm(id)` / `onCancel(id)` existants de la page (`handleAction`).
- Produces: `AdminReservationCardList({ rows, onConfirm, onCancel })` — `data-testid="admin-reservations-cards"`.

- [ ] **Step 1: Créer AdminReservationCardList**

```tsx
// components/dashboard/admin/AdminReservationCardList.tsx
"use client";

import type { AdminBookingRow } from "@/components/dashboard/admin/AdminReservationsDataGrid";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function nightsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function statusClass(status: string): string {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function AdminReservationCardList({
  rows,
  onConfirm,
  onCancel,
}: {
  rows: AdminBookingRow[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <ul className="space-y-2" data-testid="admin-reservations-cards">
      {rows.map((b) => {
        const nights = nightsBetween(b.start_date, b.end_date);
        const canConfirm = b.status === "pending";
        const canCancel = b.status === "pending" || b.status === "confirmed";
        return (
          <li key={b.id} className="border border-navy/8 bg-white">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-base font-semibold text-navy">
                  {b.guest_name ?? "Voyageur"}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    statusClass(b.status)
                  )}
                >
                  {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ??
                    b.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-navy/55">
                {b.villas?.name ?? "Villa"} ·{" "}
                {new Date(b.start_date).toLocaleDateString("fr-FR")} –{" "}
                {new Date(b.end_date).toLocaleDateString("fr-FR")}
              </p>
              <p className="mt-1 text-sm text-navy/55">
                <span className="font-semibold text-navy">
                  {fmtEur.format((b.total_price_cents ?? 0) / 100)}
                </span>{" "}
                · {nights} nuit{nights > 1 ? "s" : ""}
                {b.guest_email ? ` · ${b.guest_email}` : ""}
              </p>
            </div>
            {canConfirm || canCancel ? (
              <div
                className={cn(
                  "grid divide-x divide-navy/8 border-t border-navy/8",
                  canConfirm && canCancel ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {canConfirm ? (
                  <button
                    type="button"
                    onClick={() => onConfirm(b.id)}
                    className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-emerald-700 active:scale-[0.98]"
                  >
                    Confirmer
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    onClick={() => onCancel(b.id)}
                    className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-red-600 active:scale-[0.98]"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
```

- [ ] **Step 2: Brancher dans la page admin réservations**

Dans `app/(admin)/admin/reservations/page.tsx`, localiser le rendu `<AdminReservationsDataGrid` (ligne ~347) et le remplacer par :

```tsx
<>
  <div className="hidden md:block">
    <AdminReservationsDataGrid
      rows={bookings}
      filter={filter}
      onConfirm={(id) => handleAction(id, "confirmed")}
      onCancel={(id) => handleAction(id, "cancelled")}
      selectedKeys={selectedKeys}
      onSelectionChange={setSelectedKeys}
    />
  </div>
  <div className="md:hidden">
    <AdminReservationCardList
      rows={bookings}
      onConfirm={(id) => handleAction(id, "confirmed")}
      onCancel={(id) => handleAction(id, "cancelled")}
    />
  </div>
</>
```

(Reprendre les props EXACTES du rendu existant — si les noms diffèrent, copier ceux du fichier réel.) Ajouter l'import `AdminReservationCardList`. Les vues `calendar` et `kanban` restent inchangées (le Kanban reste desktop-first, il a déjà `overflow-x-auto`).

- [ ] **Step 3: Vérifier, gate, commit, push**

Viewport 390, `/admin/reservations` admin : cartes avec boutons Confirmer/Annuler larges ; confirmer une résa pending met à jour le statut (même handler que le grid). Viewport 1280 : DataGrid inchangé.

```bash
npx tsc --noEmit
git add components/dashboard/admin/AdminReservationCardList.tsx "app/(admin)/admin/reservations/page.tsx"
git commit -m "feat(admin): réservations en cartes mobile avec actions statut"
git push
```

---

### Task 9: Écran 4 — Mon Séjour client (hero 16:9, infos pratiques, CTA)

**Files:**
- Create: `components/espace-client/PracticalInfoCard.tsx`
- Modify: `components/espace-client/UpcomingStayHero.tsx` (chips compactes)
- Modify: `app/espace-client/page.tsx` (select villa enrichi, section infos pratiques, CTA RE-RÉSERVER, carte À faire)

**Interfaces:**
- Consumes: `CheckoutInstructions({ endDate, checkOutTime? })` (`components/espace-client/CheckoutInstructions.tsx` — **lire le fichier** pour vérifier s'il s'auto-gate sur « la veille » ; si oui le rendre sans condition, sinon l'envelopper dans la condition indiquée).
- Produces: `PracticalInfoCard({ villa, startDate, endDate, status })` — auto-gating 24 h.

- [ ] **Step 1: Enrichir le select villas de la page**

Dans `app/espace-client/page.tsx` (ligne ~83), remplacer le select :

```tsx
const { data: villas } = await supabase
  .from("villas")
  .select(
    "id, name, location, image_url, image_urls, wifi_name, wifi_password, welcome_booklet_url, check_out_time, checkout_instructions"
  )
  .in("id", villaIds);
```

⚠️ C'est un client browser (`getSupabaseBrowser`) : la RLS villas publiées doit laisser passer ces colonnes. Tester immédiatement en navigateur avec `locataire@test.com` — si les colonnes reviennent `null` à cause d'une policy en colonne (peu probable : la RLS Supabase est par ligne), constater et remonter au lead plutôt que de contourner.

- [ ] **Step 2: Créer PracticalInfoCard**

```tsx
// components/espace-client/PracticalInfoCard.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { Copy, Check } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { KayvilaTenantWidget } from "@/components/ui/pro";

type PracticalVilla = {
  wifi_name?: string | null;
  wifi_password?: string | null;
  welcome_booklet_url?: string | null;
  checkout_instructions?: string | null;
};

function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      aria-label={`Copier ${label}`}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(value);
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        } catch {
          // clipboard indisponible : rien à faire, la valeur est affichée
        }
      }}
      className="inline-flex size-11 shrink-0 items-center justify-center text-navy/45 transition-colors hover:text-gold"
    >
      {copied ? <Check className="size-4 text-emerald-600" aria-hidden /> : <Copy className="size-4" aria-hidden />}
    </button>
  );
}

export function PracticalInfoCard({
  villa,
  startDate,
  endDate,
  status,
}: {
  villa: PracticalVilla | null | undefined;
  startDate: string;
  endDate: string;
  status: string;
}) {
  // Sécurité : mêmes règles que CheckinGuide — jamais de WiFi pour une résa
  // non confirmée ou un séjour lointain (≤ 24 h avant arrivée → fin de séjour).
  const now = Date.now();
  const hoursUntilStart = (new Date(startDate).getTime() - now) / 3600000;
  const visible = status === "confirmed" && hoursUntilStart <= 24 && now < new Date(endDate).getTime();
  if (!visible || !villa) return null;

  const rows: { label: string; value: string; copyable?: boolean }[] = [];
  if (villa.wifi_name) rows.push({ label: "Réseau WiFi", value: villa.wifi_name, copyable: true });
  if (villa.wifi_password)
    rows.push({ label: "Mot de passe WiFi", value: villa.wifi_password, copyable: true });
  if (rows.length === 0 && !villa.welcome_booklet_url) return null;

  return (
    <KayvilaTenantWidget
      title="Infos pratiques"
      description="Tout ce qu'il faut pour votre séjour"
    >
      <dl className="divide-y divide-navy/5">
        {rows.map((row) => (
          <div key={row.label} className="flex min-h-[44px] items-center justify-between gap-3 py-2">
            <dt className="text-[10px] font-bold uppercase tracking-[0.22em] text-navy/45">
              {row.label}
            </dt>
            <dd className="flex min-w-0 items-center gap-1">
              <span className="truncate text-sm font-medium text-navy">{row.value}</span>
              {row.copyable ? <CopyButton value={row.value} label={row.label} /> : null}
            </dd>
          </div>
        ))}
      </dl>
      <div className="mt-3 flex flex-wrap gap-4">
        {villa.welcome_booklet_url ? (
          <a
            href={villa.welcome_booklet_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-gold no-underline transition-colors hover:text-navy"
          >
            <KayvilaPngIcon name="book" size={18} alt="" aria-hidden />
            Livret d&apos;accueil
          </a>
        ) : null}
        <Link
          href="/espace-client/livret"
          className="inline-flex min-h-[44px] items-center gap-2 text-[10px] font-bold uppercase tracking-[0.22em] text-navy/55 no-underline transition-colors hover:text-navy"
        >
          Guide complet du logement
        </Link>
      </div>
    </KayvilaTenantWidget>
  );
}
```

- [ ] **Step 3: Chips compactes dans UpcomingStayHero**

Dans `components/espace-client/UpcomingStayHero.tsx` :
1. Étendre le type : ajouter `price?: number | null;` à `UpcomingBooking`.
2. Remplacer le `<p className="mt-4 text-sm text-navy/65">…</p>` (lignes ~68-71) par des chips :

```tsx
<div className="mt-4 flex flex-wrap gap-2">
  <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
    {fmt(startDate)} – {fmt(endDate)}
  </span>
  <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
    {nights} nuit{nights > 1 ? "s" : ""}
  </span>
  {booking.price != null && booking.price > 0 ? (
    <span className="rounded-full border border-navy/10 px-3 py-1.5 text-[11px] font-medium text-navy/70">
      {new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(booking.price)}
    </span>
  ) : null}
</div>
```

3. Mobile : la photo est déjà `aspect-[16/10]` — passer à `aspect-video` (16:9) et superposer le nom sur mobile. Dans le bloc image, après le div gradient existant, ajouter :

```tsx
<div className="absolute inset-x-0 bottom-0 p-4 md:hidden">
  <h2 className="font-display text-xl font-normal leading-snug text-white drop-shadow">
    {booking.villa?.name ?? "Villa Kayvila"}
  </h2>
  {booking.villa?.location ? (
    <p className="font-display text-sm italic text-white/80">{booking.villa.location}, Martinique</p>
  ) : null}
</div>
```

et masquer le titre dupliqué de la colonne texte sur mobile : `className="hidden md:block ..."` sur le `<h2>` existant et le `<p>` localisation (garder visibles chips/CTA). Renforcer le gradient mobile existant : `from-navy/50` → `from-navy/70`.

- [ ] **Step 4: Page Séjour — infos pratiques, À faire, RE-RÉSERVER large**

Dans `app/espace-client/page.tsx` :

1. Imports : `PracticalInfoCard`, `CheckoutInstructions` (chemin `@/components/espace-client/CheckoutInstructions`).
2. Après `<UpcomingStayHero booking={upcomingBooking} />` (ligne ~237), ajouter :

```tsx
{upcomingBooking ? (
  <>
    <PracticalInfoCard
      villa={upcomingBooking.villa}
      startDate={upcomingBooking.start_date}
      endDate={upcomingBooking.end_date}
      status={upcomingBooking.status}
    />
    <CheckoutInstructions
      endDate={upcomingBooking.end_date}
      checkOutTime={upcomingBooking.villa?.check_out_time ?? undefined}
    />
  </>
) : null}
```

⚠️ Lire `CheckoutInstructions.tsx` d'abord : s'il ne s'auto-gate PAS sur « la veille du départ », envelopper dans `{(new Date(upcomingBooking.end_date).getTime() - Date.now()) / 3600000 <= 36 ? ... : null}`.

3. CTA RE-RÉSERVER : dans la section `otherBookings` (bloc `isPast`, lignes ~274-283), remplacer le petit lien « Re-réserver » par :

```tsx
<div className="flex flex-col gap-2 sm:flex-row">
  <Link
    href={`/villas/${booking.villa_id}`}
    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 bg-gold px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-white no-underline transition-colors hover:bg-gold/90 active:scale-[0.98]"
  >
    RE-RÉSERVER
  </Link>
  <Link
    href="/espace-client/messagerie"
    className="inline-flex min-h-[48px] flex-1 items-center justify-center gap-2 border border-navy/15 px-6 text-[11px] font-bold uppercase tracking-[0.22em] text-navy no-underline transition-colors hover:border-navy/30"
  >
    Contacter la conciergerie
  </Link>
</div>
```

- [ ] **Step 5: Vérifier, gate, commit, push**

`locataire@test.com`, `/espace-client`, viewport 390 : hero 16:9 avec nom superposé, chips dates/nuits, CTA RE-RÉSERVER pleine largeur sur les séjours passés. Infos pratiques : visibles UNIQUEMENT si résa confirmée ≤ 24 h avant arrivée / en cours (si les données de test ne le permettent pas, vérifier le gating par lecture du DOM : la section ne doit PAS être dans le HTML).

```bash
npx tsc --noEmit
git add components/espace-client/PracticalInfoCard.tsx components/espace-client/UpcomingStayHero.tsx app/espace-client/page.tsx
git commit -m "feat(client): hero 16:9, infos pratiques gated 24h, CTA re-réserver large"
git push
```

---

### Task 10: Tests Playwright responsive

**Files:**
- Create: `tests/responsive-dashboards.spec.ts`

**Interfaces:**
- Consumes: `data-testid="mobile-bottom-nav"` (T1), `data-testid="admin-villas-cards"` (T5), `data-testid="admin-reservations-cards"` (T8), `data-testid="filter-bottom-sheet-trigger"` (T4), `data-testid="onboarding-card"` (T6).
- Produces: suite Playwright exécutable `npx playwright test tests/responsive-dashboards.spec.ts --workers=1`.

- [ ] **Step 1: Copier le helper de login existant**

Ouvrir `tests/chatbot-scroll.spec.ts` et copier son helper de login EXACT (sélecteurs HeroUI : `getByPlaceholder`/`getByRole("textbox")`, jamais `input[type=password]`). L'adapter en `loginAs(page, email, password)`.

- [ ] **Step 2: Écrire la suite**

```ts
// tests/responsive-dashboards.spec.ts
import { test, expect, type Page } from "@playwright/test";

const ADMIN = { email: "admin@diamantnoir.com", password: "Admin123!" };
const OWNER = {
  email: process.env.TEST_OWNER_EMAIL || "proprio1@test.com",
  password: process.env.TEST_OWNER_PASSWORD || "Test123456!",
};

const MOBILE = { width: 390, height: 844 };
const NARROW = { width: 360, height: 740 };
const DESKTOP = { width: 1280, height: 800 };

// loginAs : COPIER le helper de tests/chatbot-scroll.spec.ts (sélecteurs HeroUI éprouvés)
async function loginAs(page: Page, email: string, password: string) {
  // ... implémentation copiée ...
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
}

test.describe("Responsive mobile dashboards", () => {
  test("admin : bottom nav + navigation + pas d'overflow", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin");
    const nav = page.getByTestId("mobile-bottom-nav");
    await expect(nav).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await nav.getByRole("link", { name: "Villas" }).click();
    await page.waitForURL("**/admin/villas");
  });

  test("admin villas : cartes mobiles, DataGrid caché, filtres sheet", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/villas");
    await expect(page.getByTestId("admin-villas-cards")).toBeVisible();
    await expect(page.locator('[aria-label="Catalogue des villas"]:visible')).toHaveCount(0);
    await page.getByTestId("filter-bottom-sheet-trigger").click();
    await expect(page.getByTestId("filter-bottom-sheet-panel")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("admin réservations : cartes mobiles en vue liste", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/reservations");
    await expect(page.getByTestId("admin-reservations-cards")).toBeVisible({ timeout: 20000 });
    await expectNoHorizontalOverflow(page);
  });

  test("proprio : dashboard mobile (KPI 2 colonnes, banner compact)", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto("/dashboard");
    await expect(page.getByTestId("mobile-bottom-nav")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("proprio réservations : filtres + recherche", async ({ page }) => {
    await page.setViewportSize(MOBILE);
    await loginAs(page, OWNER.email, OWNER.password);
    await page.goto("/dashboard/reservations");
    const all = page.locator("ul li a[href*='/dashboard/reservations/']");
    const countAll = await all.count();
    await page.getByRole("button", { name: "Confirmées" }).click();
    const countConfirmed = await all.count();
    expect(countConfirmed).toBeLessThanOrEqual(countAll);
    await page.getByPlaceholder("Rechercher un voyageur...").fill("zzz-introuvable");
    await expect(page.getByText("Aucune réservation ne correspond")).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("écran étroit 360px : pas d'overflow sur les 3 dashboards", async ({ page }) => {
    await page.setViewportSize(NARROW);
    await loginAs(page, ADMIN.email, ADMIN.password);
    for (const url of ["/admin", "/admin/villas", "/admin/reservations"]) {
      await page.goto(url);
      await page.waitForLoadState("networkidle");
      await expectNoHorizontalOverflow(page);
    }
  });

  test("non-régression desktop : DataGrids présents, bottom nav absente", async ({ page }) => {
    await page.setViewportSize(DESKTOP);
    await loginAs(page, ADMIN.email, ADMIN.password);
    await page.goto("/admin/villas");
    await expect(page.locator('[aria-label="Catalogue des villas"]:visible').first()).toBeVisible();
    await expect(page.getByTestId("mobile-bottom-nav")).not.toBeVisible();
  });
});
```

Ajuster les sélecteurs au DOM réel (ex. l'aria-label exact du DataGrid) — les tests doivent passer contre l'app, pas l'inverse. Si un test dépend de données absentes en base (ex. zéro résa confirmée), le rendre robuste (assertions `lessThanOrEqual`, pas de comptage exact).

- [ ] **Step 3: Lancer la suite (dev server sur :3000 requis)**

Run: `npx playwright test tests/responsive-dashboards.spec.ts --workers=1`
Expected: 7 passed, 0 skipped. Lancer 2× pour vérifier la non-flakiness.

- [ ] **Step 4: Commit + push**

```bash
git add tests/responsive-dashboards.spec.ts
git commit -m "test(mobile): suite Playwright responsive dashboards (7 tests, 3 viewports)"
git push
```

---

### Task 11: Revue finale whole-branch + merge

**Files:**
- Aucun nouveau — revue.

- [ ] **Step 1: Revue finale whole-branch** (indispensable même si chaque tâche est clean — règle projet) : `git diff main...HEAD` relu contre la spec, en particulier : (1) aucun side-stripe/gradient-text introduit, (2) aucune fonction en prop Server→Client, (3) or = 1 CTA par écran, (4) les 6 écrans couverts, (5) z-index bottom nav vs modals/sheets/drawer (la nav doit passer SOUS les overlays z-50).
- [ ] **Step 2: Gates finaux** : `npx tsc --noEmit` + `npx vitest run` (non-régression lib) + suite Playwright T10 une dernière fois.
- [ ] **Step 3:** Demander à Kenneson la validation de merge (screenshots mobiles des 6 écrans à l'appui), puis merge FF sur `main`, push, vérifier le déploiement Vercel (`vercel ls --prod` → Ready, pas juste l'exit code du push).
