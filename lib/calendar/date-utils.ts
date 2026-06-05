import type { CalendarDate, DateValue } from "@internationalized/date";
import { parseDate } from "@internationalized/date";

export type DateRangeStrings = {
  start: string;
  end: string;
};

/** ISO YYYY-MM-DD ranges (inclusive end for booking nights). */
export function buildUnavailableChecker(ranges: DateRangeStrings[]) {
  const parsed = ranges
    .map((r) => {
      try {
        return { start: parseDate(r.start), end: parseDate(r.end) };
      } catch {
        return null;
      }
    })
    .filter((r): r is { start: CalendarDate; end: CalendarDate } => r !== null);

  return (date: DateValue) =>
    parsed.some((r) => date.compare(r.start) >= 0 && date.compare(r.end) <= 0);
}

export function rangeValueToStrings(range: { start: DateValue; end: DateValue } | null) {
  if (!range?.start || !range?.end) return null;
  return {
    start: range.start.toString(),
    end: range.end.toString(),
  };
}

export function dateHasEvent(
  date: DateValue,
  events: { start: string; end?: string }[]
) {
  return events.some((ev) => {
    try {
      const start = parseDate(ev.start.slice(0, 10));
      const end = ev.end ? parseDate(ev.end.slice(0, 10)) : start;
      return date.compare(start) >= 0 && date.compare(end) <= 0;
    } catch {
      return false;
    }
  });
}
