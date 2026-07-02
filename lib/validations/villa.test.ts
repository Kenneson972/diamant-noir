import { describe, it, expect } from "vitest";
import { villaFormSchema } from "./villa";

describe("villaFormSchema", () => {
  it("rejette un nom vide", () => {
    const r = villaFormSchema.safeParse({ name: "", price_per_night: 0 });
    expect(r.success).toBe(false);
  });
  it("valide un minimum viable", () => {
    const r = villaFormSchema.safeParse({ name: "Villa Test", price_per_night: 150 });
    expect(r.success).toBe(true);
  });
  it("prix négatif rejeté", () => {
    const r = villaFormSchema.safeParse({ name: "X", price_per_night: -5 });
    expect(r.success).toBe(false);
  });
});
