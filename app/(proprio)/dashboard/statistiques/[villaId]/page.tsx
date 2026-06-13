import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getSupabaseServer } from "@/lib/supabase-server";
import type { Metadata } from "next";
import { PerformanceMetrics } from "@/components/dashboard/proprio/PerformanceMetrics";
import { OccupancyChart } from "@/components/dashboard/proprio/OccupancyChart";
import { DEFAULT_SEASONS } from "@/data/seasons";
import { SeasonalStatsSection } from "@/components/dashboard/proprio/SeasonalStatsSection";
import type { SeasonRow, MonthRow, ThresholdPoint } from "@/components/dashboard/proprio/SeasonalStatsSection";
import {
  format as formatDate,
  parseISO,
  getDaysInMonth,
  isWithinInterval,
  startOfMonth,
  endOfMonth,
} from "date-fns";
import { fr } from "date-fns/locale";

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
    .select("start_date, end_date, price")
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

  // ── Seasonal stats computation ───────────────────────────────────────────
  const { data: seasonsConfig } = await supabase
    .from("seasons_config")
    .select("season_type, start_date, end_date, occupancy_threshold")
    .eq("year", new Date().getFullYear());

  const SEASON_LABELS_MAP: Record<string, string> = {
    high: "Haute saison",
    school_holidays: "Vacances scolaires",
    mid: "Moyenne saison",
    low: "Basse saison",
  };

  const nowDate = new Date();
  const monthly: MonthRow[] = [];
  const thresholdLine: ThresholdPoint[] = [];

  for (let i = 11; i >= 0; i--) {
    const d = new Date(nowDate.getFullYear(), nowDate.getMonth() - i, 1);
    const mStart = startOfMonth(d);
    const mEnd = endOfMonth(d);
    const totalDays = getDaysInMonth(d);
    const mLabel = formatDate(d, "MMM", { locale: fr });

    let nights = 0;
    let revenue = 0;

    for (const b of bookings ?? []) {
      const bStart = parseISO(b.start_date);
      const bEnd = parseISO(b.end_date ?? b.start_date);
      const overlapStart = bStart < mStart ? mStart : bStart;
      const overlapEnd = bEnd > mEnd ? mEnd : bEnd;
      if (overlapEnd > overlapStart) {
        nights += Math.round(
          (overlapEnd.getTime() - overlapStart.getTime()) / 86400000
        );
      }
      if (bStart >= mStart && bStart <= mEnd) {
        // Commission 25% par défaut
        revenue += ((b as { price?: number }).price ?? 0) * 0.75;
      }
    }

    const occupancy = Math.min(100, Math.round((nights / totalDays) * 100));

    const midMonth = new Date(d.getFullYear(), d.getMonth(), 15);
    const seasonCfg = (seasonsConfig ?? []).find((s) =>
      isWithinInterval(midMonth, {
        start: parseISO(s.start_date),
        end: parseISO(s.end_date),
      })
    );

    monthly.push({
      month: mLabel,
      monthIndex: d.getMonth(),
      season: seasonCfg ? SEASON_LABELS_MAP[seasonCfg.season_type] : null,
      seasonType: seasonCfg?.season_type ?? null,
      nights,
      occupancy,
      netRevenue: Math.round(revenue),
      avgNightPrice: nights > 0 ? Math.round(revenue / nights) : 0,
    });

    thresholdLine.push({
      month: mLabel,
      actual: occupancy,
      threshold: seasonCfg?.occupancy_threshold ?? 50,
    });
  }

  // Agrégation par saison
  const seasonalMap: Record<
    string,
    { nights: number; revenue: number; type: string; occupancySum: number; count: number }
  > = {};
  for (const row of monthly) {
    if (!row.seasonType) continue;
    if (!seasonalMap[row.seasonType]) {
      seasonalMap[row.seasonType] = {
        nights: 0,
        revenue: 0,
        type: row.seasonType,
        occupancySum: 0,
        count: 0,
      };
    }
    seasonalMap[row.seasonType].nights += row.nights;
    seasonalMap[row.seasonType].revenue += row.netRevenue;
    seasonalMap[row.seasonType].occupancySum += row.occupancy;
    seasonalMap[row.seasonType].count += 1;
  }

  const seasonal: SeasonRow[] = Object.entries(seasonalMap).map(
    ([type, v]) => ({
      season: SEASON_LABELS_MAP[type] ?? type,
      type: type as SeasonRow["type"],
      nights: v.nights,
      occupancy: Math.round(v.occupancySum / Math.max(1, v.count)),
      netRevenue: v.revenue,
      avgNightPrice: v.nights > 0 ? Math.round(v.revenue / v.nights) : 0,
    })
  );
  // ─────────────────────────────────────────────────────────────────────────

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

      <SeasonalStatsSection
        seasonal={seasonal}
        monthly={monthly}
        thresholdLine={thresholdLine}
      />
    </div>
  );
}
