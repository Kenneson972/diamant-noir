// lib/availability-gaps.test.ts
import { describe, it, expect } from "vitest";
import { findGaps, type DateRange } from "./availability-gaps";

describe("findGaps", () => {
  it("trouve un trou entre deux plages occupées", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-05" },
      { start: "2026-07-10", end: "2026-07-15" },
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-31", 3);
    expect(gaps).toContainEqual({ start: "2026-07-05", end: "2026-07-10", nights: 5 });
    expect(gaps.some((g) => g.start === "2026-07-15")).toBe(true);
  });

  it("ignore les trous plus courts que minNights", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-05" },
      { start: "2026-07-07", end: "2026-07-20" },
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-20", 3);
    expect(gaps.find((g) => g.start === "2026-07-05")).toBeUndefined();
  });

  it("retourne toute la fenêtre si aucune occupation", () => {
    const gaps = findGaps([], "2026-07-01", "2026-07-10", 3);
    expect(gaps).toEqual([{ start: "2026-07-01", end: "2026-07-10", nights: 9 }]);
  });

  it("fusionne les plages qui se chevauchent", () => {
    const occupied: DateRange[] = [
      { start: "2026-07-01", end: "2026-07-10" },
      { start: "2026-07-05", end: "2026-07-12" },
    ];
    const gaps = findGaps(occupied, "2026-07-01", "2026-07-20", 3);
    expect(gaps).toEqual([{ start: "2026-07-12", end: "2026-07-20", nights: 8 }]);
  });
});
