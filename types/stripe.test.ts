import { describe, it, expect } from "vitest";
import { BookingRequestSchema } from "./stripe";

describe("BookingRequestSchema", () => {
  const validPayload = {
    startDate: "2026-08-15",
    endDate: "2026-08-20",
    villaId: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
    cgvAccepted: true as const,
  };

  it("accepte un payload valide sans serviceFeePercent", () => {
    const result = BookingRequestSchema.safeParse(validPayload);
    expect(result.success).toBe(true);
  });

  it("ignore un serviceFeePercent envoyé par le client (n'est plus dans le schéma)", () => {
    const result = BookingRequestSchema.safeParse({
      ...validPayload,
      serviceFeePercent: 0,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as Record<string, unknown>).serviceFeePercent).toBeUndefined();
    }
  });
});
