export type FaqItem = { q: string; a: string };
export type FaqTheme = { id: string; label: string; title: string; items: FaqItem[] };

export const CONCIERGERIE_FAQ: FaqTheme[] = [
  {
    id: "commission",
    label: "01",
    title: "Commission & frais de ménage",
    items: [
      {
        q: "Que signifie exactement le montant sur lequel s'applique la commission ?",
        a: "La commission de 20 % de Kayvila Conciergerie s'applique sur le montant brut du séjour, tel qu'affiché sur la plateforme de réservation, frais de ménage et blanchisserie inclus. Ce mode de calcul garantit une transparence totale : aucune déduction ni retraitement n'est effectué avant application de la commission. Les frais de ménage et blanchisserie sont inclus dans le montant total de la réservation et n'engendrent aucune facturation supplémentaire pour le propriétaire. Le montant par séjour est défini dans l'Annexe Tarifaire.",
      },
      {
        q: "Qui fixe le prix des frais de ménage ?",
        a: "Les frais de ménage sont fixés par Kayvila en fonction de la superficie du logement et du niveau de prestation requis. Ils vous sont communiqués avant la mise en ligne de l'annonce et font l'objet d'un accord préalable.",
      },
      {
        q: "Les frais de ménage sont-ils à la charge du propriétaire ?",
        a: "Non. Les frais de ménage entre chaque réservation sont intégralement facturés au voyageur sortant. Ils couvrent le nettoyage complet, la remise en état et la préparation pour l'arrivée suivante. Aucun frais de ménage courant n'est à votre charge.",
      },
      {
        q: "Que se passe-t-il sur les plateformes où le ménage est intégré dans le prix affiché ?",
        a: "Peu importe l'affichage de la plateforme, la commission de 20 % s'applique sur le montant brut total encaissé. Le montant du ménage et de la blanchisserie, défini dans l'Annexe Tarifaire, est inclus dans ce calcul et ne donne lieu à aucune facturation supplémentaire. Tout est détaillé dans votre rapport mensuel.",
      },
    ],
  },
  {
    id: "services",
    label: "02",
    title: "Services inclus",
    items: [
      {
        q: "Quels consommables sont réassortis à vos frais ?",
        a: "Entre chaque séjour nous renouvelons : papier toilette, essuie-tout, éponge, sacs poubelle, savon mains, café, thé, bouteilles d'eau. Les épices et condiments de base (huile, sel, poivre, sucre, ail en poudre, piment, herbes de Provence, curcuma, curry), les produits d'entretien et les gels douche/shampoing grand format sont renouvelés à l'épuisement. Aucun frais supplémentaire n'est facturé à ce titre.",
      },
      {
        q: "Qui paie le remplacement de linge endommagé ou volé ?",
        a: "Le linge endommagé ou volé est signalé immédiatement au propriétaire. Le remplacement est à la charge du voyageur via la caution ou AirCover. En l'absence de remboursement par la plateforme, les frais restent à la charge du propriétaire — Kayvila assure toutes les démarches de réclamation.",
      },
      {
        q: "Qu'est-ce qu'une « petite réparation » ?",
        a: "Nous intervenons sans validation préalable pour toute réparation dont le coût est inférieur à 50 €. Au-delà, nous vous soumettons un devis pour validation avant toute intervention. Nous n'engageons aucune dépense sans votre accord explicite.",
      },
    ],
  },
  {
    id: "prix",
    label: "03",
    title: "Gestion dynamique des prix",
    items: [
      {
        q: "Qui décide des prix et selon quels critères ?",
        a: "Kayvila ajuste les tarifs en continu selon la saisonnalité, les événements locaux, les taux de remplissage et les données du marché. Lors de la mise en service, une grille tarifaire de référence est établie avec vous, incluant un prix plancher en dessous duquel aucune réservation n'est acceptée.",
      },
      {
        q: "Avez-vous un droit de regard sur les prix ?",
        a: "Oui. Vous définissez avec nous un prix plancher inscrit dans votre contrat. Ce tarif minimum ne peut être modifié qu'avec votre accord explicite. Dans cette limite, Kayvila ajuste librement les tarifs à la hausse ou à la baisse pour optimiser votre taux de remplissage.",
      },
      {
        q: "Comment corriger un prix qui ne vous convient pas ?",
        a: "Contactez-nous directement — par téléphone ou email — et nous ajustons le tarif dans les 24 h. Notre priorité est de trouver le juste équilibre entre attractivité pour les voyageurs et satisfaction de vos attentes.",
      },
    ],
  },
  {
    id: "pack",
    label: "04",
    title: "Pack de démarrage",
    items: [
      {
        q: "Quel est le montant exact du pack de démarrage ?",
        a: "Le pack de démarrage est à la charge du propriétaire lors de la première mise en service, pour un montant forfaitaire de 200 €. Il comprend les produits de cuisine essentiels (huile, sel, poivre, sucre, ail en poudre, piment, herbes de Provence, curcuma, curry, café, thé, pack d'eau), les consommables d'accueil (papier toilette, essuie-tout, liquide vaisselle, éponges, savon liquide, sacs poubelles, torchons, pastilles lave-vaisselle), les produits de salle de bain (gel douche, shampoing, désodorisant) et les produits d'entretien sanitaire (nettoyant WC), un guide de la Martinique, la raquette électrique anti-insectes, et l'installation de la boîte à clefs sécurisée. Le réassort de ces consommables entre chaque séjour est ensuite assuré par Kayvila Conciergerie, sans frais supplémentaire pour le propriétaire.",
      },
      {
        q: "Qui assume les coûts après la première location ?",
        a: "Le réassort courant est assuré par Kayvila sans frais supplémentaire. En cas d'anomalie (éléments endommagés ou manquants), le remplacement est à la charge du voyageur via la caution ou AirCover. En l'absence de remboursement, les frais sont à la charge du propriétaire — Kayvila gérant toutes les démarches.",
      },
      {
        q: "L'inventaire est-il réalisé avant ou après la première location ?",
        a: "L'inventaire est réalisé avant la première location, en présence du propriétaire si souhaité. Il sert de référence tout au long de la collaboration.",
      },
    ],
  },
  {
    id: "finance",
    label: "05",
    title: "Encaissement & reversements",
    items: [
      {
        q: "Quel est le délai de reversement ?",
        a: "Kayvila ne perçoit pas les loyers à votre place. Vous encaissez directement les paiements voyageurs via la plateforme (Airbnb, Booking, etc.). En fin de mois, Kayvila vous adresse une facture correspondant à sa commission de 20 % sur le montant brut des séjours réalisés, réglable sous 8 jours à réception. Pour simplifier ce règlement, un mandat de prélèvement SEPA peut être mis en place dès la signature du contrat — la commission est alors prélevée automatiquement à date fixe, sans démarche de votre part. Pour les réservations effectuées directement via le site Kayvila, le paiement est scindé à la source : vous recevez votre part et Kayvila perçoit sa commission directement, sans intermédiaire ni facturation mensuelle.",
      },
      {
        q: "Qui assume les risques de non-paiement ?",
        a: "Pour les réservations via Airbnb ou Booking, les risques d'impayé voyageur sont portés par la plateforme. Pour les réservations directes via le site Kayvila, le paiement intégral est exigé à la confirmation. Kayvila gère l'ensemble des démarches.",
      },
      {
        q: "Y a-t-il des frais bancaires supplémentaires ?",
        a: "Pour les réservations via les plateformes (Airbnb, Booking, etc.), non. La facturation se limite à la commission de 20 % sur le montant brut des séjours — aucun frais caché, aucune déduction supplémentaire. Pour les réservations effectuées directement via le site Kayvila, des frais de traitement de 5 % s'appliquent sur le montant encaissé. Ces frais couvrent la gestion du paiement en ligne sécurisé, sans commission de plateforme. Au final, votre net perçu reste supérieur à ce qu'une réservation Airbnb ou Booking vous aurait rapporté, une fois leurs commissions déduites.",
      },
      {
        q: "Comment sont justifiées les déductions ?",
        a: "En fin de mois, vous recevez un rapport détaillé de toutes les réservations (dates, durées, montants nuitées, frais ménage facturés au voyageur), accompagné de la facture de commission. Tout est traçable et vérifiable.",
      },
    ],
  },
  {
    id: "contrat",
    label: "06",
    title: "Contrat & modalités",
    items: [
      {
        q: "Quelle est la durée minimale d'engagement ?",
        a: "Le contrat est conclu pour une durée d'un an, renouvelable tacitement. Durant les 3 premiers mois, chaque partie peut résilier avec un préavis de 15 jours, sans frais. Passé cette période, la résiliation requiert un préavis de 30 jours à l'échéance annuelle.",
      },
      {
        q: "Quelles sont les conditions de résiliation ?",
        a: "La résiliation se fait par lettre recommandée ou email avec accusé de réception. Toute réservation confirmée avant la notification et dont le séjour débute dans le délai de préavis reste sous gestion Kayvila, la commission correspondante restant due. Au-delà, les réservations futures sont restituées sans frais.",
      },
      {
        q: "Qui assure la responsabilité civile et l'assurance ?",
        a: "Kayvila Conciergerie est couverte par une Responsabilité Civile Professionnelle pour ses interventions. Le propriétaire doit disposer d'une assurance habitation couvrant la location saisonnière (PNO ou clause location meublée touristique). Nous vous accompagnons pour vérifier cette couverture si nécessaire.",
      },
      {
        q: "Comment sont résolus les litiges avec les voyageurs ?",
        a: "Kayvila gère en première ligne tout litige (dégradations, réclamations, remboursements). En cas de litige complexe nécessitant votre intervention, nous vous transmettons un dossier complet avec tous les éléments nécessaires.",
      },
      {
        q: "Y a-t-il une obligation de rendement ?",
        a: "Non. Kayvila s'engage sur la qualité de la gestion, pas sur un taux d'occupation minimum. Les résultats dépendent de facteurs partiellement hors de notre contrôle. Notre objectif est de maximiser votre rendement — c'est aussi notre intérêt direct.",
      },
    ],
  },
];
