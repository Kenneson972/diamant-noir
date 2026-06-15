// lib/chatbot/availability.test.ts
import { describe, it, expect } from "vitest";
import { buildAvailabilityMap, type RawBooking, type RawBlock } from "./availability";

const today = "2026-07-01";

describe("buildAvailabilityMap", () => {
  it("agrège bookings + blocks par villa en plages occupées triées", () => {
    const bookings: RawBooking[] = [
      { villa_id: "v1", start_date: "2026-07-10", end_date: "2026-07-15" },
    ];
    const blocks: RawBlock[] = [
      { villa_id: "v1", start_date: "2026-07-03", end_date: "2026-07-04" },
    ];
    const map = buildAvailabilityMap(bookings, blocks, today);
    const v1 = map.get("v1")!;
    expect(v1.bookedRanges).toEqual([
      { start: "2026-07-03", end: "2026-07-05" },
      { start: "2026-07-10", end: "2026-07-15" },
    ]);
  });

  it("isAvailableNow=false si aujourd'hui est occupé", () => {
    const map = buildAvailabilityMap(
      [{ villa_id: "v1", start_date: "2026-06-28", end_date: "2026-07-05" }],
      [],
      today
    );
    expect(map.get("v1")!.isAvailableNow).toBe(false);
    expect(map.get("v1")!.nextAvailableFrom).toBe("2026-07-05");
  });

  it("isAvailableNow=true et nextAvailableFrom=today si aucune occupation aujourd'hui", () => {
    const map = buildAvailabilityMap(
      [{ villa_id: "v1", start_date: "2026-07-20", end_date: "2026-07-25" }],
      [],
      today
    );
    expect(map.get("v1")!.isAvailableNow).toBe(true);
    expect(map.get("v1")!.nextAvailableFrom).toBe(today);
  });
});
