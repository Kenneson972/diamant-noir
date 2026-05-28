import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Toutes les villas de la plateforme — Agent C (contexte admin + outil kayvila-all-villas).
 * Auth : Bearer token Supabase d'un compte admin (requireAdmin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("villas")
      .select(
        "id, name, slug, location, capacity, price_per_night, is_published, owner_id, commission_rate, created_at"
      )
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/villas] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json(
      { villas: data ?? [], count: data?.length ?? 0 },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/villas] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
