export const SERVICE_SLUGS = ["marketing", "operations", "voyageurs", "menage", "finance"] as const;

export type ServiceSlug = (typeof SERVICE_SLUGS)[number];

export function isServiceSlug(s: string): s is ServiceSlug {
  return (SERVICE_SLUGS as readonly string[]).includes(s);
}

export type ServiceDetail = {
  slug: ServiceSlug;
  title: string;
  eyebrow: string;
  tagline: string;
  metaDescription: string;
  image: string;
  imageAlt: string;
  imagePosition: string;
  overlay: string;
  imageAlign: "left" | "right";
  items: { title: string; desc: string }[];
};

export const SERVICE_DETAILS: Record<ServiceSlug, ServiceDetail> = {
  marketing: {
    slug: "marketing",
    title: "Marketing & visibilité",
    eyebrow: "Acquisition",
    tagline: "Votre villa visible partout, valorisée au bon prix",
    metaDescription:
      "Estimation locative, photos pro, annonces multi-plateformes et prix dynamiques — Diamant Noir, conciergerie Martinique.",
    image: "/prestations-hero.png",
    imageAlt: "Intérieur de villa de luxe au coucher du soleil — Martinique",
    imagePosition: "center 20%",
    overlay: "bg-gradient-to-r from-black/70 via-black/40 to-black/10",
    imageAlign: "left",
    items: [
      {
        title: "Estimation de valeur locative",
        desc: "Analyse complète de votre bien, localisation, capacité d'accueil et marché local. Revenus réalistes — sans promesse commerciale.",
      },
      {
        title: "Photos professionnelles",
        desc: "Visuels haute résolution signés par un photographe. Lumière, cadrage, mise en scène des espaces. Des images premium justifient un tarif premium.",
      },
      {
        title: "Création et optimisation d'annonces",
        desc: "Titres accrocheurs, descriptions complètes, diffusion Airbnb · Booking · plateformes complémentaires. Ou optimisation de votre annonce existante.",
      },
      {
        title: "Prix dynamiques automatiques",
        desc: "Tarifs ajustés en temps réel selon saisonnalité, concurrence et taux d'occupation. Ni vide ni bradé.",
      },
    ],
  },
  operations: {
    slug: "operations",
    title: "Opérations & terrain",
    eyebrow: "Terrain",
    tagline: "Zéro contrainte — tout géré sur place",
    metaDescription:
      "Check-in, contrôle qualité, coordination ménage et artisans sur votre villa en Martinique — Diamant Noir.",
    image: "/villa-hero.jpg",
    imageAlt: "Villa de luxe avec piscine — Martinique",
    imagePosition: "right 40%",
    overlay: "bg-gradient-to-l from-black/65 via-black/35 to-black/10",
    imageAlign: "right",
    items: [
      {
        title: "Check-in / Check-out",
        desc: "Notre équipe accueille chaque voyageur : remise des clefs, visite de la villa, présentation des équipements. Au départ, état des lieux complet. Vous n'êtes jamais sollicité.",
      },
      {
        title: "Contrôles qualité entre chaque séjour",
        desc: "Nous inspectons la villa — équipements, électroménager, piscine, extérieurs. Tout problème est identifié et résolu avant la prochaine arrivée.",
      },
      {
        title: "Coordination ménage, linge et consommables",
        desc: "Draps, serviettes : lavés et disposés aux standards hôteliers. Savon, gel douche, café : rechargés à nos frais avant chaque séjour.",
      },
      {
        title: "Gestion des artisans et intervenants",
        desc: "Nous coordonnons les équipes de ménage, réparations et prestataires locaux. Un seul interlocuteur pour tous — zéro coordination de votre côté.",
      },
    ],
  },
  voyageurs: {
    slug: "voyageurs",
    title: "Relation voyageurs",
    eyebrow: "7j/7",
    tagline: "Vos voyageurs entre de bonnes mains, 7j/7",
    metaDescription:
      "Réservations, messages, avis : nous sommes le seul interlocuteur de vos voyageurs — conciergerie Diamant Noir Martinique.",
    image: "/prestations-hero.png",
    imageAlt: "Terrasse de villa face à la mer — Martinique",
    imagePosition: "center 75%",
    overlay: "bg-gradient-to-r from-black/75 via-black/45 to-black/15",
    imageAlign: "left",
    items: [
      {
        title: "Gestion complète des réservations",
        desc: "Demandes, confirmations, modifications, annulations. Tout géré en temps réel. Calendrier synchronisé sur tous les canaux.",
      },
      {
        title: "Seul interlocuteur des voyageurs",
        desc: "De la première question au message d'au revoir, nous sommes l'unique contact des voyageurs. Toutes les demandes, réclamations et urgences passent par notre équipe.",
      },
      {
        title: "Zéro sollicitation pour vous",
        desc: "Aucune notification, aucun appel, aucun message ne vous parvient. Vous restez propriétaire serein — nous gérons tout, 7j/7, sans jamais vous déranger.",
      },
      {
        title: "Suivi des avis et valorisation",
        desc: "Nous répondons à chaque commentaire — remerciements, retours négatifs traités avec soin, valorisation des avis positifs. Votre note moyenne grimpe, vos réservations aussi.",
      },
    ],
  },
  menage: {
    slug: "menage",
    title: "Ménage & blanchisserie",
    eyebrow: "Qualité séjour",
    tagline: "Facturé aux voyageurs — transparent pour vous",
    metaDescription:
      "Ménage et linge facturés aux voyageurs, hors commission 20 % : détail du modèle Diamant Noir en Martinique.",
    image: "/prestations-hero.png",
    imageAlt: "Intérieur villa premium — propreté hôtelière",
    imagePosition: "center 40%",
    overlay: "bg-gradient-to-r from-black/72 via-black/42 to-black/12",
    imageAlign: "right",
    items: [
      {
        title: "Frais de ménage facturés aux voyageurs",
        desc: "Les montants de ménage sont ajoutés au séjour : vous n'avancez pas ces coûts. Une présentation claire sur les annonces et au moment de la réservation.",
      },
      {
        title: "Blanchisserie incluse hors commission 20 %",
        desc: "Le linge et le ménage ne sont pas soumis à notre commission : vous conservez 100 % de ces revenus annexes selon le calibrage de votre annonce.",
      },
      {
        title: "Coordination des équipes",
        desc: "Planning, contrôle après passage, remontée des incidents : nous pilotons les prestataires pour un rendu constant entre deux séjours.",
      },
      {
        title: "Réassort consommables de bienvenue — à nos frais",
        desc: "Avant chaque arrivée, nous réapprovisionnons café, eau, savon, gel douche et produits d'accueil. Ces consommables courants sont pris en charge par Diamant Noir — aucun frais supplémentaire pour vous.",
      },
    ],
  },
  finance: {
    slug: "finance",
    title: "Finance & reversement",
    eyebrow: "Transparence",
    tagline: "Vos revenus reversés, vos comptes clairs",
    metaDescription:
      "Encaissement, commission 20 % TTC sur nuitées, espace propriétaire et Copilot — Diamant Noir Martinique.",
    image: "/villa-hero.jpg",
    imageAlt: "Villa de prestige — Martinique",
    imagePosition: "left 60%",
    overlay: "bg-gradient-to-l from-black/70 via-black/40 to-black/15",
    imageAlign: "right",
    items: [
      {
        title: "Encaissement et reversement mensuel",
        desc: "Nous collectons les paiements voyageurs et vous reversons chaque mois. Zéro gestion bancaire de votre côté.",
      },
      {
        title: "Commission 20 % TTC sur nuitées nettes",
        desc: "Ménage et blanchisserie facturés aux voyageurs — hors commission. Vous conservez 100 % de ces montants.",
      },
      {
        title: "Espace propriétaire en ligne",
        desc: "Consultez réservations, revenus et interventions à tout moment. Informé sans être débordé.",
      },
      {
        title: "Pack démarrage — 1ère location uniquement",
        desc: "Pour votre première mise en location, un pack d'installation est facturé une seule fois : sucre, café, eau, poivre, huile, épices, papier toilettes, savon, boîte à clefs et inventaire complet. Dès la 2ème location, le réassort courant est à nos frais.",
      },
    ],
  },
};
