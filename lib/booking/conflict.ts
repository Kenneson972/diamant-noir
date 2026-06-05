/** Chevauchement strict : [start, end) — end = jour de départ (non inclus). */
export function bookingDatesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string
): boolean {
  return startA < endB && endA > startB;
}

export function hasBookingConflict(
  existing: Array<{ start_date: string; end_date: string }>,
  start: string,
  end: string,
  excludeId?: string
): boolean {
  return existing.some(
    (b) =>
      (!excludeId || (b as { id?: string }).id !== excludeId) &&
      bookingDatesOverlap(start, end, b.start_date, b.end_date)
  );
}
