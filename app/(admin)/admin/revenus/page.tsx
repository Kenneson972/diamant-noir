import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { TrendingUp, BarChart3, DollarSign, CalendarDays } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { AdminPageIntro } from "@/components/dashboard/admin/AdminPageIntro";

export const metadata: Metadata = {
  title: "Revenus — Administration Kayvila",
};

export default async function AdminRevenusPage() {
  const supabase = await getSupabaseServer();

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const yearStart = new Date(now.getFullYear(), 0, 1).toISOString();

  const [
    { data: monthBookings },
    { data: yearBookings },
    { data: allPaid },
    { count: totalBookings },
  ] = await Promise.all([
    supabase
      .from("bookings")
      .select("total_price_cents")
      .gte("start_date", monthStart)
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("total_price_cents")
      .gte("start_date", yearStart)
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("total_price_cents")
      .eq("status", "confirmed"),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true }),
  ]);

  const monthRevenue = (monthBookings ?? []).reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );
  const yearRevenue = (yearBookings ?? []).reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );
  const allTimeRevenue = (allPaid ?? []).reduce(
    (sum, b) => sum + (b.total_price_cents ?? 0),
    0
  );

  return (
    <div className="space-y-8">
      <AdminPageIntro
        title="Revenus globaux"
        description="CA agrégé sur les réservations confirmées (total_price_cents)."
      />

      <div className="grid gap-6 sm:grid-cols-3">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Ce mois</span>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {formatCurrency(monthRevenue)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Cette année</span>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {formatCurrency(yearRevenue)}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Total historique</span>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {formatCurrency(allTimeRevenue)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Réservations totales</span>
            <CalendarDays className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {totalBookings ?? 0}
          </p>
        </div>
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-500">Prix moyen</span>
            <BarChart3 className="h-4 w-4 text-gray-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold text-navy">
            {totalBookings && totalBookings > 0
              ? formatCurrency(Math.round(allTimeRevenue / totalBookings))
              : "—"}
          </p>
        </div>
      </div>

      <div className="rounded-lg border bg-white p-8 text-center">
        <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
        <p className="mt-4 text-sm text-gray-500">
          Les graphiques d&eacute;taill&eacute;s par mois et par villa seront
          disponibles prochainement.
        </p>
      </div>
    </div>
  );
}
