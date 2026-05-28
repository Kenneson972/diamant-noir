import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const authHeader = request.headers.get("authorization") || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload?.name) {
      return NextResponse.json({ error: "Missing villa name" }, { status: 400 });
    }

    const admin = supabaseAdmin();
    const { data: userData, error: userError } = await admin.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Seul l'admin peut créer une villa
    const role = userData.user.user_metadata?.role;
    if (role !== "admin") {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    // Allow admin to choose owner_id; fallback to self if not provided
    const insertPayload: Record<string, unknown> = { ...payload };
    if (!insertPayload.owner_id) {
      insertPayload.owner_id = userData.user.id;
    }

    const { data, error } = await admin
      .from("villas")
      .insert(insertPayload)
      .select("*")
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    await admin.from("admin_chat_logs").insert({
      message: `Création villa ${data?.id || ""}`,
      intent: "dashboard_create_villa",
      action: "CREATE",
      response: "Villa créée",
      success: true,
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
}
