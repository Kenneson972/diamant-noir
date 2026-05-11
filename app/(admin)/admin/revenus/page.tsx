"use client";

import { useState, useEffect } from "react";
import { getSupabaseBrowser } from "@/lib/supabase";
import { TrendingUp, BarChart3, DollarSign, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

export default function AdminRevenusPage() {
  const supabase = getSupabaseBrowser();
  const [stats, setStats] = useState({ month: 0, year: 0, allTime: 0, total: 0, avg: 0 });
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
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
      ] = await Promise.all([
        supabase.from("bookings").select("total_price_cents").gte("start_date", monthStart).eq("status", "confirmed"),
        supabase.from("bookings").select("total_price_cents").gte("start_date", yearStart).eq("status", "confirmed"),
        supabase.from("bookings").select("total_price_cents").eq("status", "confirmed"),
        supabase.from("bookings").select("*", { count: "exact", head: true }),
        supabase.from("bookings").select("total_price_cents, start_date").eq("status", "confirmed").order("start_date"),
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
        const key = b.start_date?.slice(0, 7); // YYYY-MM
        if (key) byMonth[key] = (byMonth[key] ?? 0) + (b.total_price_cents ?? 0) / 100;
      });
      const months = Object.entries(byMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .slice(-12)
        .map(([k, v]) => ({ month: k, revenue: Math.round(v) }));
      setMonthlyData(months);

      setLoading(false);
    })();
  }, [supabase]);

  return (
    <div className="space-y-8">
      <AdminPageIntro title="Revenus globaux" description="CA agrégé sur les réservations confirmées." />

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

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Réservations totales</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{stats.total}</p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <span className="text-sm text-gray-500">Prix moyen</span>
          <p className="mt-2 text-3xl font-semibold text-navy">{stats.avg > 0 ? formatCurrency(stats.avg) : "—"}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-lg border bg-white p-8 text-center">
          <p className="text-sm text-gray-500">Chargement des graphiques...</p>
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
    </div>
  );
}
