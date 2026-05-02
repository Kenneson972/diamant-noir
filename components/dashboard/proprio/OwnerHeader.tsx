"use client";

import { useMemo } from "react";
import { Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function OwnerHeader() {
  const { user } = useAuth();

  const displayName =
    user?.user_metadata?.full_name ?? user?.email ?? "Propriétaire";

  const today = useMemo(() => {
    return new Date().toLocaleDateString("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border-subtle bg-transparent px-8">
      {/* Left — page title is rendered by each page */}
      <div>{/* Page title handled by page component */}</div>

      {/* Right — date, notifications, avatar */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <time
          dateTime={new Date().toISOString().split("T")[0]}
          className="hidden text-sm text-muted md:block"
        >
          {today}
        </time>

        {/* Notification bell */}
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted transition-colors hover:bg-navy-900/5 hover:text-navy-900"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          <span className="absolute right-2.5 top-2.5 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Avatar */}
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-navy-900 text-xs font-bold text-white">
          {displayName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
