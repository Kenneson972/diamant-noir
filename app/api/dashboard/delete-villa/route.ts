import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth/server";
import { isStaffAdmin } from "@/lib/auth/admin-access";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const { villaId } = await request.json();
    if (!villaId) {
      return NextResponse.json({ error: "Missing villaId" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: villa, error: villaError } = await admin
      .from("villas")
      .select("owner_id")
      .eq("id", villaId)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa not found" }, { status: 404 });
    }

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = isStaffAdmin(profile?.role, user.email);
    const isOwner = villa.owner_id === user.id;

    if (!isAdmin && !isOwner) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { error: deleteError } = await admin
      .from("villas")
      .delete()
      .eq("id", villaId);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
