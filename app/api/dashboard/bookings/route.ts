import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Réservations des villas du propriétaire connecté — Agent B (outil kayvila-my-bookings).
 * Auth : Bearer token Supabase. Scope dérivé de owner_id côté serveur.
 */
export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request);
    const supabase = supabaseAdmin();

    const { data: villas } = await supabase
      .from("villas")
      .select("id, name")
      .eq("owner_id", userId);

    const ids = (villas ?? []).map((v) => v.id);
    if (ids.length === 0) {
      return NextResponse.json({ bookings: [], count: 0 });
    }

    const { data, error } = await supabase
      .from("bookings")
      .select(
        "id, villa_id, start_date, end_date, status, payment_status, source, guest_name, total_price_cents, price"
      )
      .in("villa_id", ids)
      .order("start_date", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[dashboard/bookings] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const bookings = (data ?? []).map((b) => ({
      ...b,
      villa_name: b.villa_id ? nameById[b.villa_id] ?? null : null,
    }));

    return NextResponse.json(
      { bookings, count: bookings.length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[dashboard/bookings] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
