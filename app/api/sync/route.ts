import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncAllVillasOTA } from "@/lib/ota-hub";

export const runtime = "nodejs";

/**
 * GET /api/sync
 * Cron Vercel (toutes les heures) — synchronise tous les canaux OTA de toutes les villas.
 * Compatible legacy (ical_url Airbnb uniquement) ET nouveau format (ota_channels JSONB).
 */
export async function GET() {
  try {
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
