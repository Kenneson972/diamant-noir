export type FaqItem = { q: string; a: string };
export type FaqTheme = { id: string; label: string; title: string; items: FaqItem[] };

export const CONCIERGERIE_FAQ: FaqTheme[] = [
  {
    id: "commission",
    label: "01",
    title: "Commission et frais de ménage",
    items: [
      {
        q: "Que signifie exactement le montant sur lequel s'applique la commission ?",
        a: "La commission de 22 % de Kayvila Conciergerie s'applique sur le montant des nuitées, hors frais de ménage et de blanchisserie. Ces frais ne sont jamais intégrés à la base de commission : vous savez précisément ce sur quoi nous nous rémunérons. Les frais de ménage et blanchisserie encaissés par le Propriétaire via la plateforme sont reversés mensuellement à la Conciergerie dans la facture récapitulative, qui assure la coordination et la rémunération des intervenants chargés de ces prestations. Le montant par séjour est défini dans l'Annexe Tarifaire.",
      },
      {
        q: "Qui fixe le prix des frais de ménage ?",
        a: "Les frais de ménage sont fixés par Kayvila Conciergerie en fonction de la superficie du bien et du niveau de prestation requis. Ils sont communiqués au propriétaire avant la mise en ligne de l'annonce et font l'objet d'un accord préalable.",
      },
      {
        q: "Les frais de ménage entre deux réservations sont-ils à la charge du propriétaire ou du voyageur ?",
        a: "Les frais de ménage et de blanchisserie sont inclus dans le prix total du séjour payé par le voyageur. C'est donc le voyageur qui les finance, à travers le prix de sa réservation — le ménage entre deux séjours n'est jamais à la charge du propriétaire. Ces frais couvrent le nettoyage complet du logement, la remise en état et la préparation pour l'arrivée suivante. La commission de 22 % de Kayvila s'applique uniquement sur les nuitées, hors ménage et blanchisserie. Seul cas où un ménage est facturé au propriétaire : le rafraîchissement d'un bien resté inoccupé longtemps, détaillé dans une question dédiée ci-dessous.",
      },
      {
        q: "Que se passe-t-il sur les plateformes où le ménage est intégré dans le prix affiché ?",
        a: "Peu importe la façon dont la plateforme affiche le prix, la commission de 22 % s'applique uniquement sur la part hébergement (les nuitées). Lorsque le ménage est intégré au prix affiché, le forfait ménage et blanchisserie défini dans l'Annexe Tarifaire est déduit du montant encaissé afin de reconstituer la base de commission : Base de commission = montant total encaissé − forfait ménage et blanchisserie. Ce forfait apparaît comme une ligne distincte sur votre facture mensuelle : il correspond au remboursement de la prestation que Kayvila organise et rémunère pour vous. Aucun surcoût n'est appliqué au-delà de ce forfait — vous réglez la commission de 22 % sur les nuitées et le forfait ménage annoncé, rien d'autre. Le détail figure dans votre rapport mensuel.",
      },
      {
        q: "Y a-t-il un montant minimum de facturation ?",
        a: "Oui. Afin de couvrir le suivi permanent de votre logement (disponibilité, surveillance, gestion administrative et coordination des interventions), une facturation minimale de 50 € par mois s'applique lorsque la commission du mois est inférieure à ce montant — notamment en l'absence de réservation. Dès que votre commission mensuelle dépasse 50 €, ce minimum ne s'applique plus.",
      },
    ],
  },
  {
    id: "services",
    label: "02",
    title: "Services inclus vs services facturés",
    items: [
      {
        q: "Qui paie le ménage entre les réservations ?",
        a: "Le ménage entre deux séjours est intégralement financé par les frais facturés au voyageur, inclus dans le prix total de sa réservation. Il n'est jamais à la charge du propriétaire. Ces frais couvrent le nettoyage complet du logement, le changement du linge et la préparation pour l'arrivée suivante. Seule exception : le rafraîchissement d'un bien resté inoccupé longtemps, qui fait l'objet d'une question dédiée ci-dessous.",
      },
      {
        q: "Que se passe-t-il lorsqu'une réservation arrive sur un logement resté inoccupé un certain temps ?",
        a: "Le ménage complet est toujours réalisé le jour du départ des voyageurs. Mais lorsque la réservation suivante n'intervient que plusieurs semaines plus tard, la préparation effectuée après le départ des derniers voyageurs nécessite une mise à jour : même propre, le logement accumule de la poussière. Kayvila repasse alors le jour de la prochaine arrivée pour une remise en condition. Ce rafraîchissement n'est déclenché que par une nouvelle réservation : tant qu'aucun voyageur n'est attendu, il n'y a rien à prévoir (seule s'applique, le cas échéant, la facturation mensuelle minimale de 50 € évoquée plus haut). Sa durée dépend du temps écoulé depuis le dernier ménage :\n• Logement non loué depuis plus d'une semaine : un rafraîchissement d'environ 1 heure le jour de l'arrivée (aération, dépoussiérage des surfaces, écoulement des eaux, contrôle général).\n• Logement resté inoccupé plusieurs semaines : un rafraîchissement plus poussé de 1h30 à 2h.\nIl s'agit d'une remise en condition légère — dépoussiérage et aération pour effacer les traces d'inoccupation — et non d'un second ménage complet, celui-ci ayant déjà été effectué au départ des précédents voyageurs.\nCe rafraîchissement est facturé au propriétaire : la période d'inoccupation relève de la disponibilité du bien, et non d'un séjour précis. Il apparaît comme une ligne distincte sur votre facture mensuelle, selon le forfait défini dans l'Annexe Tarifaire, et reste déductible de vos revenus locatifs au régime réel — au même titre que vos autres frais d'entretien.",
      },
      {
        q: "Kayvila s'occupe-t-elle de l'entretien de la piscine et du jardin ?",
        a: "Kayvila vous met en relation avec des prestataires de confiance sélectionnés localement (pisciniste, jardinier) et coordonne leurs interventions autour de votre calendrier de réservations. Ces prestations sont facturées directement par le prestataire, à votre nom : vous bénéficiez de tarifs justes et de factures conformes, intégralement déductibles de vos revenus locatifs si vous êtes au régime réel.",
      },
      {
        q: "Quelles sont les limites du réassort des consommables de bienvenue ?",
        a: "Kayvila Conciergerie assure le réassort des consommables essentiels entre chaque séjour, inclus dans notre prestation de gestion. Les produits de première nécessité sont renouvelés à chaque rotation (papier toilette, essuie-tout, éponge, sacs poubelle, savon mains, café, thé, bouteilles d'eau). Les épices et condiments de base ainsi que les produits d'entretien (liquide vaisselle, pastilles lave-vaisselle) sont renouvelés à l'épuisement. Dans chaque salle de bain, un gel douche et un shampoing en grand format sont mis à disposition des voyageurs et renouvelés à l'épuisement. Les sanitaires sont équipés d'un désodorisant et d'un nettoyant WC, renouvelés à l'épuisement. Aucun frais supplémentaire n'est facturé au propriétaire à ce titre.",
      },
      {
        q: "Qui paie le remplacement de linge endommagé ou volé ?",
        a: "Le linge endommagé ou volé par un voyageur est signalé immédiatement au propriétaire. Le remplacement est à la charge du voyageur via la caution ou le mécanisme de protection Airbnb (AirCover). En l'absence de remboursement par la plateforme, les frais de remplacement sont à la charge du propriétaire — Kayvila assurant toutes les démarches de réclamation.",
      },
      {
        q: "Qu'est-ce qu'une « petite réparation » ?",
        a: "Nous intervenons sans validation préalable pour toute réparation dont le coût est inférieur à 100 €. Au-delà, nous vous soumettons un devis pour validation avant toute intervention. Nous n'engageons aucune dépense sans votre accord explicite.",
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
        a: "Kayvila Conciergerie assure une gestion dynamique des tarifs tout au long de l'année. Les prix sont ajustés en continu en fonction de la saisonnalité, des événements locaux, du taux de remplissage et des données du marché — exactement comme le font les grandes plateformes hôtelières. Lors de la mise en service, une grille tarifaire de référence est établie avec le propriétaire et fait l'objet d'un accord écrit. Celle-ci définit notamment le prix plancher en dessous duquel aucune réservation ne sera acceptée. Dans cette limite, Kayvila est libre d'ajuster les prix à la hausse ou à la baisse pour optimiser le taux de remplissage et maximiser vos revenus. Toute modification du prix plancher fait l'objet d'un accord préalable du propriétaire.",
      },
      {
        q: "Avez-vous un droit de regard sur les prix ?",
        a: "Oui. Lors de la mise en service, vous définissez avec Kayvila Conciergerie un prix plancher — c'est-à-dire le tarif minimum en dessous duquel aucune réservation ne sera acceptée. Ce prix plancher est inscrit dans votre contrat et ne peut être modifié qu'avec votre accord explicite. Dans cette limite, Kayvila est libre d'ajuster les tarifs à la hausse ou à la baisse selon les opportunités du marché, sans avoir à vous consulter pour chaque modification. Cette flexibilité est précisément ce qui permet d'optimiser votre taux de remplissage et de maximiser vos revenus.",
      },
      {
        q: "Comment se négocie un prix qui ne vous convient pas ?",
        a: "Vous nous contactez directement — par téléphone ou email — et nous ajustons le tarif dans les 24h. Notre priorité est de trouver le juste équilibre entre attractivité pour les voyageurs et satisfaction de vos attentes.",
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
        a: "Le pack de démarrage est à la charge du propriétaire lors de la première mise en service, pour un montant forfaitaire de 200 €. Il comprend les produits de cuisine essentiels (huile, sel, poivre, sucre, épices courantes, café, thé, pack d'eau), les consommables d'accueil (papier toilette, essuie-tout, liquide vaisselle, éponges, savon liquide, sacs poubelles, pastilles lave-vaisselle/machine à laver), les produits de salle de bain (gel douche, shampoing, désodorisant) et les produits d'entretien sanitaire (nettoyant WC), la raquette électrique anti-insectes, ainsi que la fourniture et l'installation d'une boîte à clefs sécurisée — celle-ci étant comprise dans le pack, elle vous appartient et reste attachée au bien. Le réassort de ces consommables entre chaque séjour est ensuite assuré par Kayvila Conciergerie, sans frais supplémentaire pour le propriétaire.",
      },
      {
        q: "Qui assume les coûts après la première location ?",
        a: "La mise à jour de l'inventaire en cas d'anomalie constatée est gérée par Kayvila et signalée au propriétaire. Si un élément est endommagé ou manquant, le remplacement est à la charge du voyageur via la caution ou le mécanisme de protection de la plateforme (Airbnb AirCover, garantie Booking). En l'absence de remboursement par la plateforme, les frais de remplacement sont à la charge du propriétaire — Kayvila assurant l'ensemble des démarches de réclamation.",
      },
      {
        q: "L'inventaire est-il réalisé avant ou après la première location ?",
        a: "L'inventaire est réalisé avant la première location, en présence du propriétaire si souhaité. Il sert de référence contractuelle pour toute la durée de la collaboration.",
      },
    ],
  },
  {
    id: "finance",
    label: "05",
    title: "Réception et suivi des paiements",
    items: [
      {
        q: "Quel est le délai de reversement ?",
        a: "Kayvila ne perçoit pas les loyers à votre place. Vous encaissez directement les paiements voyageurs via la plateforme (Airbnb, Booking, etc.). En fin de mois, Kayvila vous adresse une facture correspondant à sa commission de 22 % sur les nuitées des séjours réalisés, réglable sous 8 jours à réception. Pour simplifier ce règlement, un mandat de prélèvement SEPA peut être mis en place dès la signature du contrat — la commission est alors prélevée automatiquement à date fixe, sans démarche de votre part. Pour les réservations effectuées directement via le site Kayvila, le paiement est scindé à la source : vous recevez votre part et Kayvila perçoit sa commission directement, sans intermédiaire ni facturation mensuelle.",
      },
      {
        q: "Que se passe-t-il en cas d'annulation de dernière minute ou de non-présentation d'un voyageur ?",
        a: "En cas d'annulation moins de 48 heures avant la date d'arrivée prévue, ou de non-présentation du voyageur (no-show), les frais de ménage restent dus, le logement ayant déjà été préparé en vue du séjour (ménage de préparation, mise en place et changement du code d'accès). Cette préparation représente un travail réel, effectué que le voyageur se présente ou non. Le remboursement éventuel des nuitées au voyageur est régi par la politique d'annulation de la plateforme concernée et par nos Conditions Générales de Vente.",
      },
      {
        q: "Qui assume les risques de non-paiement ?",
        a: "Pour les réservations effectuées via les plateformes partenaires (Airbnb, Booking, etc.), les risques d'impayé voyageur sont portés par la plateforme. Pour les réservations directes via le site Kayvila, le paiement s'effectue en deux temps : un acompte de 30 % à la réservation, puis le solde au plus tard 30 jours avant l'arrivée. Pour toute réservation à moins de 30 jours de l'arrivée, le paiement intégral est exigé immédiatement. Dans tous les cas, l'intégralité du séjour est réglée avant la remise des clés. Une empreinte de garantie est par ailleurs réalisée (via une solution sécurisée de type Swikly) pour couvrir tout dommage éventuel : aucun montant n'est débité ni bloqué, et l'empreinte expire automatiquement après le séjour si rien n'est signalé. Kayvila gère l'ensemble de ces démarches pour le compte du propriétaire.",
      },
      {
        q: "Y a-t-il des frais bancaires supplémentaires ?",
        a: "Pour les réservations via les plateformes (Airbnb, Booking, etc.) : non. La facturation se limite à la commission de 22 % sur les nuitées et au forfait ménage déjà annoncé — aucun frais bancaire ni déduction cachée à votre charge. Pour les réservations effectuées directement via le site Kayvila : non plus. Les frais liés au paiement en ligne sécurisé sont pris en charge par Kayvila et n'ont aucune répercussion sur vous. De votre côté, seule la commission de 22 % s'applique — et comme il n'y a aucune commission de plateforme à déduire, votre net perçu reste supérieur à ce qu'une réservation Airbnb ou Booking vous aurait rapporté.",
      },
      {
        q: "Comment sont justifiées les déductions ?",
        a: "En fin de mois vous recevez un rapport détaillé de toutes les réservations (dates, durées, montant des nuitées, forfait ménage et blanchisserie indiqué séparément), accompagné de la facture de commission. Tout est traçable et vérifiable.",
      },
    ],
  },
  {
    id: "contrat",
    label: "06",
    title: "Contrat et modalités",
    items: [
      {
        q: "Quelle est la durée minimale d'engagement ?",
        a: "Le contrat est conclu pour une durée d'un an, renouvelable tacitement par périodes annuelles. Durant les 3 premiers mois suivant la signature, chacune des parties peut mettre fin au contrat avec un préavis de 15 jours par lettre recommandée ou email avec accusé de réception, sans frais ni pénalité. Passé cette période, la résiliation prend effet à l'échéance annuelle avec un préavis de 30 jours. Dans tous les cas, toute réservation confirmée avant la date de réception de la notification de résiliation et dont le séjour débute dans la durée du préavis reste sous la gestion de Kayvila Conciergerie. La commission correspondant à ces séjours reste due. Au-delà, les réservations futures sont restituées au propriétaire sans frais.",
      },
      {
        q: "Quelles sont les conditions de résiliation ?",
        a: "Pendant les 3 premiers mois suivant la signature, le contrat peut être résilié par l'une ou l'autre des parties avec un préavis de 15 jours, par lettre recommandée ou email avec accusé de réception, sans frais ni pénalité. Passé cette période, la résiliation prend effet à l'échéance annuelle du contrat, sous réserve d'un préavis de 30 jours notifié par lettre recommandée ou email avec accusé de réception. Dans tous les cas, toute réservation confirmée avant la date de réception de la notification de résiliation et dont le séjour débute dans la durée du préavis reste sous la gestion de Kayvila Conciergerie. La commission correspondant à ces séjours reste due. Au-delà, les réservations futures sont restituées au propriétaire sans frais.",
      },
      {
        q: "Dois-je déclarer mon logement en mairie ?",
        a: "La mise en location d'un meublé de tourisme est soumise à des obligations déclaratives qui relèvent de votre responsabilité de propriétaire (déclaration en mairie, obtention d'un numéro d'enregistrement le cas échéant). En confiant votre bien à Kayvila, vous vous engagez à effectuer ces démarches auprès de votre commune.",
      },
      {
        q: "Qui assure la responsabilité civile et l'assurance ?",
        a: "Kayvila Conciergerie est couverte par une Responsabilité Civile Professionnelle pour ses interventions. Le propriétaire doit disposer d'une assurance habitation couvrant la location saisonnière (assurance PNO ou clause location meublée touristique).",
      },
      {
        q: "Comment sont résolus les litiges avec les voyageurs ?",
        a: "Kayvila gère en première ligne tout litige avec les voyageurs (dégradations, réclamations, remboursements). En cas de litige complexe nécessitant l'intervention du propriétaire, nous vous transmettons un dossier complet avec tous les éléments nécessaires.",
      },
      {
        q: "Y a-t-il une obligation de rendement ?",
        a: "Non. Kayvila s'engage sur la qualité de la gestion, pas sur un taux d'occupation minimum. Les résultats dépendent de facteurs extérieurs (marché, saisonnalité, état du bien) sur lesquels nous n'avons qu'une influence partielle. Notre objectif est de maximiser votre rendement — c'est aussi notre intérêt direct.",
      },
    ],
  },
];
