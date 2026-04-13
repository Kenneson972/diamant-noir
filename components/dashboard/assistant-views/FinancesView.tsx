"use client";

import { TrendingUp, TrendingDown, Euro, Clock, BarChart2 } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export function FinancesView({ data }: { data: any }) {
  const finances = data?.finances || {};
  const villas = data?.villas || [];

  const revenueTotal = Number(finances.revenue_total || 0);
  const revenueThisMonth = Number(finances.revenue_this_month || 0);
  const revenueLastMonth = Number(finances.revenue_last_month || 0);
  const pendingPayments = finances.pending_payments || 0;

  const monthlyRevenue: { month: string; revenue: number }[] =
    finances.monthly_revenue || [];

  const delta =
    revenueLastMonth > 0
      ? Math.round(((revenueThisMonth - revenueLastMonth) / revenueLastMonth) * 100)
      : null;

  const revenueByVilla: { villa_name: string; revenue: number; bookings_count: number }[] =
    finances.revenue_by_villa || [];

  const maxVillaRevenue = Math.max(...revenueByVilla.map((v) => v.revenue), 1);

  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-display text-3xl text-white">Finances & reversements</h3>
          <p className="text-sm text-white/40">Données en temps réel · compte propriétaire</p>
        </div>
        <div className="flex items-center gap-2 rounded-2xl border border-gold/20 bg-gold/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-gold">
          <Euro size={14} /> Vue financière
        </div>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6 transition-all hover:border-white/10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">CA total payé</p>
          <p className="font-display text-2xl text-gold">€{revenueTotal.toLocaleString("fr-FR")}</p>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6 transition-all hover:border-white/10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Ce mois-ci</p>
          <div className="flex items-center gap-2">
            <p className="font-display text-2xl text-white">€{revenueThisMonth.toLocaleString("fr-FR")}</p>
            {delta !== null && (
              <span
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                  delta >= 0
                    ? "bg-emerald-400/10 text-emerald-400"
                    : "bg-rose-400/10 text-rose-400"
                }`}
              >
                {delta >= 0 ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                {delta > 0 ? "+" : ""}
                {delta}%
              </span>
            )}
          </div>
        </div>
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6 transition-all hover:border-white/10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-white/30">Mois dernier</p>
          <p className="font-display text-2xl text-white">€{revenueLastMonth.toLocaleString("fr-FR")}</p>
        </div>
        <div className="rounded-3xl border border-amber-400/10 bg-amber-400/5 p-6 transition-all hover:border-amber-400/20">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-amber-400/60">Paiements en attente</p>
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-amber-400" />
            <p className="font-display text-2xl text-amber-400">{pendingPayments}</p>
          </div>
        </div>
      </div>

      {/* Chart 6 mois */}
      {monthlyRevenue.length > 0 && (
        <div className="group relative overflow-hidden rounded-[40px] border border-white/5 bg-[#0D0D14] p-10">
          <div className="absolute right-0 top-0 p-8 opacity-10 transition-opacity group-hover:opacity-20">
            <BarChart2 size={100} className="text-gold" />
          </div>
          <h4 className="mb-8 flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-gold">
            <TrendingUp size={14} /> Revenus sur 6 mois
          </h4>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyRevenue} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                <XAxis
                  dataKey="month"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fontSize: 10, fill: "#ffffff40" }}
                  tickFormatter={(v) => `€${Number(v).toLocaleString("fr-FR")}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#0D0D14",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    fontSize: "12px",
                    color: "#fff",
                  }}
                  itemStyle={{ color: "#D4AF37" }}
                  formatter={(v) => [`€${Number(v ?? 0).toLocaleString("fr-FR")}`, "Revenus"]}
                />
                <Bar dataKey="revenue" fill="#D4AF37" radius={[6, 6, 0, 0]} fillOpacity={0.85} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Revenus par villa */}
      {revenueByVilla.length > 0 && (
        <div className="rounded-3xl border border-white/5 bg-[#0D0D14] p-6">
          <h4 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-white/40">
            Performance par villa
          </h4>
          <ul className="space-y-4">
            {revenueByVilla
              .sort((a, b) => b.revenue - a.revenue)
              .map((v, i) => (
                <li key={i} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white/80">{v.villa_name}</span>
                    <div className="flex items-center gap-3 text-white/40">
                      <span>{v.bookings_count} rés.</span>
                      <span className="font-bold text-gold">€{v.revenue.toLocaleString("fr-FR")}</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                    <div
                      className="h-full rounded-full bg-gold/70 transition-all duration-700"
                      style={{ width: `${Math.round((v.revenue / maxVillaRevenue) * 100)}%` }}
                    />
                  </div>
                </li>
              ))}
          </ul>
        </div>
      )}
    </div>
  );
}
