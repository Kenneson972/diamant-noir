import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";
import { RevenueSummary } from "@/components/dashboard/proprio/RevenueSummary";

export const metadata: Metadata = {
  title: "Revenus — Kayvila",
};

const MONTH_LABELS = ["Jan", "Fév", "Mar", "Avr", "Mai", "Jun", "Jul", "Aoû", "Sep", "Oct", "Nov", "Déc"];

export default async function RevenusPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: villas } = await supabase
    .from("villas")
    .select("id")
    .eq("owner_id", user!.id);

  const villaIds = villas?.map((v) => v.id) ?? [];

  const now = new Date();
  const currentMonth = now.getMonth(); // 0-indexed
  const currentYear = now.getFullYear();

  // Fetch last 6 months of confirmed/paid bookings
  const sixMonthsAgo = new Date(currentYear, currentMonth - 5, 1).toISOString();

  const { data: bookings } = villaIds.length > 0
    ? await supabase
        .from("bookings")
        .select("total_price_cents, start_date, status")
        .in("villa_id", villaIds)
        .in("status", ["confirmed", "paid"])
        .gte("start_date", sixMonthsAgo)
    : { data: [] };

  // Aggregate by month
  const monthMap: Record<number, number> = {};
  for (const b of bookings ?? []) {
    const d = new Date(b.start_date);
    const monthIndex = d.getMonth();
    const cents = b.total_price_cents ?? 0;
    monthMap[monthIndex] = (monthMap[monthIndex] ?? 0) + cents;
  }

  // Build 6-month series (oldest → newest)
  const monthlyData = Array.from({ length: 6 }, (_, i) => {
    const monthIndex = (currentMonth - 5 + i + 12) % 12;
    const revenue = Math.round((monthMap[monthIndex] ?? 0) / 100);
    return {
      month: MONTH_LABELS[monthIndex],
      revenue,
      isCurrent: monthIndex === currentMonth,
    };
  });

  const totalMonth = monthlyData.find((m) => m.isCurrent)?.revenue ?? 0;
  const totalYear = monthlyData.reduce((s, m) => s + m.revenue, 0);
  const paidMonths = monthlyData.filter((m) => m.revenue > 0);
  const averagePerNight = paidMonths.length > 0
    ? Math.round(totalYear / paidMonths.length)
    : 0;
  const prevMonthIndex = (currentMonth - 1 + 12) % 12;
  const comparisonMonth = Math.round((monthMap[prevMonthIndex] ?? 0) / 100);

  const hasEnoughHistory = monthlyData.filter((m) => m.revenue > 0).length >= 3;

  return (
    <div>
      <div className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            Revenus
          </h1>
          <p className="text-sm text-muted">Suivi de vos revenus locatifs</p>
        </div>

        <div className="space-y-6">
          <RevenueSummary
            totalMonth={totalMonth}
            totalYear={totalYear}
            averagePerNight={averagePerNight}
            comparisonMonth={comparisonMonth}
          />

          <RevenueChart data={monthlyData} hasEnoughHistory={hasEnoughHistory} />
        </div>
      </div>
    </div>
  );
}
