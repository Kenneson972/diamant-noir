/** Version courante des CGV/confidentialité — tracée en base à chaque acceptation. */
export const CGV_VERSION = "2026-06-21";

/** Texte des Conditions Générales de Vente (source unique : pages /cgv + modal checkout). */
export const CGV_TEXT = {
  objet:
    "Les présentes conditions régissent la réservation de séjours dans les villas proposées par Kayvila. Toute réservation implique l'acceptation pleine et entière des présentes conditions.",
  reservationPaiement:
    "La réservation est confirmée après validation du paiement sécurisé. Les tarifs sont indiqués en euros, toutes taxes comprises, et incluent les frais de service précisés lors de la commande.",
  annulation:
    "Les conditions d'annulation propres à chaque villa sont indiquées sur sa fiche au moment de la réservation. Nous vous invitons à en prendre connaissance avant de valider votre séjour.",
  responsabilite:
    "Kayvila agit en qualité d'intermédiaire entre les voyageurs et les propriétaires. Le voyageur s'engage à respecter le règlement intérieur de la villa louée.",
} as const;

/** Texte de la Politique de confidentialité (source unique : page /confidentialite + modal checkout). */
export const CONFIDENTIALITE_TEXT = {
  protection:
    "Kayvila s'engage à protéger vos données personnelles. Les informations collectées via les formulaires (réservation, contact, soumission villa) sont utilisées uniquement pour traiter vos demandes et améliorer nos services. Nous ne vendons pas vos données à des tiers.",
  rgpd:
    "Conformément au RGPD, vous pouvez demander l'accès, la rectification ou la suppression de vos données en nous contactant.",
} as const;
