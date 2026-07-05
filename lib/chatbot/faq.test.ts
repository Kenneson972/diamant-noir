import { describe, it, expect } from "vitest";
import { normalizeText, matchFaq, type FaqEntry } from "./faq";

const entries: FaqEntry[] = [
  {
    id: "commission",
    keywords: ["commission", "pourcentage", "combien prenez"],
    question: "Quelle est la commission ?",
    answer: "22 % direct, 20 % OTA.",
  },
  {
    id: "menage",
    keywords: ["menage", "nettoyage", "blanchisserie"],
    question: "Comment fonctionne le ménage ?",
    answer: "Prestataires pros, coût inclus.",
  },
  {
    id: "reserver",
    keywords: ["reserver", "reservation", "comment louer"],
    question: "Comment réserver ?",
    answer: "Catalogue, dates, paiement en ligne.",
  },
];

describe("normalizeText", () => {
  it("minuscule, accents et ponctuation neutralisés", () => {
    expect(normalizeText("Quelle est votre COMMISSION, s'il vous plaît ?!"))
      .toBe("quelle est votre commission s il vous plait");
  });
});

describe("matchFaq", () => {
  it("matche une formulation directe", () => {
    const m = matchFaq("Quelle est votre commission ?", entries);
    expect(m?.entry.id).toBe("commission");
  });

  it("matche malgré accents et majuscules (variations)", () => {
    expect(matchFaq("le MÉNAGE est-il inclus ?", entries)?.entry.id).toBe("menage");
    expect(matchFaq("comment se passe la blanchisserie", entries)?.entry.id).toBe("menage");
  });

  it("matche un keyword multi-mots avec priorité", () => {
    const m = matchFaq("combien prenez-vous au juste ?", entries);
    expect(m?.entry.id).toBe("commission");
  });

  it("préfère l'entrée avec le plus de keywords matchés", () => {
    const m = matchFaq("je veux réserver, comment faire une réservation ?", entries);
    expect(m?.entry.id).toBe("reserver");
    expect(m!.score).toBeGreaterThanOrEqual(2);
  });

  it("retourne null quand rien ne matche", () => {
    expect(matchFaq("parlez-moi de la météo en Islande", entries)).toBeNull();
  });

  it("retourne null sur message vide", () => {
    expect(matchFaq("", entries)).toBeNull();
  });
});
