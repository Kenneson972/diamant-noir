import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { villaId, eventType } = body;
    if (!villaId || !eventType) {
      return NextResponse.json({ error: "villaId and eventType required" }, { status: 400 });
    }
    const allowed = ["view", "click", "booking"];
    if (!allowed.includes(eventType)) {
      return NextResponse.json({ error: "Invalid eventType" }, { status: 400 });
    }

    let supabase;
    try {
      supabase = supabaseAdmin();
    } catch {
      // Service role key non configuré — analytics silencieusement ignoré
      return NextResponse.json({ success: true, skipped: "not_configured" });
    }

    const { error } = await supabase.from("villa_events").insert({
      villa_id: villaId,
      event_type: eventType,
    });

    if (error) {
      // Table villa_events peut ne pas exister encore — ne pas crasher
      console.warn("villa_events insert skipped:", error.message);
      return NextResponse.json({ success: true, skipped: error.message });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Analytics villa API error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
