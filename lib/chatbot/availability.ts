// lib/chatbot/availability.ts
// Pré-calcul des disponibilités villas pour le chatbot visiteur (A1).
// Zéro requête DB par message : la map est construite avec un cache mémoire ~5 min.

import { supabaseAdmin } from "@/lib/supabase";

export type RawBooking = { villa_id: string; start_date: string; end_date: string };
export type RawBlock = { villa_id: string; start_date: string; end_date: string };

export type VillaAvailability = {
  villaId: string;
  bookedRanges: { start: string; end: string }[]; // half-open [start, end)
  nextAvailableFrom: string | null;
  isAvailableNow: boolean;
};

function addOneDay(d: string): string {
  return new Date(Date.parse(d) + 86_400_000).toISOString().slice(0, 10);
}

/** Logique pure et testable : agrège bookings + blocks en disponibilités par villa. */
export function buildAvailabilityMap(
  bookings: RawBooking[],
  blocks: RawBlock[],
  today: string
): Map<string, VillaAvailability> {
  const byVilla = new Map<string, { start: string; end: string }[]>();

  const push = (villaId: string, start: string, end: string) => {
    if (!villaId || !start || !end) return;
    const arr = byVilla.get(villaId) ?? [];
    arr.push({ start, end });
    byVilla.set(villaId, arr);
  };

  for (const b of bookings) push(b.villa_id, b.start_date, b.end_date);
  for (const bl of blocks) push(bl.villa_id, bl.start_date, addOneDay(bl.end_date));

  const result = new Map<string, VillaAvailability>();
  for (const [villaId, rangesRaw] of byVilla) {
    const ranges = rangesRaw
      .slice()
      .sort((a, b) => a.start.localeCompare(b.start));

    const occupiedNow = ranges.find((r) => r.start <= today && r.end > today);
    const isAvailableNow = !occupiedNow;
    const nextAvailableFrom = occupiedNow ? occupiedNow.end : today;

    result.set(villaId, {
      villaId,
      bookedRanges: ranges,
      nextAvailableFrom,
      isAvailableNow,
    });
  }
  return result;
}

// ─── Cache mémoire ~5 min ──────────────────────────────────────────────────────
let _cache: { map: Map<string, VillaAvailability>; at: number } | null = null;
const TTL_MS = 5 * 60_000;

/** Charge bookings + blocks et renvoie la map de dispos (cache 5 min). */
export async function getVillaAvailabilityCached(): Promise<Map<string, VillaAvailability>> {
  if (_cache && Date.now() - _cache.at < TTL_MS) return _cache.map;

  const today = new Date().toISOString().slice(0, 10);
  const admin = supabaseAdmin();

  const [bRes, blRes] = await Promise.all([
    admin
      .from("bookings")
      .select("villa_id, start_date, end_date, status, payment_status")
      .gte("end_date", today),
    admin
      .from("villa_date_blocks")
      .select("villa_id, start_date, end_date")
      .gte("end_date", today),
  ]);

  const bookings = (bRes.data ?? [])
    .filter(
      (b: Record<string, unknown>) =>
        b.status === "confirmed" || b.payment_status === "paid"
    )
    .map((b: Record<string, unknown>) => ({
      villa_id: String(b.villa_id ?? ""),
      start_date: String(b.start_date ?? ""),
      end_date: String(b.end_date ?? ""),
    }));

  const blocks = (blRes.data ?? []).map((b: Record<string, unknown>) => ({
    villa_id: String(b.villa_id ?? ""),
    start_date: String(b.start_date ?? ""),
    end_date: String(b.end_date ?? ""),
  }));

  const map = buildAvailabilityMap(bookings, blocks, today);
  _cache = { map, at: Date.now() };
  return map;
}
