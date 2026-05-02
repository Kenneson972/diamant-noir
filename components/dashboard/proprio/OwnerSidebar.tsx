"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LogOut, Menu, X, Gem } from "lucide-react";
import { proprioMenuItems } from "./ProprioMenuItems";
import { useAuth } from "@/contexts/AuthContext";

export function OwnerSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, signOut } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? "Propriétaire";

  return (
    <>
      {/* Mobile toggle */}
      <button
        type="button"
        className="fixed left-4 top-4 z-50 flex h-10 w-10 items-center justify-center rounded-lg bg-navy-900 text-white lg:hidden"
        onClick={() => setMobileOpen(!mobileOpen)}
        aria-label={mobileOpen ? "Fermer la navigation" : "Ouvrir la navigation"}
      >
        {mobileOpen ? (
          <X className="h-5 w-5" />
        ) : (
          <Menu className="h-5 w-5" />
        )}
      </button>

      {/* Overlay mobile */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed left-0 top-0 z-40 flex h-dvh flex-col bg-navy-900 text-white transition-all duration-300",
          collapsed ? "w-16" : "w-60",
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo */}
        <div
          className={cn(
            "flex items-center border-b border-white/10",
            collapsed ? "justify-center px-0 py-6" : "px-6 py-6"
          )}
        >
          {collapsed ? (
            <Gem className="h-6 w-6 text-white/60" aria-hidden />
          ) : (
            <span className="font-display text-[10px] font-bold tracking-[0.38em] text-white/60">
              KAYVILA
            </span>
          )}
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="hidden items-center justify-center border-b border-white/5 py-2 text-xs text-white/30 transition-colors hover:text-white/60 lg:flex"
          aria-label={collapsed ? "Développer" : "Réduire"}
        >
          {collapsed ? "→" : "← Réduire"}
        </button>

        {/* Navigation */}
        <nav
          className="flex-1 space-y-1 px-2 py-4"
          aria-label="Navigation propriétaire"
        >
          {proprioMenuItems.map((item) => {
            const isActive =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-200",
                  isActive
                    ? "border-l-2 border-white bg-white/8 text-white"
                    : "border-l-2 border-transparent text-white/50 hover:bg-white/5 hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <item.icon
                  className={cn(
                    "h-5 w-5 shrink-0 transition-colors",
                    isActive ? "text-white" : "text-white/40 group-hover:text-white"
                  )}
                />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer — profile + logout */}
        <div className="border-t border-white/10 px-4 py-4">
          {!collapsed && (
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-white">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1 truncate">
                <p className="truncate text-sm font-medium text-white">{displayName}</p>
              </div>
            </div>
          )}

          <Link
            href="/"
            className="mb-2 block text-xs text-white/30 transition-colors hover:text-white/60"
          >
            Retour au site
          </Link>

          <button
            type="button"
            onClick={signOut}
            className={cn(
              "flex items-center gap-2 text-xs text-white/30 transition-colors hover:text-red-400",
              collapsed && "justify-center"
            )}
            aria-label="Se déconnecter"
          >
            <LogOut className="h-4 w-4" />
            {!collapsed && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
