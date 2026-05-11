"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LogOut, X,
  LayoutDashboard, Building2, Users, CalendarDays, UserCircle,
  DollarSign, Settings, Zap, Sparkles, Inbox, LayoutGrid,
  Home, BookOpen, MessageCircle, FileText,
  ClipboardList, BarChart3, Bell,
} from "lucide-react";

const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  LayoutDashboard, Building2, Users, CalendarDays, UserCircle,
  DollarSign, Settings, Zap, Sparkles, Inbox, LayoutGrid,
  Home, BookOpen, MessageCircle, FileText,
  ClipboardList, BarChart3, Bell,
};

export interface SidebarMenuItem {
  label: string;
  href: string;
  icon: string;
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
              {(() => {
                const IconComponent = ICON_MAP[item.icon];
                return IconComponent ? (
                  <IconComponent
                    className={cn(
                      "h-5 w-5 shrink-0 transition-colors duration-200",
                      active ? "text-gold" : "text-white/45 group-hover:text-white"
                    )}
                  />
                ) : null;
              })()}
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
          className="mt-2 block px-3 py-2 text-xs text-white/50 transition-colors hover:text-white/70"
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
