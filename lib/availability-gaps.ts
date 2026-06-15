// lib/availability-gaps.ts
// Détection de fenêtres libres dans un calendrier d'occupation.
// Plages half-open : [start, end) — end = jour de départ (villa libre ce jour-là).

export type DateRange = { start: string; end: string };
export type Gap = { start: string; end: string; nights: number };

function diffNights(start: string, end: string): number {
  const ms = Date.parse(end) - Date.parse(start);
  return Math.round(ms / 86_400_000);
}

/**
 * Retourne les fenêtres libres ≥ minNights dans [from, to),
 * compte tenu des plages occupées (fusionnées si chevauchantes).
 */
export function findGaps(
  occupied: DateRange[],
  from: string,
  to: string,
  minNights: number
): Gap[] {
  const ranges = occupied
    .filter((r) => r.end > from && r.start < to)
    .map((r) => ({
      start: r.start < from ? from : r.start,
      end: r.end > to ? to : r.end,
    }))
    .sort((a, b) => a.start.localeCompare(b.start));

  const merged: DateRange[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r.start <= last.end) {
      if (r.end > last.end) last.end = r.end;
    } else {
      merged.push({ ...r });
    }
  }

  const gaps: Gap[] = [];
  let cursor = from;
  for (const r of merged) {
    if (r.start > cursor) {
      const nights = diffNights(cursor, r.start);
      if (nights >= minNights) gaps.push({ start: cursor, end: r.start, nights });
    }
    if (r.end > cursor) cursor = r.end;
  }
  if (cursor < to) {
    const nights = diffNights(cursor, to);
    if (nights >= minNights) gaps.push({ start: cursor, end: to, nights });
  }
  return gaps;
}
