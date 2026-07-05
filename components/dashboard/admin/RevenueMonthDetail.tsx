"use client";

import { useState } from "react";
import Link from "next/link";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import type { MonthDetail, MonthBookingRow } from "@/lib/revenue/monthly-detail";

function ComparisonBadge({ label, pct }: { label: string; pct: number | null }) {
  if (pct === null) {
    return (
      <span className="inline-flex items-center rounded-full bg-navy/[0.05] px-2.5 py-1 text-[11px] font-medium text-navy/50">
        {label} : nouveau
      </span>
    );
  }
  const positive = pct >= 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {positive ? "+" : ""}
      {pct}% {label}
    </span>
  );
}

export function RevenueMonthDetail({
  detail,
  momChangePct,
  yoyChangePct,
}: {
  detail: MonthDetail;
  momChangePct: number | null;
  yoyChangePct: number | null;
}) {
  const [openVillaIds, setOpenVillaIds] = useState<Set<string>>(new Set());
  const toggleVilla = (villaId: string) => {
    setOpenVillaIds((prev) => {
      const next = new Set(prev);
      if (next.has(villaId)) next.delete(villaId);
      else next.add(villaId);
      return next;
    });
  };

  const bookingsByVilla = new Map<string, MonthBookingRow[]>();
  for (const b of detail.bookings) {
    const list = bookingsByVilla.get(b.villaId) ?? [];
    list.push(b);
    bookingsByVilla.set(b.villaId, list);
  }

  const handleExportMonth = () => {
    const rows = [
      ["Client", "Villa", "Arrivée", "Départ", "Nuits", "Canal", "CA brut (€)", "Commission (€)", "Reversement (€)"],
      ...detail.bookings.map((b) => [
        b.guestName,
        b.villaName,
        b.startDate,
        b.endDate,
        String(b.nights),
        b.channel,
        (b.gross / 100).toFixed(0),
        (b.platform / 100).toFixed(0),
        (b.owner / 100).toFixed(0),
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `revenus-${detail.monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const summaryCards = [
    { label: "CA brut", value: formatCurrency(detail.gross) },
    {
      label: "Commission Kayvila",
      value: formatCurrency(detail.platformTotal),
      subtitle: `Nuitées ${formatCurrency(detail.platformOnStay)} · Ménage ${formatCurrency(detail.platformCleaning)} · Service ${formatCurrency(detail.platformService)}`,
    },
    { label: "Reversement propriétaires", value: formatCurrency(detail.ownerNet) },
    { label: "Réservations confirmées", value: String(detail.bookingCount) },
    { label: "Nuitées vendues", value: String(detail.nightsSold) },
    { label: "Prix moyen/nuit (ADR)", value: formatCurrency(detail.adr) },
    { label: "Taux d'occupation", value: `${detail.occupancyRate}%` },
    { label: "Panier moyen", value: formatCurrency(detail.avgBasket) },
  ];

  return (
    <div className="space-y-6 rounded-lg border bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-navy">Détail — {detail.label}</h3>
        <div className="flex flex-wrap gap-2">
          <ComparisonBadge label="vs mois précédent" pct={momChangePct} />
          <ComparisonBadge label="vs année dernière" pct={yoyChangePct} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {summaryCards.map((card) => (
          <div key={card.label} className="rounded-lg border border-navy/[0.06] bg-navy/[0.015] p-4">
            <span className="text-[11px] uppercase tracking-[0.08em] text-navy/45">{card.label}</span>
            <p className="mt-1 text-xl font-semibold text-navy">{card.value}</p>
            {card.subtitle ? <p className="mt-1 text-[11px] text-navy/40">{card.subtitle}</p> : null}
          </div>
        ))}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-red-100 bg-red-50/50 p-4">
          <span className="text-[11px] uppercase tracking-[0.08em] text-red-700/70">Annulé ce mois</span>
          <p className="mt-1 text-lg font-semibold text-red-700">
            {detail.cancelled.count} · {formatCurrency(detail.cancelled.lostGross)}
          </p>
        </div>
        <div className="rounded-lg border border-navy/10 bg-navy/[0.02] p-4">
          <span className="text-[11px] uppercase tracking-[0.08em] text-navy/50">En attente (pipeline)</span>
          <p className="mt-1 text-lg font-semibold text-navy">
            {detail.pending.count} · {formatCurrency(detail.pending.potentialGross)}
          </p>
        </div>
      </div>

      {detail.bookingCount === 0 ? (
        <div className="rounded-lg border border-dashed border-navy/15 p-8 text-center">
          <KayvilaPngIcon name="calendar" size={28} alt="" className="mx-auto opacity-40" />
          <p className="mt-3 text-sm text-navy/50">Aucune réservation confirmée ce mois-ci.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-4 py-3">Villa</th>
                  <th className="px-4 py-3 text-right">CA brut</th>
                  <th className="px-4 py-3 text-right">Nuitées</th>
                  <th className="px-4 py-3 text-right">Occupation</th>
                  <th className="px-4 py-3 text-right">ADR</th>
                  <th className="px-4 py-3 text-right">Commission</th>
                  <th className="px-4 py-3 text-right">Reversement</th>
                  <th className="px-4 py-3 text-right">Résas</th>
                  <th className="px-4 py-3 text-right">% du mois</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {detail.byVilla.map((v) => (
                  <tr key={v.villaId} className="hover:bg-navy/[0.01]">
                    <td className="px-4 py-3 font-medium text-navy">{v.name}</td>
                    <td className="px-4 py-3 text-right text-navy">{formatCurrency(v.gross)}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{v.nightsSold}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{v.occupancyRate}%</td>
                    <td className="px-4 py-3 text-right text-navy/70">{formatCurrency(v.adr)}</td>
                    <td className="px-4 py-3 text-right text-gold">{formatCurrency(v.platformTotal)}</td>
                    <td className="px-4 py-3 text-right text-navy/70">{formatCurrency(v.ownerNet)}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{v.bookingCount}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{v.shareOfMonthPct}%</td>
                  </tr>
                ))}
                <tr className="bg-navy/[0.02] font-semibold text-navy">
                  <td className="px-4 py-3">Total</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.gross)}</td>
                  <td className="px-4 py-3 text-right">{detail.nightsSold}</td>
                  <td className="px-4 py-3 text-right">{detail.occupancyRate}%</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.adr)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.platformTotal)}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(detail.ownerNet)}</td>
                  <td className="px-4 py-3 text-right">{detail.bookingCount}</td>
                  <td className="px-4 py-3 text-right">100%</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-4 py-3">Canal</th>
                  <th className="px-4 py-3 text-right">CA brut</th>
                  <th className="px-4 py-3 text-right">% du mois</th>
                  <th className="px-4 py-3 text-right">Taux commission</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {detail.byChannel.map((c) => (
                  <tr key={c.channel} className="hover:bg-navy/[0.01]">
                    <td className="px-4 py-3 font-medium text-navy">{c.channel}</td>
                    <td className="px-4 py-3 text-right text-navy">{formatCurrency(c.gross)}</td>
                    <td className="px-4 py-3 text-right text-navy/60">{c.sharePct}%</td>
                    <td className="px-4 py-3 text-right text-navy/60">{c.commissionRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="space-y-2">
            {detail.byVilla.map((v) => {
              const rows = bookingsByVilla.get(v.villaId) ?? [];
              const isOpen = openVillaIds.has(v.villaId);
              return (
                <div key={v.villaId} className="rounded-lg border">
                  <button
                    type="button"
                    onClick={() => toggleVilla(v.villaId)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left"
                  >
                    <span className="flex items-center gap-2 text-sm font-medium text-navy">
                      <KayvilaPngIcon name="villa" size={16} alt="" />
                      {v.name}
                      <Link
                        href={`/admin/reservations?villa=${v.villaId}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-[11px] font-normal text-gold hover:underline"
                      >
                        voir tout
                      </Link>
                    </span>
                    <span className="text-xs text-navy/60">
                      {formatCurrency(v.gross)} brut · {formatCurrency(v.ownerNet)} reversé
                    </span>
                  </button>
                  {isOpen ? (
                    <table className="w-full border-t text-sm">
                      <thead className="bg-navy/[0.02]">
                        <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-navy/45">
                          <th className="px-4 py-2">Client</th>
                          <th className="px-4 py-2">Dates</th>
                          <th className="px-4 py-2 text-right">Nuits</th>
                          <th className="px-4 py-2 text-right">Canal</th>
                          <th className="px-4 py-2 text-right">Brut</th>
                          <th className="px-4 py-2 text-right">Commission</th>
                          <th className="px-4 py-2 text-right">Net</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-navy/[0.05]">
                        {rows.map((b) => (
                          <tr key={b.id}>
                            <td className="px-4 py-2 text-navy">{b.guestName}</td>
                            <td className="px-4 py-2 text-navy/70">
                              {b.startDate} → {b.endDate}
                            </td>
                            <td className="px-4 py-2 text-right text-navy/70">{b.nights}</td>
                            <td className="px-4 py-2 text-right text-navy/60">{b.channel}</td>
                            <td className="px-4 py-2 text-right text-navy">{formatCurrency(b.gross)}</td>
                            <td className="px-4 py-2 text-right text-gold">{formatCurrency(b.platform)}</td>
                            <td className="px-4 py-2 text-right text-navy/70">{formatCurrency(b.owner)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              );
            })}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleExportMonth}
              className="inline-flex items-center gap-2 rounded-xl border border-navy/10 px-4 py-2.5 text-sm font-semibold text-navy hover:bg-navy/5"
            >
              <KayvilaPngIcon name="download" size={18} alt="" />
              Exporter ce mois
            </button>
          </div>
        </>
      )}
    </div>
  );
}
