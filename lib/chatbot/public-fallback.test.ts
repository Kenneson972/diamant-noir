import { describe, it, expect } from "vitest";
import {
  parseStayNights,
  buildPriceEstimate,
  quickRepliesForStage,
  buildPublicFallback,
} from "./public-fallback";
import type { VillaContextItem } from "@/types/chatbot";

const villas = [
  { id: "v1", name: "Villa Azur", description: null, price_per_night: 250, capacity: 6, location: "Sainte-Anne", amenities: ["piscine"], image_url: null },
  { id: "v2", name: "Villa Corail", description: null, price_per_night: 180, capacity: 4, location: "Le Diamant", amenities: [], image_url: null },
] as VillaContextItem[];

describe("parseStayNights", () => {
  it("du 12 au 19 aout → 7 nuits", () => {
    expect(parseStayNights("on cherche du 12 au 19 aout")).toBe(7);
  });
  it("5 nuits → 5", () => {
    expect(parseStayNights("pour 5 nuits en famille")).toBe(5);
  });
  it("une semaine → 7, un week-end → 2", () => {
    expect(parseStayNights("une semaine en janvier")).toBe(7);
    expect(parseStayNights("un week-end en amoureux")).toBe(2);
  });
  it("du 28 juillet au 3 aout → 6 (chevauchement de mois)", () => {
    expect(parseStayNights("du 28 juillet au 3 aout")).toBe(6);
  });
  it("null si aucune duree detectable", () => {
    expect(parseStayNights("bonjour, avez-vous une piscine ?")).toBeNull();
  });
});

describe("buildPriceEstimate", () => {
  it("estimation par villa precise", () => {
    const txt = buildPriceEstimate(villas, 7, "v1")!;
    expect(txt).toContain("Villa Azur");
    expect(txt).toContain("1 750"); // 7 × 250, format fr-FR (U+202F = narrow NBSP)
  });
  it("fourchette min–max sans villa precise", () => {
    const txt = buildPriceEstimate(villas, 5)!;
    expect(txt).toContain("900");   // 5 × 180
    expect(txt).toContain("1 250"); // 5 × 250, format fr-FR (U+202F = narrow NBSP)
  });
  it("null si catalogue vide", () => {
    expect(buildPriceEstimate([], 5)).toBeNull();
  });
});

describe("quickRepliesForStage", () => {
  it("greet / villas / booking / contact ont leurs suggestions", () => {
    expect(quickRepliesForStage("greet")).toContain("Voir les villas");
    expect(quickRepliesForStage("villas")).toContain("Avec piscine");
    expect(quickRepliesForStage("booking")).toContain("Disponibilités");
    expect(quickRepliesForStage("contact")).toContain("Parler à un humain");
    expect(quickRepliesForStage("inconnu").length).toBeGreaterThan(0); // defaut = greet
  });
});

describe("buildPublicFallback", () => {
  it("question FAQ → reponse FAQ + quick replies de l entree", () => {
    const r = buildPublicFallback({ message: "quelle est votre commission ?", stage: "greet", villas });
    expect(r.matchedFaqId).toBe("commission");
    expect(r.reply).toContain("22 %");
  });
  it("demande de contact → oriente vers le formulaire", () => {
    const r = buildPublicFallback({ message: "je veux parler à un conseiller humain", stage: "greet", villas });
    expect(r.link).toBe("/contact");
  });
  it("demande de prix avec dates → estimation locale", () => {
    const r = buildPublicFallback({ message: "quel serait le prix pour 5 nuits ?", stage: "greet", villas });
    expect(r.matchedFaqId).toBe("tarifs");
    expect(r.reply).toContain("900");
  });
  it("aucun match → message generique + suggestions du stage", () => {
    const r = buildPublicFallback({ message: "xyzabc introuvable", stage: "booking", villas });
    expect(r.matchedFaqId).toBeNull();
    expect(r.quickReplies).toContain("Disponibilités");
    expect(r.reply.length).toBeGreaterThan(20);
  });
});
