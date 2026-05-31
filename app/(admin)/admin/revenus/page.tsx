"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { TrendingUp, BarChart3, DollarSign, Download, Building2 } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const COMMISSION_RATE = 0.20; // 20% commission Kayvila

export default function AdminRevenusPage() {
  const supabase = getSupabaseBrowser();
  const [stats, setStats] = useState({ month: 0, year: 0, allTime: 0, total: 0, avg: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [byVilla, setByVilla] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) return;
    (async () => {
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
      const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

      const [
        { data: monthBookings },
        { data: yearBookings },
        { data: allPaid },
        { count: totalBookings },
        { data: allConfirmed },
        { data: villas },
      ] = await Promise.all([
        supabase.from("bookings").select("total_price_cents").gte("start_date", monthStart).eq("status", "confirmed"),
        supabase.from("bookings").select("total_price_cents").gte("start_date", yearStart).eq("status", "confirmed"),
        supabase.from("bookings").select("total_price_cents").eq("status", "confirmed"),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("total_price_cents, start_date, villa_id, villas(name)").eq("status", "confirmed").order("start_date"),
        supabase.from("villas").select("id, name"),
      ]);

      const sum = (arr: any[]) => (arr ?? []).reduce((s: number, b: any) => s + (b.total_price_cents ?? 0), 0);
      const month = sum(monthBookings ?? []);
      const year = sum(yearBookings ?? []);
      const allTime = sum(allPaid ?? []);
      const total = totalBookings ?? 0;

      setStats({ month, year, allTime, total, avg: total > 0 ? Math.round(allTime / total) : 0 });

      // Monthly aggregation
      const byMonth: Record<string, number> = {};
      (allConfirmed ?? []).forEach((b: any) => {
        const key = b.start_date?.slice(0, 7);
        if (key) byMonth[key] = (byMonth[key] ?? 0) + (b.total_price_cents ?? 0) / 100;
      });
      const months = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([k, v]) => ({ month: k, revenue: Math.round(v) }));
      setMonthlyData(months);

      // Ventilation par villa
      const villaMap = new Map((villas ?? []).map((v: any) => [v.id, v.name]));
      const villaRevenue: Record<string, { name: string; total: number; count: number }> = {};
      (allConfirmed ?? []).forEach((b: any) => {
        const vid = b.villa_id;
        if (!vid) return;
        if (!villaRevenue[vid]) {
          villaRevenue[vid] = { name: b.villas?.name ?? villaMap.get(vid) ?? vid.slice(0, 8), total: 0, count: 0 };
        }
        villaRevenue[vid].total += (b.total_price_cents ?? 0) / 100;
        villaRevenue[vid].count += 1;
      });
      const villaList = Object.values(villaRevenue).sort((a, b) => b.total - a.total);
      setByVilla(villaList);

      setLoading(false);
    })();
  }, [supabase]);

  const exportCSV = () => {
    const rows = [
      ["Villa", "CA total (€)", "Commission Kayvila (€)", "Reversement proprio (€)", "Réservations"],
      ...byVilla.map((v: any) => [
        v.name,
        v.total.toFixed(0),
        (v.total * COMMISSION_RATE).toFixed(0),
        (v.total * (1 - COMMISSION_RATE)).toFixed(0),
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

  const totalCommission = stats.allTime * COMMISSION_RATE;
  const totalReversement = stats.allTime * (1 - COMMISSION_RATE);

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <AdminPageIntro title="Revenus" description="CA agrégé sur les réservations confirmées." />
        <button
          onClick={exportCSV}
          disabled={byVilla.length === 0}
          className="inline-flex shrink-0 items-center gap-2 self-start rounded-xl bg-navy px-4 py-2.5 text-sm font-semibold text-white hover:bg-navy/90 disabled:opacity-40"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* KPIs globaux */}
      <div className="grid gap-6 sm:grid-cols-3">
        {[
          { label: "Ce mois", value: stats.month, icon: TrendingUp },
          { label: "Cette année", value: stats.year, icon: BarChart3 },
          { label: "Total historique", value: stats.allTime, icon: DollarSign },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500">{label}</span>
              <Icon className="h-4 w-4 text-gray-400" />
            </div>
            <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(value)}</p>
          </div>
        ))}
      </div>

      {/* Distinction commission / reversement */}
      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-gradient-to-br from-gold/5 to-gold/[0.02] p-6 shadow-sm">
          <span className="text-sm text-navy/60">Commission Kayvila (20%)</span>
          <p className="mt-2 text-3xl font-semibold text-gold">{formatCurrency(totalCommission)}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Reversement propriétaires (80%)</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{formatCurrency(totalReversement)}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Réservations totales</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{stats.total}</p>
        </div>
      </div>

      {/* Graphique mensuel */}
      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Chargement...</p>
        </div>
      ) : monthlyData.length > 0 ? (
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-sm font-semibold text-navy">CA mensuel (12 derniers mois)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}€`} />
              <Tooltip />
              <Bar dataKey="revenue" fill="#D4AF37" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="rounded-lg border bg-white p-8 text-center">
          <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-4 text-sm text-gray-500">Aucune donnée de revenus disponible.</p>
        </div>
      )}

      {/* Ventilation par villa */}
      {byVilla.length > 0 && (
        <div className="rounded-lg border bg-white shadow-sm">
          <div className="px-6 py-4 border-b border-navy/[0.06]">
            <h3 className="text-sm font-semibold text-navy flex items-center gap-2">
              <Building2 size={16} className="text-navy/40" />
              Ventilation par villa
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-navy/[0.02] border-b border-navy/[0.05]">
                <tr className="text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-navy/50">
                  <th className="px-6 py-3">Villa</th>
                  <th className="px-6 py-3 text-right">CA total</th>
                  <th className="px-6 py-3 text-right">Commission (20%)</th>
                  <th className="px-6 py-3 text-right">Reversement</th>
                  <th className="px-6 py-3 text-right">Résas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy/[0.05]">
                {byVilla.map((v: any) => (
                  <tr key={v.name} className="hover:bg-navy/[0.01]">
                    <td className="px-6 py-3 font-medium text-navy">{v.name}</td>
                    <td className="px-6 py-3 text-right font-medium text-navy">{formatCurrency(v.total * 100)}</td>
                    <td className="px-6 py-3 text-right text-gold font-medium">{formatCurrency(v.total * 100 * COMMISSION_RATE)}</td>
                    <td className="px-6 py-3 text-right text-navy/70">{formatCurrency(v.total * 100 * (1 - COMMISSION_RATE))}</td>
                    <td className="px-6 py-3 text-right text-navy/60">{v.count}</td>
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
