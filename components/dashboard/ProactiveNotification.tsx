"use client";

import { useProactiveNotification } from "@/hooks/useProactiveNotification";

export function ProactiveNotification() {
  const { notification, loading, markAsRead } = useProactiveNotification();

  // Rien à afficher pendant le chargement ou si pas de notif
  if (loading || !notification) return null;

  return (
    <div
      className="mx-auto mb-6 max-w-7xl rounded-lg border border-gold/20 bg-gradient-to-r from-navy/[0.02] to-gold/[0.04] p-5 shadow-sm"
      role="status"
      aria-label="Point du jour Kayvila"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-base font-semibold text-navy">
            {notification.title}
          </h3>
          <div className="mt-2 text-[13px] leading-relaxed text-navy/75 whitespace-pre-line">
            {notification.body}
          </div>
        </div>
        <button
          onClick={() => markAsRead(notification.id)}
          className="shrink-0 rounded-md border border-navy/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.15em] text-navy/55 transition-colors hover:border-gold/30 hover:text-gold"
          aria-label="Marquer comme lu"
        >
          Marquer comme lu
        </button>
      </div>
    </div>
  );
}
