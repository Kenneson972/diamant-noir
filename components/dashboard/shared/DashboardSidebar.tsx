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
