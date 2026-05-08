import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { RevenueChart } from "@/components/dashboard/proprio/RevenueChart";
import { RevenueSummary } from "@/components/dashboard/proprio/RevenueSummary";

export const metadata: Metadata = {
  title: "Revenus — Kayvila",
};

export default async function RevenusPage() {
  const supabase = await getSupabaseServer();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Fetch villas owned by this user to get villaIds
  const { data: villas } = await supabase
    .from("villas")
    .select("id")
    .eq("owner_id", user!.id);

  const villaIds = villas?.map((v) => v.id) ?? [];

  // Static demo data — actual payment data will be connected later
  const monthlyData = [
    { month: "Jan", revenue: 4200, isCurrent: false },
    { month: "Fév", revenue: 3800, isCurrent: false },
    { month: "Mar", revenue: 5100, isCurrent: false },
    { month: "Avr", revenue: 4900, isCurrent: false },
    { month: "Mai", revenue: 6200, isCurrent: true },
  ];

  const totalMonth = 6200;
  const totalYear = 24200;
  const averagePerNight = 350;
  const comparisonMonth = 4900;

  return (
    <main className="min-h-dvh bg-cream">
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

          <RevenueChart data={monthlyData} hasEnoughHistory={true} />
        </div>
      </div>
    </main>
  );
}
