import { NextResponse, type NextRequest } from "next/server";
import { getUserFromRequest } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { checkCsrf } from "@/lib/security";

export const runtime = "nodejs";

/**
 * GET /api/dashboard/proactive-notifications
 * Returns the latest unread daily digest for the authenticated owner.
 */
export async function GET(request: NextRequest) {
  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const admin = supabaseAdmin();
    const { data, error } = await admin
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("type", "owner_daily_digest")
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[proactive-notifications] GET select error", error);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 },
      );
    }

    const notification = data?.length ? data[0] : null;
    return NextResponse.json({ notification });
  } catch (err) {
    console.error("[proactive-notifications] GET", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 },
    );
  }
}

/**
 * PATCH /api/dashboard/proactive-notifications
 * Body: { id } — marks the notification as read.
 * Verifies the notification belongs to the authenticated user.
 */
export async function PATCH(request: NextRequest) {
  const csrf = checkCsrf(request);
  if (csrf) return csrf;

  try {
    const { user } = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const id = typeof body.id === "string" ? body.id : null;
    if (!id) {
      return NextResponse.json({ error: "id requis" }, { status: 400 });
    }

    const admin = supabaseAdmin();

    // Vérifier l'appartenance (propriétaire = propriétaire de la notif)
    const { data: existing } = await admin
      .from("notifications")
      .select("id, user_id")
      .eq("id", id)
      .eq("type", "owner_daily_digest")
      .maybeSingle();

    if (!existing) {
      return NextResponse.json(
        { error: "Notification introuvable" },
        { status: 404 },
      );
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { error: updateError } = await admin
      .from("notifications")
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq("id", id);

    if (updateError) {
      console.error("[proactive-notifications] PATCH update error", updateError);
      return NextResponse.json(
        { error: "Erreur serveur" },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[proactive-notifications] PATCH", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 },
    );
  }
}
