import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

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

    const result = (villas || []).map((v) => ({
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
