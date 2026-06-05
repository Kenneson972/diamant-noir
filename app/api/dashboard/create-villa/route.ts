import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getSessionUser } from "@/lib/auth/server";
import { isStaffAdmin } from "@/lib/auth/admin-access";
import { withCsrf } from "@/lib/security";

export const runtime = "nodejs";

export const POST = withCsrf(async (request: Request) => {
  try {
    const user = await getSessionUser(request);

    if (!user) {
      return NextResponse.json({ error: "Non connecté" }, { status: 401 });
    }

    const payload = await request.json();
    if (!payload?.name) {
      return NextResponse.json({ error: "Missing villa name" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    const { data: profile } = await admin
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = isStaffAdmin(
      profile?.role,
      user.user_metadata?.role as string | undefined,
      user.email
    );

    const insertPayload: Record<string, unknown> = { ...payload };

    if (isAdmin) {
      if (!insertPayload.owner_id) {
        insertPayload.owner_id = user.id;
      }
    } else {
      insertPayload.owner_id = user.id;
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
});
