import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/villa-submissions
 * Liste les soumissions de villas — consommé par l'Agent C (outil submissions).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const { data, error } = await supabase
      .from("villa_submissions")
      .select("id, owner_name, owner_email, villa_name, location, status, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[admin/villa-submissions] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    return NextResponse.json({ submissions: data ?? [], total: (data ?? []).length });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/villa-submissions] error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
