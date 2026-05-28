import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { isStaffAdmin } from "@/lib/auth/admin-access";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const supabase = supabaseAdmin();
    const { data: userData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !userData?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = userData.user.id;

    // Check if admin
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = isStaffAdmin(
      profile?.role ?? null,
      userData.user.user_metadata?.role as string | undefined,
      userData.user.email
    );

    // Get owner's villa IDs if not admin
    let ownerVillaIds: string[] = [];
    if (!isAdmin) {
      const { data: ownerVillas } = await supabase
        .from("villas")
        .select("id")
        .eq("owner_id", userId);
      ownerVillaIds = (ownerVillas || []).map((v) => v.id);
    }

    const [eventsRes, villasRes, bookingsRes] = await Promise.all([
      supabase.from("villa_events").select("villa_id, event_type, created_at"),
      supabase.from("villas").select("id, name"),
      supabase.from("bookings").select("villa_id, price, status"),
    ]);

    if (eventsRes.error) {
      return NextResponse.json({ error: eventsRes.error.message }, { status: 500 });
    }

    const events = eventsRes.data;

    const byVilla: Record<string, { views: number; clicks: number; bookings: number }> = {};
    for (const e of events || []) {
      if (!e.villa_id) continue;
      if (!byVilla[e.villa_id]) {
        byVilla[e.villa_id] = { views: 0, clicks: 0, bookings: 0 };
      }
      if (e.event_type === "view") byVilla[e.villa_id].views++;
      else if (e.event_type === "click") byVilla[e.villa_id].clicks++;
      else if (e.event_type === "booking") byVilla[e.villa_id].bookings++;
    }

    const villas = villasRes.data;
    const bookings = bookingsRes.data;

    const revenueByVilla: Record<string, number> = {};
    for (const b of bookings || []) {
      if (b.status !== "confirmed" && b.status !== "paid") continue;
      const vid = b.villa_id;
      if (!vid) continue;
      revenueByVilla[vid] = (revenueByVilla[vid] || 0) + Number(b.price || 0);
    }

    // Filter by owner_id for non-admin users
    const filteredVillas = isAdmin
      ? (villas || [])
      : (villas || []).filter((v) => ownerVillaIds.includes(v.id));

    const result = filteredVillas.map((v) => ({
      villaId: v.id,
      villaName: v.name,
      views: byVilla[v.id]?.views ?? 0,
      clicks: byVilla[v.id]?.clicks ?? 0,
      bookings: byVilla[v.id]?.bookings ?? 0,
      revenue: revenueByVilla[v.id] ?? 0,
    }));

    return NextResponse.json(result);
  } catch (error) {
    console.error("Analytics villas error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
