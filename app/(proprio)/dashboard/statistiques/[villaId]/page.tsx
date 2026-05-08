import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { PerformanceMetrics } from "@/components/dashboard/proprio/PerformanceMetrics";
import { OccupancyChart } from "@/components/dashboard/proprio/OccupancyChart";
import { DEFAULT_SEASONS } from "@/data/seasons";

export const metadata: Metadata = {
  title: "Statistiques — Kayvila",
};

interface PageProps {
  params: Promise<{ villaId: string }>;
}

function daysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

function calcOccupancyPerMonth(
  bookings: { start_date: string; end_date: string }[]
): { month: number; year: number; rate: number }[] {
  const now = new Date();
  const results: { month: number; year: number; rate: number }[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const m = d.getMonth();
    const y = d.getFullYear();
    const monthStart = new Date(y, m, 1);
    const monthEnd = new Date(y, m + 1, 0);
    const totalDays = daysInMonth(y, m);

    let nights = 0;
    for (const b of bookings) {
      const start = new Date(b.start_date);
      const end = new Date(b.end_date);
      const overlapStart = start < monthStart ? monthStart : start;
      const overlapEnd = end > monthEnd ? monthEnd : end;
      if (overlapEnd > overlapStart) {
        const diffMs = overlapEnd.getTime() - overlapStart.getTime();
        nights += Math.round(diffMs / (1000 * 60 * 60 * 24));
      }
    }

    results.push({
      month: m,
      year: y,
      rate: Math.min(100, Math.round((nights / totalDays) * 100)),
    });
  }

  return results;
}

export default async function StatistiquesVillaPage({ params }: PageProps) {
  const { villaId } = await params;
  const supabase = await getSupabaseServer();

  const { data: villa, error: villaError } = await supabase
    .from("villas")
    .select("name")
    .eq("id", villaId)
    .single();

  if (villaError || !villa) {
    notFound();
  }

  // Fetch confirmed bookings for occupancy calculation (last 12 months)
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
  twelveMonthsAgo.setDate(1);

  const { data: bookings } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("villa_id", villaId)
    .eq("status", "confirmed")
    .gte("start_date", twelveMonthsAgo.toISOString().split("T")[0]);

  const rawOccupancy = calcOccupancyPerMonth(bookings ?? []);

  const monthNames = [
    "Jan", "Fév", "Mar", "Avr", "Mai", "Juin",
    "Juil", "Aoû", "Sep", "Oct", "Nov", "Déc",
  ];
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  const occupancyData = rawOccupancy.map((d) => ({
    month: monthNames[d.month],
    monthIndex: d.month,
    rate: d.rate,
    isCurrent: d.month === currentMonth && d.year === currentYear,
  }));

  // Guard: at least 3 completed months with any occupancy data (rate > 0)
  const completedWithData = occupancyData.filter(
    (d) => !d.isCurrent && d.rate > 0
  );
  const hasEnoughHistory = completedWithData.length >= 3;

  // Fetch seasons from DB, fall back to defaults
  const { data: seasonsDb } = await supabase
    .from("seasons")
    .select("id, name, color, months")
    .order("id");

  const seasons =
    seasonsDb && seasonsDb.length > 0
      ? seasonsDb.map((s: { id: number; name: string; color: string; months: number[] }) => ({
          name: s.name,
          color: s.color,
          months: s.months as number[],
        }))
      : DEFAULT_SEASONS;

  // PerformanceMetrics: use last completed month's rate
  const lastCompleted = [...occupancyData].reverse().find((d) => !d.isCurrent);
  const occupancyRate = lastCompleted?.rate ?? 0;

  // Total confirmed nights (all time)
  const { data: allBookings } = await supabase
    .from("bookings")
    .select("start_date, end_date")
    .eq("villa_id", villaId)
    .eq("status", "confirmed");

  const totalNights = (allBookings ?? []).reduce((sum, b) => {
    const diff =
      new Date(b.end_date).getTime() - new Date(b.start_date).getTime();
    return sum + Math.max(0, Math.round(diff / (1000 * 60 * 60 * 24)));
  }, 0);

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/villas"
        className="inline-flex items-center gap-1.5 text-sm text-navy/50 transition-colors hover:text-navy"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux villas
      </Link>

      <h1 className="font-display text-2xl font-bold text-navy">
        Statistiques — {villa.name}
      </h1>

      <PerformanceMetrics
        occupancyRate={occupancyRate}
        totalNights={totalNights}
        avgRating={0}
        totalReviews={0}
      />

      <OccupancyChart
        data={occupancyData}
        hasEnoughHistory={hasEnoughHistory}
        seasons={seasons}
      />
    </div>
  );
}
