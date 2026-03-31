import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { syncAllOTAChannels, detectOTASource, type OTAChannel } from "@/lib/ota-hub";

export const runtime = "nodejs";

/**
 * POST /api/sync-ota
 * Sync manuelle d'une villa spécifique depuis le dashboard.
 * Permet aussi d'ajouter un nouveau canal OTA à la volée.
 *
 * Body :
 * {
 *   villaId: string,
 *   channels?: OTAChannel[]       // Si fourni, remplace les canaux existants
 *   addUrl?: string               // Ajoute un seul URL (auto-détection de la source)
 * }
 */
export async function POST(req: Request) {
  try {
    const { villaId, channels, addUrl } = await req.json();

    if (!villaId) {
      return NextResponse.json({ error: "villaId requis" }, { status: 400 });
    }

    const supabase = supabaseAdmin();

    // Cas 1 : ajout d'un URL unique (auto-détection OTA)
    if (addUrl) {
      const source = detectOTASource(addUrl);
      const newChannel: OTAChannel = {
        source,
        ical_url: addUrl,
        label: source.charAt(0).toUpperCase() + source.slice(1),
      };

      // Récupérer les canaux existants
      const { data: villa } = await supabase
        .from("villas")
        .select("ota_channels")
        .eq("id", villaId)
        .single();

      const existing: OTAChannel[] = Array.isArray(villa?.ota_channels)
        ? villa.ota_channels
        : [];

      // Éviter les doublons (même source + même URL)
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

      // Sync immédiate du nouveau canal
      const result = await syncAllOTAChannels(villaId, [newChannel], supabase);
      return NextResponse.json({ added: !isDuplicate, ...result });
    }

    // Cas 2 : sync de canaux fournis explicitement
    if (channels && Array.isArray(channels)) {
      // Sauvegarder dans Supabase
      await supabase
        .from("villas")
        .update({ ota_channels: channels })
        .eq("id", villaId);

      const result = await syncAllOTAChannels(villaId, channels, supabase);
      return NextResponse.json(result);
    }

    // Cas 3 : sync des canaux existants de la villa
    const { data: villa, error } = await supabase
      .from("villas")
      .select("ical_url, ota_channels")
      .eq("id", villaId)
      .single();

    if (error || !villa) {
      return NextResponse.json({ error: "Villa introuvable" }, { status: 404 });
    }

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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Sync OTA failed" },
      { status: 500 }
    );
  }
}
