import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncAllVillasOTA } from "@/lib/ota-hub";
import { verifyApiKey } from "@/lib/auth/server";
import { getSupabaseServer } from "@/lib/supabase-server";
import { isStaffAdmin } from "@/lib/auth/admin-access";

export const runtime = "nodejs";

async function isAuthorized(request: Request): Promise<boolean> {
  if (verifyApiKey(request)) return true;

  try {
    const supabase = await getSupabaseServer();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();

    return isStaffAdmin(profile?.role ?? null, null, user.email ?? null);
  } catch {
    return false;
  }
}

export async function GET(request: Request) {
  try {
    if (!(await isAuthorized(request))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      return NextResponse.json({ synced: 0, results: [] });
    }

    const supabase = supabaseAdmin();
    const results = await syncAllVillasOTA(supabase);

    const syncedCount = results.filter(
      (r) => r.channels.length > 0
    ).length;

    const totalInserted = results.reduce((s, r) => s + r.totalInserted, 0);
    const totalDeleted = results.reduce((s, r) => s + r.totalDeleted, 0);
    const errors = results
      .flatMap((r) => r.channels)
      .filter((c) => c.error)
      .map((c) => ({ source: c.source, error: c.error }));

    return NextResponse.json({
      synced: syncedCount,
      totalInserted,
      totalDeleted,
      errors: errors.length > 0 ? errors : undefined,
      results,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync failed" },
      { status: 500 }
    );
  }
}
