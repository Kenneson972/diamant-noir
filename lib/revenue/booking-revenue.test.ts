import { describe, it, expect } from "vitest";
import { getCommissionRate, grossCentsFromBooking } from "./booking-revenue";

describe("getCommissionRate", () => {
  it('"airbnb" → 20%', () => {
    expect(getCommissionRate("airbnb")).toBe(20);
  });

  it('"direct" → 22%', () => {
    expect(getCommissionRate("direct")).toBe(22);
  });

  it('"booking" → 20%', () => {
    expect(getCommissionRate("booking")).toBe(20);
  });

  it("null → 22% (défaut)", () => {
    expect(getCommissionRate(null)).toBe(22);
  });
});

describe("grossCentsFromBooking", () => {
  it("calcule le total à partir de price + cleaning + service", () => {
    const result = grossCentsFromBooking({
      price: 150,
      cleaning_fee: 80,
      service_fee: 22.5,
      total_price_cents: null,
    });
    // 150€ = 15000c + 80€ = 8000c + 22.5€ = 2250c → 25250
    expect(result).toBe(25250);
  });

  it("fallback sur total_price_cents si price absent", () => {
    const result = grossCentsFromBooking({
      price: null,
      cleaning_fee: null,
      service_fee: null,
      total_price_cents: 30000,
    });
    expect(result).toBe(30000);
  });
});
