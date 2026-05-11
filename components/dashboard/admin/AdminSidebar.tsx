"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminMenuItems } from "./AdminMenuItems";
import { LogOut, X } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { getSupabaseBrowser } from "@/lib/supabase";

interface AdminSidebarProps {
  open: boolean;
  onClose: () => void;
}

function AdminSidebarAccount({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const { user } = useAuth();
  const supabase = getSupabaseBrowser();

  async function handleSignOut() {
    if (supabase) await supabase.auth.signOut();
    onClose();
    router.push("/login?redirect=/admin");
    router.refresh();
  }

  const email = user?.email ?? "Administrateur";

  return (
    <div className="mt-auto border-t border-white/10 px-4 py-4">
      <div className="rounded-lg bg-white/5 px-3 py-2">
        <p className="truncate text-[11px] font-medium text-white/90" title={email}>
          {email}
        </p>
        <p className="mt-0.5 text-[11px] uppercase tracking-wider text-white/45">
          Administrateur
        </p>
      </div>
      <button
        type="button"
        onClick={() => void handleSignOut()}
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
  );
}

export function AdminSidebar({ open, onClose }: AdminSidebarProps) {
  const pathname = usePathname();

  const sidebarContent = (
    <>
      {/* Logo */}
      <Link
        href="/admin"
        className="flex shrink-0 items-center gap-2 border-b border-white/10 px-6 py-6"
        onClick={onClose}
      >
        <span className="font-display-dashboard text-xl font-semibold tracking-wide text-gold">
          Kayvila
        </span>
        <span className="rounded-md bg-gold/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
          Admin
        </span>
      </Link>

      {/* Navigation */}
      <nav
        className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-6"
        aria-label="Navigation administration"
      >
        {adminMenuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : item.href === "/admin/hub-classique"
                ? pathname === "/admin/hub-classique"
                : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={cn(
                "group flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border border-gold/30 bg-gold/[0.08] text-gold"
                  : "border border-transparent text-white/75 hover:border-gold/30 hover:bg-white/[0.05] hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-gold" : "text-white/45 group-hover:text-white"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <AdminSidebarAccount onClose={onClose} />
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-dvh w-64 flex-col bg-navy text-white shadow-[4px_0_24px_rgba(0,0,0,0.12)] md:flex">
        {sidebarContent}
      </aside>

      {/* Mobile overlay */}
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
