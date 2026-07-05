"use client";

import { useState } from "react";
import { BarChart3, DollarSign } from "lucide-react";
import { KayvilaPngIcon } from "@/components/icons/KayvilaPngIcon";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import type { VillaRevenueRow, RevenueStats } from "@/app/(admin)/admin/revenus/page";
import type { MonthDetail } from "@/lib/revenue/monthly-detail";
import { computeMomChange, shiftMonthKey } from "@/lib/revenue/monthly-comparison";
import { RevenueMonthDetail } from "./RevenueMonthDetail";

type MonthlyChartPoint = { monthKey: string; month: string; revenue: number };

export function AdminRevenusClient({
  stats,
  monthlyData,
  byVilla,
  monthlyDetails,
  monthlyGrossHistory,
  error,
}: {
  stats: RevenueStats;
  monthlyData: MonthlyChartPoint[];
  byVilla: VillaRevenueRow[];
  monthlyDetails: Record<string, MonthDetail>;
  monthlyGrossHistory: Record<string, number>;
  error: string | null;
}) {
  const defaultMonthKey = monthlyData[monthlyData.length - 1]?.monthKey ?? "";
  const [selectedMonthKey, setSelectedMonthKey] = useState(defaultMonthKey);

  const exportCSV = () => {
    const rows = [
      ["Villa", "CA total (€)", "Commission Kayvila (€)", "Reversement proprio (€)", "Réservations"],
      ...byVilla.map((v) => [
        v.name,
        (v.gross / 100).toFixed(0),
        (v.platform / 100).toFixed(0),
        (v.owner / 100).toFixed(0),
        v.count,
      ]),
    ];
    const csv = rows.map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `kayvila-revenus-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedDetail = monthlyDetails[selectedMonthKey];
  const momChangePct = selectedDetail
    ? computeMomChange(selectedDetail.gross, monthlyGrossHistory[shiftMonthKey(selectedMonthKey, -1)] ?? 0)
    : null;
  const yoyChangePct = selectedDetail
    ? computeMomChange(selectedDetail.gross, monthlyGrossHistory[shiftMonthKey(selectedMonthKey, -12)] ?? 0)
    : null;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <AdminPageIntro
          title="Revenus"
          description="Commission selon canal de réservation (20% OTA · 22% direct)"
        />
        {byVilla.length > 0 && (
          <button
            onClick={exportCSV}
            className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90"
          >
            <KayvilaPngIcon name="download" size={18} alt="" />
            Export CSV
          </button>
        )}
      </div>

      {error && (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}

      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "Ce mois (brut)", value: stats.monthGross, icon: "trending-up" },
          { label: "Cette année (brut)", value: stats.yearGross, icon: "barChart3" },
          { label: "Total historique (brut)", value: stats.allTimeGross, icon: "dollarSign" },
        ].map(({ label, value, icon }) => (
          <div key={label} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              {icon === "trending-up" ? (
                <KayvilaPngIcon name="trending-up" size={18} alt="" />
              ) : icon === "barChart3" ? (
                <BarChart3 className="h-4 w-4 text-gray-400" />
              ) : (
                <DollarSign className="h-4 w-4 text-gray-400" />
              )}
            </div>
            <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-gold/5 to-gold/[0.02] p-6 shadow-sm">
          <span className="text-sm text-navy/60">Commission Kayvila (net plateforme)</span>
          <p className="mt-2 text-3xl font-semibold text-gold">
            {formatCurrency(stats.allTimePlatform)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Reversement propriétaires (net)</span>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {formatCurrency(stats.allTimeOwner)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Réservations totales</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{stats.total}</p>
        </div>
      </div>

      {monthlyData.length > 0 ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-navy">CA mensuel brut (12 derniers mois)</h3>
            <select
              aria-label="Sélectionner un mois"
              value={selectedMonthKey}
              onChange={(e) => setSelectedMonthKey(e.target.value)}
              className="min-h-[40px] rounded-full border border-navy/10 bg-white px-3 py-2 text-[11px] text-navy/70 focus:border-gold/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/40"
            >
              {monthlyData.map((point) => (
                <option key={point.monthKey} value={point.monthKey}>
                  {monthlyDetails[point.monthKey]?.label ?? point.month}
                </option>
              ))}
            </select>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip />
              <Bar
                dataKey="revenue"
                radius={[4, 4, 0, 0]}
                cursor="pointer"
                onClick={(data: any) => setSelectedMonthKey(data.payload.monthKey)}
              >
                {monthlyData.map((point) => (
                  <Cell
                    key={point.monthKey}
                    fill={point.monthKey === selectedMonthKey ? "#D4AF37" : "#D4AF3766"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Aucune donnée de revenus disponible.</p>
        </div>
      )}

      {selectedDetail ? (
        <RevenueMonthDetail
          detail={selectedDetail}
          momChangePct={momChangePct}
          yoyChangePct={yoyChangePct}
        />
      ) : null}

      {byVilla.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-navy/[0.06]">
            <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
              <KayvilaPngIcon name="villa" size={18} alt="" className="text-navy/60" />
              Ventilation par villa
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-6 py-3">Villa</th>
                  <th className="px-6 py-3 text-right">CA brut</th>
                  <th className="px-6 py-3 text-right">Commission Kayvila</th>
                  <th className="px-6 py-3 text-right">Reversement</th>
                  <th className="px-6 py-3 text-right">Résas</th>
                  <th className="px-6 py-3 text-right">Canal maj.</th>
                  <th className="px-6 py-3 text-right">Taux</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {byVilla.map((v) => (
                  <tr key={v.name} className="hover:bg-navy/[0.01]">
                    <td className="px-6 py-3 font-medium text-navy">{v.name}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy">
                      {formatCurrency(v.gross)}
                    </td>
                    <td className="px-6 py-3 text-right text-gold font-medium">
                      {formatCurrency(v.platform)}
                    </td>
                    <td className="px-6 py-3 text-right text-navy/70">
                      {formatCurrency(v.owner)}
                    </td>
                    <td className="px-6 py-3 text-right text-navy/60">{v.count}</td>
                    <td className="px-6 py-3 text-right text-navy/60 text-xs">{v.dominantSource}</td>
                    <td className="px-6 py-3 text-right">
                      <span className={`text-xs font-medium ${v.commissionRate === 20 ? 'text-amber-600' : 'text-navy'}`}>
                        {v.commissionRate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
