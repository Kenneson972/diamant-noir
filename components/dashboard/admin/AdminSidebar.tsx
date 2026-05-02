"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { adminMenuItems } from "./AdminMenuItems";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-screen w-64 flex-col bg-navy text-white">
      {/* Logo */}
      <Link
        href="/admin"
        className="flex items-center gap-2 border-b border-white/10 px-6 py-6"
      >
        <span className="font-heading text-xl tracking-wide text-gold">
          Kayvila
        </span>
        <span className="rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
          Admin
        </span>
      </Link>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-6" aria-label="Navigation administration">
        {adminMenuItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-r-sm px-4 py-2.5 text-sm font-medium transition-all duration-200",
                isActive
                  ? "border-l-2 border-gold bg-navy/80 text-gold"
                  : "border-l-2 border-transparent text-white/70 hover:border-gold/50 hover:bg-white/5 hover:text-white"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <item.icon
                className={cn(
                  "h-5 w-5 shrink-0 transition-colors duration-200",
                  isActive ? "text-gold" : "text-white/50 group-hover:text-white"
                )}
              />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 px-6 py-4">
        <Link
          href="/"
          className="text-xs text-white/40 transition-colors hover:text-white/60"
        >
          Retour au site
        </Link>
      </div>
    </aside>
  );
}
