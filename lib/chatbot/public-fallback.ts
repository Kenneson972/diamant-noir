// lib/chatbot/public-fallback.ts
// Fallback offline de l'agent public : FAQ + detection d'intent + estimation prix.
// Fonctions pures -- aucune dependance reseau.

import { FAQ_CATEGORIES, matchFaq, normalizeText, type FaqEntry } from "./faq";
import type { VillaContextItem } from "@/types/chatbot";

const MONTHS = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

/** Nombre de nuits detecte dans un message francais, sinon null. */
export function parseStayNights(message: string): number | null {
  const norm = normalizeText(message);

  // "du 12 au 19 aout" / "du 28 juillet au 3 aout"
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

  // "5 nuits" / "10 jours"
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

/** Estimation de prix locale (villa precise ou fourchette catalogue). */
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
 * Reponse fallback publique quand n8n est indisponible.
 * Ordre : contact -> prix+duree -> FAQ (voyageur + proprietaire) -> generique.
 */
export function buildPublicFallback(input: {
  message: string;
  stage: string;
  villas: VillaContextItem[];
  villaId?: string;
}): PublicFallbackResult {
  const { message, stage, villas, villaId } = input;
  const norm = normalizeText(message);

  // 1. Demande de contact humain -- prioritaire
  if (CONTACT_RE.test(` ${norm} `)) {
    return {
      reply:
        "Bien sûr. Le plus simple est notre formulaire de contact — notre équipe vous répond rapidement, 7 jours sur 7. Vous pouvez aussi me laisser votre question ici.",
      quickReplies: quickRepliesForStage("contact"),
      matchedFaqId: "contact-humain",
      link: "/contact",
    };
  }

  // 2. Demande de prix -- estimation locale si duree detectable
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

  // 3. FAQ voyageur + proprietaire
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

  // 4. Generique + suggestions du stage
  const count = villas.length;
  return {
    reply:
      `Notre assistant est momentanément indisponible, mais je reste là pour l'essentiel : nous proposons ${count} villa${count > 1 ? "s" : ""} de standing en Martinique avec conciergerie privée. Posez-moi votre question autrement, ou contactez directement notre équipe.`,
    quickReplies: quickRepliesForStage(stage),
    matchedFaqId: null,
    link: "/contact",
  };
}
