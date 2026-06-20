import { NextResponse, type NextRequest } from "next/server";
import { verifyApiKey } from "@/lib/auth/server";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPackCached } from "@/lib/owner-assistant-context";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";

export const runtime = "nodejs";

/**
 * GET /api/agent/owners-digest-context
 * Internal endpoint for n8n cron — returns context for each active owner
 * who hasn't received a daily digest yet today (Martinique timezone).
 * Auth: Bearer <CRON_API_KEY>
 */
export async function GET(request: NextRequest) {
  if (!verifyApiKey(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const admin = supabaseAdmin();

    // Date d'aujourd'hui en timezone Martinique (UTC-4)
    const mqNow = new Date(
      new Date().toLocaleString("en-US", { timeZone: "America/Martinique" })
    );
    const mqToday = mqNow.toISOString().split("T")[0]; // "2026-06-20"

    // Récupérer tous les propriétaires actifs
    const { data: owners, error: ownersError } = await admin
      .from("profiles")
      .select("id, email")
      .eq("role", "owner");

    if (ownersError || !owners?.length) {
      console.warn("[owners-digest-context] No owners found", ownersError);
      return NextResponse.json({ owners: [] });
    }

    // Récupérer l'ensemble des owners déjà traités aujourd'hui
    const { data: alreadyDone } = await admin
      .from("notifications")
      .select("user_id")
      .eq("type", "owner_daily_digest")
      .gte(
        "created_at",
        `${mqToday}T00:00:00.000-04:00` // début du jour Martinique
      );

    const doneIds = new Set((alreadyDone ?? []).map((r) => r.user_id));

    // Construire le contexte pour chaque owner non encore traité
    const results: Array<{ owner_id: string; context: OwnerContextPack }> = [];
    for (const owner of owners) {
      if (doneIds.has(owner.id)) continue;

      try {
        const pack = await buildOwnerContextPackCached(admin, owner.id);
        results.push({ owner_id: owner.id, context: pack });
      } catch (err) {
        console.error(
          `[owners-digest-context] Failed for owner ${owner.id}`,
          err
        );
      }
    }

    return NextResponse.json({ owners: results });
  } catch (err) {
    console.error("[owners-digest-context] Internal error", err);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
