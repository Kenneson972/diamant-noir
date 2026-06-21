import { NextResponse } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { runPendingSubmissions } from "@/lib/proactive/pending-submissions";

export const runtime = "nodejs";

export async function GET(request: Request) {
  if (!verifyApiKey(request)) return new NextResponse("Unauthorized", { status: 401 });
  try {
    const n = await runPendingSubmissions(supabaseAdmin());
    return NextResponse.json({ ok: true, alerted: n });
  } catch (e) {
    console.error("[cron/pending-submissions]", e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
