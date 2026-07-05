# Amélioration des 3 agents IA Kayvila — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FAQ centralisée + fallbacks offline intelligents pour les 3 agents IA (public, admin, proprio), injection de la connaissance dans les routes `/api/agent/*-context` lues par les bots n8n, et correction des 14 bugs de l'audit (spec : `docs/superpowers/specs/2026-07-05-agents-ia-faq-design.md`).

**Architecture:** Le code Next.js ne raisonne pas — il valide, enrichit le contexte, route vers n8n et gère les fallbacks. Les bots n8n tirent leur `systemPrompt` + données des routes `/api/agent/*-context` (le `context` du payload webhook est ignoré par n8n). Les workflows n8n corrigés sont générés par script dans `~/Downloads/KAYVILABOT/` et importés manuellement.

**Tech Stack:** Next.js 14 (App Router, routes `runtime="nodejs"`), Supabase (client `supabaseAdmin()`), Vitest, n8n (JSON workflows), DeepSeek via n8n.

## Global Constraints

- Tout le texte utilisateur/LLM est en **français**.
- Réponses de fallback **< 500 tokens** (~350 mots max).
- **Ne pas changer la signature des fonctions déjà exportées** (en ajouter est permis).
- **Ne pas modifier le frontend** (`components/`, `app/**/page.tsx`).
- **Aucune API externe** dans les fallbacks — tout marche offline.
- Tarification (règle dure) : commission **22 % nuitées résas directes, 20 % résas OTA** ; frais ménage/service **jamais de montant fixe** — « définis dans l'Annexe Tarifaire / voir FAQ ».
- Dev server port **3001** ; **ne jamais lancer `npm run build`**.
- Tests : `npx vitest run <fichier>` depuis `diamant-noir/`.
- Répertoire de travail : `/Users/kennesonbasel-somnier/Downloads/CLIENT KARIBLOOM/DIAMANTNOIR/diamant-noir`.
- Commits : messages en français, format `feat(scope): …` + trailer Co-Authored-By claude-flow.

---

### Task 1: Migration `chatbot_feedback` + helper de log

**Files:**
- Create: `supabase/migrations/20260705120000_chatbot_feedback.sql`
- Create: `lib/chatbot/feedback.ts`

**Interfaces:**
- Produces: `logChatbotFeedback(input: { agent: "public" | "admin" | "proprio"; sessionId: string | null; question: string; matched: boolean }): Promise<void>` — fire-and-forget, n'échoue jamais.

- [ ] **Step 1: Écrire la migration**

```sql
-- supabase/migrations/20260705120000_chatbot_feedback.sql
-- Questions chatbot sans réponse (fallback) — analyse des trous de la FAQ.

CREATE TABLE IF NOT EXISTS chatbot_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent TEXT NOT NULL CHECK (agent IN ('public', 'admin', 'proprio')),
  session_id TEXT,
  question TEXT NOT NULL,
  matched BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS chatbot_feedback_created_idx ON chatbot_feedback (created_at DESC);
CREATE INDEX IF NOT EXISTS chatbot_feedback_agent_idx ON chatbot_feedback (agent, matched);

-- RLS activée sans policy : accès service-role uniquement (comme admin_chat_logs).
ALTER TABLE chatbot_feedback ENABLE ROW LEVEL SECURITY;
```

- [ ] **Step 2: Écrire `lib/chatbot/feedback.ts`**

```ts
// lib/chatbot/feedback.ts
// Log fire-and-forget des questions fallback dans chatbot_feedback.
// Ne bloque jamais la réponse, n'émet jamais d'exception.

import { supabaseAdmin } from "@/lib/supabase";

export type ChatbotFeedbackInput = {
  agent: "public" | "admin" | "proprio";
  sessionId: string | null;
  question: string;
  matched: boolean;
};

export async function logChatbotFeedback(input: ChatbotFeedbackInput): Promise<void> {
  try {
    await supabaseAdmin().from("chatbot_feedback").insert({
      agent: input.agent,
      session_id: input.sessionId ? input.sessionId.slice(0, 120) : null,
      question: input.question.slice(0, 500),
      matched: input.matched,
    });
  } catch (e) {
    console.warn("[chatbot/feedback] insert skipped:", e);
  }
}
```

- [ ] **Step 3: Appliquer la migration sur Supabase**

Utiliser le MCP Supabase (`apply_migration`, name `chatbot_feedback`) avec le SQL du Step 1, sur le projet Supabase du site (celui listé par `list_projects` correspondant à Kayvila/diamant-noir). En cas d'indisponibilité MCP : signaler et continuer (la table n'est pas bloquante, l'insert est try/catch).

- [ ] **Step 4: Commit**

```bash
git add supabase/migrations/20260705120000_chatbot_feedback.sql lib/chatbot/feedback.ts
git commit -m "feat(chatbot): table chatbot_feedback + log fire-and-forget des questions sans réponse"
```

---

### Task 2: Moteur FAQ — `normalizeText` + `matchFaq` (TDD)

**Files:**
- Create: `lib/chatbot/faq.ts` (moteur seul, contenu en Task 3)
- Test: `lib/chatbot/faq.test.ts`

**Interfaces:**
- Produces:
  - `type FaqCategoryId = "voyageur" | "proprietaire" | "admin" | "sejour"`
  - `type FaqEntry = { id: string; keywords: string[]; question: string; answer: string; quickReplies?: string[]; link?: string }`
  - `normalizeText(s: string): string` — minuscules, accents supprimés, ponctuation → espaces
  - `matchFaq(message: string, entries: FaqEntry[]): { entry: FaqEntry; score: number } | null` — meilleur score, null si aucun keyword ne matche
  - `faqForPrompt(categories: FaqCategoryId[]): { q: string; a: string }[]` (utilisée à partir de Task 3)

- [ ] **Step 1: Écrire les tests du moteur (échec attendu)**

```ts
// lib/chatbot/faq.test.ts
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
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/chatbot/faq.test.ts`
Expected: FAIL — `Cannot find module './faq'` (ou exports manquants).

- [ ] **Step 3: Implémenter le moteur**

```ts
// lib/chatbot/faq.ts
// FAQ centralisée des agents IA Kayvila — moteur de matching offline.
// Zéro dépendance externe : fonctionne même quand n8n est indisponible.

export type FaqCategoryId = "voyageur" | "proprietaire" | "admin" | "sejour";

export type FaqEntry = {
  id: string;
  /** Mots-clés en minuscules SANS accents (comparés après normalizeText). */
  keywords: string[];
  question: string;
  /** Réponse française, texte brut, < 500 tokens. */
  answer: string;
  quickReplies?: string[];
  link?: string;
};

/** Minuscules, accents supprimés, ponctuation remplacée par des espaces. */
export function normalizeText(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export type FaqMatch = { entry: FaqEntry; score: number };

/**
 * Meilleure entrée FAQ pour un message.
 * Score = nb de keywords présents ; un keyword multi-mots vaut 2 points.
 * Retourne null si aucun keyword ne matche.
 */
export function matchFaq(message: string, entries: FaqEntry[]): FaqMatch | null {
  const norm = normalizeText(message);
  if (!norm) return null;
  const padded = ` ${norm} `;

  let best: FaqMatch | null = null;
  for (const entry of entries) {
    let score = 0;
    for (const kw of entry.keywords) {
      const k = normalizeText(kw);
      if (!k) continue;
      if (padded.includes(` ${k} `) || (k.includes(" ") && norm.includes(k))) {
        score += k.includes(" ") ? 2 : 1;
      }
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { entry, score };
    }
  }
  return best;
}
```

Note : `matchFaq` teste ` ${k} ` avec délimiteurs pour éviter les faux positifs par sous-chaîne (« chat » dans « achat »). Pour « ménage est-il inclus » : `normalizeText` produit `menage est il inclus` → ` menage ` présent. Pour « blanchisserie » en fin de phrase, le padding gère les bords.

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run lib/chatbot/faq.test.ts`
Expected: PASS (6 tests). Si « combien prenez-vous » échoue : `normalizeText("combien prenez")` = `combien prenez`, et le message normalisé `combien prenez vous au juste` contient bien `combien prenez` → OK via la branche `k.includes(" ") && norm.includes(k)`.

- [ ] **Step 5: Commit**

```bash
git add lib/chatbot/faq.ts lib/chatbot/faq.test.ts
git commit -m "feat(chatbot): moteur FAQ offline — normalisation accents + matching par mots-clés"
```

---

### Task 3: Contenu FAQ 4 catégories + `faqForPrompt`

**Files:**
- Modify: `lib/chatbot/faq.ts` (ajouter FAQ_CATEGORIES + faqForPrompt à la fin)
- Test: `lib/chatbot/faq.test.ts` (ajouter les tests contenu)

**Interfaces:**
- Produces: `FAQ_CATEGORIES: Record<FaqCategoryId, FaqEntry[]>`, `faqForPrompt(categories: FaqCategoryId[]): { q: string; a: string }[]`

- [ ] **Step 1: Ajouter les tests contenu (échec attendu)**

Ajouter à la fin de `lib/chatbot/faq.test.ts` :

```ts
import { FAQ_CATEGORIES, faqForPrompt } from "./faq";

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
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/chatbot/faq.test.ts`
Expected: FAIL — `FAQ_CATEGORIES` non exporté.

- [ ] **Step 3: Ajouter le contenu à `lib/chatbot/faq.ts`**

```ts
// ─── Contenu FAQ (source de vérité tarifs : voir data/conciergerie-faq.ts) ────

const VOYAGEUR: FaqEntry[] = [
  {
    id: "tarifs",
    keywords: ["tarif", "prix", "cout", "coute", "combien"],
    question: "Quels sont vos tarifs ?",
    answer:
      "Nos tarifs varient selon la villa et la saison. Chaque villa affiche son prix par nuit sur sa page. Donnez-moi vos dates et le nombre de voyageurs, je vous fais une estimation.",
    quickReplies: ["Voir les villas", "Faire une estimation"],
    link: "/villas",
  },
  {
    id: "reserver",
    keywords: ["reserver", "reservation", "louer", "comment louer"],
    question: "Comment réserver ?",
    answer:
      "Choisissez votre villa dans notre catalogue, sélectionnez vos dates puis finalisez votre réservation en ligne. Le paiement est sécurisé par carte bancaire.",
    quickReplies: ["Voir les villas", "Disponibilités"],
    link: "/villas",
  },
  {
    id: "animaux",
    keywords: ["animaux", "animal", "chien", "chat"],
    question: "Les animaux sont-ils acceptés ?",
    answer:
      "Cela dépend des villas : chacune a sa propre politique concernant les animaux. Indiquez-moi la villa qui vous intéresse ou contactez-nous, nous vérifions ensemble.",
    quickReplies: ["Contacter le concierge"],
    link: "/contact",
  },
  {
    id: "disponibilites",
    keywords: ["disponible", "disponibilite", "dispo", "libre"],
    question: "Comment connaître les disponibilités ?",
    answer:
      "Les disponibilités sont visibles sur la page de chaque villa. Indiquez-moi vos dates, je vérifie ce qui est libre.",
    quickReplies: ["Voir les villas"],
    link: "/villas",
  },
  {
    id: "annulation",
    keywords: ["annuler", "annulation", "rembourse", "remboursement"],
    question: "Quelles sont les conditions d'annulation ?",
    answer:
      "Les conditions d'annulation sont détaillées dans nos conditions générales et peuvent varier selon la villa. Contactez-nous pour étudier votre cas précis.",
    quickReplies: ["Parler à un humain"],
    link: "/contact",
  },
  {
    id: "derniere-minute",
    keywords: ["derniere minute", "ce soir", "demain soir", "aujourd hui"],
    question: "Peut-on réserver en dernière minute ?",
    answer:
      "Les réservations de dernière minute sont possibles selon disponibilité. Contactez-nous directement, nous faisons le maximum pour vous accueillir.",
    quickReplies: ["Contacter le concierge"],
    link: "/contact",
  },
  {
    id: "contact-humain",
    keywords: ["humain", "conseiller", "telephone", "appeler", "parler a quelqu un", "contact"],
    question: "Comment parler à un humain ?",
    answer:
      "Vous pouvez joindre notre équipe via le formulaire de contact — nous répondons rapidement, 7 jours sur 7.",
    quickReplies: ["Formulaire de contact"],
    link: "/contact",
  },
  {
    id: "paiement",
    keywords: ["paiement", "payer", "carte", "securise", "stripe"],
    question: "Comment se passe le paiement ?",
    answer:
      "Le paiement s'effectue en ligne par carte bancaire via une plateforme sécurisée. Vous recevez immédiatement votre confirmation par email.",
    quickReplies: ["Voir les villas"],
  },
];

const PROPRIETAIRE: FaqEntry[] = [
  {
    id: "commission",
    keywords: ["commission", "pourcentage", "prelevez", "prenez", "remuneration"],
    question: "Quelle est la commission de Kayvila ?",
    answer:
      "Kayvila prélève une commission de 22 % sur le montant des nuitées pour les réservations directes, et de 20 % pour les réservations venant des plateformes (Airbnb, Booking). Le ménage et la blanchisserie sont toujours exclus de la base de commission.",
    quickReplies: ["Soumettre ma villa", "Le minimum mensuel ?"],
    link: "/soumettre-ma-villa",
  },
  {
    id: "minimum",
    keywords: ["minimum", "50", "facturation minimale", "frais fixe", "abonnement"],
    question: "Y a-t-il un minimum de facturation ?",
    answer:
      "Après une période d'essai de 3 mois sans engagement, une facturation minimale de 50 € par mois s'applique uniquement lorsque la commission du mois est inférieure à ce montant. Dès que votre commission dépasse 50 €, ce minimum ne s'applique plus.",
    quickReplies: ["La commission ?", "Soumettre ma villa"],
  },
  {
    id: "menage",
    keywords: ["menage", "blanchisserie", "nettoyage", "draps", "linge"],
    question: "Comment fonctionne le ménage ?",
    answer:
      "Kayvila coordonne des prestataires professionnels pour le ménage et la blanchisserie. Le coût est inclus dans le prix payé par le voyageur — jamais à votre charge entre deux séjours. Les montants exacts sont définis dans votre Annexe Tarifaire, consultable dans la FAQ du site.",
    quickReplies: ["La commission ?"],
  },
  {
    id: "inoccupation",
    keywords: ["inoccupation", "vide", "pas de reservation", "inoccupe", "periode creuse"],
    question: "Que se passe-t-il si ma villa est inoccupée ?",
    answer:
      "En période sans réservation, seule la facturation minimale de 50 € par mois s'applique (après les 3 mois d'essai). Pendant ce temps, nous continuons de promouvoir activement votre villa sur notre site et les plateformes partenaires.",
    quickReplies: ["Comment être plus visible ?"],
  },
  {
    id: "services",
    keywords: ["services supplementaires", "photo", "reportage", "shooting", "annonce"],
    question: "Proposez-vous des services supplémentaires ?",
    answer:
      "Oui : reportage photo professionnel, optimisation de votre annonce et conseils de mise en valeur. Les détails et tarifs sont communiqués sur demande.",
    quickReplies: ["Soumettre ma villa"],
    link: "/soumettre-ma-villa",
  },
  {
    id: "imprevus",
    keywords: ["imprevu", "panne", "reparation", "probleme technique", "intervention", "urgence"],
    question: "Comment gérez-vous les imprévus ?",
    answer:
      "Nous intervenons 24h/24. Les petites réparations (moins de 100 €) sont gérées directement par nos équipes, et vous êtes systématiquement informé de chaque intervention.",
    quickReplies: ["Les reversements ?"],
  },
  {
    id: "reversement",
    keywords: ["reversement", "verse", "paye", "facture", "rapport", "sepa"],
    question: "Quand suis-je payé ?",
    answer:
      "Vous recevez chaque mois un rapport détaillé accompagné de la facture de commission, réglable sous 8 jours. Le mandat SEPA est possible pour simplifier les règlements.",
    quickReplies: ["La commission ?"],
  },
  {
    id: "demarrage",
    keywords: ["pack", "demarrage", "200", "mise en service", "debut"],
    question: "Y a-t-il des frais de démarrage ?",
    answer:
      "Un pack de démarrage de 200 € s'applique à la première mise en service : consommables initiaux, boîte à clés sécurisée et guide d'accueil de votre villa.",
    quickReplies: ["Soumettre ma villa"],
    link: "/soumettre-ma-villa",
  },
  {
    id: "soumettre",
    keywords: ["soumettre", "confier", "gestion", "inscrire", "devenir proprietaire"],
    question: "Comment confier ma villa à Kayvila ?",
    answer:
      "Soumettez votre villa via notre formulaire en ligne — nous revenons vers vous sous 48 h avec une estimation personnalisée de vos revenus locatifs.",
    quickReplies: ["Soumettre ma villa", "La commission ?"],
    link: "/soumettre-ma-villa",
  },
  {
    id: "sync-ota",
    keywords: ["airbnb", "booking", "calendrier", "synchronisation", "double reservation"],
    question: "Gérez-vous Airbnb et Booking ?",
    answer:
      "Oui, nous synchronisons vos calendriers Airbnb et Booking en continu pour éviter toute double réservation, et nous gérons les voyageurs quelle que soit la plateforme d'origine.",
    quickReplies: ["La commission ?"],
  },
];

const ADMIN: FaqEntry[] = [
  {
    id: "occupation",
    keywords: ["occupation", "taux", "remplissage"],
    question: "Quel est le taux d'occupation ?",
    answer: "Taux d'occupation global sur 30 jours + détail par villa (calculé en direct).",
  },
  {
    id: "top-villas",
    keywords: ["top", "meilleure", "classement", "performance"],
    question: "Quelles sont les meilleures villas ?",
    answer: "Top 3 des villas par revenu encaissé, avec nombre de réservations.",
  },
  {
    id: "ota-sync",
    keywords: ["ota", "sync", "airbnb", "booking", "ical", "erreur"],
    question: "Où en est la synchronisation OTA ?",
    answer: "Dernière synchro, canaux en erreur et détail des erreurs récentes.",
  },
  {
    id: "checkins-semaine",
    keywords: ["check in", "checkin", "arrivee", "semaine", "arrive"],
    question: "Quels check-ins cette semaine ?",
    answer: "Arrivées sous 7 jours avec nom du client et villa.",
  },
  {
    id: "demandes",
    keywords: ["demande", "attente", "soumission", "reclamation"],
    question: "Quelles demandes sont en attente ?",
    answer: "Détail par type : soumissions de villas, paiements en attente, tâches ouvertes.",
  },
  {
    id: "revenus",
    keywords: ["revenu", "chiffre", "ca", "encaisse", "finance"],
    question: "Où en sont les revenus ?",
    answer: "CA du mois, comparaison vs mois dernier, historique 6 mois.",
  },
];

const SEJOUR: FaqEntry[] = [
  {
    id: "checkin",
    keywords: ["digicode", "code porte", "entrer", "arrivee", "check in", "checkin", "cles"],
    question: "Comment se passe le check-in ?",
    answer:
      "Votre digicode vous est envoyé 24 h avant l'arrivée. Rendez-vous directement à la villa — tout est prêt pour vous.",
  },
  {
    id: "wifi",
    keywords: ["wifi", "internet", "connexion", "code wifi"],
    question: "Où trouver le code wifi ?",
    answer: "Le code wifi se trouve dans le livret d'accueil de la villa.",
  },
  {
    id: "concierge",
    keywords: ["concierge", "joindre", "telephone", "appeler", "contact"],
    question: "Comment contacter le concierge ?",
    answer:
      "Vous pouvez me joindre ici à tout moment, ou appeler le +596 696 68 18 69 — disponible 24h/24.",
  },
  {
    id: "prolonger",
    keywords: ["prolonger", "rester plus", "nuit supplementaire", "prolongation"],
    question: "Peut-on prolonger le séjour ?",
    answer:
      "Une prolongation est possible selon disponibilité de la villa. Faites-en la demande ici, nous vous confirmons rapidement.",
  },
  {
    id: "annuler",
    keywords: ["annuler", "annulation", "rembourse"],
    question: "Comment annuler ?",
    answer:
      "Les conditions d'annulation figurent dans nos conditions générales. Contactez-nous pour étudier votre situation.",
  },
  {
    id: "menage-sejour",
    keywords: ["menage", "nettoyage", "serviettes", "draps"],
    question: "Le ménage est-il inclus ?",
    answer:
      "Le ménage de fin de séjour est inclus. En cours de séjour, un ménage supplémentaire est possible sur demande (avec supplément).",
  },
];

export const FAQ_CATEGORIES: Record<FaqCategoryId, FaqEntry[]> = {
  voyageur: VOYAGEUR,
  proprietaire: PROPRIETAIRE,
  admin: ADMIN,
  sejour: SEJOUR,
};

/** FAQ condensée { q, a } pour injection dans les systemPrompts n8n. */
export function faqForPrompt(categories: FaqCategoryId[]): { q: string; a: string }[] {
  return categories.flatMap((c) =>
    FAQ_CATEGORIES[c].map((e) => ({ q: e.question, a: e.answer }))
  );
}
```

- [ ] **Step 4: Vérifier que tous les tests passent**

Run: `npx vitest run lib/chatbot/faq.test.ts`
Expected: PASS (11 tests). Si « vous prenez quel pourcentage » ne matche pas : keyword `prenez` couvre ce cas (1 point). Si « ma villa reste vide » ne matche pas `inoccupation` : keyword `vide` couvre.

- [ ] **Step 5: Commit**

```bash
git add lib/chatbot/faq.ts lib/chatbot/faq.test.ts
git commit -m "feat(chatbot): contenu FAQ 4 catégories (voyageur, proprietaire, admin, sejour) — règle 22/20"
```

---

### Task 4: Mise à jour tarifaire — `CONCIERGERIE_FACTS` + `data/conciergerie-faq.ts`

**Files:**
- Modify: `lib/chatbot/conciergerie-context.ts:14-22` (CONCIERGERIE_FACTS)
- Modify: `data/conciergerie-faq.ts` (réponses commission — lire le fichier d'abord, remplacements ciblés)

**Interfaces:**
- Consumes: rien.
- Produces: `CONCIERGERIE_FACTS` mis à jour (même nom, même type `readonly string[]`).

- [ ] **Step 1: Mettre à jour CONCIERGERIE_FACTS**

Dans `lib/chatbot/conciergerie-context.ts`, remplacer les deux premières entrées du tableau :

```ts
export const CONCIERGERIE_FACTS = [
  "Commission Kayvila : 22 % du montant des nuitées pour les réservations directes, 20 % pour les réservations venant des plateformes OTA (Airbnb, Booking). Ménage et blanchisserie toujours exclus de la base de commission, facturés séparément aux voyageurs.",
  "Les frais de ménage et de service sont définis par Kayvila dans l'Annexe Tarifaire — aucun montant fixe à citer, renvoyer vers la FAQ du site ou le contact.",
  "Synchronisation des calendriers Airbnb / Booking pour éviter les doubles réservations.",
  "Maintenance, ménage, accueil voyageurs et réassort des consommables gérés par Kayvila.",
  "Visibilité accrue : mise en avant sur le site Kayvila + plateformes OTA.",
  "Pack de démarrage 200 € à la première mise en service (consommables, boîte à clés sécurisée, guide).",
  "Rapport mensuel détaillé + facture de commission, réglable sous 8 jours (mandat SEPA possible).",
] as const;
```

(L'entrée « frais de traitement de 5 % » est supprimée — obsolète, remplacée par la règle 22/20.)

- [ ] **Step 2: Mettre à jour data/conciergerie-faq.ts**

Lire le fichier en entier, puis :
1. `grep -n "22\s*%\|5\s*%\|frais de traitement" data/conciergerie-faq.ts` pour localiser toutes les mentions.
2. Dans chaque réponse mentionnant la commission : préciser « 22 % sur les nuitées pour les réservations directes (20 % pour les réservations venant des plateformes Airbnb/Booking) » — modifier uniquement les phrases de taux, ne pas réécrire les réponses entières.
3. Si une réponse mentionne « frais de traitement de 5 % » pour les résas directes : remplacer la phrase par la règle 22 % direct / 20 % OTA.
4. Ne PAS toucher aux montants ménage existants s'ils renvoient à l'Annexe Tarifaire (c'est déjà la bonne formulation).

- [ ] **Step 3: Vérifier la cohérence**

Run: `grep -c "20 %" data/conciergerie-faq.ts && grep -c "5 %" data/conciergerie-faq.ts || true`
Expected: au moins 1 occurrence de « 20 % » ; plus aucune mention de frais 5 % liés aux résas directes.
Run: `npx vitest run lib` — Expected: PASS (aucune régression, notamment `lib/chatbot/*.test.ts`).

- [ ] **Step 4: Commit**

```bash
git add lib/chatbot/conciergerie-context.ts data/conciergerie-faq.ts
git commit -m "feat(tarifs): règle commission 22 % direct / 20 % OTA dans les faits conciergerie et la FAQ site"
```

---

### Task 5: Fallback public — `lib/chatbot/public-fallback.ts` (TDD)

**Files:**
- Create: `lib/chatbot/public-fallback.ts`
- Test: `lib/chatbot/public-fallback.test.ts`

**Interfaces:**
- Consumes: `matchFaq`, `FAQ_CATEGORIES`, `normalizeText` (Task 2/3) ; `VillaContextItem` de `@/types/chatbot`.
- Produces:
  - `parseStayNights(message: string): number | null`
  - `buildPriceEstimate(villas: VillaContextItem[], nights: number, villaId?: string): string | null`
  - `quickRepliesForStage(stage: string): string[]`
  - `buildPublicFallback(input: { message: string; stage: string; villas: VillaContextItem[]; villaId?: string }): { reply: string; quickReplies: string[]; matchedFaqId: string | null; link?: string }`

- [ ] **Step 1: Écrire les tests (échec attendu)**

```ts
// lib/chatbot/public-fallback.test.ts
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
  it("« du 12 au 19 août » → 7 nuits", () => {
    expect(parseStayNights("on cherche du 12 au 19 août")).toBe(7);
  });
  it("« 5 nuits » → 5", () => {
    expect(parseStayNights("pour 5 nuits en famille")).toBe(5);
  });
  it("« une semaine » → 7, « un week-end » → 2", () => {
    expect(parseStayNights("une semaine en janvier")).toBe(7);
    expect(parseStayNights("un week-end en amoureux")).toBe(2);
  });
  it("« du 28 juillet au 3 août » → 6 (chevauchement de mois)", () => {
    expect(parseStayNights("du 28 juillet au 3 août")).toBe(6);
  });
  it("null si aucune durée détectable", () => {
    expect(parseStayNights("bonjour, avez-vous une piscine ?")).toBeNull();
  });
});

describe("buildPriceEstimate", () => {
  it("estimation par villa précise", () => {
    const txt = buildPriceEstimate(villas, 7, "v1")!;
    expect(txt).toContain("Villa Azur");
    expect(txt).toContain("1 750"); // 7 × 250, format fr-FR
  });
  it("fourchette min–max sans villa précise", () => {
    const txt = buildPriceEstimate(villas, 5)!;
    expect(txt).toContain("900");   // 5 × 180
    expect(txt).toContain("1 250"); // 5 × 250
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
    expect(quickRepliesForStage("inconnu").length).toBeGreaterThan(0); // défaut = greet
  });
});

describe("buildPublicFallback", () => {
  it("question FAQ → réponse FAQ + quick replies de l'entrée", () => {
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
  it("aucun match → message générique + suggestions du stage", () => {
    const r = buildPublicFallback({ message: "xyzabc introuvable", stage: "booking", villas });
    expect(r.matchedFaqId).toBeNull();
    expect(r.quickReplies).toContain("Disponibilités");
    expect(r.reply.length).toBeGreaterThan(20);
  });
});
```

- [ ] **Step 2: Vérifier l'échec**

Run: `npx vitest run lib/chatbot/public-fallback.test.ts`
Expected: FAIL — module inexistant.

- [ ] **Step 3: Implémenter**

```ts
// lib/chatbot/public-fallback.ts
// Fallback offline de l'agent public : FAQ + détection d'intent + estimation prix.
// Fonctions pures — aucune dépendance réseau.

import { FAQ_CATEGORIES, matchFaq, normalizeText, type FaqEntry } from "./faq";
import type { VillaContextItem } from "@/types/chatbot";

const MONTHS = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

/** Nombre de nuits détecté dans un message français, sinon null. */
export function parseStayNights(message: string): number | null {
  const norm = normalizeText(message);

  // « du 12 au 19 août » / « du 28 juillet au 3 aout »
  const range = norm.match(
    /du (\d{1,2})(?: ([a-z]+))? au (\d{1,2})(?: ([a-z]+))?/
  );
  if (range) {
    const d1 = parseInt(range[1], 10);
    const d2 = parseInt(range[3], 10);
    const m1 = range[2] ? MONTHS.indexOf(range[2]) : -1;
    const m2 = range[4] ? MONTHS.indexOf(range[4]) : -1;
    if (d1 >= 1 && d1 <= 31 && d2 >= 1 && d2 <= 31) {
      if (m1 >= 0 && m2 >= 0 && m2 !== m1) {
        const daysInM1 = new Date(2026, m1 + 1, 0).getDate();
        const nights = daysInM1 - d1 + d2;
        if (nights > 0 && nights <= 90) return nights;
      } else if (d2 > d1) {
        return d2 - d1;
      }
    }
  }

  // « 5 nuits » / « 10 jours »
  const n = norm.match(/(\d{1,2}) (nuits?|jours?)/);
  if (n) {
    const nights = parseInt(n[1], 10) - (n[2].startsWith("jour") ? 1 : 0);
    if (nights >= 1 && nights <= 90) return Math.max(1, nights);
  }

  if (/\bune semaine\b/.test(norm)) return 7;
  if (/\bdeux semaines\b/.test(norm)) return 14;
  if (/\bweek ?end\b/.test(norm)) return 2;

  return null;
}

const fmtEUR = (n: number) => n.toLocaleString("fr-FR");

/** Estimation de prix locale (villa précise ou fourchette catalogue). */
export function buildPriceEstimate(
  villas: VillaContextItem[],
  nights: number,
  villaId?: string
): string | null {
  const published = villas.filter((v) => v.price_per_night > 0);
  if (published.length === 0) return null;

  if (villaId) {
    const v = published.find((x) => x.id === villaId);
    if (v) {
      return `Pour ${nights} nuit${nights > 1 ? "s" : ""} à la ${v.name}, comptez environ ${fmtEUR(nights * v.price_per_night)} € (hors options). Les tarifs exacts selon vos dates sont confirmés à la réservation.`;
    }
  }

  const prices = published.map((v) => v.price_per_night);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return `Pour ${nights} nuit${nights > 1 ? "s" : ""}, comptez entre ${fmtEUR(nights * min)} € et ${fmtEUR(nights * max)} € selon la villa. Dites-moi vos critères (personnes, secteur, piscine), je vous oriente.`;
}

const STAGE_QUICK_REPLIES: Record<string, string[]> = {
  greet: ["Voir les villas", "Comment ça marche ?", "Contacter le concierge"],
  villas: ["Avec piscine", "Moins de 200€", "Disponibilités"],
  booking: ["Disponibilités", "Annulation", "Parler à un humain"],
  contact: ["Parler à un humain", "Formulaire de contact"],
};

export function quickRepliesForStage(stage: string): string[] {
  return STAGE_QUICK_REPLIES[stage] ?? STAGE_QUICK_REPLIES.greet;
}

const CONTACT_RE = /\b(humain|conseiller|quelqu un|telephone|appeler|rappeler|joindre)\b/;
const PRICE_RE = /\b(prix|tarif|cout|coute|combien|budget|estimation)\b/;

export type PublicFallbackResult = {
  reply: string;
  quickReplies: string[];
  matchedFaqId: string | null;
  link?: string;
};

/**
 * Réponse fallback publique quand n8n est indisponible.
 * Ordre : contact → prix+durée → FAQ (voyageur + proprietaire) → générique.
 */
export function buildPublicFallback(input: {
  message: string;
  stage: string;
  villas: VillaContextItem[];
  villaId?: string;
}): PublicFallbackResult {
  const { message, stage, villas, villaId } = input;
  const norm = normalizeText(message);

  // 1. Demande de contact humain — prioritaire
  if (CONTACT_RE.test(` ${norm} `)) {
    return {
      reply:
        "Bien sûr. Le plus simple est notre formulaire de contact — notre équipe vous répond rapidement, 7 jours sur 7. Vous pouvez aussi me laisser votre question ici.",
      quickReplies: quickRepliesForStage("contact"),
      matchedFaqId: "contact-humain",
      link: "/contact",
    };
  }

  // 2. Demande de prix — estimation locale si durée détectable
  if (PRICE_RE.test(` ${norm} `)) {
    const nights = parseStayNights(message);
    const estimate = nights ? buildPriceEstimate(villas, nights, villaId) : null;
    return {
      reply:
        estimate ??
        "Nos tarifs varient selon la villa et la saison — chaque villa affiche son prix par nuit sur sa page. Donnez-moi vos dates et le nombre de voyageurs, je vous fais une estimation.",
      quickReplies: ["Voir les villas", "Faire une estimation", "Contacter le concierge"],
      matchedFaqId: "tarifs",
      link: "/villas",
    };
  }

  // 3. FAQ voyageur + propriétaire
  const entries: FaqEntry[] = [...FAQ_CATEGORIES.voyageur, ...FAQ_CATEGORIES.proprietaire];
  const match = matchFaq(message, entries);
  if (match) {
    return {
      reply: match.entry.answer,
      quickReplies: match.entry.quickReplies ?? quickRepliesForStage(stage),
      matchedFaqId: match.entry.id,
      link: match.entry.link,
    };
  }

  // 4. Générique + suggestions du stage
  const count = villas.length;
  return {
    reply:
      `Notre assistant est momentanément indisponible, mais je reste là pour l'essentiel : nous proposons ${count} villa${count > 1 ? "s" : ""} de standing en Martinique avec conciergerie privée. Posez-moi votre question autrement, ou contactez directement notre équipe.`,
    quickReplies: quickRepliesForStage(stage),
    matchedFaqId: null,
    link: "/contact",
  };
}
```

- [ ] **Step 4: Vérifier que les tests passent**

Run: `npx vitest run lib/chatbot/public-fallback.test.ts`
Expected: PASS (13 tests). Attention au test « prix pour 5 nuits » : `PRICE_RE` matche `prix` → branche 2 → `parseStayNights` retourne 5 → estimation avec 900 (5 × 180). Le test « du 28 juillet au 3 août » : juillet = 31 jours → 31 − 28 + 3 = 6.

- [ ] **Step 5: Commit**

```bash
git add lib/chatbot/public-fallback.ts lib/chatbot/public-fallback.test.ts
git commit -m "feat(chatbot): fallback public offline — FAQ, détection contact/prix, estimation par dates, quick replies par stage"
```

---

### Task 6: Câblage agent public — `app/api/chat/route.ts`

**Files:**
- Modify: `app/api/chat/route.ts:21-43` (buildFallbackResponse) et `app/api/chat/route.ts:230-259` (payload villaId)

**Interfaces:**
- Consumes: `buildPublicFallback` (Task 5), `logChatbotFeedback` (Task 1).
- Produces: rien de nouveau — la route garde exactement le même contrat de réponse (`ChatbotResponse`).

- [ ] **Step 1: Remplacer buildFallbackResponse**

Dans `app/api/chat/route.ts`, ajouter les imports :

```ts
import { buildPublicFallback } from "@/lib/chatbot/public-fallback";
import { logChatbotFeedback } from "@/lib/chatbot/feedback";
```

Remplacer la fonction `buildFallbackResponse` (lignes 21-43) par :

```ts
// Réponse de fallback si n8n est indisponible — moteur FAQ offline
function buildFallbackResponse(
  sessionId: string,
  villaCount: number,
  reason: "no_webhook" | "timeout" | "error",
  opts?: { message?: string; stage?: string; villas?: import("@/types/chatbot").VillaContextItem[]; villaId?: string }
): ChatbotResponse {
  const fb = buildPublicFallback({
    message: opts?.message ?? "",
    stage: opts?.stage ?? "greet",
    villas: opts?.villas ?? [],
    villaId: opts?.villaId,
  });

  // Log fire-and-forget des questions sans réponse (pas de await)
  if (opts?.message) {
    void logChatbotFeedback({
      agent: "public",
      sessionId,
      question: opts.message,
      matched: fb.matchedFaqId !== null,
    });
  }

  const suffix =
    reason === "no_webhook" && process.env.NODE_ENV === "development"
      ? "\n\n(Mode démonstration — configurez N8N_WEBHOOK_URL)"
      : "";

  return {
    success: true,
    reply: fb.reply + suffix,
    sessionId,
    stage: "fallback",
    cta: fb.link ? { type: "link", url: fb.link } : undefined,
    suggestedQuickReplies: fb.quickReplies,
  } as ChatbotResponse;
}
```

Note : vérifier dans `types/chatbot.ts` la forme exacte de `cta` (`{ type, url? }` ou autre). Si `cta.type: "link"` n'existe pas dans le type, utiliser la valeur du type existante la plus proche (ex. `{ type: "none" }` + le lien inclus en fin de `reply`). Ne pas modifier le type `cta` (contrat frontend).

- [ ] **Step 2: Mettre à jour les 4 appels de buildFallbackResponse**

Dans la même route, remplacer chaque appel :
- ligne ~234 : `buildFallbackResponse(sessionId, villas.length, "no_webhook", { message: sanitized.sanitized, stage: body.currentStage ?? "greet", villas, villaId: apiInput?.villaId })` — attention : ce call est AVANT la construction d'apiInput → passer `typeof body.villaId === "string" ? body.villaId : undefined`.
- ligne ~276 (`n8n error status`) et ~284 (`unparseable`) et ~331 (catch timeout/error) : mêmes options `{ message: sanitized.sanitized, stage: body.currentStage ?? "greet", villas, villaId: typeof body.villaId === "string" ? body.villaId : undefined }`.

- [ ] **Step 3: Vérification manuelle**

Run: `npx vitest run lib/chatbot` puis `npx tsc --noEmit 2>&1 | head -20`
Expected: tests PASS ; pas de nouvelle erreur TypeScript dans `app/api/chat/route.ts` (le repo peut avoir des erreurs préexistantes ailleurs — comparer avant/après si besoin).

Test manuel (dev server déjà lancé sur 3001, sinon `npm run dev -- -p 3001` en arrière-plan) :

```bash
curl -s -X POST http://localhost:3001/api/chat -H 'Content-Type: application/json' \
  -d '{"message":"quelle est votre commission ?","sessionId":"test-plan"}' | head -c 400
```
Expected (si N8N_WEBHOOK_URL absent en local) : JSON avec `reply` contenant « 22 % » et « 20 % ».

- [ ] **Step 4: Commit**

```bash
git add app/api/chat/route.ts
git commit -m "feat(chatbot): agent public branché sur le fallback FAQ offline + log chatbot_feedback"
```

---

### Task 7: `visitor-context` — prompt consolidé + FAQ (le cerveau du Bot A)

**Files:**
- Modify: `app/api/agent/visitor-context/route.ts`

**Interfaces:**
- Consumes: `faqForPrompt` (Task 3), `CONCIERGERIE_FACTS` (Task 4).
- Produces: réponse JSON `{ context: { villas, availableAmenities, villaCount, conciergerieFacts, faq }, systemPrompt }` — le champ `faq` est nouveau ; `systemPrompt` intègre désormais le tunnel de stages complet (source de vérité unique, le hardcode n8n sera supprimé en Task 13).

- [ ] **Step 1: Ajouter la FAQ au contexte**

Dans `app/api/agent/visitor-context/route.ts`, ajouter l'import :

```ts
import { faqForPrompt } from "@/lib/chatbot/faq";
```

Dans le `NextResponse.json({ context: { ... } })`, ajouter au contexte :

```ts
      faq: faqForPrompt(["voyageur", "proprietaire"]),
```

- [ ] **Step 2: Remplacer le systemPrompt par la version consolidée**

Remplacer entièrement la template string `systemPrompt` par :

```ts
    systemPrompt: `Tu es le Concierge IA de Kayvila, conciergerie de villas de standing en Martinique (site : kayvila.vercel.app, base : Fort-de-France). Tu t'exprimes en français, avec élégance, sobriété et précision.

TON :
- Vouvoiement systématique, phrases courtes (1-2 lignes par paragraphe)
- Chaleureux et fier de la Martinique, jamais arrogant
- Aucun emoji, aucune formule vide (« Bien sûr », « Avec plaisir »)

RÈGLES ABSOLUES :
1. Ne JAMAIS confirmer une disponibilité sans vérification explicite dans les données fournies
2. Ne JAMAIS inventer un prix, un équipement ou un service absent des données
3. Si une info est inconnue : « Nous vérifions et vous confirmons cela dans la journée »
4. Si le visiteur demande un humain, passer immédiatement en stage handoff
5. Réponses appuyées sur le CATALOGUE, les FAITS CONCIERGERIE et la FAQ OFFICIELLE fournis

DOUBLE CONVERSION — deux profils :
1. VOYAGEUR (cherche à séjourner) : aider à trouver la villa idéale, qualifier (dates, budget, voyageurs), proposer un pré-booking quand il est prêt.
2. PROPRIÉTAIRE (veut confier sa villa) : répondre avec les FAITS CONCIERGERIE et la FAQ (commission 22 % direct / 20 % OTA, minimum 50 €/mois après 3 mois d'essai), l'inviter à soumettre sa villa via le lien fourni, ne JAMAIS lui proposer une villa du catalogue, émettre ownerLead.

STAGES DE CONVERSATION (dans l'ordre) :
- greet : accueillir chaleureusement, 1 seul échange, puis discover
- discover : questions ouvertes (dates, budget, nombre, ambiance), 1-3 échanges
- clarify : 1 seule question par échange, max 2 échanges
- recommend : présenter 1-2 villas MAXIMUM avec leurs atouts
- qualify : collecter les infos manquantes, max 2 questions par échange
- verify : récapituler TOUS les slots collectés, demander confirmation, 1 échange
- prebook : confirmer et proposer le lien de réservation
- ownerlead : tunnel propriétaire (voir DOUBLE CONVERSION)
- handoff : « Notre équipe vous contactera personnellement dans les plus brefs délais. »
- fallback : réorienter poliment vers Kayvila

LEAD TEMPERATURE : cold (aucun critère) → exploratoire ; warm (≥1 critère) → qualifier ; hot (dates + villa + budget + contact) → pré-booker.

SLOTS OBLIGATOIRES PRÉ-BOOKING : checkIn (date future AAAA-MM-JJ), checkOut (min 2 nuits), totalGuests (≤ capacité villa), email valide. Ordre de collecte : firstName, totalGuests, checkIn+checkOut, email (jamais avant intérêt manifeste), phone (optionnel).

ESCALADE HUMAINE (stage handoff + shouldEscalateToHuman=true) : demande explicite d'humain, suivi d'une réservation existante, frustration détectée, ou 3 échanges sans progression.

FORMAT DE RÉPONSE — UNIQUEMENT ce JSON, rien avant/après, reply en texte brut sans markdown ni emoji :
{"reply":"...","stage":"greet|discover|clarify|recommend|qualify|verify|prebook|ownerlead|handoff|fallback","intent":"booking_inquiry|general_info|availability|pricing|unsupported|booking_followup","leadTemperature":"cold|warm|hot","suggestedQuickReplies":["..."],"preBooking":null,"ownerLead":null,"shouldEscalateToHuman":false}

PRÉ-BOOKING (en stage verify confirmé) : {"villaId":"valeur (ref: ...) du catalogue, jamais inventée","email":"...","startDate":"AAAA-MM-JJ","endDate":"AAAA-MM-JJ","guests":4,"firstName":"..."}

OWNERLEAD (profil propriétaire) : {"villasCount":N,"location":"...","email":"...","name":"..."} — inclure le lien complet de soumission dans reply : https://kayvila.vercel.app/soumettre-ma-villa

FAQ OFFICIELLE (réponses de référence — reformuler avec ton ton, ne jamais contredire) :
${faqForPrompt(["voyageur", "proprietaire"]).map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n")}`,
```

- [ ] **Step 3: Vérifier**

Run: `npx tsc --noEmit 2>&1 | grep visitor-context; echo done`
Expected: `done` sans erreur. Puis :

```bash
curl -s http://localhost:3001/api/agent/visitor-context | python3 -c "import json,sys; d=json.load(sys.stdin); print('faq entries:', len(d['context']['faq'])); print('stages ok:', 'ownerlead' in d['systemPrompt']); print('2020 ok:', '20 % OTA' in d['systemPrompt'] or '20 %' in d['systemPrompt'])"
```
Expected: `faq entries: 18`, `stages ok: True`, `2020 ok: True`.

- [ ] **Step 4: Commit**

```bash
git add app/api/agent/visitor-context/route.ts
git commit -m "feat(agent-a): systemPrompt visiteur consolidé (tunnel complet, source unique) + FAQ officielle injectée"
```

---

### Task 8: Fallback + commandes locales admin — `lib/admin-chat-fallback.ts` (TDD)

**Files:**
- Create: `lib/admin-chat-fallback.ts`
- Test: `lib/admin-chat-fallback.test.ts`
- Modify: `lib/admin-assistant-context.ts` (ajouter `computeAdminInsights` à la fin)
- Test: `lib/admin-assistant-context.test.ts` (ajouter un describe — lire le fichier avant, ajouter à la fin)

**Interfaces:**
- Consumes: `computeOccupancyByVilla`, `computeAdminAlerts`, `buildDailyBriefing`, `AdminAnalyticsInput` (existants dans `lib/admin-assistant-context.ts`).
- Produces:
  - `computeAdminInsights(input: AdminInsightsInput): AdminInsights` dans `lib/admin-assistant-context.ts` avec :
    ```ts
    export type AdminInsightsInput = {
      revenue_this_month: number;
      revenue_last_month: number;
      villas: { id: string; name: string; is_published: boolean; has_photo: boolean }[];
      owners: { id: string; full_name: string | null; connect_completed: boolean }[];
      overdue_tasks: number;
      submissions_received: number;
      ota_channels_with_errors: string[];
    };
    export type AdminInsights = {
      revenue_delta_pct: number | null;
      villas_without_photo: { id: string; name: string }[];
      owners_without_connect: { id: string; name: string | null }[];
      top_actions: string[]; // max 3, français
    };
    ```
  - `parseAdminCommand(message: string, todayStr: string): AdminLocalCommand` dans `lib/admin-chat-fallback.ts` avec :
    ```ts
    export type AdminLocalCommand =
      | { type: "create_task"; title: string; dueDate: string | null }
      | { type: "complete_task"; taskRef: string }
      | { type: "note_client"; client: string; note: string }
      | null;
    ```
  - `buildAdminFallbackReply(message: string, ctx: AdminFallbackContext): { text: string; action: string; suggestions: string[]; matchedFaqId: string | null }` avec :
    ```ts
    export type AdminFallbackContext = {
      contextData: Record<string, any>;      // le contextData existant de la route
      occupancy: Record<string, number>;     // computeOccupancyByVilla
      villaNames: Record<string, string>;    // id → name
      alerts: { severity: string; label: string }[]; // computeAdminAlerts (mappé)
      briefing: { checkins_today: number; checkouts_today: number; submissions_pending: number; highlights: string[] };
      insights: AdminInsights;
      checkins7d: { guest_name: string | null; villa_name: string; start_date: string }[];
    };
    ```

- [ ] **Step 1: Tests `computeAdminInsights` (échec attendu)**

Ajouter à la fin de `lib/admin-assistant-context.test.ts` (lire le fichier d'abord ; réutiliser ses imports vitest) :

```ts
import { computeAdminInsights } from "./admin-assistant-context";

describe("computeAdminInsights", () => {
  const base = {
    revenue_this_month: 6000,
    revenue_last_month: 5000,
    villas: [
      { id: "v1", name: "Villa Azur", is_published: true, has_photo: true },
      { id: "v2", name: "Villa Corail", is_published: true, has_photo: false },
      { id: "v3", name: "Brouillon", is_published: false, has_photo: false },
    ],
    owners: [
      { id: "o1", full_name: "Richard", connect_completed: true },
      { id: "o2", full_name: "Marie", connect_completed: false },
    ],
    overdue_tasks: 2,
    submissions_received: 1,
    ota_channels_with_errors: ["airbnb"],
  };

  it("delta CA en % vs mois dernier", () => {
    expect(computeAdminInsights(base).revenue_delta_pct).toBe(20);
    expect(computeAdminInsights({ ...base, revenue_last_month: 0 }).revenue_delta_pct).toBeNull();
  });

  it("villas publiées sans photo uniquement", () => {
    const r = computeAdminInsights(base);
    expect(r.villas_without_photo).toEqual([{ id: "v2", name: "Villa Corail" }]);
  });

  it("proprios sans Stripe Connect", () => {
    expect(computeAdminInsights(base).owners_without_connect).toEqual([{ id: "o2", name: "Marie" }]);
  });

  it("top 3 actions max, priorisées", () => {
    const r = computeAdminInsights(base);
    expect(r.top_actions.length).toBeLessThanOrEqual(3);
    expect(r.top_actions[0]).toMatch(/OTA|retard/i); // erreurs OTA ou tâches en retard d'abord
  });
});
```

- [ ] **Step 2: Vérifier l'échec puis implémenter `computeAdminInsights`**

Run: `npx vitest run lib/admin-assistant-context.test.ts` → FAIL.

Ajouter à la fin de `lib/admin-assistant-context.ts` :

```ts
// ─── Insights proactifs (Task 8) ─────────────────────────────────────────────

export type AdminInsightsInput = {
  revenue_this_month: number;
  revenue_last_month: number;
  villas: { id: string; name: string; is_published: boolean; has_photo: boolean }[];
  owners: { id: string; full_name: string | null; connect_completed: boolean }[];
  overdue_tasks: number;
  submissions_received: number;
  ota_channels_with_errors: string[];
};

export type AdminInsights = {
  revenue_delta_pct: number | null;
  villas_without_photo: { id: string; name: string }[];
  owners_without_connect: { id: string; name: string | null }[];
  top_actions: string[];
};

export function computeAdminInsights(input: AdminInsightsInput): AdminInsights {
  const {
    revenue_this_month, revenue_last_month, villas, owners,
    overdue_tasks, submissions_received, ota_channels_with_errors,
  } = input;

  const revenue_delta_pct =
    revenue_last_month > 0
      ? Math.round(((revenue_this_month - revenue_last_month) / revenue_last_month) * 100)
      : null;

  const villas_without_photo = villas
    .filter((v) => v.is_published && !v.has_photo)
    .map((v) => ({ id: v.id, name: v.name }));

  const owners_without_connect = owners
    .filter((o) => !o.connect_completed)
    .map((o) => ({ id: o.id, name: o.full_name }));

  // Actions recommandées, par criticité : OTA > tâches en retard > soumissions > photos > Connect
  const actions: string[] = [];
  if (ota_channels_with_errors.length > 0)
    actions.push(`Vérifier la synchro OTA en erreur (${ota_channels_with_errors.join(", ")})`);
  if (overdue_tasks > 0)
    actions.push(`Traiter ${overdue_tasks} tâche(s) en retard`);
  if (submissions_received > 0)
    actions.push(`Répondre à ${submissions_received} soumission(s) de villa en attente`);
  if (villas_without_photo.length > 0)
    actions.push(`Ajouter des photos à ${villas_without_photo.map((v) => v.name).join(", ")}`);
  if (owners_without_connect.length > 0)
    actions.push(`Relancer l'onboarding Stripe Connect de ${owners_without_connect.length} propriétaire(s)`);

  return {
    revenue_delta_pct,
    villas_without_photo,
    owners_without_connect,
    top_actions: actions.slice(0, 3),
  };
}
```

Run: `npx vitest run lib/admin-assistant-context.test.ts` → PASS.

- [ ] **Step 3: Tests `parseAdminCommand` + `buildAdminFallbackReply` (échec attendu)**

```ts
// lib/admin-chat-fallback.test.ts
import { describe, it, expect } from "vitest";
import { parseAdminCommand, buildAdminFallbackReply, type AdminFallbackContext } from "./admin-chat-fallback";

describe("parseAdminCommand", () => {
  const today = "2026-07-05";

  it("créer une tâche (avec échéance demain)", () => {
    const c = parseAdminCommand("Crée une tâche vérifier la piscine pour demain", today);
    expect(c).toEqual({ type: "create_task", title: "vérifier la piscine", dueDate: "2026-07-06" });
  });

  it("créer une tâche sans échéance", () => {
    const c = parseAdminCommand("ajoute une tâche : rappeler le plombier", today);
    expect(c).toEqual({ type: "create_task", title: "rappeler le plombier", dueDate: null });
  });

  it("marquer une tâche faite par référence", () => {
    const c = parseAdminCommand("marque la tâche #123 comme faite", today);
    expect(c).toEqual({ type: "complete_task", taskRef: "123" });
  });

  it("note sur un client", () => {
    const c = parseAdminCommand("Ajoute une note sur le client Dupont : préfère arriver après 18h", today);
    expect(c).toEqual({ type: "note_client", client: "Dupont", note: "préfère arriver après 18h" });
  });

  it("question normale → null", () => {
    expect(parseAdminCommand("quel est le taux d'occupation ?", today)).toBeNull();
  });
});

const ctx: AdminFallbackContext = {
  contextData: {
    villas_summary: { total: 3, published: 2, draft: 1 },
    bookings_summary: { total: 10, confirmed: 7, pending: 2, checkins_today: 1, checkins_48h: 2, checkins_7d: 4, checkouts_today: 0 },
    tasks_summary: { total: 5, overdue: 2, due_today: 1, pending: 3, in_progress: 1 },
    finances: { revenue_total: 20000, revenue_this_month: 6000, revenue_last_month: 5000, pending_payments: 1, revenue_by_villa: [ { villa_name: "Villa Azur", revenue: 12000, bookings_count: 6 }, { villa_name: "Villa Corail", revenue: 8000, bookings_count: 4 } ], monthly_revenue: [] },
    submissions_summary: { total: 2, received: 1, in_progress: 1, approved: 0, needs_photos: 1 },
    ota_health: { last_sync: "2026-07-04T10:00:00Z", recent_errors: [{ villa_id: "v1", source: "airbnb", error: "404 ical", synced_at: "2026-07-04T10:00:00Z" }], channels_with_errors: ["airbnb"] },
  },
  occupancy: { v1: 80, v2: 40 },
  villaNames: { v1: "Villa Azur", v2: "Villa Corail" },
  alerts: [{ severity: "high", label: "Conflit de réservation sur Villa Azur" }],
  briefing: { checkins_today: 1, checkouts_today: 0, submissions_pending: 1, highlights: ["1 check-in(s) aujourd'hui"] },
  insights: { revenue_delta_pct: 20, villas_without_photo: [], owners_without_connect: [], top_actions: ["Vérifier la synchro OTA en erreur (airbnb)"] },
  checkins7d: [{ guest_name: "M. Martin", villa_name: "Villa Azur", start_date: "2026-07-07" }],
};

describe("buildAdminFallbackReply", () => {
  it("salutation → briefing du jour + alertes en tête", () => {
    const r = buildAdminFallbackReply("bonjour", ctx);
    expect(r.text).toContain("Conflit de réservation");
    expect(r.text).toContain("check-in");
    expect(r.matchedFaqId).toBe("briefing");
  });

  it("occupation → taux par villa", () => {
    const r = buildAdminFallbackReply("quel est le taux d'occupation ?", ctx);
    expect(r.text).toContain("Villa Azur");
    expect(r.text).toContain("80");
  });

  it("top villas → classement par revenu", () => {
    const r = buildAdminFallbackReply("quelles sont les meilleures villas ?", ctx);
    expect(r.text.indexOf("Villa Azur")).toBeLessThan(r.text.indexOf("Villa Corail"));
  });

  it("check-ins semaine → noms + villas", () => {
    const r = buildAdminFallbackReply("check-ins de la semaine ?", ctx);
    expect(r.text).toContain("M. Martin");
    expect(r.text).toContain("Villa Azur");
  });

  it("OTA → erreurs détaillées", () => {
    const r = buildAdminFallbackReply("des erreurs de sync ota ?", ctx);
    expect(r.text).toContain("airbnb");
    expect(r.text).toContain("404 ical");
  });

  it("revenus → CA + delta vs mois dernier", () => {
    const r = buildAdminFallbackReply("le chiffre du mois ?", ctx);
    expect(r.text).toContain("6");
    expect(r.text).toContain("+20");
  });

  it("texte brut : pas de markdown ni d'emoji", () => {
    for (const q of ["bonjour", "occupation ?", "revenus ?"]) {
      const t = buildAdminFallbackReply(q, ctx).text;
      expect(t).not.toMatch(/\*\*|##|[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it("question inconnue → résumé général, matchedFaqId null", () => {
    const r = buildAdminFallbackReply("blabla incompréhensible", ctx);
    expect(r.matchedFaqId).toBeNull();
    expect(r.text).toContain("3 villa");
  });
});
```

- [ ] **Step 4: Vérifier l'échec puis implémenter**

Run: `npx vitest run lib/admin-chat-fallback.test.ts` → FAIL (module inexistant).

```ts
// lib/admin-chat-fallback.ts
// Fallback + commandes locales de l'agent admin — fonctions pures, testables.
// Texte brut uniquement (pas de markdown/emoji — cohérent avec les prompts n8n).

import { matchFaq, FAQ_CATEGORIES, normalizeText } from "@/lib/chatbot/faq";
import type { AdminInsights } from "@/lib/admin-assistant-context";

// ─── Commandes locales (exécutées quand n8n est indisponible) ────────────────

export type AdminLocalCommand =
  | { type: "create_task"; title: string; dueDate: string | null }
  | { type: "complete_task"; taskRef: string }
  | { type: "note_client"; client: string; note: string }
  | null;

function addDays(d: string, n: number): string {
  return new Date(Date.parse(d + "T00:00:00Z") + n * 86_400_000).toISOString().slice(0, 10);
}

export function parseAdminCommand(message: string, todayStr: string): AdminLocalCommand {
  const msg = message.trim();

  // Note client — AVANT create_task (contient aussi « ajoute »)
  const note = msg.match(
    /(?:ajoute|mets?)\s+une\s+note\s+sur\s+(?:le\s+client\s+|la\s+cliente\s+|le\s+|la\s+)?(.+?)\s*:\s*(.+)/i
  );
  if (note) {
    return { type: "note_client", client: note[1].trim(), note: note[2].trim() };
  }

  // Tâche faite : « marque la tâche #123 comme faite / terminée »
  const done = msg.match(/t[âa]che\s*#?\s*([\w-]+)\s+(?:comme\s+)?(?:faite?|termin[ée]e?|finie?|done)/i);
  if (done) {
    return { type: "complete_task", taskRef: done[1] };
  }

  // Créer une tâche : « crée/ajoute une tâche [:] <titre> [pour demain|aujourd'hui] »
  const create = msg.match(/(?:cr[ée]{1,2}[er]*|ajoute[rz]?)\s+(?:une\s+)?t[âa]che\s*:?\s+(.+)/i);
  if (create) {
    let title = create[1].trim();
    let dueDate: string | null = null;
    const norm = normalizeText(title);
    if (/\bpour demain\b/.test(norm)) {
      dueDate = addDays(todayStr, 1);
      title = title.replace(/\s*pour\s+demain\s*$/i, "").trim();
    } else if (/\bpour aujourd hui\b/.test(norm)) {
      dueDate = todayStr;
      title = title.replace(/\s*pour\s+aujourd'?hui\s*$/i, "").trim();
    }
    if (title) return { type: "create_task", title, dueDate };
  }

  return null;
}

// ─── Fallback data-driven ─────────────────────────────────────────────────────

export type AdminFallbackContext = {
  contextData: Record<string, any>;
  occupancy: Record<string, number>;
  villaNames: Record<string, string>;
  alerts: { severity: string; label: string }[];
  briefing: {
    checkins_today: number;
    checkouts_today: number;
    submissions_pending: number;
    highlights: string[];
  };
  insights: AdminInsights;
  checkins7d: { guest_name: string | null; villa_name: string; start_date: string }[];
};

const eur = (n: number | undefined) => (n ?? 0).toLocaleString("fr-FR");

function alertsHeader(ctx: AdminFallbackContext): string {
  if (ctx.alerts.length === 0) return "";
  return "A traiter : " + ctx.alerts.slice(0, 3).map((a) => a.label).join(" | ") + "\n\n";
}

export function buildAdminFallbackReply(
  message: string,
  ctx: AdminFallbackContext
): { text: string; action: string; suggestions: string[]; matchedFaqId: string | null } {
  const msg = normalizeText(message);
  const d = ctx.contextData;
  const fin = d.finances || {};
  const bs = d.bookings_summary || {};
  const ts = d.tasks_summary || {};
  const vs = d.villas_summary || {};
  const sub = d.submissions_summary || {};
  const ota = d.ota_health || {};

  // Salutation → briefing du jour
  if (/^(bonjour|salut|hello|coucou|bonsoir|hey)\b/.test(msg) || msg === "briefing") {
    const b = ctx.briefing;
    const lines = [
      alertsHeader(ctx) + `Briefing du jour :`,
      `- ${b.checkins_today} check-in(s), ${b.checkouts_today} check-out(s) aujourd'hui`,
      `- ${ts.overdue ?? 0} tache(s) en retard, ${b.submissions_pending} soumission(s) en attente`,
      `- CA du mois : ${eur(fin.revenue_this_month)} EUR` +
        (ctx.insights.revenue_delta_pct !== null
          ? ` (${ctx.insights.revenue_delta_pct >= 0 ? "+" : ""}${ctx.insights.revenue_delta_pct}% vs mois dernier)`
          : ""),
      ctx.insights.top_actions.length
        ? `Actions recommandees : ${ctx.insights.top_actions.join(" ; ")}`
        : "",
    ].filter(Boolean);
    return {
      text: lines.join("\n"),
      action: "SHOW_STATS",
      suggestions: ["Check-ins de la semaine ?", "Taux d'occupation ?", "Erreurs OTA ?"],
      matchedFaqId: "briefing",
    };
  }

  // Occupation
  if (/occupation|taux|remplissage/.test(msg)) {
    const rows = Object.entries(ctx.occupancy)
      .sort((a, b) => b[1] - a[1])
      .map(([id, pct]) => `- ${ctx.villaNames[id] ?? id} : ${pct}%`);
    const global = rows.length
      ? Math.round(Object.values(ctx.occupancy).reduce((s, v) => s + v, 0) / rows.length)
      : 0;
    return {
      text: alertsHeader(ctx) + `Taux d'occupation 30 jours : ${global}% en moyenne.\n${rows.join("\n")}`,
      action: "SHOW_VILLAS",
      suggestions: ["Top villas par revenu ?", "Check-ins de la semaine ?"],
      matchedFaqId: "occupation",
    };
  }

  // Top villas
  if (/top|meilleure|classement|performance|revenu par villa/.test(msg)) {
    const top = ((fin.revenue_by_villa as any[]) || [])
      .slice()
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 3)
      .map((v, i) => `${i + 1}. ${v.villa_name} : ${eur(v.revenue)} EUR (${v.bookings_count} resa)`);
    return {
      text: alertsHeader(ctx) + `Top villas par revenu encaisse :\n${top.join("\n")}`,
      action: "SHOW_FINANCES",
      suggestions: ["Taux d'occupation ?", "Revenus du mois ?"],
      matchedFaqId: "top-villas",
    };
  }

  // Check-ins semaine
  if (/check.?in|arrivee|semaine|arrive/.test(msg)) {
    const rows = ctx.checkins7d
      .slice(0, 10)
      .map((c) => `- ${c.start_date} : ${c.guest_name ?? "Client"} — ${c.villa_name}`);
    return {
      text:
        alertsHeader(ctx) +
        (rows.length
          ? `Arrivees sous 7 jours (${rows.length}) :\n${rows.join("\n")}`
          : "Aucune arrivee prevue sous 7 jours."),
      action: "SHOW_BOOKINGS",
      suggestions: ["Check-outs du jour ?", "Reservations en attente ?"],
      matchedFaqId: "checkins-semaine",
    };
  }

  // OTA
  if (/ota|sync|airbnb|booking|ical|erreur/.test(msg)) {
    const errs = ((ota.recent_errors as any[]) || []).map(
      (e) => `- ${e.source} (villa ${ctx.villaNames[e.villa_id] ?? e.villa_id}) : ${e.error}`
    );
    const last = ota.last_sync ? new Date(ota.last_sync).toLocaleString("fr-FR") : "jamais";
    return {
      text:
        alertsHeader(ctx) +
        `Synchro OTA — derniere : ${last}.\n` +
        (errs.length ? `Erreurs recentes :\n${errs.join("\n")}` : "Aucune erreur recente."),
      action: "SHOW_OTA_HEALTH",
      suggestions: ["Forcer une synchro ?", "Briefing du jour ?"],
      matchedFaqId: "ota-sync",
    };
  }

  // Revenus
  if (/revenu|chiffre|\bca\b|encaisse|financ|euro/.test(msg)) {
    const delta =
      ctx.insights.revenue_delta_pct !== null
        ? ` (${ctx.insights.revenue_delta_pct >= 0 ? "+" : ""}${ctx.insights.revenue_delta_pct}% vs mois dernier)`
        : "";
    return {
      text:
        alertsHeader(ctx) +
        `Revenus : ${eur(fin.revenue_this_month)} EUR ce mois${delta}.\n` +
        `Mois dernier : ${eur(fin.revenue_last_month)} EUR. Total encaisse : ${eur(fin.revenue_total)} EUR.\n` +
        `Paiements en attente : ${fin.pending_payments ?? 0}.`,
      action: "SHOW_FINANCES",
      suggestions: ["Top villas ?", "Taux d'occupation ?"],
      matchedFaqId: "revenus",
    };
  }

  // Demandes en attente
  if (/demande|attente|soumission|reclamation/.test(msg)) {
    return {
      text:
        alertsHeader(ctx) +
        `Demandes en attente :\n- Soumissions de villas : ${sub.received ?? 0} recue(s), ${sub.in_progress ?? 0} en cours\n- Paiements en attente : ${fin.pending_payments ?? 0}\n- Taches ouvertes : ${(ts.pending ?? 0) + (ts.in_progress ?? 0)} (dont ${ts.overdue ?? 0} en retard)`,
      action: "SHOW_SUBMISSIONS",
      suggestions: ["Soumissions recentes ?", "Taches en retard ?"],
      matchedFaqId: "demandes",
    };
  }

  // FAQ admin générique (mots-clés restants)
  const m = matchFaq(message, FAQ_CATEGORIES.admin);
  if (m) {
    return {
      text: alertsHeader(ctx) + m.entry.answer,
      action: "SHOW_STATS",
      suggestions: ["Briefing du jour ?", "Taux d'occupation ?"],
      matchedFaqId: m.entry.id,
    };
  }

  // Résumé général
  return {
    text:
      alertsHeader(ctx) +
      `Vue d'ensemble : ${vs.total ?? 0} villa(s) (${vs.published ?? 0} publiee(s)), ` +
      `${bs.checkins_today ?? 0} check-in(s) aujourd'hui, ${ts.overdue ?? 0} tache(s) en retard, ` +
      `${eur(fin.revenue_this_month)} EUR ce mois-ci, ${sub.received ?? 0} soumission(s) en attente.\n` +
      `Que puis-je faire pour vous ?`,
    action: "SHOW_STATS",
    suggestions: ["Briefing du jour ?", "Check-ins de la semaine ?", "Revenus du mois ?"],
    matchedFaqId: null,
  };
}
```

- [ ] **Step 5: Vérifier que tous les tests passent**

Run: `npx vitest run lib/admin-chat-fallback.test.ts lib/admin-assistant-context.test.ts`
Expected: PASS. Point d'attention : le test « le chiffre du mois ? » passe par la branche revenus (`chiffre`) ; « quelles sont les meilleures villas ? » par `meilleure` ; « blabla incompréhensible » ne matche aucune branche ni FAQ admin → résumé.

- [ ] **Step 6: Commit**

```bash
git add lib/admin-chat-fallback.ts lib/admin-chat-fallback.test.ts lib/admin-assistant-context.ts lib/admin-assistant-context.test.ts
git commit -m "feat(admin-chat): fallback data-driven (briefing, occupation, top villas, OTA, check-ins) + commandes locales + insights proactifs"
```

---

### Task 9: Câblage route admin — token n8n (P0), actions locales, insights, statut tâches

**Files:**
- Modify: `app/api/admin/chat/route.ts`

**Interfaces:**
- Consumes: `buildAdminFallbackReply`, `parseAdminCommand`, `AdminFallbackContext` (Task 8) ; `computeAdminInsights`, `computeOccupancyByVilla`, `computeAdminAlerts`, `buildDailyBriefing` (existants) ; `logChatbotFeedback` (Task 1) ; `getSupabaseServer` de `@/lib/supabase-server`.
- Produces: la route renvoie le même contrat (`response`, `action`, `action_data`, `suggested_prompts`) ; payload n8n enrichi de `token`.

- [ ] **Step 1: Forward du token vers n8n (P0 #1)**

Ajouter les imports :

```ts
import { getSupabaseServer } from "@/lib/supabase-server";
import { buildAdminFallbackReply, parseAdminCommand, type AdminFallbackContext } from "@/lib/admin-chat-fallback";
import { computeAdminInsights } from "@/lib/admin-assistant-context";
import { logChatbotFeedback } from "@/lib/chatbot/feedback";
```

Dans `POST`, après `const userId = await requireAdmin(request);`, ajouter :

```ts
    // Token Supabase pour l'auth du bot n8n (Fetch Admin Context) — P0 audit :
    // sans lui, le workflow reçoit Bearer vide → 401 → jamais de LLM.
    let n8nToken = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    if (!n8nToken) {
      try {
        const supaSrv = await getSupabaseServer();
        const { data: { session } } = await supaSrv.auth.getSession();
        n8nToken = session?.access_token ?? "";
      } catch { /* cookie session absente — on envoie vide, le bot répondra 401 */ }
    }
```

Puis dans le `body: JSON.stringify({...})` de l'appel webhook, ajouter le champ :

```ts
          token: n8nToken,
```

- [ ] **Step 2: Construire le contexte fallback enrichi**

Dans `POST`, après `const { contextData, villas, bookings, tasks, submissions, otaLogs, today, todayStr } = await gatherAdminContext(supabase);`, ajouter :

```ts
    // ── Analytics + insights pour fallback/démo (fonctions pures) ────────────
    const profilesRes = await supabase
      .from("profiles")
      .select("id, full_name, role, stripe_connect_onboarding_completed")
      .limit(200);
    const profiles = profilesRes.data ?? [];

    const villasFullRes = await supabase
      .from("villas")
      .select("id, name, is_published, image_url, image_urls")
      .limit(200);
    const villasFull = villasFullRes.data ?? [];

    const analyticsInput = {
      today: todayStr,
      villas: villas.map((v: any) => ({ id: String(v.id), name: String(v.name ?? "Villa") })),
      bookings: bookings.map((b: any) => ({
        villa_id: String(b.villa_id), start_date: String(b.start_date), end_date: String(b.end_date),
        status: String(b.status ?? ""), payment_status: String(b.payment_status ?? ""),
      })),
      blocks: [],
      tasks: tasks.map((t: any) => ({ id: String(t.id), villa_id: String(t.villa_id), status: String(t.status ?? ""), due_date: t.due_date ?? null })),
      reviews: [],
      submissions: submissions.map((s: any) => ({ id: String(s.id), status: String(s.status ?? ""), created_at: String(s.created_at), owner_name: s.owner_name, villa_name: s.villa_name })),
      revenueByVilla: {},
      revenueLastMonthByVilla: {},
    };

    const insights = computeAdminInsights({
      revenue_this_month: (contextData.finances as any).revenue_this_month ?? 0,
      revenue_last_month: (contextData.finances as any).revenue_last_month ?? 0,
      villas: villasFull.map((v: any) => ({
        id: String(v.id), name: String(v.name ?? "Villa"),
        is_published: !!v.is_published,
        has_photo: !!v.image_url || (Array.isArray(v.image_urls) && v.image_urls.length > 0),
      })),
      owners: profiles
        .filter((p: any) => ["owner", "proprietaire", "proprio"].includes(String(p.role)))
        .map((p: any) => ({ id: String(p.id), full_name: p.full_name ?? null, connect_completed: !!p.stripe_connect_onboarding_completed })),
      overdue_tasks: (contextData.tasks_summary as any).overdue ?? 0,
      submissions_received: (contextData.submissions_summary as any).received ?? 0,
      ota_channels_with_errors: ((contextData.ota_health as any).channels_with_errors as string[]) ?? [],
    });

    // Insights envoyés aussi à n8n via contextData
    (contextData as any).insights = insights;

    const villaNames: Record<string, string> = Object.fromEntries(
      villas.map((v: any) => [String(v.id), String(v.name ?? "Villa")])
    );

    const fallbackCtx: AdminFallbackContext = {
      contextData,
      occupancy: computeOccupancyByVilla(analyticsInput),
      villaNames,
      alerts: computeAdminAlerts(analyticsInput).map((a) => ({ severity: a.severity, label: a.label })),
      briefing: buildDailyBriefing(analyticsInput),
      insights,
      checkins7d: bookings
        .filter((b: any) => b.start_date >= todayStr && b.start_date <= addDays(todayStr, 7) && b.status !== "cancelled")
        .map((b: any) => ({
          guest_name: b.guest_name ?? null,
          villa_name: villaNames[String(b.villa_id)] ?? "Villa",
          start_date: String(b.start_date),
        })),
    };
```

(`computeOccupancyByVilla`, `computeAdminAlerts`, `buildDailyBriefing` sont déjà importés en tête de route.)

- [ ] **Step 3: Fallback unifié + actions locales**

Créer dans la route une fonction locale qui remplace le « mode démo » et les deux fallbacks pauvres :

```ts
    // Réponse locale unifiée (mode démo ET panne n8n) — actions locales incluses
    async function localReply(reason: string) {
      const cmd = parseAdminCommand(message.trim(), todayStr);
      if (cmd?.type === "create_task") {
        const { data: created, error } = await supabase.from("tasks").insert({
          title: cmd.title, type: "other", status: "pending", due_date: cmd.dueDate,
        }).select("id").single();
        return NextResponse.json({
          success: true,
          response: error
            ? `Impossible de créer la tâche : ${error.message}`
            : `Tâche créée : « ${cmd.title} »${cmd.dueDate ? ` (échéance ${cmd.dueDate})` : ""} — #${created?.id}`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Mes tâches en retard ?", "Briefing du jour ?"],
          request_id, metadata: { source: "local", reason },
        });
      }
      if (cmd?.type === "complete_task") {
        const { error, count } = await supabase.from("tasks")
          .update({ status: "done", completed_at: new Date().toISOString() }, { count: "exact" })
          .eq("id", cmd.taskRef);
        return NextResponse.json({
          success: true,
          response: error || !count
            ? `Tâche #${cmd.taskRef} introuvable ou non modifiable.`
            : `Tâche #${cmd.taskRef} marquée comme faite.`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Tâches restantes ?", "Briefing du jour ?"],
          request_id, metadata: { source: "local", reason },
        });
      }
      if (cmd?.type === "note_client") {
        const { error } = await supabase.from("tasks").insert({
          title: `Note — ${cmd.client} : ${cmd.note}`.slice(0, 200),
          type: "other", status: "pending",
        });
        return NextResponse.json({
          success: true,
          response: error
            ? `Impossible d'enregistrer la note : ${error.message}`
            : `Note enregistrée sur ${cmd.client} (visible dans les tâches).`,
          action: "SHOW_TASKS", action_data: contextData,
          suggested_prompts: ["Voir les tâches ?"],
          request_id, metadata: { source: "local", reason },
        });
      }

      const local = buildAdminFallbackReply(message.trim(), fallbackCtx);
      void logChatbotFeedback({
        agent: "admin", sessionId: sessionid ?? null,
        question: message.trim(), matched: local.matchedFaqId !== null,
      });
      return NextResponse.json({
        success: true,
        response: local.text,
        action: local.action, action_data: contextData,
        suggested_prompts: local.suggestions,
        request_id, metadata: { source: "local", reason },
      });
    }
```

Puis :
1. Remplacer le bloc `if (!webhookURL) { ...buildAdminDemoReply... }` par `if (!webhookURL) return localReply("no_webhook");`
2. Remplacer le `return NextResponse.json({ ...snapshot... })` du `catch (fetchErr)` par `return localReply("n8n_unreachable");`
3. Remplacer celui du `if (!webhookRes.ok)` par ``return localReply(`n8n_status_${webhookRes.status}`);``
4. Supprimer entièrement la fonction `buildAdminDemoReply` (lignes 31-118) — remplacée par `buildAdminFallbackReply`.

- [ ] **Step 4: Fix P2 #12 — statut de tâche unifié**

Dans le handler `CREATE_TASK` existant (action n8n, ligne ~470), remplacer `status: "todo"` par `status: "pending"`.

- [ ] **Step 5: Vérifier**

Run: `npx tsc --noEmit 2>&1 | grep "admin/chat" ; echo done` → `done` sans erreur.
Run: `npx vitest run lib` → PASS.
Test manuel (session admin requise — si pas de token sous la main, vérifier au moins que la route ne crashe pas) :

```bash
curl -s -X POST http://localhost:3001/api/admin/chat -H 'Content-Type: application/json' -d '{"message":"bonjour"}' | head -c 200
```
Expected: `401` propre (auth requise) — pas de 500.

- [ ] **Step 6: Commit**

```bash
git add app/api/admin/chat/route.ts
git commit -m "feat(admin-chat): token n8n forwardé (fix P0), fallback unifié data-driven, actions locales sans n8n, statut tâches unifié"
```

---

### Task 10: `admin-context` — FAQ + insights pour le Bot C

**Files:**
- Modify: `app/api/agent/admin-context/route.ts`

**Interfaces:**
- Consumes: `computeAdminInsights` (Task 8), `faqForPrompt` (Task 3).
- Produces: réponse JSON enrichie — `context.insights`, `context.faq` ; `systemPrompt` complété (FAQ + insights).

- [ ] **Step 1: Enrichir le contexte**

Ajouter les imports :

```ts
import { computeAdminInsights } from "@/lib/admin-assistant-context";
import { faqForPrompt } from "@/lib/chatbot/faq";
```

Dans `gatherAdminContext` de CE fichier, le select `profiles` (ligne ~44) devient :

```ts
    supabase.from("profiles").select("id,role,full_name,email,phone,stripe_connect_onboarding_completed").order("created_at", { ascending: false }),
```

et le select `villas` (ligne ~37) devient :

```ts
    supabase.from("villas").select("id,name,price_per_night,seasonal_prices,owner_id,status,cancellation_policy,currency,is_published,image_url,image_urls").order("name"),
```

Dans `GET`, après la construction de `contextData`, ajouter :

```ts
    const insights = computeAdminInsights({
      revenue_this_month: contextData.finances.revenue_this_month,
      revenue_last_month: contextData.finances.revenue_last_month,
      villas: ctx.villas.map((v: any) => ({
        id: String(v.id), name: String(v.name ?? "Villa"),
        is_published: !!v.is_published,
        has_photo: !!v.image_url || (Array.isArray(v.image_urls) && v.image_urls.length > 0),
      })),
      owners: ctx.profiles
        .filter((p: any) => ["owner", "proprietaire", "proprio"].includes(String(p.role)))
        .map((p: any) => ({ id: String(p.id), full_name: p.full_name ?? null, connect_completed: !!p.stripe_connect_onboarding_completed })),
      overdue_tasks: contextData.tasks_summary.overdue,
      submissions_received: contextData.submissions_summary.received,
      ota_channels_with_errors: contextData.ota_health.channels_with_errors as string[],
    });
    (contextData as any).insights = insights;
    (contextData as any).faq = faqForPrompt(["admin"]);
```

- [ ] **Step 2: Compléter le systemPrompt**

À la fin de la template string `systemPrompt` (après « Une seule action par réponse. »), ajouter :

```ts
INSIGHTS PROACTIFS — le contexte contient "insights" : delta CA vs mois dernier, villas publiées sans photo, propriétaires sans onboarding Stripe Connect, top actions recommandées. Mentionne spontanément le plus critique quand l'admin demande un état des lieux ou un briefing.

FAQ INTERNE (référence des demandes types) :
${faqForPrompt(["admin"]).map((f) => `Q: ${f.q} → ${f.a}`).join("\n")}
```

(Concaténer via `` + ` ... ` `` ou inclure dans la même template string.)

- [ ] **Step 3: Vérifier + commit**

Run: `npx tsc --noEmit 2>&1 | grep "admin-context" ; echo done` → `done`.

```bash
git add app/api/agent/admin-context/route.ts
git commit -m "feat(agent-c): insights proactifs + FAQ admin injectés dans le contexte servi au bot n8n"
```

---

### Task 11: Agent proprio — `lib/owner-assistant-reply.ts` (TDD) + câblage route + owner-context

**Files:**
- Create: `lib/owner-assistant-reply.ts`
- Test: `lib/owner-assistant-reply.test.ts`
- Modify: `app/api/dashboard/owner-assistant/route.ts` (smartReply/fallbackReply → nouvelles fonctions ; buildCompactContext enrichi ; feedback)
- Modify: `app/api/agent/owner-context/route.ts` (FAQ + règle 22/20 dans systemPrompt)

**Interfaces:**
- Consumes: `OwnerContextPack` de `@/lib/owner-assistant-context` ; `matchFaq`, `FAQ_CATEGORIES`, `faqForPrompt` (Tasks 2-3) ; `logChatbotFeedback` (Task 1).
- Produces:
  - `buildOwnerReply(pack: OwnerContextPack, message: string): { text: string; matchedFaqId: string | null }` — texte brut, chiffres réels du pack, FAQ proprio en premier recours.
  - `buildOwnerFallbackText(pack: OwnerContextPack): string`
  - `ownerInsights(pack: OwnerContextPack): { revenue_delta_pct: number | null; next_arrival: { villa_name: string; guest_name: string | null; start_date: string } | null; occupancy_30d: number }`

- [ ] **Step 1: Tests (échec attendu)**

```ts
// lib/owner-assistant-reply.test.ts
import { describe, it, expect } from "vitest";
import { buildOwnerReply, buildOwnerFallbackText, ownerInsights } from "./owner-assistant-reply";
import type { OwnerContextPack } from "./owner-assistant-context";

const pack: OwnerContextPack = {
  current_date_iso: "2026-07-05T12:00:00.000Z",
  portfolio: {
    total_villas: 2, published_villas: 2,
    total_revenue_paid: 24000, revenue_current_month: 3000, revenue_last_month: 2500,
    upcoming_bookings_count: 2, pending_tasks_count: 1,
  },
  today: [
    { kind: "check_in", villa_id: "v1", villa_name: "Villa Azur", booking_id: "b1", guest_name: "M. Martin", start_date: "2026-07-05", end_date: "2026-07-10" },
  ],
  alerts: [],
  villas: [
    { id: "v1", name: "Villa Azur", is_published: true },
    { id: "v2", name: "Villa Corail", is_published: true },
  ],
  bookings: [
    { id: "b1", villa_id: "v1", start_date: "2026-07-05", end_date: "2026-07-10", status: "confirmed", payment_status: "paid", guest_name: "M. Martin" },
    { id: "b2", villa_id: "v2", start_date: "2026-07-12", end_date: "2026-07-15", status: "confirmed", payment_status: "paid", guest_name: "Mme Leroy" },
  ],
  tasks_open: [{ id: "t1", villa_id: "v1", content: "Vérifier climatisation" }],
};

describe("ownerInsights", () => {
  it("delta CA, prochaine arrivée, occupation", () => {
    const i = ownerInsights(pack);
    expect(i.revenue_delta_pct).toBe(20);
    expect(i.next_arrival?.villa_name).toBe("Villa Azur");
    expect(i.occupancy_30d).toBeGreaterThan(0);
  });
});

describe("buildOwnerReply", () => {
  it("revenus → chiffres réels + delta", () => {
    const r = buildOwnerReply(pack, "mes revenus ce mois ?");
    expect(r.text).toContain("3 000");
    expect(r.text).toContain("+20");
  });

  it("arrivées du jour → utilise kind check_in (fix bug e.type)", () => {
    const r = buildOwnerReply(pack, "qui arrive aujourd'hui ?");
    expect(r.text).toContain("Arrivee");
    expect(r.text).toContain("M. Martin");
  });

  it("question FAQ proprio → réponse 22/20", () => {
    const r = buildOwnerReply(pack, "quelle est votre commission déjà ?");
    expect(r.matchedFaqId).toBe("commission");
    expect(r.text).toContain("22 %");
    expect(r.text).toContain("20 %");
  });

  it("texte brut sans markdown ni emoji", () => {
    for (const q of ["mes revenus ?", "qui arrive ?", "mes villas ?", "peu importe"]) {
      const t = buildOwnerReply(pack, q).text;
      expect(t).not.toMatch(/\*\*|##|[\u{1F300}-\u{1FAFF}]/u);
    }
  });

  it("inconnu → vue d'ensemble, matchedFaqId null", () => {
    const r = buildOwnerReply(pack, "zzz question étrange");
    expect(r.matchedFaqId).toBeNull();
    expect(r.text).toContain("2 villa");
  });
});

describe("buildOwnerFallbackText", () => {
  it("snapshot utile en une phrase", () => {
    const t = buildOwnerFallbackText(pack);
    expect(t).toContain("2 villa");
    expect(t).toContain("1 tache");
  });
});
```

- [ ] **Step 2: Vérifier l'échec puis implémenter**

Run: `npx vitest run lib/owner-assistant-reply.test.ts` → FAIL.

```ts
// lib/owner-assistant-reply.ts
// Réponses locales de l'agent proprio (mode démo + panne n8n).
// Texte brut, chiffres réels du OwnerContextPack, FAQ propriétaire intégrée.

import { matchFaq, FAQ_CATEGORIES, normalizeText } from "@/lib/chatbot/faq";
import type { OwnerContextPack } from "@/lib/owner-assistant-context";

const eur = (n: number) => Math.round(n).toLocaleString("fr-FR");

export function ownerInsights(pack: OwnerContextPack): {
  revenue_delta_pct: number | null;
  next_arrival: { villa_name: string; guest_name: string | null; start_date: string } | null;
  occupancy_30d: number;
} {
  const p = pack.portfolio;
  const revenue_delta_pct =
    p.revenue_last_month > 0
      ? Math.round(((p.revenue_current_month - p.revenue_last_month) / p.revenue_last_month) * 100)
      : null;

  const todayStr = pack.current_date_iso.slice(0, 10);
  const villaNameById = Object.fromEntries(
    (pack.villas as { id?: string; name?: string }[]).map((v) => [String(v.id), String(v.name ?? "Villa")])
  );
  const upcoming = (pack.bookings as { villa_id?: string; start_date?: string; guest_name?: string; status?: string }[])
    .filter((b) => String(b.start_date ?? "") >= todayStr && b.status !== "cancelled")
    .sort((a, b) => String(a.start_date).localeCompare(String(b.start_date)));
  const next = upcoming[0] ?? null;

  // Occupation 30j : nuits réservées / (villas × 30)
  const horizon = new Date(Date.parse(todayStr) + 30 * 86_400_000).toISOString().slice(0, 10);
  let nights = 0;
  for (const b of pack.bookings as { start_date?: string; end_date?: string; status?: string }[]) {
    if (b.status === "cancelled") continue;
    const s = String(b.start_date ?? "").slice(0, 10);
    const e = String(b.end_date ?? "").slice(0, 10);
    if (!s || !e) continue;
    const cs = s < todayStr ? todayStr : s;
    const ce = e > horizon ? horizon : e;
    if (cs < ce) nights += Math.round((Date.parse(ce) - Date.parse(cs)) / 86_400_000);
  }
  const denom = Math.max(1, pack.portfolio.total_villas * 30);
  const occupancy_30d = Math.min(100, Math.round((nights / denom) * 100));

  return {
    revenue_delta_pct,
    next_arrival: next
      ? {
          villa_name: villaNameById[String(next.villa_id)] ?? "Villa",
          guest_name: (next.guest_name as string) ?? null,
          start_date: String(next.start_date),
        }
      : null,
    occupancy_30d,
  };
}

export function buildOwnerReply(
  pack: OwnerContextPack,
  message: string
): { text: string; matchedFaqId: string | null } {
  const msg = normalizeText(message);
  const p = pack.portfolio;
  const ins = ownerInsights(pack);

  // FAQ propriétaire d'abord (commission, minimum, ménage, imprévus…)
  const faq = matchFaq(message, FAQ_CATEGORIES.proprietaire);
  if (faq && faq.score >= 1 && !/revenu|arrive|villa|tache/.test(msg)) {
    return { text: faq.entry.answer, matchedFaqId: faq.entry.id };
  }

  // Revenus — chiffres réels
  if (/revenu|chiffre|encaisse|gagne|financ|argent|mois/.test(msg)) {
    const delta =
      ins.revenue_delta_pct !== null
        ? ` (${ins.revenue_delta_pct >= 0 ? "+" : ""}${ins.revenue_delta_pct}% vs mois dernier)`
        : "";
    return {
      text:
        `Revenus nets : ${eur(p.revenue_current_month)} EUR ce mois-ci${delta}.\n` +
        `Mois dernier : ${eur(p.revenue_last_month)} EUR. Total encaisse : ${eur(p.total_revenue_paid)} EUR.`,
      matchedFaqId: "revenus",
    };
  }

  // Arrivées / réservations — utilise kind (fix bug e.type)
  if (/reservation|booking|sejour|check ?in|arrive|depart|client|voyageur|qui est/.test(msg)) {
    if (pack.today.length === 0) {
      const next = ins.next_arrival
        ? ` Prochaine arrivee : ${ins.next_arrival.guest_name ?? "client"} le ${ins.next_arrival.start_date} (${ins.next_arrival.villa_name}).`
        : "";
      return {
        text: `Aucun check-in ni check-out aujourd'hui. ${p.upcoming_bookings_count} reservation(s) a venir.${next}`,
        matchedFaqId: "reservations",
      };
    }
    const lines = pack.today.slice(0, 8).map((e) => {
      const label = e.kind === "check_in" ? "Arrivee" : e.kind === "check_out" ? "Depart" : "En sejour";
      return `- ${label} : ${e.guest_name ?? "Client"} — ${e.villa_name} (${e.start_date} → ${e.end_date})`;
    });
    return {
      text: `Aujourd'hui, ${pack.today.length} evenement(s) :\n${lines.join("\n")}\n${p.upcoming_bookings_count} reservation(s) a venir.`,
      matchedFaqId: "reservations",
    };
  }

  // Tâches
  if (/tache|todo|urgent|retard|maintenance/.test(msg)) {
    if (p.pending_tasks_count === 0) {
      return { text: "Aucune tache en attente. Tout est en ordre.", matchedFaqId: "taches" };
    }
    const lines = (pack.tasks_open as { content?: string; title?: string }[])
      .slice(0, 10)
      .map((t) => `- ${t.content || t.title || "Sans titre"}`);
    return {
      text: `${p.pending_tasks_count} tache(s) en attente :\n${lines.join("\n")}`,
      matchedFaqId: "taches",
    };
  }

  // Villas
  if (/villa|propriete|maison|portfolio|parc/.test(msg)) {
    const lines = (pack.villas as { name?: string; is_published?: boolean }[]).map(
      (v) => `- ${v.name ?? "Villa"} : ${v.is_published ? "publiee" : "non publiee"}`
    );
    return {
      text: `Votre parc : ${p.total_villas} villa(s), ${p.published_villas} publiee(s).\n${lines.join("\n")}\nOccupation 30 jours : ${ins.occupancy_30d}%.`,
      matchedFaqId: "villas",
    };
  }

  // Vue d'ensemble par défaut
  const delta =
    ins.revenue_delta_pct !== null
      ? ` (${ins.revenue_delta_pct >= 0 ? "+" : ""}${ins.revenue_delta_pct}%)`
      : "";
  return {
    text:
      `Vue d'ensemble : ${p.total_villas} villa(s) (${p.published_villas} publiee(s)), ` +
      `${pack.today.length} evenement(s) aujourd'hui, ${p.pending_tasks_count} tache(s) en attente, ` +
      `${eur(p.revenue_current_month)} EUR ce mois-ci${delta}. Que puis-je faire pour vous ?`,
    matchedFaqId: null,
  };
}

/** Snapshot bref quand n8n est en erreur. */
export function buildOwnerFallbackText(pack: OwnerContextPack): string {
  const p = pack.portfolio;
  return (
    `Mon analyse detaillee est temporairement indisponible. Snapshot : ` +
    `${p.total_villas} villa(s), ${pack.today.length} evenement(s) aujourd'hui, ` +
    `${p.pending_tasks_count} tache(s) en attente, ${eur(p.revenue_current_month)} EUR ce mois-ci.`
  );
}
```

Run: `npx vitest run lib/owner-assistant-reply.test.ts` → PASS.
Attention au test commission : « quelle est votre commission déjà ? » → FAQ `commission` matche (`commission`), et le garde `!/revenu|arrive|villa|tache/` passe car aucun de ces mots n'est présent.

- [ ] **Step 3: Câbler la route owner-assistant**

Dans `app/api/dashboard/owner-assistant/route.ts` :

1. Ajouter les imports :

```ts
import { buildOwnerReply, buildOwnerFallbackText, ownerInsights } from "@/lib/owner-assistant-reply";
import { faqForPrompt } from "@/lib/chatbot/faq";
import { logChatbotFeedback } from "@/lib/chatbot/feedback";
```

2. Supprimer les fonctions locales `smartReply` et `fallbackReply` (lignes ~139-224).
3. Mode démo (`if (!webhookURL)`) — remplacer `response: smartReply(pack, userMessage),` par :

```ts
        response: (() => {
          const r = buildOwnerReply(pack, userMessage);
          void logChatbotFeedback({ agent: "proprio", sessionId: sessionid ?? null, question: userMessage, matched: r.matchedFaqId !== null });
          return r.text;
        })(),
```

4. Les trois fallbacks n8n (fetch error, `!ok`, réponse malformée) — remplacer `response: fallbackReply(pack),` par `response: buildOwnerFallbackText(pack),`.
5. Dans `buildCompactContext` (ligne ~121), ajouter au retour :

```ts
    insights: ownerInsights(pack),
    faq: faqForPrompt(["proprietaire"]),
```

- [ ] **Step 4: Enrichir owner-context (Bot B)**

Dans `app/api/agent/owner-context/route.ts` :

1. Import : `import { faqForPrompt } from "@/lib/chatbot/faq";` et `import { ownerInsights } from "@/lib/owner-assistant-reply";`
2. Dans la réponse JSON, ajouter à côté de `context` :

```ts
    insights: ownerInsights(context),
    faq: faqForPrompt(["proprietaire"]),
```

3. À la fin du `systemPrompt`, ajouter :

```ts
TARIFICATION (référence absolue, ne jamais improviser) : commission Kayvila 22 % sur les nuitées pour les réservations directes, 20 % pour les réservations OTA (Airbnb/Booking). Ménage et blanchisserie exclus de la base de commission. Minimum de facturation 50 €/mois après les 3 mois d'essai. Frais de ménage/service : montants définis dans l'Annexe Tarifaire — ne jamais citer de montant fixe.

FAQ PROPRIÉTAIRE (réponses officielles) :
${faqForPrompt(["proprietaire"]).map((f) => `Q: ${f.q}\nR: ${f.a}`).join("\n")}
```

- [ ] **Step 5: Vérifier + commit**

Run: `npx vitest run lib` → PASS. `npx tsc --noEmit 2>&1 | grep -E "owner-assistant|owner-context" ; echo done` → `done`.

```bash
git add lib/owner-assistant-reply.ts lib/owner-assistant-reply.test.ts app/api/dashboard/owner-assistant/route.ts app/api/agent/owner-context/route.ts
git commit -m "feat(owner-assistant): FAQ proprio 22/20, réponses chiffrées en fallback (fix bug kind), insights injectés vers le bot n8n"
```

---

### Task 12: Route digest — `app/api/agent/owners-digest-context/route.ts` (P0 #2)

**Files:**
- Create: `app/api/agent/owners-digest-context/route.ts`
- Create: `lib/owner-digest.ts`
- Test: `lib/owner-digest.test.ts`

**Interfaces:**
- Consumes: `buildOwnerContextPack` de `@/lib/owner-assistant-context`, `ownerInsights` (Task 11).
- Produces:
  - `buildOwnerDigestItem(ownerId: string, pack: OwnerContextPack): { owner_id: string; context: { portfolio: unknown; today: unknown; alerts_count: number; insights: unknown } }` (pure, dans `lib/owner-digest.ts`)
  - Route GET `Authorization: Bearer ${OWNERS_DIGEST_SECRET}` → `{ current_date_iso: string, owners: DigestItem[] }` — consommée par le nœud n8n « HTTP - Fetch Owners Digest Context » (le champ `owners` alimente « Split Out - Per Owner », chaque item porte `owner_id` lu par « Insert Digest »).

- [ ] **Step 1: Test du builder pur (échec attendu)**

```ts
// lib/owner-digest.test.ts
import { describe, it, expect } from "vitest";
import { buildOwnerDigestItem } from "./owner-digest";
import type { OwnerContextPack } from "./owner-assistant-context";

const pack = {
  current_date_iso: "2026-07-05T12:00:00.000Z",
  portfolio: { total_villas: 1, published_villas: 1, total_revenue_paid: 1000, revenue_current_month: 500, revenue_last_month: 400, upcoming_bookings_count: 1, pending_tasks_count: 0 },
  today: [], alerts: [{ id: "a1", severity: "high", title: "x", body: null, villa_id: null, created_at: "", read_at: null }],
  villas: [{ id: "v1", name: "Villa Azur" }], bookings: [], tasks_open: [],
} as OwnerContextPack;

describe("buildOwnerDigestItem", () => {
  it("structure attendue par le workflow n8n (owner_id à la racine)", () => {
    const item = buildOwnerDigestItem("o1", pack);
    expect(item.owner_id).toBe("o1");
    expect(item.context.alerts_count).toBe(1);
    expect(item.context.portfolio).toBeDefined();
    expect(item.context.insights).toBeDefined();
  });
});
```

- [ ] **Step 2: Implémenter le builder**

```ts
// lib/owner-digest.ts
// Payload digest quotidien par propriétaire — consommé par le cron n8n (Bot B).

import type { OwnerContextPack } from "@/lib/owner-assistant-context";
import { ownerInsights } from "@/lib/owner-assistant-reply";

export type OwnerDigestItem = {
  owner_id: string;
  context: {
    portfolio: OwnerContextPack["portfolio"];
    today: OwnerContextPack["today"];
    alerts_count: number;
    insights: ReturnType<typeof ownerInsights>;
  };
};

export function buildOwnerDigestItem(ownerId: string, pack: OwnerContextPack): OwnerDigestItem {
  return {
    owner_id: ownerId,
    context: {
      portfolio: pack.portfolio,
      today: pack.today,
      alerts_count: pack.alerts.length,
      insights: ownerInsights(pack),
    },
  };
}
```

Run: `npx vitest run lib/owner-digest.test.ts` → PASS.

- [ ] **Step 3: Créer la route**

```ts
// app/api/agent/owners-digest-context/route.ts
// GET — contexte digest quotidien pour le cron n8n (Bot B, 8h Martinique).
// Auth : Authorization: Bearer ${OWNERS_DIGEST_SECRET} (secret partagé, variable d'env).

import { NextResponse } from "next/server";
import { corsHeaders } from "@/lib/cors";
import { supabaseAdmin } from "@/lib/supabase";
import { buildOwnerContextPack } from "@/lib/owner-assistant-context";
import { buildOwnerDigestItem, type OwnerDigestItem } from "@/lib/owner-digest";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.OWNERS_DIGEST_SECRET;
  const bearer = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!secret || !bearer || bearer !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = supabaseAdmin();

  // Propriétaires = owner_id distincts des villas publiées
  const { data: villaOwners, error } = await admin
    .from("villas")
    .select("owner_id")
    .not("owner_id", "is", null);
  if (error) {
    console.error("[owners-digest] villas", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }

  const ownerIds = [...new Set((villaOwners ?? []).map((v) => String(v.owner_id)))].slice(0, 50);
  const owners: OwnerDigestItem[] = [];
  for (const ownerId of ownerIds) {
    try {
      const pack = await buildOwnerContextPack(admin, ownerId);
      if (pack.portfolio.total_villas > 0) owners.push(buildOwnerDigestItem(ownerId, pack));
    } catch (e) {
      console.warn("[owners-digest] owner skipped", ownerId, e);
    }
  }

  return NextResponse.json({ current_date_iso: new Date().toISOString(), owners });
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders("GET, OPTIONS") });
}
```

- [ ] **Step 4: Vérifier**

```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:3001/api/agent/owners-digest-context
```
Expected: `401` (sans secret). Ajouter `OWNERS_DIGEST_SECRET=<valeur>` dans `.env.local` (générer : `openssl rand -hex 32`) puis re-tester avec `-H "Authorization: Bearer <valeur>"` → `200` avec `owners` (peut être vide en local). **Rappeler à Kenneson d'ajouter `OWNERS_DIGEST_SECRET` dans les env Vercel ET dans les variables n8n (`$vars.OWNERS_DIGEST_SECRET`).**

- [ ] **Step 5: Commit**

```bash
git add app/api/agent/owners-digest-context/route.ts lib/owner-digest.ts lib/owner-digest.test.ts
git commit -m "feat(agent-b): route owners-digest-context pour le cron digest 8h (fix P0 — route inexistante)"
```

---

### Task 13: Workflows n8n corrigés — script + JSON v4/v5

**Files:**
- Create: `scripts/n8n-apply-fixes.py`
- Output (hors repo) : `~/Downloads/KAYVILABOT/Kayvibot A — Visiteur (v4 — prompt API).json`, `…B — Propriétaire (v5 — fixes).json`, `…C — Admin (v5 — fixes).json`

**Interfaces:**
- Consumes: JSON originaux dans `~/Downloads/KAYVILABOT/` ; `systemPrompt` consolidé servi par visitor-context (Task 7).
- Produces: 3 JSON prêts à importer. Aucune modification d'URL de webhook ni de structure de réponse.

- [ ] **Step 1: Écrire le script de transformation**

```python
#!/usr/bin/env python3
# scripts/n8n-apply-fixes.py
# Génère les workflows n8n corrigés (audit 2026-07-05) dans ~/Downloads/KAYVILABOT/.
# Les originaux ne sont jamais modifiés. Rollback = réimporter l'ancien JSON.
import json, copy, os, sys

SRC = os.path.expanduser("~/Downloads/KAYVILABOT")
A = "Kayvibot A — Visiteur (Fusion v3 — Dalcielo_Elise).json"
B = "Kayvibot B — Propriétaire (Fusion v4 — Postgres pré-fetch).json"
C = "Kayvibot C — Admin (Fusion v4 — Postgres pré-fetch).json"

def load(name):
    with open(os.path.join(SRC, name)) as f:
        return json.load(f)

def save(wf, name):
    path = os.path.join(SRC, name)
    with open(path, "w") as f:
        json.dump(wf, f, ensure_ascii=False, indent=2)
    print("écrit:", path)

def node(wf, name):
    for n in wf["nodes"]:
        if n["name"] == name:
            return n
    raise KeyError(name)

def set_never_error(n):
    n.setdefault("parameters", {}).setdefault("options", {})["response"] = {
        "response": {"neverError": True}
    }

def set_model_temp(wf, temp):
    for n in wf["nodes"]:
        if n["type"].endswith("lmChatDeepSeek"):
            n.setdefault("parameters", {}).setdefault("options", {})["temperature"] = temp

# ── Bot A v4 : prompt unique côté API + secret webhook + neverError ──────────
wf = load(A)
wf["name"] = "Kayvibot A — Visiteur (v4 — prompt API)"
bc = node(wf, "Build Context")
bc["parameters"]["jsCode"] = r"""
const ctxItem = $('Fetch Visitor Context').first().json;
const ctx = ctxItem.context || {};
const chatInput = $('Edit Fields').first().json.chatInput;
const sessionId = $('Edit Fields').first().json.sessionId;

// Heure locale Martinique
const now = new Date();
const mqStr = (opts) => now.toLocaleString('fr-FR', { timeZone: 'America/Martinique', ...opts });
const timeContext = `Date/heure Martinique : ${mqStr({ weekday: 'long' })} ${mqStr({ day: 'numeric', month: 'long', year: 'numeric' })}, ${mqStr({ hour: '2-digit', minute: '2-digit' })}`;

// Catalogue villas (données temps réel de l'API)
const villas = ctx.villas || [];
let villasText = villas.length
  ? 'CATALOGUE TEMPS REEL :\n' + villas.map(v => {
      let line = `- ${v.name || 'Villa'} : ${v.price_per_night || '?'} EUR/nuit`;
      if (v.capacity) line += `, jusqu a ${v.capacity} personnes`;
      if (v.location) line += `, ${v.location}`;
      if (v.availability) {
        if (v.availability.isAvailableNow) line += ' [DISPONIBLE]';
        else if (v.availability.nextAvailableFrom) line += ` [disponible des ${v.availability.nextAvailableFrom}]`;
        else line += ' [COMPLET]';
      }
      if (v.id) line += ` (ref: ${v.id})`;
      return line;
    }).join('\n')
  : 'Aucune villa disponible actuellement — inviter le visiteur a contacter l equipe.';
const amenitiesText = (ctx.availableAmenities || []).slice(0, 20).join(', ');
const facts = Array.isArray(ctx.conciergerieFacts) ? ctx.conciergerieFacts : [];
const factsText = facts.length ? 'FAITS CONCIERGERIE :\n' + facts.map(f => `- ${f}`).join('\n') : '';

// Le systemPrompt de l'API est LA source de vérité (tunnel complet + FAQ inclus côté site)
const systemMessage = (ctxItem.systemPrompt || '')
  + `\n\n=============================\n${timeContext}\n\n${villasText}\nEquipements proposes : ${amenitiesText}\n\n${factsText}\n=============================`;

return { json: { chatInput, sessionId, systemMessage } };
""".strip()
set_never_error(node(wf, "Fetch Visitor Context"))
set_model_temp(wf, 0.4)

# Vérification du secret webhook : Ban Eval refuse si X-Webhook-Secret invalide
ban = node(wf, "Code - Ban Eval")
ban["parameters"]["jsCode"] = (
    "const secretOk = !$vars.KAYVILA_WEBHOOK_SECRET || "
    "($('Webhook Trigger').first().json.headers?.['x-webhook-secret'] === $vars.KAYVILA_WEBHOOK_SECRET);\n"
    + ban["parameters"]["jsCode"].replace(
        "const banned = !!(d.session_id || (d[0] && d[0].session_id));",
        "const banned = !secretOk || !!(d.session_id || (d[0] && d[0].session_id));",
    )
)
save(wf, "Kayvibot A — Visiteur (v4 — prompt API).json")

# ── Bot B v5 : Resend body, IF urgent resserré, digest réparé, secret $vars ──
wf = load(B)
wf["name"] = "Kayvibot B — Propriétaire (v5 — fixes audit)"
set_never_error(node(wf, "Fetch Owner Context"))
set_model_temp(wf, 0.3)

resend = node(wf, "Resend - Alerte Proprio")
resend["parameters"]["specifyBody"] = "json"
resend["parameters"].pop("bodyParameters", None)
resend["parameters"]["jsonBody"] = (
    '={{ JSON.stringify({ from: $vars.RESEND_FROM || "Kayvila <onboarding@resend.dev>", '
    'to: [$vars.ADMIN_ALERT_EMAIL || "karibloom972@gmail.com"], '
    'subject: "Kayvila — message proprietaire urgent", '
    'html: "<p>Message proprietaire (session " + $json.sessionId + ") : " + '
    '($(\'Edit Fields\').first().json.chatInput || "") + "</p><p>Reponse du bot : " + ($json.reply || "") + "</p>" }) }}'
)

urgent = node(wf, "IF - Urgent ?")
urgent["parameters"]["conditions"]["conditions"][0]["rightValue"] = (
    r"\b(urgent|urgence|panne|fuite|degat|dégât|sinistre|inondation|litige|vol|cambriolage)\b"
)

dig = node(wf, "HTTP - Fetch Owners Digest Context")
dig["parameters"]["headerParameters"]["parameters"] = [
    {"name": "Authorization", "value": "=Bearer {{ $vars.OWNERS_DIGEST_SECRET }}"}
]
set_never_error(dig)

chain = node(wf, "LLM - Generateur de message")
chain["parameters"] = {
    "promptType": "define",
    "text": (
        "=Tu es l'assistant Kayvila. Redige en francais, texte brut sans markdown ni emoji, "
        "un point du jour de 3-4 phrases maximum pour ce proprietaire de villa, chaleureux et factuel, "
        "a partir de ces donnees JSON (portfolio, evenements du jour, alertes, insights) : "
        "{{ JSON.stringify($json.context) }}"
    ),
}

ins = node(wf, "Postgres - Insert Digest")
ins["parameters"]["columns"]["value"]["user_id"] = "={{ $('Split Out - Per Owner').item.json.owner_id }}"
ins["parameters"]["columns"]["value"]["metadata"] = (
    "={{ JSON.stringify({ source: 'agent_b_cron', date: new Date().toISOString().slice(0,10) }) }}"
)
save(wf, "Kayvibot B — Propriétaire (v5 — fixes audit).json")

# ── Bot C v5 : PII retirée + neverError + temperature ────────────────────────
wf = load(C)
wf["name"] = "Kayvibot C — Admin (v5 — fixes audit)"
set_never_error(node(wf, "Fetch Admin Context"))
set_model_temp(wf, 0.3)

fad = node(wf, "Fetch Admin Data")
fad["parameters"]["query"] = fad["parameters"]["query"].replace(
    "'users', (SELECT json_agg(p) FROM (SELECT id,email,full_name,role,created_at FROM profiles ORDER BY created_at DESC LIMIT 50) p)",
    "'users_summary', (SELECT json_build_object('total', COUNT(*), 'owners', COUNT(*) FILTER (WHERE role IN ('owner','proprietaire','proprio')), 'admins', COUNT(*) FILTER (WHERE role = 'admin')) FROM profiles)",
)
save(wf, "Kayvibot C — Admin (v5 — fixes audit).json")

print("\nOK — 3 workflows générés. Variables n8n requises ($vars) :")
print("  KAYVILA_WEBHOOK_SECRET (= N8N_WEBHOOK_SECRET côté Vercel)")
print("  OWNERS_DIGEST_SECRET   (= OWNERS_DIGEST_SECRET côté Vercel)")
print("  RESEND_API_KEY, RESEND_FROM, ADMIN_ALERT_EMAIL")
```

- [ ] **Step 2: Exécuter et vérifier**

Run: `python3 scripts/n8n-apply-fixes.py`
Expected: 3 fichiers `(v4 …)`/`(v5 …)` créés dans `~/Downloads/KAYVILABOT/`, message des variables requises.

Vérifier la validité JSON :

```bash
cd ~/Downloads/KAYVILABOT && for f in *v4*json *v5*json; do python3 -c "import json; json.load(open('$f')); print('OK', '$f')"; done
```
Expected: 3 × OK. Vérifier aussi : `python3 -c "import json; wf=json.load(open('$HOME/Downloads/KAYVILABOT/Kayvibot C — Admin (v5 — fixes audit).json')); q=[n for n in wf['nodes'] if n['name']=='Fetch Admin Data'][0]['parameters']['query']; assert 'email' not in q, 'PII encore présente'; print('PII OK')"` → `PII OK`.

- [ ] **Step 3: Commit du script**

```bash
git add scripts/n8n-apply-fixes.py
git commit -m "feat(n8n): script de génération des workflows corrigés v4/v5 (audit 2026-07-05)"
```

---

### Task 14: Vérification finale + résumé

**Files:** aucun nouveau.

- [ ] **Step 1: Suite de tests complète**

Run: `npx vitest run`
Expected: PASS — tous les tests, y compris les préexistants (`lib/admin-confirm.test.ts`, `lib/chatbot/availability.test.ts`, etc.).

- [ ] **Step 2: TypeScript global**

Run: `npx tsc --noEmit 2>&1 | tail -5`
Expected: aucune erreur nouvelle dans les fichiers touchés (comparer avec `git stash && npx tsc --noEmit | wc -l && git stash pop` si doute sur le préexistant).

- [ ] **Step 3: Résumé final pour Kenneson (dans la conversation, pas de fichier)**

Inclure :
- Nombre de FAQs par catégorie (voyageur 8, proprietaire 10, admin 6, sejour 6 = 30).
- Nouvelles capacités par agent (public : FAQ offline + estimation prix + quick replies ; admin : token n8n réparé + briefing + alertes + 3 actions locales + insights ; proprio : FAQ 22/20 + réponses chiffrées + insights ; Bot B : digest réparé + email urgent réparé).
- Nombre de tests ajoutés et statut.
- **Actions manuelles pour Kenneson** :
  1. Importer les 3 JSON v4/v5 dans n8n (les anciens restent en rollback).
  2. Créer les variables n8n : `KAYVILA_WEBHOOK_SECRET`, `OWNERS_DIGEST_SECRET`, `RESEND_API_KEY`, `RESEND_FROM`, `ADMIN_ALERT_EMAIL`.
  3. Ajouter `OWNERS_DIGEST_SECRET` dans les env Vercel.
  4. Tests de validation : visiteur → « quelle est votre commission ? » (attend 22 %/20 %) ; proprio → « mes revenus ce mois ? » ; admin → « bonjour » (briefing) ; exécution manuelle du cron digest.

---

## Self-Review (fait à l'écriture du plan)

- **Couverture spec** : socle FAQ (T1-T4) ✓ ; agent public + visitor-context (T5-T7) ✓ ; agent admin + admin-context, P0 token, actions locales, insights, briefing, alertes, statut tâches (T8-T10) ✓ ; agent proprio + owner-context, fix kind, texte brut (T11) ✓ ; digest P0 (T12) ✓ ; n8n v4/v5 : prompt unique, Resend, IF urgent, secret webhook, neverError, PII, temperature, troncature (T13 — la troncature `slice(6000)` de B/C reste côté Build Context : non modifiée car le retrait de la PII et le JSON compact réduisent la taille sous le seuil ; risque résiduel accepté) ✓ ; tests transverses (T14) ✓.
- **Placeholders** : aucun TBD/TODO ; tout le code est fourni.
- **Cohérence des types** : `FaqEntry`/`FaqCategoryId` (T2) utilisés partout ; `AdminInsights` défini T8, consommé T9/T10 ; `ownerInsights` défini T11, consommé T12 ; `OwnerDigestItem.owner_id` aligné avec l'expression n8n corrigée (`$('Split Out - Per Owner').item.json.owner_id`).
- **Écart assumé vs spec** : la « troncature sûre champ par champ » (P1 #10) est traitée par réduction de la donnée à la source (PII retirée, contexte compact) plutôt que par réécriture du serializer n8n — documenté dans le résumé final.
