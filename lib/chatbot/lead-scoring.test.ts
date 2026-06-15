// lib/chatbot/lead-scoring.test.ts
import { describe, it, expect } from "vitest";
import { isHotLead } from "./lead-scoring";

describe("isHotLead", () => {
  it("chaud si leadTemperature=hot", () => {
    expect(isHotLead({ leadTemperature: "hot" })).toBe(true);
  });
  it("chaud si score >= 70", () => {
    expect(isHotLead({ qualificationScore: 80 })).toBe(true);
    expect(isHotLead({ qualificationScore: 50 })).toBe(false);
  });
  it("chaud (heuristique démo) si dates + budget + guests connus", () => {
    expect(isHotLead({ knownLeadData: { checkIn: "2026-07-01", budget: 5000, guests: 4 } })).toBe(true);
  });
  it("froid sinon", () => {
    expect(isHotLead({})).toBe(false);
    expect(isHotLead({ knownLeadData: { guests: 2 } })).toBe(false);
  });
});
