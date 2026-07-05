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
