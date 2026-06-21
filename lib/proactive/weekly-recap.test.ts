import { describe, it, expect } from "vitest";
import { computeRevenueDelta } from "@/lib/proactive/weekly-recap";

describe("computeRevenueDelta", () => {
  it("flag si baisse > 30%", () => {
    expect(computeRevenueDelta(600, 1000).dropOver30).toBe(true); // -40%
  });
  it("pas de flag si baisse exactement 30%", () => {
    expect(computeRevenueDelta(700, 1000).dropOver30).toBe(false); // -30% pile
  });
  it("pas de flag si base 0 (pas de référence)", () => {
    expect(computeRevenueDelta(500, 0).dropOver30).toBe(false);
  });
  it("pas de flag si hausse", () => {
    expect(computeRevenueDelta(1200, 1000).dropOver30).toBe(false);
  });
  it("delta correct", () => {
    expect(computeRevenueDelta(800, 1000).delta).toBe(-200);
  });
});
