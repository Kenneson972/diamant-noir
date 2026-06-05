import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Villas du propriétaire connecté — consommé par l'Agent B (outil kayvila-my-villas).
 * Auth : Bearer token Supabase (le serveur dérive owner_id, ne fait pas confiance à un param d'URL).
 */
export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request);
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("villas")
      .select(
        "id, name, slug, location, capacity, price_per_night, is_published, commission_rate, created_at"
      )
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[dashboard/villas] query failed", error);
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
    console.error("[dashboard/villas] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
