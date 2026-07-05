import { describe, it, expect } from "vitest";
import { normalizeText, matchFaq, faqForPrompt, FAQ_CATEGORIES, type FaqEntry } from "./faq";

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

describe("FAQ_CATEGORIES — contenu", () => {
  it("les 4 catégories existent et sont non vides", () => {
    for (const cat of ["voyageur", "proprietaire", "admin", "sejour"] as const) {
      expect(FAQ_CATEGORIES[cat].length).toBeGreaterThanOrEqual(5);
    }
  });

  it("règle tarifaire : 22 % direct / 20 % OTA, jamais de montant ménage fixe", () => {
    const commission = FAQ_CATEGORIES.proprietaire.find((e) => e.id === "commission")!;
    expect(commission.answer).toContain("22 %");
    expect(commission.answer).toContain("20 %");
    const menage = FAQ_CATEGORIES.proprietaire.find((e) => e.id === "menage")!;
    expect(menage.answer).not.toMatch(/\d+\s*€/); // pas de montant fixe
  });

  it("chaque réponse < 500 tokens (~350 mots) et keywords normalisés", () => {
    for (const entries of Object.values(FAQ_CATEGORIES)) {
      for (const e of entries) {
        expect(e.answer.split(/\s+/).length).toBeLessThan(350);
        for (const k of e.keywords) {
          expect(k).toBe(k.toLowerCase());
          expect(k.normalize("NFD").replace(/[̀-ͯ]/g, "")).toBe(k);
        }
      }
    }
  });

  it("variations de formulation matchent la bonne entrée", () => {
    expect(matchFaq("vous prenez quel pourcentage sur les locations ?", FAQ_CATEGORIES.proprietaire)?.entry.id).toBe("commission");
    expect(matchFaq("c'est quoi le code du wifi", FAQ_CATEGORIES.sejour)?.entry.id).toBe("wifi");
    expect(matchFaq("peut-on venir avec notre chien ?", FAQ_CATEGORIES.voyageur)?.entry.id).toBe("animaux");
    expect(matchFaq("ma villa reste vide en ce moment", FAQ_CATEGORIES.proprietaire)?.entry.id).toBe("inoccupation");
  });

  it("faqForPrompt agrège les catégories demandées", () => {
    const items = faqForPrompt(["voyageur", "proprietaire"]);
    expect(items.length).toBe(FAQ_CATEGORIES.voyageur.length + FAQ_CATEGORIES.proprietaire.length);
    expect(items[0]).toHaveProperty("q");
    expect(items[0]).toHaveProperty("a");
  });
});
