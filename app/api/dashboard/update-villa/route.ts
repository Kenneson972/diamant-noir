import { NextResponse } from "next/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const supabase = await getSupabaseServer();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { villaId, payload } = await request.json();
    if (!villaId || !payload) {
      return NextResponse.json({ error: "Missing villaId or payload" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Verify villa exists and check ownership
    const { data: villa, error: villaError } = await admin
      .from("villas")
      .select("id, owner_id")
      .eq("id", villaId)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    if (villa.owner_id && villa.owner_id !== user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Update via supabaseAdmin (bypass RLS, but we already checked ownership)
    const { data, error } = await admin
      .from("villas")
      .update(payload)
      .eq("id", villaId)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
