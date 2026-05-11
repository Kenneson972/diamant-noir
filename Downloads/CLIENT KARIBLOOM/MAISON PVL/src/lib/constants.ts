export const SITE_NAME = 'Maison PVL';
export const SITE_DESCRIPTION =
  "L'élégance sur mesure — Vêtements premium pour homme et femme";
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || 'https://maisonpvl.com';

export const GENDERS = ['homme', 'femme'] as const;
export type Gender = (typeof GENDERS)[number];

export const LOCALES = ['fr', 'en', 'es', 'it'] as const;
export type Locale = (typeof LOCALES)[number];

export const DEFAULT_LOCALE: Locale = 'fr';

export const CURRENCY = 'EUR';

export const LOCALE_MAP: Record<Locale, string> = {
  fr: 'fr-FR',
  en: 'en-GB',
  es: 'es-ES',
  it: 'it-IT',
};

export const NAV_ITEMS = [
  { label: 'nav.homme', href: '/homme', gender: 'homme' as const },
  { label: 'nav.femme', href: '/femme', gender: 'femme' as const },
];

export const COLLECTION_TABS = [
  { label: 'nav.nouveautes', slug: 'nouveautes' },
  { label: 'nav.essentiels', slug: 'essentiels' },
  { label: 'nav.silhouettes', slug: 'silhouettes' },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  processing: 'En préparation',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
  returned: 'Retournée',
};

export const RETURN_STATUS_LABELS: Record<string, string> = {
  requested: 'Demandé',
  approved: 'Approuvé',
  shipped: 'Expédié',
  received: 'Reçu',
  refunded: 'Remboursé',
  rejected: 'Refusé',
};
