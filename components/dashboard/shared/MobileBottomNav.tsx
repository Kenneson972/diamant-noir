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
  const { setMobileOpen } = useSidebar();
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
          onClick={() => setMobileOpen(true)}
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
