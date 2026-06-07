import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import {
  grossCentsFromBooking,
  ownerNetCents,
  platformFeeCents,
  getCommissionRate,
} from "@/lib/revenue/booking-revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CONFIRMED_STATUSES = ["confirmed", "paid"];

export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const admin = supabaseAdmin();

    const [{ data: bookings }, { data: villas }] = await Promise.all([
      admin
        .from("bookings")
        .select(
          "id, villa_id, start_date, status, payment_status, price, cleaning_fee, service_fee, total_price_cents, source, villas(name, commission_rate)"
        )
        .in("status", CONFIRMED_STATUSES)
        .order("start_date", { ascending: false }),
      admin.from("villas").select("id, name, commission_rate"),
    ]);

    const rows = bookings ?? [];
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
      .toISOString()
      .slice(0, 10);
    const yearStart = new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);

    const rateFor = (b: (typeof rows)[0]) =>
      (b.villas as { commission_rate?: number } | null)?.commission_rate ?? 25;

    const sumGross = (list: typeof rows) =>
      list.reduce((s, b) => s + grossCentsFromBooking(b), 0);
    const sumPlatform = (list: typeof rows) =>
      list.reduce((s, b) => s + platformFeeCents(b, (b as any).source ?? null), 0);
    const sumOwner = (list: typeof rows) =>
      list.reduce((s, b) => s + ownerNetCents(b, (b as any).source ?? null), 0);

    const monthRows = rows.filter((b) => b.start_date >= monthStart);
    const yearRows = rows.filter((b) => b.start_date >= yearStart);

    const byMonth: Record<string, number> = {};
    for (const b of rows) {
      const key = String(b.start_date ?? "").slice(0, 7);
      if (!key) continue;
      byMonth[key] = (byMonth[key] ?? 0) + grossCentsFromBooking(b) / 100;
    }
    const monthlyData = Object.entries(byMonth)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-12)
      .map(([month, revenue]) => ({ month, revenue: Math.round(revenue) }));

    const villaNameById = Object.fromEntries(
      (villas ?? []).map((v) => [v.id, v.name])
    );
    const villaRevenue: Record<
      string,
      { name: string; gross: number; platform: number; owner: number; count: number }
    > = {};

    for (const b of rows) {
      const vid = b.villa_id;
      if (!vid) continue;
      if (!villaRevenue[vid]) {
        villaRevenue[vid] = {
          name:
            (b.villas as { name?: string } | null)?.name ??
            villaNameById[vid] ??
            vid.slice(0, 8),
          gross: 0,
          platform: 0,
          owner: 0,
          count: 0,
        };
      }
      villaRevenue[vid].gross += grossCentsFromBooking(b);
      villaRevenue[vid].platform += platformFeeCents(b, (b as any).source ?? null);
      villaRevenue[vid].owner += ownerNetCents(b, (b as any).source ?? null);
      villaRevenue[vid].count += 1;
      if (!(villaRevenue[vid] as any).sourceCounts) (villaRevenue[vid] as any).sourceCounts = {};
      const src = ((b as any).source) ?? 'direct';
      (villaRevenue[vid] as any).sourceCounts[src] = ((villaRevenue[vid] as any).sourceCounts[src] ?? 0) + 1;
    }

    const SOURCE_LABELS: Record<string, string> = {
      airbnb: 'Airbnb', expedia: 'Expedia', trivago: 'Trivago',
      vrbo: 'Vrbo', booking: 'Booking', ical: 'iCal',
      direct: 'Direct', manual: 'Manuel', admin: 'Admin',
    };

    const byVilla = Object.values(villaRevenue)
      .sort((a, b) => b.gross - a.gross)
      .map((v) => {
        const entries = Object.entries((v as any).sourceCounts ?? {}) as [string, number][];
        const dominantSource = entries.sort((a, b) => b[1] - a[1])[0]?.[0] ?? 'direct';
        return {
          ...v,
          dominantSource: SOURCE_LABELS[dominantSource] ?? dominantSource,
          commissionRate: getCommissionRate(dominantSource),
        };
      });

    const { count: totalBookings } = await admin
      .from("bookings")
      .select("*", { count: "exact", head: true });

    return NextResponse.json({
      stats: {
        monthGross: sumGross(monthRows),
        yearGross: sumGross(yearRows),
        allTimeGross: sumGross(rows),
        allTimePlatform: sumPlatform(rows),
        allTimeOwner: sumOwner(rows),
        total: totalBookings ?? rows.length,
        avg: rows.length > 0 ? Math.round(sumGross(rows) / rows.length) : 0,
      },
      monthlyData,
      byVilla,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/revenue]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
