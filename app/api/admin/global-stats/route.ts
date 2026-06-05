import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import {
  grossCentsFromBooking,
  platformFeeCents,
} from "@/lib/revenue/booking-revenue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Statistiques globales plateforme (revenus Stripe, occupation, soumissions) — Agent C.
 * Auth : Bearer token Supabase d'un compte admin (requireAdmin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const [villasRes, bookingsRes, submissionsRes] = await Promise.all([
      supabase.from("villas").select("id, is_published"),
      supabase
        .from("bookings")
        .select(
          "total_price_cents, price, cleaning_fee, service_fee, status, payment_status, start_date"
        ),
      supabase.from("villa_submissions").select("id, status"),
    ]);

    const villas = villasRes.data ?? [];
    const bookings = bookingsRes.data ?? [];
    const submissions = submissionsRes.data ?? [];

    const now = new Date();
    const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const isPaid = (b: { status: string; payment_status: string }) =>
      b.status === "confirmed" || b.status === "paid" || b.payment_status === "paid";

    const paid = bookings.filter(isPaid);
    const revenueTotalCents = paid.reduce((s, b) => s + grossCentsFromBooking(b), 0);
    const platformTotalCents = paid.reduce((s, b) => s + platformFeeCents(b), 0);
    const revenueCurrentMonthCents = paid
      .filter((b) => String(b.start_date ?? "").startsWith(monthKey))
      .reduce((s, b) => s + grossCentsFromBooking(b), 0);
    const platformCurrentMonthCents = paid
      .filter((b) => String(b.start_date ?? "").startsWith(monthKey))
      .reduce((s, b) => s + platformFeeCents(b), 0);

    return NextResponse.json(
      {
        villas: {
          total: villas.length,
          published: villas.filter((v) => v.is_published).length,
        },
        bookings: {
          total: bookings.length,
          paid: bookings.filter(isPaid).length,
          pending: bookings.filter((b) => b.status === "pending").length,
        },
        revenue: {
          total_cents: revenueTotalCents,
          total_eur: Math.round(revenueTotalCents / 100),
          platform_cents: platformTotalCents,
          platform_eur: Math.round(platformTotalCents / 100),
          current_month_cents: revenueCurrentMonthCents,
          current_month_eur: Math.round(revenueCurrentMonthCents / 100),
          current_month_platform_cents: platformCurrentMonthCents,
          current_month_platform_eur: Math.round(platformCurrentMonthCents / 100),
        },
        submissions: {
          total: submissions.length,
          pending: submissions.filter((s) => s.status === "pending").length,
        },
        generated_at: now.toISOString(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/global-stats] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
