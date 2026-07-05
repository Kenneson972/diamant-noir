import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runOwnerDailyDigest } from "@/lib/proactive/owner-daily-digest";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const n = await runOwnerDailyDigest(supabaseAdmin());
    return NextResponse.json({ ok: true, digestCount: n });
  } catch (e) {
    console.error("[cron/owner-daily-digest]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
