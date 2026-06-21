import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runGhostVillas } from "@/lib/proactive/ghost-villas";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const n = await runGhostVillas(supabaseAdmin());
    return NextResponse.json({ ok: true, alerted: n });
  } catch (e) {
    console.error("[cron/ghost-villas]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
