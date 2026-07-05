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
export function matchFaq(
  message: string,
  entries: FaqEntry[],
): FaqMatch | null {
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
