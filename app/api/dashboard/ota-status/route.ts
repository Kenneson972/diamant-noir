import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Santé des synchronisations OTA des villas du propriétaire — Agent B (outil kayvila-ota-status).
 * S'appuie sur ota_sync_logs (dernière synchro + erreur éventuelle par villa).
 */
export async function GET(request: Request) {
  try {
    const userId = await requireAuth(request);
    const supabase = supabaseAdmin();

    const { data: villas } = await supabase
      .from("villas")
      .select("id, name")
      .eq("owner_id", userId);

    const ids = (villas ?? []).map((v) => v.id);
    if (ids.length === 0) {
      return NextResponse.json({ ota: [], count: 0 });
    }

    const { data, error } = await supabase
      .from("ota_sync_logs")
      .select("villa_id, source, total_inserted, total_deleted, error, created_at")
      .in("villa_id", ids)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("[dashboard/ota-status] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    // Dernier log par (villa, source)
    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const latest = new Map<string, Record<string, unknown>>();
    for (const log of data ?? []) {
      const key = `${log.villa_id}:${log.source}`;
      if (!latest.has(key)) {
        latest.set(key, {
          villa_id: log.villa_id,
          villa_name: log.villa_id ? nameById[log.villa_id] ?? null : null,
          source: log.source,
          last_synced_at: log.created_at,
          last_error: log.error ?? null,
          healthy: !log.error,
        });
      }
    }

    return NextResponse.json(
      { ota: Array.from(latest.values()), count: latest.size },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[dashboard/ota-status] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
