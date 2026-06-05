import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Toutes les réservations de la plateforme — Agent C (outil kayvila-all-bookings).
 * Auth : Bearer token Supabase d'un compte admin (requireAdmin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const [{ data: bookings, error }, { data: villas }] = await Promise.all([
      supabase
        .from("bookings")
        .select(
          "id, villa_id, start_date, end_date, status, payment_status, source, guest_name, total_price_cents, price"
        )
        .order("start_date", { ascending: false })
        .limit(100),
      supabase.from("villas").select("id, name"),
    ]);

    if (error) {
      console.error("[admin/bookings] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const rows = (bookings ?? []).map((b) => ({
      ...b,
      villa_name: b.villa_id ? nameById[b.villa_id] ?? null : null,
    }));

    return NextResponse.json(
      { bookings: rows, count: rows.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/bookings] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
