import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireAdmin, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Santé globale des synchronisations OTA (toutes villas) — Agent C (outil kayvila-ota-all).
 * Dernier log par (villa, source) depuis ota_sync_logs. Auth : admin (requireAdmin).
 */
export async function GET(request: Request) {
  try {
    await requireAdmin(request);
    const supabase = supabaseAdmin();

    const [{ data: logs, error }, { data: villas }] = await Promise.all([
      supabase
        .from("ota_sync_logs")
        .select("villa_id, source, total_inserted, total_deleted, error, created_at")
        .order("created_at", { ascending: false })
        .limit(300),
      supabase.from("villas").select("id, name"),
    ]);

    if (error) {
      console.error("[admin/ota-status] query failed", error);
      return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
    }

    const nameById = Object.fromEntries((villas ?? []).map((v) => [v.id, v.name]));
    const latest = new Map<string, Record<string, unknown>>();
    for (const log of logs ?? []) {
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

    const ota = Array.from(latest.values());
    return NextResponse.json(
      { ota, count: ota.length, with_errors: ota.filter((o) => !o.healthy).length },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("[admin/ota-status] error", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
