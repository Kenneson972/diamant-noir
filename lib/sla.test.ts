// lib/sla.test.ts
import { describe, it, expect } from "vitest";
import { slaThresholds, getSlaStatus } from "./sla";

const HOUR = 3600_000;

describe("slaThresholds", () => {
  it("returns urgent thresholds", () => {
    expect(slaThresholds("urgent").resolveHours).toBe(24);
    expect(slaThresholds("urgent").takenHours).toBe(2);
  });
  it("returns standard thresholds", () => {
    expect(slaThresholds("standard").resolveHours).toBe(48);
  });
});

describe("getSlaStatus", () => {
  const now = new Date("2026-06-15T12:00:00Z");
  it("is ok when fresh", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 1 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("ok");
  });
  it("is warn at >=75% of resolve window", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 37 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("warn");
  });
  it("is over past the resolve window", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 49 * HOUR).toISOString(), priority: "standard", resolvedAt: null }, now);
    expect(s.level).toBe("over");
  });
  it("resolved requests are always ok", () => {
    const s = getSlaStatus({ createdAt: new Date(now.getTime() - 100 * HOUR).toISOString(), priority: "urgent", resolvedAt: now.toISOString() }, now);
    expect(s.level).toBe("ok");
  });
});
