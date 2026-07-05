import { supabaseAdmin } from "@/lib/supabase";
import type { Metadata } from "next";
import { AdminRevenusClient } from "@/components/dashboard/admin/AdminRevenusClient";
import {
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  getCommissionRate,
} from "@/lib/revenue/booking-revenue";
import {
  buildMonthlyDetails,
  type ConfirmedBookingInput,
  type MinimalBookingInput,
  type VillaInfo,
  type MonthDetail,
} from "@/lib/revenue/monthly-detail";

export const metadata: Metadata = {
  title: "Revenus — Administration Kayvila",
};

export const dynamic = "force-dynamic";

const CONFIRMED_STATUSES = ["confirmed", "paid"];

export type VillaRevenueRow = {
  name: string;
  gross: number;
  platform: number;
  owner: number;
  count: number;
  dominantSource: string;
  commissionRate: number;
};

export type RevenueStats = {
  monthGross: number;
  yearGross: number;
  allTimeGross: number;
  allTimePlatform: number;
  allTimeOwner: number;
  total: number;
  avg: number;
};

export default async function AdminRevenusPage() {
  let stats: RevenueStats = {
    monthGross: 0, yearGross: 0, allTimeGross: 0,
    allTimePlatform: 0, allTimeOwner: 0, total: 0, avg: 0,
  };
  let monthlyData: { monthKey: string; month: string; revenue: number }[] = [];
  let byVilla: VillaRevenueRow[] = [];
  let monthlyDetails: Record<string, MonthDetail> = {};
  let monthlyGrossHistory: Record<string, number> = {};
  let error: string | null = null;

  try {
    const supabase = supabaseAdmin();
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

    const [{ data: bookings }, { data: villas }, { data: recentNonConfirmed }] = await Promise.all([
      supabase
        .from("bookings")
        .select("id, villa_id, start_date, end_date, guest_name, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, source, villas(name, commission_rate)")
        .in("status", CONFIRMED_STATUSES)
        .order("start_date", { ascending: false }),
      supabase.from("villas").select("id, name, commission_rate"),
      supabase
        .from("bookings")
        .select("villa_id, start_date, price, cleaning_fee, service_fee, total_price_cents, status")
        .in("status", ["cancelled", "refunded", "pending"])
        .gte("start_date", twelveMonthsAgo.toISOString()),
    ]);

    const villaMap = new Map((villas ?? []).map((v: any) => [v.id, v]));

    let allTimeGross = 0, allTimePlatform = 0, allTimeOwner = 0;
    let monthGross = 0, yearGross = 0, totalBookings = 0;

    // Per-villa aggregation
    const villaBuckets: Record<string, { gross: number; platform: number; owner: number; count: number; sources: Record<string, number> }> = {};

    for (const b of (bookings ?? []) as any[]) {
      const gross = grossCentsFromBooking(b);
      const source = b.source as string | null;
      const rate = getCommissionRate(source);
      const platform = platformFeeCents(b, rate);
      const owner = ownerNetCents(b, rate);
      const startDate = new Date(b.start_date);

      totalBookings++;
      allTimeGross += gross;
      allTimePlatform += platform;
      allTimeOwner += owner;

      if (startDate >= monthStart) monthGross += gross;
      if (startDate >= yearStart) yearGross += gross;

      // Villa bucket
      const vId = b.villa_id;
      if (!villaBuckets[vId]) villaBuckets[vId] = { gross: 0, platform: 0, owner: 0, count: 0, sources: {} };
      villaBuckets[vId].gross += gross;
      villaBuckets[vId].platform += platform;
      villaBuckets[vId].owner += owner;
      villaBuckets[vId].count++;
      villaBuckets[vId].sources[source ?? "direct"] = (villaBuckets[vId].sources[source ?? "direct"] ?? 0) + 1;
    }

    stats = {
      monthGross,
      yearGross,
      allTimeGross,
      allTimePlatform,
      allTimeOwner,
      total: totalBookings,
      avg: totalBookings > 0 ? Math.round(allTimeGross / totalBookings) : 0,
    };

    // Fenêtre glissante 12 mois (oldest → newest)
    const monthKeys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      monthKeys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }

    const villasForDetail: VillaInfo[] = (villas ?? []).map((v: any) => ({ id: v.id, name: v.name }));
    const confirmedForDetail: ConfirmedBookingInput[] = (bookings ?? []).map((b: any) => ({
      id: b.id,
      villa_id: b.villa_id,
      guest_name: b.guest_name,
      start_date: b.start_date,
      end_date: b.end_date,
      price: b.price,
      cleaning_fee: b.cleaning_fee,
      service_fee: b.service_fee,
      total_price_cents: b.total_price_cents,
      source: b.source,
    }));
    const cancelledForDetail: MinimalBookingInput[] = (recentNonConfirmed ?? [])
      .filter((b: any) => b.status === "cancelled" || b.status === "refunded")
      .map((b: any) => ({
        villa_id: b.villa_id,
        start_date: b.start_date,
        price: b.price,
        cleaning_fee: b.cleaning_fee,
        service_fee: b.service_fee,
        total_price_cents: b.total_price_cents,
      }));
    const pendingForDetail: MinimalBookingInput[] = (recentNonConfirmed ?? [])
      .filter((b: any) => b.status === "pending")
      .map((b: any) => ({
        villa_id: b.villa_id,
        start_date: b.start_date,
        price: b.price,
        cleaning_fee: b.cleaning_fee,
        service_fee: b.service_fee,
        total_price_cents: b.total_price_cents,
      }));

    const detailResult = buildMonthlyDetails({
      confirmedBookings: confirmedForDetail,
      cancelledBookings: cancelledForDetail,
      pendingBookings: pendingForDetail,
      villas: villasForDetail,
      monthKeys,
    });
    monthlyDetails = detailResult.monthlyDetails;
    monthlyGrossHistory = detailResult.monthlyGrossHistory;

    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    monthlyData = monthKeys.map((key) => {
      const monthIndex = Number(key.split("-")[1]) - 1;
      return {
        monthKey: key,
        month: monthNames[monthIndex],
        revenue: Math.round((monthlyDetails[key]?.gross ?? 0) / 100),
      };
    });

    // Villa rows
    byVilla = Object.entries(villaBuckets).map(([vId, vb]) => {
      const villa = villaMap.get(vId);
      const dominantSource = Object.entries(vb.sources).sort(([, a], [, b]) => b - a)[0]?.[0] ?? "direct";
      return {
        name: villa?.name ?? vId.slice(0, 8),
        gross: vb.gross,
        platform: vb.platform,
        owner: vb.owner,
        count: vb.count,
        dominantSource,
        commissionRate: getCommissionRate(dominantSource),
      };
    }).sort((a, b) => b.gross - a.gross);
  } catch (e) {
    error = e instanceof Error ? e.message : "Erreur inconnue";
  }

  return (
    <AdminRevenusClient
      stats={stats}
      monthlyData={monthlyData}
      byVilla={byVilla}
      monthlyDetails={monthlyDetails}
      monthlyGrossHistory={monthlyGrossHistory}
      error={error}
    />
  );
}
