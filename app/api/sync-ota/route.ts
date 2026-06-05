import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncAllOTAChannels, detectOTASource, type OTAChannel } from "@/lib/ota-hub";
import { checkRateLimit, ipFromRequest } from "@/lib/security";
import { requireAuth, AuthError } from "@/lib/auth/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!checkRateLimit(`sync-ota:${ipFromRequest(req)}`, 10, 60_000)) {
    return NextResponse.json({ error: "Trop de requêtes" }, { status: 429 });
  }

  try {
    const userId = await requireAuth(req);

    const { villaId, channels, addUrl } = await req.json();

    if (!villaId) {
      return NextResponse.json({ error: "villaId requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    const { data: villa, error: villaError } = await supabase
      .from("villas")
      .select("id, owner_id, ical_url, ota_channels")
      .eq("id", villaId)
      .single();

    if (villaError || !villa) {
      return NextResponse.json({ error: "Villa introuvable" }, { status: 404 });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    const isAdmin = profile?.role === "admin";
    if (!isAdmin && villa.owner_id !== userId) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    // Cas 1 : ajout d'un URL unique (auto-détection OTA)
    if (addUrl) {
      const source = detectOTASource(addUrl);
      const newChannel: OTAChannel = {
        source,
        ical_url: addUrl,
        label: source.charAt(0).toUpperCase() + source.slice(1),
      };

      const existing: OTAChannel[] = Array.isArray(villa.ota_channels)
        ? villa.ota_channels
        : [];

      const isDuplicate = existing.some(
        (c) => c.source === source && c.ical_url === addUrl
      );

      if (!isDuplicate) {
        const updated = [...existing, newChannel];
        await supabase
          .from("villas")
          .update({ ota_channels: updated })
          .eq("id", villaId);
      }

      const result = await syncAllOTAChannels(villaId, [newChannel], supabase);
      return NextResponse.json({ added: !isDuplicate, ...result });
    }

    // Cas 2 : sync de canaux fournis explicitement
    if (channels && Array.isArray(channels)) {
      await supabase
        .from("villas")
        .update({ ota_channels: channels })
        .eq("id", villaId);

      const result = await syncAllOTAChannels(villaId, channels, supabase);
      return NextResponse.json(result);
    }

    // Cas 3 : sync des canaux existants de la villa
    let activeChannels: OTAChannel[] = [];
    if (Array.isArray(villa.ota_channels) && villa.ota_channels.length > 0) {
      activeChannels = villa.ota_channels;
    } else if (villa.ical_url) {
      activeChannels = [{ source: "airbnb", ical_url: villa.ical_url }];
    }

    if (!activeChannels.length) {
      return NextResponse.json({
        villaId,
        channels: [],
        totalInserted: 0,
        totalDeleted: 0,
        message: "Aucun canal OTA configuré pour cette villa",
      });
    }

    const result = await syncAllOTAChannels(villaId, activeChannels, supabase);
    return NextResponse.json(result);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync OTA failed" },
      { status: 500 }
    );
  }
}
