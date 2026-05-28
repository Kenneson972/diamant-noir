import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";
import { withCsrf } from "@/lib/security";

export const runtime = "nodejs";

export const POST = withCsrf(async (request: Request) => {
  try {
    const userId = await requireAdmin(request);

    const payload = await request.json();
    if (!payload?.name) {
      return NextResponse.json({ error: "Missing villa name" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Allow admin to choose owner_id; fallback to self if not provided
    const insertPayload: Record<string, unknown> = { ...payload };
    if (!insertPayload.owner_id) {
      insertPayload.owner_id = userId;
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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Server error" },
      { status: 500 }
    );
  }
});
