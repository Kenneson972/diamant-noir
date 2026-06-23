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
