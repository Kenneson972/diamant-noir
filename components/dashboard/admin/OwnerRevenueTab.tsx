"use client";

interface Props {
  ownerId: string;
  bookings: any[];
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

export function OwnerRevenueTab({ ownerId, bookings, totalRevenueCents, totalBookings }: Props) {
  const avgRevenue = totalBookings > 0 ? totalRevenueCents / totalBookings : 0;
  const commissionCents = totalRevenueCents * 0.25;
  const ownerPayout = totalRevenueCents * 0.75;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">CA Brut</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatEuros(totalRevenueCents)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Commission (25%)</p>
          <p className="mt-1 text-2xl font-bold text-gold">{formatEuros(commissionCents)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Reversé Proprio</p>
          <p className="mt-1 text-2xl font-bold text-navy">{formatEuros(ownerPayout)}</p>
        </div>
        <div className="rounded-2xl border border-navy/10 bg-white p-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-navy/35">Réservations</p>
          <p className="mt-1 text-2xl font-bold text-navy">{totalBookings}</p>
        </div>
      </div>

      {/* Booking table */}
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
                {bookings.map((b, i) => (
                  <tr
                    key={b.id}
                    className={i % 2 === 0 ? "bg-transparent" : "bg-navy/[0.01]"}
                  >
                    <td className="px-4 py-3 text-navy">
                      {formatDate(b.start_date)} → {formatDate(b.end_date)}
                    </td>
                    <td className="px-4 py-3 text-navy">{b.guest_name ?? "—"}</td>
                    <td className="px-4 py-3 text-right text-navy font-medium">
                      {formatEuros(b.total_price_cents ?? 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-muted">
                      {formatEuros((b.total_price_cents ?? 0) * 0.25)}
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
