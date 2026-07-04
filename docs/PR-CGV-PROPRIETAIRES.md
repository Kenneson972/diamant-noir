3 modifications à faire sur diamant-noir (https://github.com/Kenneson972/diamant-noir, branche main) :

## 1. Ajouter CGV_PROPRIETAIRES dans lib/legal.ts
Après la constante `CGV_FULL` (ligne ~118), ajouter une nouvelle export `CGV_PROPRIETAIRES` avec le texte des CGV Propriétaires (cf. ci-dessous). Ne pas toucher à `CGV_FULL` qui reste les CGV Voyageurs existantes.

## 2. Modifier app/cgv/page.tsx pour afficher les DEUX CGV
Remplacer le contenu de la page pour afficher d'abord les CGV Voyageurs (existantes, via `CgvContent` ou directement `CGV_FULL`), puis un séparateur, puis les CGV Propriétaires (via `CGV_PROPRIETAIRES`). On peut soit modifier `CgvContent.tsx` pour inclure les deux, soit les afficher côte à côte dans la page.

Approche simple : modifier `components/legal/CgvContent.tsx` pour qu'il affiche `CGV_FULL` puis `CGV_PROPRIETAIRES` avec un titre de section "CGV Propriétaires" entre les deux.

## 3. Modifier le lien dans le footer
Dans `components/layout/Footer.tsx`, remplacer le lien existant :
```
<Link href="/cgv" className="transition-colors hover:text-black/70">CGV</Link>
```
par :
```
<Link href="/cgv" className="transition-colors hover:text-black/70">CGV</Link>
```
(Pas de changement de lien — les deux CGV sont sur /cgv. Mais on peut ajouter un `title` ou aria-label si souhaité.)

### Texte des CGV Propriétaires (à mettre dans la constante) :

KAYVILA CONCIERGERIE
Confiance · Réactivité · Excellence
CGV PROPRIÉTAIRES
Conditions Générales de Vente — Propriétaires

Article 1 — Présentation de la société
Kayvila Conciergerie est une SARLU au capital social de 1 000 €, immatriculée au Registre du Commerce et des Sociétés de Fort-de-France sous le numéro 106 394 489, dont le siège social est situé Quartier Palmène, 97270 Saint-Esprit, Martinique (972).
SIRET : 106 394 489 00012
Numéro de TVA intracommunautaire : FR32106394489
Représentée par : GELARD-THOMACHOT Richard, en qualité de gérant.
Contact : contact@kayvila.com — 0696 68 18 69
Ci-après désignée « la Conciergerie ».

Article 2 — Champ d'application
Les présentes Conditions Générales de Vente Propriétaires (les « CGV Propriétaires ») s'appliquent à l'ensemble des prestations de conciergerie et de gestion locative de courte durée proposées par Kayvila Conciergerie aux propriétaires de biens immobiliers (ci-après « le Propriétaire ») souhaitant confier la gestion locative de leur bien.
Elles complètent le contrat de mandat de gestion conclu entre le Propriétaire et la Conciergerie, auquel elles sont annexées. Toute signature du contrat de mandat implique l'acceptation pleine et entière des présentes CGV Propriétaires. En cas de contradiction entre le mandat et les présentes, les stipulations du mandat prévalent.

Article 3 — Prestations proposées aux Propriétaires
La Conciergerie propose notamment les services suivants :
•  Création et optimisation des annonces sur les plateformes de location (Airbnb, Booking.com, etc.) ainsi que sur le site internet de la Conciergerie ;
•  Réalisation de reportages photographiques des biens ;
•  Gestion des réservations et des communications avec les voyageurs ;
•  Accueil et check-in des voyageurs, physique ou à distance selon les modalités convenues ;
•  Organisation et supervision des prestations de ménage et blanchisserie ;
•  Mise en relation avec des prestataires d'entretien (piscine, jardin, espaces extérieurs) et coordination de leurs interventions, ces prestations étant facturées directement au Propriétaire par les prestataires concernés ;
•  Gestion des états des lieux d'entrée et de sortie ;
•  Assistance et support 7j/7 aux voyageurs pendant leur séjour ;
•  Gestion des incidents et interventions de maintenance de premier niveau ;
•  Conseil en optimisation tarifaire dynamique et revenue management ;
•  Rapport mensuel de suivi et de performance.

Article 4 — Tarification et rémunération
4.1 Commission applicable aux Propriétaires
La Conciergerie perçoit une commission de vingt-deux pour cent (22%) du montant des nuitées réglé par le voyageur, à l'exclusion des frais de ménage et de blanchisserie. Lorsqu'une plateforme intègre le forfait de ménage et de blanchisserie au prix affiché, ce forfait est déduit du montant encaissé afin de reconstituer l'assiette de la commission (assiette = montant total encaissé moins forfait de ménage et de blanchisserie).
Les frais de ménage et de blanchisserie sont intégrés au prix du séjour facturé au voyageur, de sorte qu'ils ne sont pas supportés par le Propriétaire ; ils sont exclus de l'assiette de la commission. La Conciergerie assure le règlement des intervenants chargés de ces prestations.

4.2 Modalités de règlement
Pour les réservations effectuées via les plateformes tierces, le Propriétaire encaisse directement les paiements des voyageurs. La commission ainsi que l'enveloppe correspondant aux frais de ménage et de blanchisserie sont reversées à la Conciergerie à la fin de chaque mois civil, sur présentation d'une facture récapitulative établie par la Conciergerie, dans un délai de huit (8) jours à compter de la réception de ladite facture.
Tout retard de paiement entraîne l'application de pénalités de retard au taux de trois (3) fois le taux d'intérêt légal en vigueur, ainsi qu'une indemnité forfaitaire de recouvrement de quarante (40) euros.

4.3 Réservations directes via le site internet de la Conciergerie
Pour les réservations effectuées directement via le site internet de la Conciergerie, les fonds versés par le Voyageur sont collectés au moyen d'une solution de paiement sécurisée de type Stripe Connect, et répartis automatiquement à la source. Le contrat de location se forme directement entre le Voyageur et le Propriétaire ; la Conciergerie agit en qualité d'intermédiaire technique de mise en relation et de prestataire de services, sans encaisser le loyer pour son propre compte.
Lors de la transaction, la commission revenant à la Conciergerie (22% du montant des nuitées, hors ménage et blanchisserie) lui est versée directement, tandis que le solde est versé sur le compte du Propriétaire. Les frais liés au traitement du paiement en ligne sont supportés par la Conciergerie et n'entraînent aucun surcoût pour le Voyageur ni pour le Propriétaire. Aucun reversement mensuel n'est alors nécessaire pour ces réservations, la répartition étant opérée automatiquement.

4.4 Frais de ménage et blanchisserie
Les frais de ménage et de blanchisserie sont fixés d'un commun accord lors de la signature du contrat de prestation et intégrés au prix du séjour facturé au voyageur. La Conciergerie assure la rémunération des intervenants chargés de ces prestations. Le détail des forfaits figure à l'Annexe tarifaire du mandat de gestion.

4.5 Forfait de rafraîchissement après inoccupation
Lorsqu'une réservation intervient sur un bien resté inoccupé depuis le dernier ménage, la Conciergerie procède, le jour de l'arrivée, à un rafraîchissement de remise en condition (aération, dépoussiérage, contrôle général). Contrairement au forfait de ménage, ce rafraîchissement est facturé au Propriétaire, la période d'inoccupation relevant de la disponibilité du bien et non d'un séjour donné. Son tarif, selon la durée d'inoccupation, figure à l'Annexe tarifaire du mandat de gestion. Aucune intervention n'est facturée à ce titre pendant les périodes d'inoccupation.

4.6 Facturation minimale mensuelle
Afin de couvrir le suivi permanent du bien (disponibilité, surveillance, gestion administrative et coordination des interventions), une facturation minimale de cinquante euros (50 €) par mois s'applique lorsque le montant de la commission due au titre d'un mois est inférieur à cette somme, notamment en l'absence de réservation. Dès que la commission mensuelle atteint ou dépasse ce montant, ce minimum ne s'applique pas et seule la commission est due. Cette facturation minimale ne s'applique qu'à compter de l'expiration de la période d'essai de trois (3) mois prévue à l'article 9 ; pendant cette période d'essai, seule la commission effectivement due est facturée, sans minimum mensuel.

Article 5 — Obligations de la Conciergerie
La Conciergerie s'engage à :
•  Gérer les annonces et les réservations avec diligence et professionnalisme ;
•  Assurer la disponibilité et la réactivité vis-à-vis des voyageurs et des propriétaires ;
•  Coordonner et superviser les intervenants chargés du ménage et de la blanchisserie ;
•  Rendre compte mensuellement au Propriétaire de l'activité locative de son bien ;
•  Respecter la confidentialité des informations transmises par les Propriétaires et les Voyageurs.

Article 6 — Obligations du Propriétaire
Le Propriétaire s'engage à :
•  Mettre à disposition un bien conforme à la description figurant sur les annonces ;
•  S'assurer que le bien est couvert par une assurance propriétaire non occupant (PNO) ou multirisque habitation incluant expressément la garantie villégiature ou location saisonnière, et en justifier par la remise d'une attestation en cours de validité ;
•  Informer la Conciergerie de toute indisponibilité du bien dans les meilleurs délais ;
•  Reverser la commission et les sommes dues dans les délais prévus à l'article 4.2 ;
•  Attester avoir effectué, ou effectuer avant toute mise en location, les démarches déclaratives obligatoires (déclaration en mairie et, si la commune l'exige, obtention d'un numéro d'enregistrement à communiquer à la Conciergerie pour figurer sur les annonces) ;
•  Assurer, en sa qualité de loueur redevable, la collecte, la déclaration et le reversement de la taxe de séjour ; pour les réservations directes, celle-ci est perçue auprès du voyageur en sus du prix du séjour puis reversée au Propriétaire, à charge pour lui de la déclarer et de la reverser à la collectivité compétente ;
•  Ne pas court-circuiter la Conciergerie en concluant directement avec un Voyageur présenté par celle-ci.

Article 7 — Responsabilité
7.1 Responsabilité de la Conciergerie
La Conciergerie intervient en qualité de prestataire de services et, pour les réservations directes, d'intermédiaire technique. Sa responsabilité est limitée aux prestations de gestion qui lui sont expressément confiées. Elle ne saurait être tenue responsable des vices cachés du logement, des dommages causés par un cas de force majeure, ou des actes du Propriétaire ou du Voyageur.
7.2 Responsabilité du Propriétaire
Le Propriétaire demeure seul responsable de la conformité de son bien aux normes légales et réglementaires applicables à la location saisonnière en Martinique, notamment en ce qui concerne les obligations déclaratives auprès de la mairie, le respect des règles de copropriété, et la sécurité des équipements (notamment le dispositif de sécurité de piscine prévu par la loi). L'entretien de la piscine, du jardin et des espaces extérieurs relève de la responsabilité du Propriétaire et des prestataires facturés en direct ; la Conciergerie n'en assure que la mise en relation et la coordination.

Article 8 — Protection des données personnelles (RGPD)
8.1 Responsable du traitement
Le responsable du traitement est Kayvila Conciergerie (SARLU), SIREN 106 394 489, Quartier Palmène, 97270 Saint-Esprit, Martinique. Toute question relative à vos données peut être adressée à : contact@kayvila.com.
8.2 Données collectées et finalités
Dans le cadre du mandat de gestion, la Conciergerie collecte et traite les données suivantes : identité (nom, prénom), coordonnées (email, téléphone, adresse postale), coordonnées bancaires (IBAN/RIB) et informations relatives au bien confié. Ces données sont traitées aux fins suivantes : exécution du mandat de gestion, reversement des sommes dues et facturation, relation propriétaire et reporting, et respect des obligations légales, comptables et fiscales.
8.3 Bases légales
Les traitements reposent sur l'exécution du contrat (mandat de gestion) et le respect d'obligations légales (facturation, comptabilité).
8.4 Destinataires des données
Les données sont destinées à la Conciergerie et, dans la limite de leurs missions respectives, à ses sous-traitants et partenaires : établissement bancaire, prestataire de paiement (notamment Stripe Connect), expert-comptable et, le cas échéant, l'administration compétente. Elles ne sont pas transmises à des tiers à des fins commerciales sans le consentement préalable du Propriétaire, sauf obligation légale.
8.5 Transferts hors Union européenne
Certains prestataires techniques peuvent traiter des données en dehors de l'Union européenne. De tels transferts ne sont opérés que vers des pays assurant un niveau de protection adéquat ou sous réserve de garanties appropriées (clauses contractuelles types de la Commission européenne).
8.6 Durée de conservation
Les données sont conservées pendant toute la durée du mandat, puis archivées conformément aux délais légaux, notamment dix (10) ans pour les pièces comptables et contractuelles.
8.7 Droits du Propriétaire
Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978 modifiée, le Propriétaire dispose des droits d'accès, de rectification, d'effacement, de limitation, d'opposition et de portabilité de ses données, ainsi que du droit de définir des directives relatives au sort de ses données après son décès. Ces droits s'exercent par demande adressée à contact@kayvila.com. Le Propriétaire dispose également du droit d'introduire une réclamation auprès de la Commission Nationale de l'Informatique et des Libertés (CNIL — www.cnil.fr).

Article 9 — Durée et résiliation
Le contrat de prestation conclu avec le Propriétaire est établi pour une durée d'un an, renouvelable tacitement par périodes annuelles.
Pendant les trois (3) premiers mois suivant la signature, le contrat peut être résilié par l'une ou l'autre des parties avec un préavis de quinze (15) jours, par lettre recommandée ou email avec accusé de réception, sans frais ni pénalité.
Passé cette période, la résiliation prend effet à l'échéance annuelle du contrat, sous réserve d'un préavis de trente (30) jours notifié par lettre recommandée ou email avec accusé de réception.
Toute réservation confirmée avant la date de réception de la notification de résiliation et dont le séjour débute dans la durée du préavis applicable reste obligatoirement sous la gestion de Kayvila Conciergerie jusqu'à son terme. La commission correspondant à ces séjours reste due. Toute réservation dont le séjour est prévu au-delà est restituée au Propriétaire sans frais.

Article 10 — Droit applicable et juridiction compétente
Les présentes CGV Propriétaires sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant tout recours judiciaire.
Lorsque le Propriétaire a la qualité de consommateur ou de non-professionnel, il bénéficie également du droit de recourir gratuitement au médiateur de la consommation dont relève la Conciergerie (CM2C — www.cm2c.net), dans les conditions prévues aux articles L.612-1 et suivants du Code de la consommation.
À défaut d'accord amiable, tout litige relatif à l'interprétation ou à l'exécution des présentes sera soumis à la compétence des tribunaux de Fort-de-France, sous réserve des règles d'ordre public applicables au consommateur.

Article 11 — Dispositions diverses
La nullité d'une clause des présentes CGV n'entraîne pas la nullité de l'ensemble du document. Le fait pour l'une des parties de ne pas se prévaloir d'un manquement de l'autre partie ne saurait être interprété comme une renonciation à se prévaloir de ce manquement à l'avenir.

Confiance · Réactivité · Excellence
Kayvila Conciergerie — Martinique
