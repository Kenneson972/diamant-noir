/**
 * ════════════════════════════════════════════════════════════════════════
 *  KARIBLOOM · TEMPLATE PACK SCALE  —  "L'entreprise automatisée"
 *  Base de référence : Kayvila / Conciergerie Diamant Noir (Martinique)
 * ════════════════════════════════════════════════════════════════════════
 *
 *  SOURCE DE VÉRITÉ CLIENT — un seul fichier à remplir pour démarrer un
 *  nouveau client SCALE (entreprise multi-acteurs : booking, espaces
 *  client + admin + partenaires/proprio, paiement, synchro agendas, CRM).
 *
 *  ▸ Profil pack SCALE : 8-10 pages + landing pages · IA niveau 4
 *    (orchestration) · CRM · booking multi-agendas (iCal/OTA) · espaces
 *    sécurisés multi-rôles · rappels SMS/email · reporting.
 *
 *  Stack : Next.js · React · TypeScript · Supabase · Stripe ·
 *  FullCalendar · Tailwind.
 *
 *  COMMENT L'UTILISER
 *  1. Dupliquer le repo diamant-noir/ → nouveau dossier client.
 *  2. Remplir CLIENT ci-dessous.
 *  3. Reporter le nom de marque dans src/data/site-brand.ts.
 *  4. Reporter les couleurs dans tailwind.config.ts (gold/navy/cream…).
 *  5. Adapter prestations/FAQ/saisons dans src/data/.
 *  6. Suivre la checklist complète dans template/TEMPLATE.md.
 *
 *  Valeurs ci-dessous = Kayvila = EXEMPLE de référence. « ⟶ À CHANGER ».
 */

export const CLIENT = {
  /* ─── Identité ─────────────────────────────────────────── */
  brand: 'Kayvila',                       // ⟶ À CHANGER (src/data/site-brand.ts)
  legalName: 'Conciergerie Diamant Noir', // ⟶ À CHANGER — raison sociale
  tagline: 'Conciergerie pour villa de standing en Martinique', // ⟶ À CHANGER
  shortDescription:
    'Conciergerie pour villa de standing en Martinique. Villas d’exception, réservation en ligne, entretien et gestion.', // ⟶ À CHANGER
  businessType: 'TravelAgency',           // ⟶ À CHANGER — type schema.org

  /* ─── i18n (le site est multilingue) ───────────────────── */
  locales: ['fr', 'en', 'es'],            // ⟶ ajuster selon client
  defaultLocale: 'fr',

  /* ─── Coordonnées (NAP) ────────────────────────────────── */
  address: {
    city: 'Le Diamant',                   // ⟶ À CHANGER
    region: 'Martinique',
    countryCode: 'MQ',                     // ⟶ À CHANGER
  },
  phone: '',                              // ⟶ À CHANGER
  email: '',                              // ⟶ À CHANGER

  /* ─── SEO ──────────────────────────────────────────────── */
  seo: {
    baseUrl: 'https://kayvila.com',       // ⟶ À CHANGER
    keywords: ['villa de standing', 'conciergerie villa', 'location villa Martinique', 'villa Martinique', 'réservation villa'], // ⟶ À CHANGER
    titles: {
      fr: 'Kayvila | Conciergerie pour villa de standing en Martinique',      // ⟶ À CHANGER
      en: 'Kayvila | Premium Concierge Martinique',             // ⟶ À CHANGER
      es: 'Kayvila | Conserjería de alto standing Martinica',   // ⟶ À CHANGER
    },
  },

  /* ─── Thème (reporter dans tailwind.config.ts → colors) ── */
  theme: {
    gold: '#D4AF37',          // accent standing       ⟶ À CHANGER
    navy: '#0A0A0A',          // encre / texte fort   ⟶ À CHANGER
    navy900: '#0B1D2E',
    navy800: '#132A41',
    offwhite: '#FAFAFA',      // fond
    cream: '#F5F0E8',         // ⟶ À CHANGER
    champagne: '#F0E6CE',     // ⟶ À CHANGER
    sand: '#DDD5C4',
    borderSubtle: '#E5E3DB',
  },

  /* ─── Rôles & espaces (multi-acteurs) ──────────────────── */
  roles: {
    client: true,             // /espace-client
    admin: true,              // /(admin)
    owner: true,              // /(proprio) — propriétaires de villas
  },

  /* ─── Paramètres métier SCALE ──────────────────────────── */
  booking: {
    enabled: true,
    currency: 'EUR',
    icalSync: true,           // synchro OTA (Airbnb/Booking) via iCal
    stripe: true,             // paiement réservation
    calendar: 'FullCalendar',
  },
  catalog: {
    type: 'villas',           // ⟶ À CHANGER — unité réservable (villa, suite, prestation…)
    seasonalPricing: true,    // src/data/seasons.ts
  },
  features: {
    referral: false,          // parrainage désactivé Kayvila
    notifications: true,      // notifications multi-types (constants.ts)
    requests: true,           // demandes de service (early check-in, etc.)
    villaSubmission: true,    // soumission de villa par un proprio
  },
} as const

export type ClientConfig = typeof CLIENT
export default CLIENT
