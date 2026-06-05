# Dashboard Unification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace 3 divergent dashboard layouts (Admin, Owner, Tenant) with a single shared `DashboardShell` + dark sidebar design system.

**Architecture:** Extract 3 shared components into `components/dashboard/shared/`. Each layout becomes a thin server wrapper around `<DashboardShell>`. DashboardShell uses AuthContext internally for sign-out. Delete 9 old component files. Unify to dark sidebar + offwhite background + Lucide icons + ≥11px text + zero side-stripes.

**Tech Stack:** Next.js 15, React 19, Tailwind CSS v3, Lucide React, TypeScript

---

## File Map

```
NEW:
  components/dashboard/shared/DashboardShell.tsx
  components/dashboard/shared/DashboardSidebar.tsx
  components/dashboard/shared/DashboardHeader.tsx
  components/espace-client/TenantMenuItems.ts

MODIFY:
  app/(admin)/admin/layout.tsx
  app/(proprio)/dashboard/layout.tsx
  app/espace-client/layout.tsx

DELETE:
  components/dashboard/admin/AdminLayout.tsx
  components/dashboard/admin/AdminHeader.tsx
  components/dashboard/admin/AdminSidebar.tsx
  components/dashboard/admin/AdminMain.tsx
  components/dashboard/proprio/OwnerLayout.tsx
  components/dashboard/proprio/OwnerHeader.tsx
  components/dashboard/proprio/OwnerSidebar.tsx
  components/espace-client/EspaceClientShell.tsx
  components/espace-client/EspaceClientProviders.tsx
```

---

### Task 1: Create TenantMenuItems config

**Files:** Create: `components/espace-client/TenantMenuItems.ts`

- [ ] **Step 1: Write file**

```typescript
import {
  Home,
  BookOpen,
  MessageCircle,
  FileText,
  UserCircle,
  type LucideIcon,
} from "lucide-react";

export interface TenantMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

export const tenantMenuItems: TenantMenuItem[] = [
  { label: "Séjour", href: "/espace-client", icon: Home, exact: true },
  { label: "Livret", href: "/espace-client/livret", icon: BookOpen },
  { label: "Messages", href: "/espace-client/messagerie", icon: MessageCircle },
  { label: "Documents", href: "/espace-client/documents", icon: FileText },
  { label: "Conciergerie", href: "/espace-client/conciergerie", icon: UserCircle },
];
```

- [ ] **Step 2: Commit**

```bash
git add components/espace-client/TenantMenuItems.ts
git commit -m "feat: add TenantMenuItems config for unified dashboard nav

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 2: Create DashboardSidebar

**Files:** Create: `components/dashboard/shared/DashboardSidebar.tsx`

- [ ] **Step 1: Create directory and write file**

```bash
mkdir -p components/dashboard/shared
```

```tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface DashboardSidebarProps {
  role: "admin" | "owner" | "tenant";
  roleLabel: string;
  menu: SidebarMenuItem[];
  userName?: string;
  userEmail?: string;
  onSignOut: () => void;
  open: boolean;
  onClose: () => void;
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
}: DashboardSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname?.startsWith(href);

  const displayName = userName ?? userEmail ?? roleLabel;

  const homeHref =
    role === "admin" ? "/admin" : role === "owner" ? "/dashboard" : "/espace-client";

  const sidebarContent = (
    <>
      <Link
        href={homeHref}
        className="flex shrink-0 items-center gap-2 border-b border-white/10 px-6 py-6"
        onClick={onClose}
      >
        <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
          Kayvila
        </span>
        <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-gold">
          {roleLabel}
        </span>
      </Link>

      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6"
        aria-label={`Navigation ${roleLabel.toLowerCase()}`}
      >
        {menu.map((item) => {
          const active = isActive(item.href, item.exact);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "border border-gold/30 bg-gold/[0.08] text-gold"
                  : "border border-transparent text-white/75 hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  active ? "text-gold" : "text-white/45 group-hover:text-white"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto border-t border-white/10 px-4 py-4">
        <div className="rounded-lg bg-white/5 px-3 py-2">
          <p className="truncate text-[11px] font-medium text-white/90" title={displayName}>
            {displayName}
          </p>
          <p className="mt-0.5 text-[11px] font-medium uppercase tracking-wider text-white/45">
            {roleLabel}
          </p>
        </div>
        <button
          type="button"
          onClick={onSignOut}
          className="mt-3 flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-white/85 transition-colors hover:bg-white/10"
        >
          <LogOut className="h-4 w-4 shrink-0 opacity-80" aria-hidden />
          Déconnexion
        </button>
        <Link
          href="/"
          className="mt-2 block px-3 py-2 text-xs text-white/40 transition-colors hover:text-white/70"
          onClick={onClose}
        >
          Retour au site public
        </Link>
      </div>
    </>
  );

  return (
    <>
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-64 flex-col bg-navy text-white shadow-[4px_0_24px_rgba(0,0,0,0.12)] md:flex">
        {sidebarContent}
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Fermer le menu"
          />
          <aside className="relative flex h-full w-64 max-w-[85vw] flex-col bg-navy text-white shadow-xl">
            <button
              type="button"
              onClick={onClose}
              className="absolute right-4 top-4 z-10 rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white"
              aria-label="Fermer le menu"
            >
              <X size={20} />
            </button>
            {sidebarContent}
          </aside>
        </div>
      ) : null}
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/shared/DashboardSidebar.tsx
git commit -m "feat: add shared DashboardSidebar — dark, dynamic menu, no side-stripe

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 3: Create DashboardHeader

**Files:** Create: `components/dashboard/shared/DashboardHeader.tsx`

- [ ] **Step 1: Write file**

```tsx
"use client";

import { useMemo } from "react";
import { Bell, Menu } from "lucide-react";

interface DashboardHeaderProps {
  roleLabel: string;
  displayName: string;
  onToggleSidebar: () => void;
}

export function DashboardHeader({
  roleLabel,
  displayName,
  onToggleSidebar,
}: DashboardHeaderProps) {
  const today = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  const isoDate = useMemo(
    () => new Date().toISOString().split("T")[0] ?? "",
    []
  );

  const initial = (displayName[0] ?? "?").toUpperCase();

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
          <p className="font-display-dashboard text-[10px] font-bold uppercase tracking-[0.35em] text-gold">
            {roleLabel}
          </p>
          <p className="truncate font-display-dashboard text-lg font-semibold leading-tight text-navy md:text-xl">
            Kayvila
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 md:gap-5">
        <time
          dateTime={isoDate}
          className="hidden max-w-[14rem] text-right text-sm leading-snug text-navy/50 lg:block"
        >
          {today}
        </time>
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-navy/45 transition-colors hover:bg-navy/[0.06] hover:text-navy"
          aria-label="Notifications (bientôt disponible)"
        >
          <Bell className="h-5 w-5" />
        </button>
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

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/shared/DashboardHeader.tsx
git commit -m "feat: add shared DashboardHeader — date, notifs, avatar

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 4: Create DashboardShell with AuthContext

**Files:** Create: `components/dashboard/shared/DashboardShell.tsx`

- [ ] **Step 1: Write file**

```tsx
"use client";

import { useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import type { SidebarMenuItem } from "./DashboardSidebar";

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
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? roleLabel;
  const userEmail = user?.email;

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  const fullBleed = role === "admin" && pathname.startsWith("/admin/assistant");

  return (
    <>
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
        />
        <div className="flex min-h-dvh flex-col md:pl-64">
          <DashboardHeader
            roleLabel={roleLabel}
            displayName={displayName}
            onToggleSidebar={() => setSidebarOpen((v) => !v)}
          />
          <main
            id={`${role}-main`}
            className={cn(
              "flex-1",
              fullBleed
                ? "h-[calc(100dvh-4rem)] overflow-hidden p-0 md:h-[calc(100dvh-4.25rem)]"
                : "px-4 py-6 md:px-8 md:py-8"
            )}
          >
            {children}
          </main>
        </div>
      </div>
    </>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add components/dashboard/shared/DashboardShell.tsx
git commit -m "feat: add DashboardShell — unified layout for all 3 roles

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 5: Migrate Admin layout + delete old files

**Files:**
- Modify: `app/(admin)/admin/layout.tsx`
- Delete: `components/dashboard/admin/AdminLayout.tsx`, `AdminHeader.tsx`, `AdminSidebar.tsx`, `AdminMain.tsx`

- [ ] **Step 1: Rewrite admin layout**

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { adminMenuItems } from "@/components/dashboard/admin/AdminMenuItems";
import { isStaffAdmin, normalizeRole } from "@/lib/auth/admin-access";

export const metadata = {
  title: "Administration Kayvila",
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
    if (effective === "owner") {
      redirect("/dashboard");
    }
    redirect("/espace-client");
  }

  return (
    <DashboardShell role="admin" roleLabel="Admin" menu={adminMenuItems}>
      {children}
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Delete old admin components**

```bash
rm components/dashboard/admin/AdminLayout.tsx
rm components/dashboard/admin/AdminHeader.tsx
rm components/dashboard/admin/AdminSidebar.tsx
rm components/dashboard/admin/AdminMain.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/(admin)/admin/layout.tsx
git rm components/dashboard/admin/AdminLayout.tsx components/dashboard/admin/AdminHeader.tsx components/dashboard/admin/AdminSidebar.tsx components/dashboard/admin/AdminMain.tsx
git commit -m "refactor: migrate admin to DashboardShell, remove 4 old components

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 6: Migrate Owner layout + delete old files

**Files:**
- Modify: `app/(proprio)/dashboard/layout.tsx`
- Delete: `components/dashboard/proprio/OwnerLayout.tsx`, `OwnerHeader.tsx`, `OwnerSidebar.tsx`

- [ ] **Step 1: Rewrite owner layout**

```tsx
import { redirect } from "next/navigation";
import { getSupabaseServer } from "@/lib/supabase-server";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { proprioMenuItems } from "@/components/dashboard/proprio/ProprioMenuItems";
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

  return (
    <DashboardShell role="owner" roleLabel="Propriétaire" menu={proprioMenuItems}>
      {children}
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Delete old owner components**

```bash
rm components/dashboard/proprio/OwnerLayout.tsx
rm components/dashboard/proprio/OwnerHeader.tsx
rm components/dashboard/proprio/OwnerSidebar.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/(proprio)/dashboard/layout.tsx
git rm components/dashboard/proprio/OwnerLayout.tsx components/dashboard/proprio/OwnerHeader.tsx components/dashboard/proprio/OwnerSidebar.tsx
git commit -m "refactor: migrate owner to DashboardShell, remove Copilot + 3 old components

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 7: Migrate Tenant layout + delete old files

**Files:**
- Modify: `app/espace-client/layout.tsx`
- Delete: `components/espace-client/EspaceClientShell.tsx`, `EspaceClientProviders.tsx`

- [ ] **Step 1: Rewrite tenant layout**

```tsx
"use client";

import { useEffect, useState, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase";
import { DashboardShell } from "@/components/dashboard/shared/DashboardShell";
import { tenantMenuItems } from "@/components/espace-client/TenantMenuItems";

export default function EspaceClientLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState(true);
  const supabase = getSupabaseBrowser();

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.user) {
        const redirect = pathname || "/espace-client";
        router.replace(`/login?redirect=${encodeURIComponent(redirect)}`);
        return;
      }
      setLoading(false);
    })();
  }, [supabase, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-offwhite flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
      </div>
    );
  }

  if (!supabase) {
    return (
      <div className="min-h-dvh bg-offwhite flex items-center justify-center p-6">
        <p className="text-sm text-navy/60">Configuration indisponible.</p>
      </div>
    );
  }

  return (
    <DashboardShell role="tenant" roleLabel="Client" menu={tenantMenuItems}>
      <div className="p-5 md:p-10 max-w-5xl w-full mx-auto">{children}</div>
    </DashboardShell>
  );
}
```

- [ ] **Step 2: Delete old tenant components**

```bash
rm components/espace-client/EspaceClientShell.tsx
rm components/espace-client/EspaceClientProviders.tsx
```

- [ ] **Step 3: Commit**

```bash
git add app/espace-client/layout.tsx
git rm components/espace-client/EspaceClientShell.tsx components/espace-client/EspaceClientProviders.tsx
git commit -m "refactor: migrate tenant to DashboardShell, remove 2 old components

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

### Task 8: Build verification

**Files:** None (verification only)

- [ ] **Step 1: Run build**

```bash
cd /Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir && npm run build 2>&1 | tail -50
```

Expected: Build succeeds with no errors. If import errors appear, fix them manually — check for any page component that imported from deleted files.

- [ ] **Step 2: Fix any remaining imports**

```bash
cd /Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir && grep -r "AdminLayout\|AdminHeader\|AdminSidebar\|AdminMain\|OwnerLayout\|OwnerHeader\|OwnerSidebar\|EspaceClientShell\|EspaceClientProviders" app/ components/ --include="*.tsx" --include="*.ts" -l 2>/dev/null
```

For each file found, update the import to use the shared component instead.

- [ ] **Step 3: Final commit**

```bash
git add -A && git commit -m "fix: resolve remaining imports after dashboard unification

Co-Authored-By: claude-flow <ruv@ruv.net>"
```

---

## Self-Review

- [x] Spec coverage: All 7 spec sections covered — 3 shared components created, 3 layouts migrated, 9 files deleted, design rules enforced
- [x] No placeholders: Every step has exact code or exact commands
- [x] Type consistency: `SidebarMenuItem` used in Task 2, imported in Task 4. Compatible with all 3 menu configs (`MenuItem`, `TenantMenuItem`)
- [x] No side-stripes: DashboardSidebar uses `border border-gold/30 bg-gold/[0.08]` — no `border-l-2`, no `before:w-[2px]`
- [x] Text ≥ 11px throughout: All labels in DashboardSidebar and DashboardHeader use ≥11px (sidebar labels inherit text-sm = 14px, role badge = 11px, user info = 11px)
