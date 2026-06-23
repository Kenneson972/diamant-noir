# Dashboard Sidebar Upgrade — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter sidebar rétractable, menus groupés avec sous-menus animés, et badges dynamiques DB aux dashboards admin et proprio, sans toucher à l'identité visuelle Kayvila.

**Architecture:** Enrichissement ciblé de `DashboardSidebar.tsx` + `DashboardShell.tsx` (état collapsed localStorage) + layouts Server Components (fetch badge counts) + restructuration des menu arrays. Aucun nouveau fichier créé.

**Tech Stack:** Next.js 15.2.9, Tailwind v4, HeroUI Pro, TypeScript strict, Lucide React, KayvilaPngIcon (PNG 28px invert)

## Global Constraints

- `bg-navy` sidebar uniquement — jamais `bg-card`, `bg-sidebar`, ou tokens shadcn
- Icônes PNG 28px (`invert`) via `KayvilaPngIcon` pour les noms mappés, Lucide 26px sinon
- Texte ≥ 11px partout, jamais `text-[10px]` pour du contenu informatif
- `text-gold` / `bg-gold` uniquement pour signaux actif/badge — jamais décoratif
- Lucide icons = chaînes string dans les menu arrays (passage Server→Client)
- `"use client"` inline interdit dans un Server Component — extraire si besoin
- Aucun composant `<main>` nested (les pages dashboard ne peuvent pas avoir leur propre `<main>`)
- Build validé par `npx tsc --noEmit` à chaque tâche (pas de `npm run build` local — se casse sur BigInt)

---

## Task 1 — Extend SidebarMenuItem + Restructure Menu Arrays

**Files:**
- Modify: `components/dashboard/shared/DashboardSidebar.tsx` (type interface only, lines 43–47)
- Modify: `components/dashboard/admin/AdminMenuItems.ts` (full rewrite)
- Modify: `components/dashboard/proprio/ProprioMenuItems.ts` (full rewrite)

**Interfaces:**
- Produces: `SidebarMenuItem` avec `badge?`, `group?`, `children?` — utilisé par Tasks 2, 5, 6

---

- [ ] **Step 1: Étendre l'interface SidebarMenuItem dans DashboardSidebar.tsx**

Remplacer les lignes 43–47 de `components/dashboard/shared/DashboardSidebar.tsx` :

```tsx
// Avant
export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
}

// Après
export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
  badge?: number;        // count live, masqué si 0
  group?: string;        // heading de section (ex. "GESTION")
  children?: SidebarMenuItem[];  // sous-items, niveau 1 uniquement
}
```

- [ ] **Step 2: Réécrire AdminMenuItems.ts**

Remplacer le contenu complet de `components/dashboard/admin/AdminMenuItems.ts` :

```ts
import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const adminMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/admin", icon: "LayoutDashboard", exact: true },

  { label: "Villas",         href: "/admin/villas",        icon: "Building2",    group: "GESTION" },
  { label: "Réservations",   href: "/admin/reservations",  icon: "CalendarDays", group: "GESTION" },
  { label: "Clients",        href: "/admin/clients",       icon: "UserCircle",   group: "GESTION" },
  { label: "Propriétaires",  href: "/admin/proprietaires", icon: "Users",        group: "GESTION" },
  { label: "Soumissions",    href: "/admin/soumissions",   icon: "Home",         group: "GESTION" },
  { label: "Demandes",       href: "/admin/demandes",      icon: "ClipboardList",group: "GESTION" },

  { label: "Revenus",        href: "/admin/revenus",       icon: "DollarSign",   group: "FINANCES" },
  {
    label: "Outils",
    href: "#",
    icon: "Zap",
    group: "FINANCES",
    children: [
      { label: "Tarification", href: "/admin/tarification", icon: "Percent" },
      { label: "Sync OTA",     href: "/admin/sync-ota",     icon: "Zap" },
    ],
  },

  { label: "Avis",         href: "/admin/avis",       icon: "Star",          group: "OUTILS" },
  { label: "Documents",    href: "/admin/documents",  icon: "FileText",      group: "OUTILS" },
  { label: "Messagerie",   href: "/admin/messagerie", icon: "MessageCircle", group: "OUTILS" },
  { label: "Concierge IA", href: "/admin/concierge",  icon: "Sparkles",      group: "OUTILS" },
  { label: "Paramètres",   href: "/admin/parametres", icon: "Settings",      group: "OUTILS" },
];
```

- [ ] **Step 3: Réécrire ProprioMenuItems.ts**

Remplacer le contenu complet de `components/dashboard/proprio/ProprioMenuItems.ts` :

```ts
import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const proprioMenuItems: SidebarMenuItem[] = [
  { label: "Tableau de bord", href: "/dashboard", icon: "LayoutDashboard", exact: true },

  { label: "Mes Villas",    href: "/dashboard/villas",        icon: "Building2",    group: "MES PROPRIÉTÉS" },
  { label: "Réservations",  href: "/dashboard/reservations",  icon: "CalendarDays", group: "MES PROPRIÉTÉS" },
  { label: "Tâches",        href: "/dashboard/taches",        icon: "ClipboardList",group: "MES PROPRIÉTÉS" },

  { label: "Revenus",       href: "/dashboard/revenus",       icon: "DollarSign",   group: "FINANCES & SUIVI" },
  { label: "Statistiques",  href: "/dashboard/statistiques",  icon: "BarChart3",    group: "FINANCES & SUIVI" },

  { label: "Mon concierge", href: "/dashboard/concierge",     icon: "Sparkles",     group: "SERVICES" },
  { label: "Mes documents", href: "/dashboard/documents",     icon: "FileText",     group: "SERVICES" },
];
```

- [ ] **Step 4: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Attendu : 0 erreur liée aux fichiers modifiés. (Des erreurs pré-existantes dans `tests/` peuvent apparaître — ignorer.)

- [ ] **Step 5: Commit**

```bash
git add components/dashboard/shared/DashboardSidebar.tsx \
        components/dashboard/admin/AdminMenuItems.ts \
        components/dashboard/proprio/ProprioMenuItems.ts
git commit -m "feat(sidebar): étend SidebarMenuItem + restructure menus groupes/children/badges"
```

---

## Task 2 — Réécrire DashboardSidebar (NavItem récursif + groupes + collapse + badges)

**Files:**
- Modify: `components/dashboard/shared/DashboardSidebar.tsx` (réécriture complète)

**Interfaces:**
- Consumes: `SidebarMenuItem` étendu (Task 1) — `badge`, `group`, `children`
- Consumes: `KayvilaPngIcon` depuis `@/components/icons/KayvilaPngIcon` (déjà importé)
- Produces: props `collapsed?: boolean`, `onToggleCollapsed?: () => void` optionnels (Task 3 les rendra obligatoires)

---

- [ ] **Step 1: Réécrire DashboardSidebar.tsx en entier**

Remplacer le contenu complet de `components/dashboard/shared/DashboardSidebar.tsx` :

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  LogOut, X, PanelLeftClose, PanelLeftOpen, ChevronRight,
  LayoutDashboard, CalendarDays, UserCircle,
  DollarSign, Settings, Zap, Inbox, LayoutGrid,
  FileText, ClipboardList, BarChart3, Gift, Percent,
} from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
  exact?: boolean;
  badge?: number;
  group?: string;
  children?: SidebarMenuItem[];
}

const ICON_MAP: Record<string, React.ComponentType<{ className?: string; size?: number }>> = {
  LayoutDashboard, CalendarDays, UserCircle,
  DollarSign, Settings, Zap, Inbox, LayoutGrid,
  FileText, ClipboardList, BarChart3, Gift, Percent,
};

const PNG_ICON_MAP: Record<string, string> = {
  Building2: "villa",
  Users: "users",
  Sparkles: "sparkle",
  Home: "home",
  BookOpen: "book",
  MessageCircle: "message",
  Bell: "bell",
  Heart: "heart",
  Star: "star",
};

function SidebarIcon({ name, className }: { name: string; className?: string }) {
  const pngName = PNG_ICON_MAP[name];
  if (pngName) {
    return (
      <KayvilaPngIcon
        name={pngName as Parameters<typeof KayvilaPngIcon>[0]["name"]}
        size={28}
        alt=""
        invert
        className={className}
      />
    );
  }
  const LucideComponent = ICON_MAP[name] ?? LayoutDashboard;
  return <LucideComponent size={26} className={className} />;
}

function NavItem({
  item,
  pathname,
  collapsed,
  onUncollapse,
}: {
  item: SidebarMenuItem;
  pathname: string;
  collapsed: boolean;
  onUncollapse: () => void;
}) {
  const hasChildren = !!item.children?.length;

  const isActive =
    item.exact ? pathname === item.href : item.href !== "#" && pathname.startsWith(item.href);

  const isChildActive =
    hasChildren && item.children!.some((c) => pathname.startsWith(c.href));

  const [open, setOpen] = useState(isChildActive);

  const highlighted = isActive || isChildActive;

  const baseClass = cn(
    "group relative flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
    highlighted
      ? "border border-gold/30 bg-gold/[0.08] text-gold"
      : "border border-transparent text-white/75 hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
  );

  const iconClass = cn(
    "shrink-0 transition-colors duration-200",
    highlighted ? "text-gold" : "text-white/45 group-hover:text-white"
  );

  if (hasChildren) {
    return (
      <div>
        <button
          type="button"
          onClick={() => {
            if (collapsed) {
              onUncollapse();
              setOpen(true);
            } else {
              setOpen((v) => !v);
            }
          }}
          title={collapsed ? item.label : undefined}
          className={cn(baseClass, "w-full text-left", collapsed && "justify-center px-3")}
        >
          <SidebarIcon name={item.icon} className={iconClass} />
          {!collapsed && (
            <>
              <span className="flex-1 truncate">{item.label}</span>
              <ChevronRight
                size={14}
                strokeWidth={2}
                className={cn(
                  "shrink-0 text-white/30 transition-transform duration-200",
                  open && "rotate-90"
                )}
              />
            </>
          )}
          {collapsed && item.badge != null && item.badge > 0 && (
            <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
          )}
        </button>

        {!collapsed && (
          <div
            className={cn(
              "grid transition-[grid-template-rows,opacity] duration-300 ease-in-out",
              open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
            )}
          >
            <div className="relative overflow-hidden">
              <div className="absolute bottom-0 left-[17px] top-0 border-l border-white/10" />
              <div className="flex flex-col gap-0.5 pb-1 pt-0.5">
                {item.children!.map((child) => (
                  <NavItem
                    key={child.href}
                    item={child}
                    pathname={pathname}
                    collapsed={false}
                    onUncollapse={onUncollapse}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      className={cn(baseClass, collapsed && "justify-center px-3")}
    >
      <SidebarIcon name={item.icon} className={iconClass} />
      {!collapsed && (
        <>
          <span className="flex-1 truncate">{item.label}</span>
          {item.badge != null && item.badge > 0 && (
            <span className="ml-auto flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold/80 px-1.5 text-[10px] font-bold text-navy">
              {item.badge > 99 ? "99+" : item.badge}
            </span>
          )}
        </>
      )}
      {collapsed && item.badge != null && item.badge > 0 && (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-gold" />
      )}
    </Link>
  );
}

export interface DashboardSidebarProps {
  role: "admin" | "owner" | "tenant";
  roleLabel: string;
  menu: SidebarMenuItem[];
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
}

export function DashboardSidebar({
  role,
  roleLabel,
  menu,
  userName,
  userEmail,
  onSignOut,
  open,
  onClose,
  collapsed = false,
  onToggleCollapsed = () => {},
}: DashboardSidebarProps) {
  const pathname = usePathname() ?? "";
  const displayName = userName ?? userEmail ?? roleLabel;

  const homeHref =
    role === "admin" ? "/admin" : role === "owner" ? "/dashboard" : "/espace-client";

  function renderMenu(isCollapsed: boolean) {
    let lastGroup: string | undefined = undefined;
    return menu.map((item) => {
      const showHeading = item.group !== undefined && item.group !== lastGroup;
      if (item.group !== undefined) lastGroup = item.group;
      return (
        <div key={`${item.href}-${item.label}`}>
          {showHeading && !isCollapsed && (
            <p className="px-4 pb-1 pt-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/30">
              {item.group}
            </p>
          )}
          <NavItem
            item={item}
            pathname={pathname}
            collapsed={isCollapsed}
            onUncollapse={onToggleCollapsed}
          />
        </div>
      );
    });
  }

  function sidebarContent(isCollapsed: boolean, handleClose: () => void) {
    return (
      <>
        <Link
          href={homeHref}
          onClick={handleClose}
          className={cn(
            "flex shrink-0 items-center gap-2 border-b border-white/10 py-6",
            isCollapsed ? "justify-center px-3" : "px-6"
          )}
        >
          {isCollapsed ? (
            <span className="font-display-dashboard text-xl font-semibold text-gold">K</span>
          ) : (
            <>
              <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
                Kayvila
              </span>
              <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
                {roleLabel}
              </span>
            </>
          )}
        </Link>

        <nav
          className="no-scrollbar min-h-0 flex-1 space-y-0.5 overflow-y-auto px-3 py-6 pb-10"
          aria-label={`Navigation ${roleLabel.toLowerCase()}`}
        >
          {renderMenu(isCollapsed)}
        </nav>

        <div
          className="pointer-events-none relative -mt-8 h-8 shrink-0 bg-gradient-to-t from-navy to-transparent"
          aria-hidden="true"
        />

        {/* Toggle collapse — desktop uniquement */}
        <div
          className={cn(
            "hidden border-t border-white/10 pb-2 pt-3 md:block",
            isCollapsed ? "px-2" : "px-4"
          )}
        >
          <button
            type="button"
            onClick={onToggleCollapsed}
            aria-label={isCollapsed ? "Étendre le menu" : "Réduire le menu"}
            title={isCollapsed ? "Étendre le menu" : undefined}
            className={cn(
              "flex w-full items-center rounded-lg py-2 text-white/50 transition-colors hover:bg-white/10 hover:text-white",
              isCollapsed ? "justify-center px-2" : "gap-2 px-3"
            )}
          >
            {isCollapsed ? (
              <PanelLeftOpen size={18} strokeWidth={1.5} />
            ) : (
              <>
                <PanelLeftClose size={18} strokeWidth={1.5} />
                <span className="text-[13px]">Réduire</span>
              </>
            )}
          </button>
        </div>

        <div
          className={cn(
            "mt-auto border-t border-white/10 py-4",
            isCollapsed ? "px-2" : "px-4"
          )}
        >
          {!isCollapsed && (
            <div className="rounded-lg bg-white/5 px-3 py-2">
              <p className="truncate text-[11px] font-medium text-white/90" title={displayName}>
                {displayName}
              </p>
              <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/45">
                {roleLabel}
              </p>
            </div>
          )}
          <button
            type="button"
            onClick={onSignOut}
            title={isCollapsed ? "Déconnexion" : undefined}
            className={cn(
              "mt-3 flex w-full items-center gap-2 rounded-lg py-2.5 text-left text-sm font-medium text-white/85 transition-colors hover:bg-white/10",
              isCollapsed ? "justify-center px-2" : "px-3"
            )}
          >
            <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
            {!isCollapsed && "Déconnexion"}
          </button>
          {!isCollapsed && (
            <Link
              href="/"
              onClick={handleClose}
              className="mt-2 block px-3 py-2 text-xs text-white/65 transition-colors hover:text-white"
            >
              Retour au site public
            </Link>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 hidden h-dvh flex-col bg-navy text-white shadow-[4px_0_24px_rgba(0,0,0,0.12)] transition-[width] duration-300 md:flex",
          collapsed ? "w-16" : "w-64"
        )}
      >
        {sidebarContent(collapsed, () => {})}
      </aside>

      {/* Drawer mobile (comportement inchangé) */}
      {open && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={onClose}
            aria-label="Fermer le menu"
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-navy pt-[env(safe-area-inset-top)] text-white shadow-xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-[calc(1rem+env(safe-area-inset-top))] z-10 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X className="h-5 w-5" />
            </button>
            {sidebarContent(false, onClose)}
          </aside>
        </div>
      )}
    </>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Attendu : 0 erreur liée à `DashboardSidebar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/shared/DashboardSidebar.tsx
git commit -m "feat(sidebar): NavItem récursif + groupes animés + collapse + badges"
```

---

## Task 3 — DashboardShell : état collapsed + pl dynamique

**Files:**
- Modify: `components/dashboard/shared/DashboardShell.tsx`

**Interfaces:**
- Consumes: `collapsed?: boolean`, `onToggleCollapsed?: () => void` de `DashboardSidebar` (Task 2)
- Produces: passe `menu` à `DashboardHeader` (Task 4)

---

- [ ] **Step 1: Réécrire DashboardShell.tsx**

Remplacer le contenu complet de `components/dashboard/shared/DashboardShell.tsx` :

```tsx
"use client";

import { useState, useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { AdminCommandPalette } from "@/components/dashboard/admin/AdminCommandPalette";
import type { SidebarMenuItem } from "./DashboardSidebar";

const SIDEBAR_STORAGE_KEY = "kayvila-sidebar-collapsed";

interface DashboardShellProps {
  role: "admin" | "owner" | "tenant";
  roleLabel: string;
  menu: SidebarMenuItem[];
  children: ReactNode;
}

export function DashboardShell({
  role,
  roleLabel,
  menu,
  children,
}: DashboardShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, signOut } = useAuth();

  // Init depuis localStorage (SSR-safe : useEffect uniquement côté client)
  useEffect(() => {
    const saved = localStorage.getItem(SIDEBAR_STORAGE_KEY);
    if (saved === "true") setCollapsed(true);
  }, []);

  const handleToggleCollapsed = () => {
    setCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_STORAGE_KEY, String(next));
      return next;
    });
  };

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? roleLabel;
  const userEmail = user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  return (
    <>
      {role === "admin" ? <AdminCommandPalette /> : null}
      <a
        href={`#${role}-main`}
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-navy focus:px-4 focus:py-2 focus:text-sm focus:text-white focus:shadow-lg"
      >
        Aller au contenu principal
      </a>

      <div className="min-h-dvh bg-offwhite font-body-dashboard text-navy antialiased">
        <DashboardSidebar
          role={role}
          roleLabel={roleLabel}
          menu={menu}
          userName={displayName}
          userEmail={userEmail}
          onSignOut={handleSignOut}
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          collapsed={collapsed}
          onToggleCollapsed={handleToggleCollapsed}
        />
        <div
          className={cn(
            "flex min-h-dvh flex-col transition-[padding] duration-300",
            collapsed ? "md:pl-16" : "md:pl-64"
          )}
        >
          <DashboardHeader
            roleLabel={roleLabel}
            displayName={displayName}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
            userId={user?.id}
            role={role}
            menu={menu}
            pathname={pathname}
          />
          <main
            id={`${role}-main`}
            className="flex-1 px-4 py-6 md:px-8 md:py-8"
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

`DashboardHeader` va signaler des props inconnues (`menu`, `pathname`) — c'est attendu jusqu'à la Task 4.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/shared/DashboardShell.tsx
git commit -m "feat(shell): état collapsed localStorage + pl dynamique + passe menu au header"
```

---

## Task 4 — DashboardHeader : breadcrumb

**Files:**
- Modify: `components/dashboard/shared/DashboardHeader.tsx`

**Interfaces:**
- Consumes: `menu: SidebarMenuItem[]`, `pathname: string` depuis `DashboardShell` (Task 3)

---

- [ ] **Step 1: Réécrire DashboardHeader.tsx**

Remplacer le contenu complet de `components/dashboard/shared/DashboardHeader.tsx` :

```tsx
"use client";

import { useMemo } from "react";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";
import type { SidebarMenuItem } from "./DashboardSidebar";

function findBreadcrumb(
  menu: SidebarMenuItem[],
  pathname: string
): { parent?: string; current: string } | null {
  for (const item of menu) {
    if (item.children?.length) {
      const child = item.children.find((c) => pathname.startsWith(c.href));
      if (child) return { parent: item.label, current: child.label };
    }
    const match = item.exact
      ? pathname === item.href
      : item.href !== "#" && pathname.startsWith(item.href);
    if (match) return { current: item.label };
  }
  return null;
}

interface DashboardHeaderProps {
  roleLabel: string;
  displayName: string;
  onToggleSidebar: () => void;
  userId?: string;
  role?: "admin" | "owner" | "tenant";
  menu?: SidebarMenuItem[];
  pathname?: string;
}

export function DashboardHeader({
  roleLabel,
  displayName,
  onToggleSidebar,
  userId,
  role,
  menu = [],
  pathname = "",
}: DashboardHeaderProps) {
  const today = useMemo(
    () =>
      new Date().toLocaleDateString("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      }),
    []
  );

  const isoDate = useMemo(
    () => new Date().toISOString().split("T")[0] ?? "",
    []
  );

  const initial = (displayName[0] ?? "?").toUpperCase();

  const breadcrumb = useMemo(
    () => findBreadcrumb(menu, pathname),
    [menu, pathname]
  );

  return (
    <header className="sticky top-0 z-30 flex h-16 shrink-0 items-center justify-between border-b border-navy/[0.08] bg-white/95 px-4 backdrop-blur-md md:h-[4.25rem] md:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={onToggleSidebar}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-navy/65 transition-colors hover:bg-navy/[0.06] hover:text-navy md:hidden"
          aria-label="Ouvrir le menu"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div className="min-w-0">
          <p className="font-display-dashboard text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
            {roleLabel}
          </p>
          {breadcrumb ? (
            <p className="hidden min-w-0 items-baseline gap-1.5 font-display-dashboard text-sm text-navy/50 md:flex">
              {breadcrumb.parent && (
                <>
                  <span>{breadcrumb.parent}</span>
                  <span className="text-navy/30">/</span>
                </>
              )}
              <span className="font-semibold text-navy">{breadcrumb.current}</span>
            </p>
          ) : (
            <p className="truncate font-display-dashboard text-lg font-semibold leading-tight text-navy md:text-xl">
              Kayvila
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5">
        <time
          dateTime={isoDate}
          className="hidden max-w-[14rem] text-right text-sm leading-snug text-navy/50 lg:block"
        >
          {today}
        </time>
        <NotificationBell userId={userId} role={role} />
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full bg-navy text-xs font-bold text-white shadow-sm ring-2 ring-white md:h-10 md:w-10"
          title={displayName}
        >
          <span aria-hidden>{initial}</span>
          <span className="sr-only">{displayName}</span>
        </div>
      </div>
    </header>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Attendu : 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add components/dashboard/shared/DashboardHeader.tsx
git commit -m "feat(header): breadcrumb navigation depuis menu + pathname"
```

---

## Task 5 — Admin layout : fetch badge counts

**Files:**
- Modify: `app/(admin)/admin/layout.tsx`

**Interfaces:**
- Consumes: `adminMenuItems` (Task 1) — type `SidebarMenuItem[]`
- Produces: `adminMenuItems` enrichi avec `badge` injecté avant passage à `DashboardShell`

---

- [ ] **Step 1: Mettre à jour app/(admin)/admin/layout.tsx**

Remplacer le contenu complet de `app/(admin)/admin/layout.tsx` :

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { adminMenuItems } from "@/components/dashboard/admin/AdminMenuItems";
import { isStaffAdmin, normalizeRole } from "@/lib/auth/admin-access";
import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const metadata = {
  title: "Administration Kayvila",
  robots: { index: false, follow: false },
};

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirect=/admin");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const effective = normalizeRole(profile?.role ?? user.user_metadata?.role);
  if (
    !isStaffAdmin(
      profile?.role,
      user.user_metadata?.role as string | undefined,
      user.email
    )
  ) {
    if (effective === "owner") redirect("/dashboard");
    redirect("/espace-client");
  }

  // Fetch badge counts en parallèle
  const [reservations, soumissions, avis, demandes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("villa_submissions")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("reviews")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending"),
    supabase
      .from("requests")
      .select("id", { count: "exact", head: true })
      .eq("priority", "urgent")
      .neq("status", "resolved"),
  ]);

  const badgeMap: Record<string, number> = {
    "/admin/reservations": reservations.count ?? 0,
    "/admin/soumissions":  soumissions.count ?? 0,
    "/admin/avis":         avis.count ?? 0,
    "/admin/demandes":     demandes.count ?? 0,
  };

  const menuWithBadges: SidebarMenuItem[] = adminMenuItems.map((item) => ({
    ...item,
    badge: badgeMap[item.href] ?? item.badge,
  }));

  return (
    <DashboardShell role="admin" roleLabel="Admin" menu={menuWithBadges}>
      {children}
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Attendu : 0 erreur.

- [ ] **Step 3: Commit**

```bash
git add "app/(admin)/admin/layout.tsx"
git commit -m "feat(admin): fetch badge counts réservations/soumissions/avis/demandes"
```

---

## Task 6 — Proprio layout : fetch badge counts

**Files:**
- Modify: `app/(proprio)/dashboard/layout.tsx`

**Interfaces:**
- Consumes: `proprioMenuItems` (Task 1)
- Produces: menu enrichi avec badges réservations + tâches

---

- [ ] **Step 1: Mettre à jour app/(proprio)/dashboard/layout.tsx**

Dans `app/(proprio)/dashboard/layout.tsx`, après la récupération de `ownerVillas`, ajouter le fetch des badges et l'injection dans le menu. Remplacer le contenu complet :

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { proprioMenuItems } from "@/components/dashboard/proprio/ProprioMenuItems";
import { CopilotProvider } from "@/components/dashboard/proprio/CopilotContext";
import { isStaffAdmin, isOwnerRole } from "@/lib/auth/admin-access";
import { OwnerContactFAB } from "@/components/dashboard/proprio/OwnerContactFAB";
import type { SidebarMenuItem } from "@/components/dashboard/shared/DashboardSidebar";

export const metadata = {
  title: "Tableau de bord propriétaire",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

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

  const { data: ownerVillas } = await supabase
    .from("villas")
    .select("id, name")
    .eq("owner_id", user.id)
    .order("name");

  const adminUser = isStaffAdmin(
    profile?.role,
    user.user_metadata?.role as string | undefined,
    user.email
  );
  if (adminUser) redirect("/admin");

  const ownerUser = isOwnerRole(
    profile?.role,
    user.user_metadata?.role as string | undefined
  );
  if (!ownerUser) redirect("/espace-client");

  // Fetch badge counts
  const ownerVillaIds = (ownerVillas ?? []).map((v) => v.id);

  const [reservations, taches] =
    ownerVillaIds.length > 0
      ? await Promise.all([
          supabase
            .from("bookings")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .eq("status", "pending"),
          supabase
            .from("tasks")
            .select("id", { count: "exact", head: true })
            .in("villa_id", ownerVillaIds)
            .neq("status", "done"),
        ])
      : ([{ count: 0 }, { count: 0 }] as const);

  const badgeMap: Record<string, number> = {
    "/dashboard/reservations": reservations.count ?? 0,
    "/dashboard/taches":       taches.count ?? 0,
  };

  const menuWithBadges: SidebarMenuItem[] = proprioMenuItems.map((item) => ({
    ...item,
    badge: badgeMap[item.href] ?? item.badge,
  }));

  return (
    <CopilotProvider>
      <DashboardShell role="owner" roleLabel="Propriétaire" menu={menuWithBadges}>
        {children}
      </DashboardShell>
      <OwnerContactFAB ownerId={user.id} villas={ownerVillas ?? []} />
    </CopilotProvider>
  );
}
```

- [ ] **Step 2: Vérifier TypeScript**

```bash
npx tsc --noEmit 2>&1 | grep -v "node_modules" | head -20
```

Attendu : 0 erreur.

- [ ] **Step 3: Commit + push**

```bash
git add "app/(proprio)/dashboard/layout.tsx"
git commit -m "feat(proprio): fetch badge counts réservations/tâches + menu restructuré"
git push origin main
```

---

## Vérification finale (après toutes les tâches)

- [ ] Se connecter en admin → vérifier sidebar groupée, badge "Réservations" visible
- [ ] Cliquer toggle "Réduire" → sidebar collapse en `w-16`, dots badges visibles
- [ ] Rafraîchir la page → sidebar reste collapsed (localStorage)
- [ ] Cliquer item "Outils" → sous-menu Tarification/Sync OTA s'anime avec CSS grid
- [ ] Header → breadcrumb "Réservations" s'affiche sur `/admin/reservations`
- [ ] Se connecter en proprio → badges Réservations + Tâches si counts > 0
- [ ] Mobile : drawer s'ouvre normalement, pas de collapse possible
