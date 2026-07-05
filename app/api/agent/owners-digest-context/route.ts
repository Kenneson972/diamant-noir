// app/api/agent/owners-digest-context/route.ts
// GET — contexte digest quotidien pour le cron n8n (Bot B, 8h Martinique).
// Auth : Authorization: Bearer ${OWNERS_DIGEST_SECRET} (secret partagé, variable d'env).

import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPack } from "@/lib/owner-assistant-context";
import { buildOwnerDigestItem, type OwnerDigestItem } from "@/lib/owner-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.OWNERS_DIGEST_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !bearer || bearer !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();

  // Propriétaires = owner_id distincts des villas publiées
  const { data: villaOwners, error } = await admin
    .from("villas")
    .select("owner_id")
    .not("owner_id", "is", null);
  if (error) {
    console.error("[owners-digest] villas", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const ownerIds = [...new Set((villaOwners ?? []).map((v) => String(v.owner_id)))].slice(0, 50);
  const owners: OwnerDigestItem[] = [];
  for (const ownerId of ownerIds) {
    try {
      const pack = await buildOwnerContextPack(admin, ownerId);
      if (pack.portfolio.total_villas > 0) owners.push(buildOwnerDigestItem(ownerId, pack));
    } catch (e) {
      console.warn("[owners-digest] owner skipped", ownerId, e);
    }
  }

  return NextResponse.json({ current_date_iso: new Date().toISOString(), owners });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
