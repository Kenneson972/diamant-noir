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
  images: {
    sectionIntro: string;
    sectionDetails: string;
    sectionMarket: string;
    sectionIntroAlt: string;
    sectionDetailsAlt: string;
    sectionMarketAlt: string;
  };
};

export const SERVICE_DETAILS: Record<ServiceSlug, ServiceDetail> = {
  marketing: {
    slug: "marketing",
    title: "Marketing & visibilité",
    eyebrow: "Acquisition",
    tagline: "Votre villa visible partout, valorisée au bon prix",
    metaDescription:
      "Estimation locative, photos professionnelles, annonces optimisées et gestion dynamique des prix pour maximiser le revenu de votre villa en Martinique — Kayvila conciergerie.",
    image: "/marketing.png",
    imageAlt: "Piscine de villa de luxe au coucher du soleil avec appareil photo — Marketing locatif Kayvila Martinique",
    imagePosition: "center 40%",
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
    images: {
      sectionIntro: "/marketing.png",
      sectionDetails: "/marketing.png",
      sectionMarket: "/marketing.png",
      sectionIntroAlt: "Piscine villa luxe au coucher du soleil — stratégie marketing locatif",
      sectionDetailsAlt: "Annonce premium optimisée pour villa martiniquaise",
      sectionMarketAlt: "Analyse du marché locatif martiniquais — pricing dynamique",
    },
  },
  operations: {
    slug: "operations",
    title: "Opérations & terrain",
    eyebrow: "Terrain",
    tagline: "Zéro contrainte — tout géré sur place",
    metaDescription:
      "Check-in et check-out pris en charge, contrôles qualité entre chaque séjour, coordination ménage et artisans sur votre villa en Martinique — Kayvila conciergerie.",
    image: "/terrain.png",
    imageAlt: "Accueil personnalisé à l'entrée d'une villa avec boîte à clés sécurisée — Opérations terrain Kayvila Martinique",
    imagePosition: "center 35%",
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
    images: {
      sectionIntro: "/terrain.png",
      sectionDetails: "/terrain.png",
      sectionMarket: "/terrain.png",
      sectionIntroAlt: "Entrée villa avec boîte à clés sécurisée — accueil check-in",
      sectionDetailsAlt: "Équipe terrain inspectant une villa avant un séjour",
      sectionMarketAlt: "Carte de la Martinique avec zones d'intervention conciergerie",
    },
  },
  voyageurs: {
    slug: "voyageurs",
    title: "Relation voyageurs",
    eyebrow: "7j/7",
    tagline: "Vos voyageurs entre de bonnes mains, 7j/7",
    metaDescription:
      "Gestion complète des réservations, interlocuteur unique pour les voyageurs, suivi des avis et zéro sollicitation pour le propriétaire — Kayvila Martinique.",
    image: "/relation.png",
    imageAlt: "Couple en terrasse face à l'océan, verre de coco à la main — Relation voyageurs Kayvila Martinique",
    imagePosition: "center 50%",
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
    images: {
      sectionIntro: "/relation.png",
      sectionDetails: "/relation.png",
      sectionMarket: "/relation.png",
      sectionIntroAlt: "Couple en terrasse face à l'océan — accueil voyageurs Kayvila",
      sectionDetailsAlt: "Communication avec les voyageurs — service réactif 7j/7",
      sectionMarketAlt: "Voyageurs internationaux en Martinique — clientèle premium",
    },
  },
  menage: {
    slug: "menage",
    title: "Ménage & blanchisserie",
    eyebrow: "Qualité séjour",
    tagline: "Facturé aux voyageurs — transparent pour vous",
    metaDescription:
      "Frais de ménage et blanchisserie facturés aux voyageurs, hors commission 20 %, réassort consommables inclus, entretien piscine et jardin coordonné — Kayvila Martinique.",
    image: "/menage.png",
    imageAlt: "Lit impeccable avec drap blanc et fleur de frangipanier — Ménage blanchisserie Kayvila Martinique",
    imagePosition: "center 45%",
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
        desc: "Avant chaque arrivée, nous réapprovisionnons café, eau, savon, gel douche et produits d'accueil. Ces consommables courants sont pris en charge par Kayvila — aucun frais supplémentaire pour vous.",
      },
      {
        title: "Entretien piscine & jardin (abonnement non inclus)",
        desc: "Un prestataire agréé assure l'entretien régulier de votre piscine (traitement de l'eau, nettoyage, contrôle PH) et de vos espaces verts (tonte, taille, désherbage). Service facturé en sus, sur abonnement — nous coordonnons et supervisons pour vous.",
      },
    ],
    images: {
      sectionIntro: "/menage.png",
      sectionDetails: "/menage.png",
      sectionMarket: "/menage.png",
      sectionIntroAlt: "Lit impeccable avec drap blanc et fleur — ménage blanchisserie haut standing",
      sectionDetailsAlt: "Linge de maison préparé aux standards hôteliers",
      sectionMarketAlt: "Piscine et jardin entretenus en climat tropical martiniquais",
    },
  },
  finance: {
    slug: "finance",
    title: "Finance & reversement",
    eyebrow: "Transparence",
    tagline: "Vos revenus reversés, vos comptes clairs",
    metaDescription:
      "Encaissement des loyers, commission 20 % TTC sur nuitées nettes, espace propriétaire en ligne et Copilot — gestion locative transparente Kayvila Martinique.",
    image: "/finance.png",
    imageAlt: "Bureau en terrasse avec MacBook, café et orchidée — Gestion financière Kayvila Martinique",
    imagePosition: "center 40%",
    overlay: "bg-gradient-to-l from-black/70 via-black/40 to-black/15",
    imageAlign: "right",
    items: [
      {
        title: "Vous encaissez directement via les plateformes",
        desc: "Kayvila ne perçoit pas les loyers à votre place. Vous encaissez directement les paiements voyageurs via Airbnb, Booking ou toute autre plateforme. En fin de mois, Kayvila vous adresse une facture de commission — réglable sous 8 jours. Un mandat de prélèvement SEPA peut simplifier ce règlement.",
      },
      {
        title: "Commission 20 % TTC sur les nuitées réalisées",
        desc: "La commission de 20 % s'applique sur le montant brut du séjour, frais de ménage et blanchisserie inclus (selon l'affichage de la plateforme). Sur les plateformes qui intègrent le ménage dans le prix affiché, l'assiette est recalculée : base commission = prix total encaissé − forfait ménage contractuel. Ménage et blanchisserie facturés aux voyageurs — hors commission. Vous conservez 100 % de ces montants.",
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
    images: {
      sectionIntro: "/finance.png",
      sectionDetails: "/finance.png",
      sectionMarket: "/finance.png",
      sectionIntroAlt: "Bureau terrasse avec MacBook et café — gestion financière sereine",
      sectionDetailsAlt: "Tableau de bord propriétaire — reversements et commissions",
      sectionMarketAlt: "Graphique d'évolution des revenus locatifs — marché martiniquais",
    },
  },
};
