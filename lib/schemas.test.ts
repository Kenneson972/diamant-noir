import { describe, it, expect } from "vitest";
import { villaSubmissionSchema } from "./schemas";

describe("villaSubmissionSchema", () => {
  it("accepte une soumission minimale valide", () => {
    const r = villaSubmissionSchema.safeParse({ name: "Jean", email: "jean@test.com" });
    expect(r.success).toBe(true);
  });
  it("rejette name manquant ou email invalide", () => {
    expect(villaSubmissionSchema.safeParse({ email: "x@y.com" }).success).toBe(false);
    expect(villaSubmissionSchema.safeParse({ name: "Jean", email: "pas-un-email" }).success).toBe(false);
  });
  it("accepte les champs optionnels (équipements, photo_urls)", () => {
    const r = villaSubmissionSchema.safeParse({
      name: "Jean", email: "jean@test.com",
      equipements: ["wifi", "bbq"], photo_urls: ["https://x.com/a.jpg"], parking_securise: true,
    });
    expect(r.success).toBe(true);
  });
});
