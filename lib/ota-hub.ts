/**
 * OTA Hub — Diamant Noir
 * Synchronisation multi-sources : Airbnb, Expedia, Trivago, Vrbo, Booking.com
 *
 * Tous les grands OTA exportent un flux iCal standard.
 * Ce module unifie la sync de tous les canaux pour une villa donnée.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import ical from "node-ical";

// ─── Types ────────────────────────────────────────────────────────────────────

export type OTASource =
  | "airbnb"
  | "expedia"
  | "trivago"
  | "vrbo"
  | "booking"
  | "direct";

export type OTAChannel = {
  source: OTASource;
  ical_url: string;
  label?: string; // Ex: "Airbnb Principal", "Expedia FR"
};

export type OTASyncResult = {
  source: OTASource;
  inserted: number;
  deleted: number;
  error?: string;
};

export type VillaSyncResult = {
  villaId: string;
  channels: OTASyncResult[];
  totalInserted: number;
  totalDeleted: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

const toDateOnly = (date: Date): string => date.toISOString().slice(0, 10);

/**
 * Détecte automatiquement la source OTA depuis une URL iCal.
 * Utile quand l'utilisateur colle juste une URL sans préciser la source.
 */
export const detectOTASource = (url: string): OTASource => {
  if (url.includes("airbnb.com") || url.includes("airbnb.co")) return "airbnb";
  if (url.includes("expedia.com") || url.includes("homeaway.com")) return "expedia";
  if (url.includes("trivago.com")) return "trivago";
  if (url.includes("vrbo.com")) return "vrbo";
  if (url.includes("booking.com")) return "booking";
  return "direct";
};

/**
 * Construit un external_id unique par source pour éviter les collisions
 * entre OTAs qui pourraient avoir le même UID iCal.
 */
const buildExternalId = (source: OTASource, uid: string): string =>
  `${source}_${uid}`;

// ─── Sync d'un canal OTA ──────────────────────────────────────────────────────

export const syncOTAChannel = async (
  channel: OTAChannel,
  villaId: string,
  supabase: SupabaseClient
): Promise<OTASyncResult> => {
  try {
    const events = await ical.async.fromURL(channel.ical_url);

    const rows = Object.values(events)
      .filter((event) => event.type === "VEVENT")
      .map((event) => ({
        villa_id: villaId,
        start_date: toDateOnly(event.start as Date),
        end_date: toDateOnly(event.end as Date),
        status: "confirmed",
        source: channel.source,
        guest_name: event.summary || `Réservation ${channel.label ?? channel.source}`,
        price: 0,
        external_id: buildExternalId(channel.source, event.uid as string),
      }));

    if (!rows.length) {
      return { source: channel.source, inserted: 0, deleted: 0 };
    }

    const externalIds = rows.map((r) => r.external_id);

    // Supprimer les anciennes réservations de cette source qui ne sont plus dans le flux
    const { count: deletedCount } = await supabase
      .from("bookings")
      .delete({ count: "exact" })
      .eq("villa_id", villaId)
      .eq("source", channel.source)
      .not("external_id", "in", `(${externalIds.map((id) => `'${id}'`).join(",")})`);

    // Insérer / mettre à jour les réservations actuelles
    const { error } = await supabase
      .from("bookings")
      .upsert(rows, { onConflict: "villa_id,external_id" });

    if (error) {
      return {
        source: channel.source,
        inserted: 0,
        deleted: 0,
        error: error.message,
      };
    }

    return {
      source: channel.source,
      inserted: rows.length,
      deleted: deletedCount ?? 0,
    };
  } catch (err) {
    return {
      source: channel.source,
      inserted: 0,
      deleted: 0,
      error: err instanceof Error ? err.message : "Erreur inconnue",
    };
  }
};

// ─── Sync de tous les canaux d'une villa ──────────────────────────────────────

/**
 * Synchronise tous les canaux OTA d'une villa en parallèle.
 * C'est la fonction principale à appeler depuis le cron ou le dashboard.
 */
export const syncAllOTAChannels = async (
  villaId: string,
  channels: OTAChannel[],
  supabase: SupabaseClient
): Promise<VillaSyncResult> => {
  const results = await Promise.all(
    channels.map((channel) => syncOTAChannel(channel, villaId, supabase))
  );

  return {
    villaId,
    channels: results,
    totalInserted: results.reduce((sum, r) => sum + r.inserted, 0),
    totalDeleted: results.reduce((sum, r) => sum + r.deleted, 0),
  };
};

// ─── Sync globale de toutes les villas ────────────────────────────────────────

/**
 * Sync toutes les villas qui ont des canaux OTA configurés.
 * Utilisé par le cron Vercel (/api/sync).
 *
 * Priorité : ota_channels (nouveau format) > ical_url (legacy Airbnb uniquement)
 */
export const syncAllVillasOTA = async (
  supabase: SupabaseClient
): Promise<VillaSyncResult[]> => {
  const { data: villas, error } = await supabase
    .from("villas")
    .select("id, ical_url, ota_channels");

  if (error) throw error;

  const results = await Promise.all(
    (villas ?? []).map(async (villa) => {
      let channels: OTAChannel[] = [];

      // Nouveau format : ota_channels JSONB
      if (Array.isArray(villa.ota_channels) && villa.ota_channels.length > 0) {
        channels = villa.ota_channels as OTAChannel[];
      }
      // Legacy : ical_url simple (Airbnb uniquement)
      else if (villa.ical_url) {
        channels = [
          {
            source: "airbnb",
            ical_url: villa.ical_url,
            label: "Airbnb (legacy)",
          },
        ];
      }

      if (!channels.length) {
        return {
          villaId: villa.id,
          channels: [],
          totalInserted: 0,
          totalDeleted: 0,
        };
      }

      return syncAllOTAChannels(villa.id, channels, supabase);
    })
  );

  return results;
};
