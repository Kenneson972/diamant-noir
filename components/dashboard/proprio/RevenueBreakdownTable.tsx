"use client";

import { useState } from "react";

export type RevenueRow = {
  id: string;
  checkIn: string;
  guestName: string;
  villaName: string;
  nights: number;
  gross: number;
  commissionRate: number;
  commission: number;
  cleaningFee: number;
  net: number;
  paymentStatus: string;
  stripeTransferId: string | null;
  stripeTransferDate: string | null;
  stripeTransferStatus: string | null;
  villaId: string;
};

function formatEur(v: number) {
  return v >= 1000 ? `${(v / 1000).toFixed(1)}K€` : `${v.toLocaleString("fr-FR")}€`;
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR");
}

const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  paid: "Payé",
  transferred: "Virement émis",
  settled: "Soldé",
  failed: "Échoué",
};

export function RevenueBreakdownTable({ rows }: { rows: RevenueRow[] }) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const totals = rows.reduce(
    (acc, r) => ({
      gross: acc.gross + r.gross,
      commission: acc.commission + r.commission,
      cleaning: acc.cleaning + r.cleaningFee,
      net: acc.net + r.net,
    }),
    { gross: 0, commission: 0, cleaning: 0, net: 0 }
  );

  if (rows.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-navy/60">
        Aucune réservation sur cette période.
      </p>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-navy/10">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-navy/5 bg-offwhite">
              {[
                "Arrivée",
                "Voyageur",
                "Villa",
                "Nuits",
                "Brut",
                "Commission",
                "Fr. ménage",
                "Net",
                "Statut",
                "",
              ].map((h) => (
                <th
                  key={h}
                  className="whitespace-nowrap px-3 py-3 text-left text-xs font-medium text-navy/50"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-navy/5">
            {rows.map((row) => {
              const isOpen = expandedId === row.id;
              return (
                <>
                  <tr
                    key={row.id}
                    className="bg-white transition-colors hover:bg-offwhite"
                  >
                    <td className="whitespace-nowrap px-3 py-3 text-navy/70">
                      {formatDate(row.checkIn)}
                    </td>
                    <td className="px-3 py-3 font-medium text-navy">
                      {row.guestName}
                    </td>
                    <td className="max-w-[140px] truncate px-3 py-3 text-navy/70">
                      {row.villaName}
                    </td>
                    <td className="px-3 py-3 text-navy/70">{row.nights}</td>
                    <td className="px-3 py-3 text-navy">
                      {formatEur(row.gross)}
                    </td>
                    <td className="px-3 py-3 text-red-500">
                      -{formatEur(row.commission)}
                    </td>
                    <td className="px-3 py-3 text-navy/70">
                      {formatEur(row.cleaningFee)}
                    </td>
                    <td className="px-3 py-3 font-semibold text-gold">
                      {formatEur(row.net)}
                    </td>
                    <td className="px-3 py-3">
                      <span className="rounded-full bg-navy/5 px-2 py-0.5 text-xs text-navy/70">
                        {PAYMENT_STATUS_LABELS[row.paymentStatus] ??
                          row.paymentStatus}
                      </span>
                    </td>
                    <td className="px-3 py-3">
                      <button
                        type="button"
                        onClick={() =>
                          setExpandedId(isOpen ? null : row.id)
                        }
                        className="text-navy/60 transition-colors hover:text-navy"
                        aria-label={isOpen ? "Réduire" : "Voir détail"}
                      >
                        {isOpen ? (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="18 15 12 9 6 15" /></svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>
                        )}
                      </button>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr key={`${row.id}-detail`}>
                      <td
                        colSpan={10}
                        className="bg-offwhite px-6 py-4"
                      >
                        <div className="grid gap-6 sm:grid-cols-2">
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
                              Décomposition financière
                            </p>
                            <div className="space-y-1.5 text-sm">
                              <div className="flex justify-between">
                                <span className="text-navy/80">Brut HT</span>
                                <span className="text-navy">
                                  {formatEur(row.gross)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy/80">
                                  Frais ménage
                                </span>
                                <span className="text-navy">
                                  {formatEur(row.cleaningFee)}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-navy/80">
                                  Commission Kayvila
                                </span>
                                <span className="text-red-500">
                                  -{formatEur(row.commission)}
                                </span>
                              </div>
                              <div className="flex justify-between border-t border-navy/10 pt-1.5 font-semibold">
                                <span className="text-navy">Net reversé</span>
                                <span className="text-gold">
                                  {formatEur(row.net)}
                                </span>
                              </div>
                            </div>
                          </div>
                          {row.stripeTransferId && (
                            <div>
                              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-navy/50">
                                Stripe Connect
                              </p>
                              <div className="space-y-1.5 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-navy/80">
                                    ID transfer
                                  </span>
                                  <code className="rounded bg-white px-1 text-xs text-navy/70">
                                    {row.stripeTransferId}
                                  </code>
                                </div>
                                {row.stripeTransferDate && (
                                  <div className="flex justify-between">
                                    <span className="text-navy/80">
                                      Date reversement
                                    </span>
                                    <span className="text-navy">
                                      {formatDate(row.stripeTransferDate)}
                                    </span>
                                  </div>
                                )}
                                {row.stripeTransferStatus && (
                                  <div className="flex justify-between">
                                    <span className="text-navy/80">Statut</span>
                                    <span className="text-navy">
                                      {PAYMENT_STATUS_LABELS[
                                        row.stripeTransferStatus
                                      ] ?? row.stripeTransferStatus}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                        <a
                          href={`/dashboard/reservations/${row.villaId}/${row.id}`}
                          className="mt-4 inline-block text-xs text-gold hover:underline"
                        >
                          Voir la réservation complète →
                        </a>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="border-t border-navy/10 bg-navy/[0.03]">
              <td
                colSpan={4}
                className="px-3 py-3 text-xs font-semibold text-navy/50"
              >
                TOTAUX
              </td>
              <td className="px-3 py-3 font-semibold text-navy">
                {formatEur(totals.gross)}
              </td>
              <td className="px-3 py-3 font-semibold text-red-500">
                -{formatEur(totals.commission)}
              </td>
              <td className="px-3 py-3 font-semibold text-navy/70">
                {formatEur(totals.cleaning)}
              </td>
              <td className="px-3 py-3 font-bold text-gold">
                {formatEur(totals.net)}
              </td>
              <td colSpan={2} />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
