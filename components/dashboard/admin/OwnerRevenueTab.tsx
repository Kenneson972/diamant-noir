"use client";

import {
  buildCommissionRateByVillaId,
  commissionCents,
  commissionRateLabel,
  DEFAULT_COMMISSION_RATE,
} from "@/lib/commission";

type VillaCommission = { id: string; commission_rate?: number | null };

type BookingRow = {
  id: string;
  villa_id: string;
  start_date: string;
  end_date: string;
  total_price_cents: number | null;
  status: string;
  guest_name: string | null;
};

interface Props {
  ownerId: string;
  villas: VillaCommission[];
  bookings: BookingRow[];
  totalRevenueCents: number;
  totalBookings: number;
}

function formatEuros(cents: number): string {
  return `${(cents / 100).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function OwnerRevenueTab({
  villas,
  bookings,
  totalRevenueCents,
  totalBookings,
}: Props) {
  const rateByVilla = buildCommissionRateByVillaId(villas);

  const bookingCommissions = bookings.map((b) => {
    const rate = rateByVilla.get(b.villa_id) ?? DEFAULT_COMMISSION_RATE;
    const amount = b.total_price_cents ?? 0;
    return { booking: b, rate, commission: commissionCents(amount, rate) };
  });

  const totalCommissionCents = bookingCommissions.reduce(
    (sum, row) => sum + row.commission,
    0
  );
  const ownerPayoutCents = totalRevenueCents - totalCommissionCents;
  const avgRate =
    totalRevenueCents > 0
      ? totalCommissionCents / totalRevenueCents
      : DEFAULT_COMMISSION_RATE;
  const ratesDiffer =
    new Set(rateByVilla.values()).size > 1 ||
    (rateByVilla.size > 0 &&
      ![...rateByVilla.values()].every((r) => r === DEFAULT_COMMISSION_RATE));

  const commissionLabel = ratesDiffer
    ? `Commission Kayvila (~${Math.round(avgRate * 100)} % moy.)`
    : `Commission Kayvila (${commissionRateLabel(avgRate)})`;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">CA Brut</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatEuros(totalRevenueCents)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">
            {commissionLabel}
          </p>
          <p className="mt-1 text-2xl font-bold text-gold">{formatEuros(totalCommissionCents)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Reversé Proprio</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatEuros(ownerPayoutCents)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Réservations</p>
          <p className="mt-1 text-2xl font-bold text-navy">{totalBookings}</p>
        </div>
      </div>

      {bookings.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-navy/10 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy/10 bg-navy/[0.02]">
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-navy/35">
                    Dates
                  </th>
                  <th className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.1em] text-navy/35">
                    Client
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-navy/35">
                    Montant
                  </th>
                  <th className="px-4 py-3 text-right text-[10px] font-bold uppercase tracking-[0.1em] text-navy/35">
                    Commission
                  </th>
                  <th className="px-4 py-3 text-center text-[10px] font-bold uppercase tracking-[0.1em] text-navy/35">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody>
                {bookingCommissions.map(({ booking: b, rate, commission }, i) => (
                  <tr
                    key={b.id}
                    className={i % 2 === 0 ? "bg-transparent" : "bg-navy/[0.01]"}
                  >
                    <td className="px-4 py-3 text-navy" suppressHydrationWarning>
                      {formatDate(b.start_date)} → {formatDate(b.end_date)} {/* react-doctor: locale hydration mismatch */}
                    </td>
                    <td className="px-4 py-3 text-navy">{b.guest_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right font-medium text-navy">
                      {formatEuros(b.total_price_cents ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatEuros(commission)}
                      <span className="ml-1 text-[10px] text-navy/35">
                        ({commissionRateLabel(rate)})
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-navy/15 bg-white p-12 text-center">
          <p className="text-navy/40">Aucune réservation confirmée.</p>
        </div>
      )}
    </div>
  );
}
