"use client";

import { useMemo } from "react";
import { Menu } from "lucide-react";
import { NotificationBell } from "@/components/dashboard/NotificationBell";

interface DashboardHeaderProps {
  roleLabel: string;
  displayName: string;
  onToggleSidebar: () => void;
  userId?: string;
  role?: "admin" | "owner" | "tenant";
}

export function DashboardHeader({
  roleLabel,
  displayName,
  onToggleSidebar,
  userId,
  role,
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
          <p className="font-display-dashboard text-[11px] font-semibold uppercase tracking-[0.25em] text-gold">
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
