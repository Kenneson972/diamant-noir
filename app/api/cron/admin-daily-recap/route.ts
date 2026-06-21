import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runDailyRecap } from "@/lib/proactive/daily-recap";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const n = await runDailyRecap(supabaseAdmin());
    return NextResponse.json({ ok: true, signalCount: n });
  } catch (e) {
    console.error("[cron/admin-daily-recap]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
