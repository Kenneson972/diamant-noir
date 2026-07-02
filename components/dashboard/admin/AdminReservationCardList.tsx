"use client";

import type { AdminBookingRow } from "@/components/dashboard/admin/AdminReservationsDataGrid";
import { BOOKING_STATUS_LABELS } from "@/lib/constants";
import { cn } from "@/lib/utils";

const fmtEur = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});

function nightsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function statusClass(status: string): string {
  if (status === "confirmed") return "bg-emerald-50 text-emerald-700";
  if (status === "pending") return "bg-amber-50 text-amber-700";
  return "bg-red-50 text-red-700";
}

export function AdminReservationCardList({
  rows,
  onConfirm,
  onCancel,
}: {
  rows: AdminBookingRow[];
  onConfirm: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  return (
    <ul className="space-y-2" data-testid="admin-reservations-cards">
      {rows.map((b) => {
        const nights = nightsBetween(b.start_date, b.end_date);
        const canConfirm = b.status === "pending";
        const canCancel = b.status === "pending" || b.status === "confirmed";
        return (
          <li key={b.id} className="border border-navy/8 bg-white">
            <div className="p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="min-w-0 truncate text-base font-semibold text-navy">
                  {b.guest_name ?? "Voyageur"}
                </p>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                    statusClass(b.status)
                  )}
                >
                  {BOOKING_STATUS_LABELS[b.status as keyof typeof BOOKING_STATUS_LABELS] ??
                    b.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-navy/55">
                {b.villas?.name ?? "Villa"} ·{" "}
                {new Date(b.start_date).toLocaleDateString("fr-FR")} –{" "}
                {new Date(b.end_date).toLocaleDateString("fr-FR")}
              </p>
              <p className="mt-1 text-sm text-navy/55">
                <span className="font-semibold text-navy">
                  {fmtEur.format((b.total_price_cents ?? 0) / 100)}
                </span>{" "}
                · {nights} nuit{nights > 1 ? "s" : ""}
                {b.guest_email ? ` · ${b.guest_email}` : ""}
              </p>
            </div>
            {canConfirm || canCancel ? (
              <div
                className={cn(
                  "grid divide-x divide-navy/8 border-t border-navy/8",
                  canConfirm && canCancel ? "grid-cols-2" : "grid-cols-1"
                )}
              >
                {canConfirm ? (
                  <button
                    type="button"
                    onClick={() => onConfirm(b.id)}
                    className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-emerald-700 active:scale-[0.98]"
                  >
                    Confirmer
                  </button>
                ) : null}
                {canCancel ? (
                  <button
                    type="button"
                    onClick={() => onCancel(b.id)}
                    className="flex min-h-[48px] items-center justify-center text-sm font-semibold text-red-600 active:scale-[0.98]"
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}
