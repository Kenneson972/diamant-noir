// app/api/chat/owner-lead/owner-lead.test.ts
import { describe, it, expect } from "vitest";
import { validateOwnerLead, buildSubmissionUrl } from "@/lib/chatbot/conciergerie-context";

describe("validateOwnerLead", () => {
  it("rejette si aucune info utile", () => {
    expect(validateOwnerLead({}).ok).toBe(false);
  });
  it("accepte avec villasCount ou location", () => {
    expect(validateOwnerLead({ villasCount: 3 }).ok).toBe(true);
    expect(validateOwnerLead({ location: "Trois-Îlets" }).ok).toBe(true);
  });
});

describe("buildSubmissionUrl", () => {
  it("pré-remplit les champs connus", () => {
    const url = buildSubmissionUrl({ name: "Jean", email: "j@x.com", location: "Trois-Îlets" });
    expect(url.startsWith("/soumettre-ma-villa?")).toBe(true);
    expect(url).toContain("villa_location=Trois");
  });
  it("retourne le chemin nu si rien à pré-remplir", () => {
    expect(buildSubmissionUrl({})).toBe("/soumettre-ma-villa");
  });
});
