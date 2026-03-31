import type { SupabaseClient } from "@supabase/supabase-js";
import ical from "node-ical";

const toDateOnly = (date: Date) => date.toISOString().slice(0, 10);

type SyncOptions = {
  icalUrl: string;
  villaId: string | null;
  supabase: SupabaseClient;
};

export const syncAirbnbICal = async ({
  icalUrl,
  villaId,
  supabase,
}: SyncOptions) => {
  const events = await ical.async.fromURL(icalUrl);
  const rows = Object.values(events)
    .filter((event) => event.type === "VEVENT")
    .map((event) => ({
      villa_id: villaId,
      start_date: toDateOnly(event.start as Date),
      end_date: toDateOnly(event.end as Date),
      status: "confirmed",
      source: "airbnb",
      guest_name: event.summary || "Réservation Airbnb",
      price: 0,
      external_id: event.uid, // On stocke l'ID unique d'Airbnb
    }));

  if (!rows.length) {
    // Si Airbnb est vide, on supprime peut-être les anciens bookings airbnb ?
    // Pour l'instant on ne fait rien pour éviter les erreurs de vidage massif
    return { inserted: 0 };
  }

  // 1. Supprimer les anciens bookings Airbnb de cette villa qui ne sont plus dans le flux
  const externalIds = rows.map(r => r.external_id);
  await supabase
    .from("bookings")
    .delete()
    .eq("villa_id", villaId)
    .eq("source", "airbnb")
    .not("external_id", "in", `(${externalIds.join(',')})`);

  // 2. Insérer/Mettre à jour les nouveaux
  const { error } = await supabase
    .from("bookings")
    .upsert(rows, { onConflict: "villa_id,external_id" });

  if (error) {
    throw error;
  }

  return { inserted: rows.length };
};
