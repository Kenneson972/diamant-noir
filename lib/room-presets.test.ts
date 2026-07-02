import { describe, it, expect } from "vitest";
import { ROOM_PRESETS, getBedCapacity, totalRoomCapacity } from "./room-presets";

describe("ROOM_PRESETS", () => {
  it("a 3 presets", () => {
    expect(ROOM_PRESETS).toHaveLength(3);
  });
  it("chaque preset a au moins 1 chambre", () => {
    for (const p of ROOM_PRESETS) expect(p.rooms.length).toBeGreaterThanOrEqual(1);
  });
});

describe("getBedCapacity", () => {
  it("King size = 2", () => expect(getBedCapacity("King size")).toBe(2));
  it("Simple = 1", () => expect(getBedCapacity("Simple")).toBe(1));
});

describe("totalRoomCapacity", () => {
  it("King + 2×Simple = 4", () => {
    expect(totalRoomCapacity([
      { bed: "King size" }, { bed: "Simple" }, { bed: "Simple" },
    ])).toBe(4);
  });
  it("tableau vide = 0", () => expect(totalRoomCapacity([])).toBe(0));
});
