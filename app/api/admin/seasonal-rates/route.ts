import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    await requireAdmin(request);
    const body = await request.json();
    const { villa_id, label, start_date, end_date, price_per_night } = body;

    if (!villa_id || !label || !start_date || !end_date || !price_per_night) {
      return NextResponse.json({ error: "Tous les champs sont obligatoires." }, { status: 400 });
    }

    if (end_date < start_date) {
      return NextResponse.json({ error: "La date de fin doit être après la date de début." }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Check for overlapping rates
    const { data: overlapping } = await admin
      .from("seasonal_rates")
      .select("id, label, start_date, end_date")
      .eq("villa_id", villa_id)
      .lte("start_date", end_date)
      .gte("end_date", start_date);

    if (overlapping && overlapping.length > 0) {
      const overlap = overlapping[0];
      const start = new Date(overlap.start_date).toLocaleDateString("fr-FR");
      const end = new Date(overlap.end_date).toLocaleDateString("fr-FR");
      return NextResponse.json({
        error: `Cette période chevauche une plage existante (${overlap.label} : ${start} – ${end}). Veuillez ajuster les dates.`,
        overlapping: overlap,
      }, { status: 409 });
    }

    const { data, error } = await admin
      .from("seasonal_rates")
      .insert({ villa_id, label, start_date, end_date, price_per_night: Math.round(Number(price_per_night)) })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true, rate: data }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[seasonal-rates POST]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    await requireAdmin(request);
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID requis" }, { status: 400 });

    const { error } = await supabaseAdmin().from("seasonal_rates").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[seasonal-rates DELETE]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
