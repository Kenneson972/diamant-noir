"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search } from "lucide-react";
import type { BookingStatus } from "@/types/domain";
import { BookingStatusBadge } from "@/components/dashboard/proprio/BookingStatusBadge";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency, getBookingPriceCents, cn } from "@/lib/utils";

export type OwnerBookingItem = {
  id: string;
  villa_id: string;
  villa_name: string;
  guest_name: string | null;
  start_date: string;
  end_date: string;
  status: BookingStatus;
  total_price_cents: number | null;
  source: string | null;
  payment_status: string | null;
  guests: number | null;
};

const STATUS_FILTERS: { key: string; label: string; statuses: readonly BookingStatus[] | null }[] = [
  { key: "all", label: "Toutes", statuses: null },
  { key: "pending", label: "En attente", statuses: ["pending"] },
  { key: "confirmed", label: "Confirmées", statuses: ["confirmed", "paid"] },
  { key: "cancelled", label: "Annulées", statuses: ["cancelled", "refunded"] },
];

const SOURCE_LABELS: Record<string, string> = {
  airbnb: "Airbnb",
  direct: "Direct",
  booking: "Booking",
  vrbo: "Vrbo",
  expedia: "Expedia",
  ical: "iCal",
};

const PAYMENT_LABELS: Record<string, string> = {
  paid: "Payé",
  unpaid: "En attente",
  refunded: "Remboursé",
  partially_refunded: "Remb. partiel",
};

function nightsBetween(start: string, end: string): number {
  return Math.round((new Date(end).getTime() - new Date(start).getTime()) / 86400000);
}

function monthKey(dateStr: string): string {
  return dateStr.slice(0, 7);
}

function monthLabel(dateStr: string): string {
  return new Date(dateStr + "T00:00:00Z").toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export function BookingGroupedList({
  items,
  villas,
}: {
  items: OwnerBookingItem[];
  villas: { id: string; name: string }[];
}) {
  const [statusKey, setStatusKey] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [villaId, setVillaId] = useState<string>("all");

  const filtered = useMemo(() => {
    const active = STATUS_FILTERS.find((f) => f.key === statusKey);
    const q = search.trim().toLowerCase();
    return items.filter((b) => {
      if (active?.statuses && !active.statuses.includes(b.status)) return false;
      if (villaId !== "all" && b.villa_id !== villaId) return false;
      if (q && !(b.guest_name ?? "").toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, statusKey, search, villaId]);

  const groups = useMemo(() => {
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime()
    );
    const map = new Map<string, OwnerBookingItem[]>();
    for (const b of sorted) {
      const key = monthKey(b.start_date);
      const bucket = map.get(key);
      if (bucket) bucket.push(b);
      else map.set(key, [b]);
    }
    return Array.from(map.entries());
  }, [filtered]);

  return (
    <div className="space-y-5">
      {/* Filtres segmentés */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrer par statut">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setStatusKey(f.key)}
            aria-pressed={statusKey === f.key}
            className={cn(
              "min-h-[44px] rounded-full px-4 text-sm font-semibold transition-colors",
              statusKey === f.key
                ? "bg-navy text-white"
                : "border border-navy/10 bg-white text-navy/55 hover:border-navy/30"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Recherche + villa */}
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-navy/30" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un voyageur..."
            className="min-h-[44px] w-full rounded-lg border border-navy/10 bg-white pl-9 pr-4 text-base focus:border-gold/50 focus:outline-none md:text-sm"
          />
        </div>
        {villas.length > 1 ? (
          <select
            value={villaId}
            onChange={(e) => setVillaId(e.target.value)}
            aria-label="Filtrer par villa"
            className="min-h-[44px] rounded-lg border border-navy/10 bg-white px-3 text-base focus:border-gold/50 focus:outline-none md:text-sm"
          >
            <option value="all">Toutes les villas</option>
            {villas.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        ) : null}
      </div>

      {/* Groupes par mois */}
      {groups.length === 0 ? (
        <div className="dashboard-card flex flex-col items-center py-12 text-center">
          <KayvilaPngIcon name="calendar" size={24} className="mb-4 text-muted" />
          <p className="text-sm text-muted">
            {search || statusKey !== "all"
              ? "Aucune réservation ne correspond à ces filtres."
              : "Aucune réservation pour le moment."}
          </p>
          <Link
            href="/dashboard/villas"
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 text-[11px] font-bold uppercase tracking-[0.22em] text-gold no-underline hover:text-navy"
          >
            Voir mes villas
          </Link>
        </div>
      ) : (
        groups.map(([key, bookings]) => (
          <section key={key} aria-label={monthLabel(key + "-01")}>
            <p className="sticky top-16 z-10 -mx-4 bg-offwhite px-4 py-2 text-[11px] font-bold uppercase tracking-[0.28em] text-navy/45 md:static md:mx-0 md:bg-transparent md:px-0">
              {monthLabel(key + "-01")}
            </p>
            <ul className="mt-2 space-y-2">
              {bookings.map((b) => {
                const nights = nightsBetween(b.start_date, b.end_date);
                return (
                  <li key={b.id}>
                    <Link
                      href={`/dashboard/reservations/${b.villa_id}/${b.id}`}
                      className="block border border-navy/8 bg-white p-4 no-underline transition-colors hover:border-gold/30 active:scale-[0.99]"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="min-w-0 truncate text-base font-semibold text-navy">
                          {b.guest_name ?? "Voyageur"}
                        </p>
                        <BookingStatusBadge status={b.status} />
                      </div>
                      <p className="mt-1 text-sm text-navy/55" suppressHydrationWarning>
                        {b.villa_name} ·{" "}
                        {new Date(b.start_date).toLocaleDateString("fr-FR")} –{" "}
                        {new Date(b.end_date).toLocaleDateString("fr-FR")} {/* react-doctor: locale hydration mismatch */}
                      </p>
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-navy/55">
                        <span className="text-sm font-semibold text-navy">
                          {formatCurrency(getBookingPriceCents(b))}
                        </span>
                        <span>
                          {nights} nuit{nights > 1 ? "s" : ""}
                        </span>
                        {b.guests != null ? <span>{b.guests} pers.</span> : null}
                        <span>{SOURCE_LABELS[b.source ?? ""] ?? b.source ?? "—"}</span>
                        <span
                          className={cn(
                            "font-medium",
                            b.payment_status === "paid" ? "text-emerald-600" : "text-amber-600"
                          )}
                        >
                          {PAYMENT_LABELS[b.payment_status ?? ""] ?? "En attente"}
                        </span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
