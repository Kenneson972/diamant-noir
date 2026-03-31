/**
 * types/chatbot.ts
 * Diamant Noir — Contrats TypeScript stricts du chatbot public V1
 *
 * Chaîne de données : Chatbot.tsx → /api/chat → n8n webhook → /api/chat → Chatbot.tsx
 *
 * Conventions :
 *   - Intents   : snake_case  (compatibilité JSON n8n)
 *   - Stages    : snake_case  (machine à états linéaire)
 *   - Interfaces : PascalCase
 *   - Tous les champs temporels : ISO 8601 string (pas de Date object)
 */

// ---------------------------------------------------------------------------
// 1. ENUMS & UNION TYPES
// ---------------------------------------------------------------------------

/**
 * Intents détectables par n8n.
 * La liste doit rester synchronisée avec le nœud "Set Intent" du workflow n8n.
 */
export type ChatIntent =
  | "greeting"
  | "villa_discovery"        // "Montrez-moi vos villas"
  | "villa_detail"           // "Parlez-moi de la Villa X"
  | "villa_comparison"       // "Comparez Villa A et Villa B"
  | "availability_check"     // "Est-ce disponible du 10 au 17 août ?"
  | "price_inquiry"          // "Quel est le tarif ?"
  | "price_calculation"      // "Combien pour 7 nuits ?"
  | "booking_intent"         // Lead chaud, prêt à réserver
  | "booking_followup"       // "J'ai une réservation en cours"
  | "concierge_request"      // "Pouvez-vous organiser un transfert ?"
  | "amenity_inquiry"        // "Y a-t-il une piscine chauffée ?"
  | "location_inquiry"       // "Où se trouve la villa ?"
  | "capacity_inquiry"       // "Combien de personnes ?"
  | "lead_capture"           // Collecte active d'informations de contact
  | "contact_request"        // "Je voudrais être rappelé"
  | "faq_general"            // Politiques, conditions, annulation
  | "human_handoff"          // Demande explicite de conseiller humain
  | "small_talk"             // Hors-sujet, politesse
  | "unsupported_request"    // Hors périmètre
  | "unknown";               // Intent non reconnu

/**
 * Étapes de la conversation (machine à états).
 * Le frontend adapte l'UI (suggestions, formulaires) en fonction du stage.
 */
export type ChatStage =
  | "greet"                  // Message initial, suggestions par défaut
  | "discover"               // Exploration catalogue
  | "qualify"                // Collecte dates + capacité
  | "recommend"              // Villas présentées
  | "compare"                // Tableau comparatif affiché
  | "pricing"                // Calcul de prix en cours / affiché
  | "availability_confirmed" // Disponibilité validée
  | "lead_warm"              // Lead qualifié, pré-réservation possible
  | "prebook"                // Formulaire pré-réservation affiché
  | "handoff"                // Transfert vers conseiller humain
  | "fallback"               // Réponse dégradée / hors périmètre
  | "closed";                // Conversation terminée / convertie

/**
 * Température du lead basée sur le niveau d'engagement et la qualification.
 */
export type LeadTemperature = "cold" | "warm" | "hot";

// ---------------------------------------------------------------------------
// 2. LEAD DATA
// ---------------------------------------------------------------------------

/**
 * Données collectées progressivement au fil de la conversation.
 * Tous les champs sont optionnels : collecte incrémentale sur plusieurs échanges.
 * `temperature` est le seul champ requis (valeur par défaut : "cold").
 */
export interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  /** Nombre d'adultes */
  adults?: number;
  /** Nombre d'enfants */
  children?: number;
  /** Total = adults + children (calculé, stocké pour commodité) */
  totalGuests?: number;
  /** ISO date : "2025-07-14" */
  checkIn?: string;
  /** ISO date : "2025-07-21" */
  checkOut?: string;
  /** Nombre de nuits calculé */
  nights?: number;
  /** Budget indicatif par nuit en euros */
  budgetPerNight?: number;
  /** Objectif du séjour : "birthday", "honeymoon", "family", "corporate", etc. */
  stayPurpose?: string;
  /** IDs villas sur lesquelles le lead a montré de l'intérêt */
  interestedVillaIds?: string[];
  /** Équipements souhaités mentionnés explicitement */
  desiredAmenities?: string[];
  /** Demandes spéciales en texte libre */
  specialRequests?: string;
  /** utm_source ou nom de page d'entrée */
  acquisitionSource?: string;
  /** Score de qualification 0–100 calculé par n8n */
  qualificationScore?: number;
  /** Température du lead */
  temperature: LeadTemperature;
}

// ---------------------------------------------------------------------------
// 3. VILLA SIMPLIFIÉE POUR LE CHAT
// ---------------------------------------------------------------------------

/**
 * Représentation allégée d'une villa pour l'affichage dans le chat.
 * Ne jamais exposer ical_url ni access_token au frontend public.
 */
export interface SuggestedVilla {
  id: string;
  name: string;
  /** Description courte optimisée pour le chat (max 180 caractères) */
  shortDescription: string;
  pricePerNight: number;
  capacity: number;
  location: string | null;
  imageUrl: string | null;
  /** 3–5 équipements mis en avant dans la suggestion */
  highlights: string[];
  /** Raison de la recommandation par l'IA */
  matchReason?: string;
  /** Disponible pour les dates demandées (undefined = non vérifié) */
  availableForRequestedDates?: boolean;
  /** Prix total estimé pour le séjour demandé */
  estimatedTotal?: number;
  /** URL interne /villas/[slug] */
  slug?: string;
}

/**
 * Villa brute envoyée dans le contexte API → n8n.
 * Correspond aux colonnes Supabase retournées par la requête.
 */
export interface VillaContextItem {
  id: string;
  name: string;
  description: string | null;
  price_per_night: number;
  capacity: number;
  location: string | null;
  amenities: string[];
  image_url: string | null;
}

// ---------------------------------------------------------------------------
// 4. COMPARISON DATA
// ---------------------------------------------------------------------------

/**
 * Structure complète pour le composant comparatif côté UI.
 */
export interface ComparisonData {
  villas: Array<{
    id: string;
    name: string;
    highlights: string[];
    pricePerNight: number;
    capacity: number;
    location: string | null;
    imageUrl?: string | null;
    estimatedTotal?: number;
  }>;
  /** Critères de comparaison structurés (optionnel, enrichissement futur) */
  criteria?: Array<{
    key: string;
    label: string;
    values: Record<string, string | number | boolean>;
  }>;
  /** Villa recommandée par l'IA (id) */
  recommendedVillaId?: string;
  recommendationReason?: string;
}

// ---------------------------------------------------------------------------
// 5. CTA STRUCTURÉ
// ---------------------------------------------------------------------------

export type CtaType =
  | "none"
  | "view_villa"
  | "check_availability"
  | "contact"
  | "book_now"
  | "callback"
  | "navigate";

export interface ChatCta {
  type: CtaType;
  label?: string;
  /** URL interne ou externe */
  url?: string;
  /** ID villa ciblée */
  villaId?: string;
}

// ---------------------------------------------------------------------------
// 6. PRE-BOOKING PAYLOAD
// ---------------------------------------------------------------------------

/**
 * Payload de pré-réservation, structuré pour être prêt à l'emploi
 * dans un formulaire ou une API de création de booking.
 */
export interface PreBookingPayload {
  /** Si false, la liste missingFields indique ce qui manque */
  readyToCreate: boolean;
  missingFields: string[];
  payload?: {
    villaId: string;
    villaName: string;
    /** ISO date */
    checkIn: string;
    /** ISO date */
    checkOut: string;
    nights: number;
    adults: number;
    children: number;
    totalGuests: number;
    estimatedTotal: number;
    leadData: Pick<LeadData, "firstName" | "lastName" | "email" | "phone" | "specialRequests">;
    source: "website_chatbot";
    /** ISO timestamp */
    createdAt: string;
    sessionId: string;
  };
}

// ---------------------------------------------------------------------------
// 7. CHATBOT REQUEST — Chatbot.tsx → /api/chat
// ---------------------------------------------------------------------------

/**
 * Corps de la requête POST /api/chat envoyée par le composant Chatbot.tsx.
 */
export interface ChatbotRequest {
  /** Message saisi par l'utilisateur */
  message: string;
  /** Session persistée en localStorage */
  sessionId: string;
  /** Locale de l'interface */
  locale?: "fr" | "en";
  /** Pathname Next.js courant */
  currentPage?: string;
  /** ID villa en vue sur la page (ex. : page /villas/[id]) */
  villaId?: string;
  /** Lead data accumulée côté client */
  knownLeadData?: Partial<LeadData>;
  /** Stage courant transmis pour continuité de contexte */
  currentStage?: ChatStage;
  source: "website_chatbot";
}

// ---------------------------------------------------------------------------
// 8. CHATBOT API INPUT — /api/chat → n8n webhook
// ---------------------------------------------------------------------------

/**
 * Payload enrichi envoyé au webhook n8n.
 * L'API Next.js y injecte le contexte Supabase et les métadonnées de session.
 */
export interface ChatbotApiInput {
  // Conversation
  message: string;
  sessionId: string;
  locale: "fr" | "en";
  source: "website_chatbot";
  /** ISO timestamp de la requête */
  timestamp: string;
  currentPage: string;

  // Lead state
  knownLeadData: Partial<LeadData>;
  currentStage: ChatStage;

  // Contexte villas injecté par l'API
  context: {
    villas: VillaContextItem[];
    availableAmenities: string[];
    villaCount: number;
  };

  // Capabilities déclarées (guide le workflow n8n)
  capabilities: {
    canVerifyAvailability: boolean;  // true si iCal actif
    canCreateBooking: boolean;       // true si Supabase write activé
    canSendEmail: boolean;           // true si Resend configuré
  };

  // Optionnel : ID villa en contexte de page
  villaId?: string;
}

// ---------------------------------------------------------------------------
// 9. N8N RESPONSE — n8n → /api/chat
// ---------------------------------------------------------------------------

/**
 * Réponse structurée attendue du workflow n8n.
 * Le champ `reply` est le seul obligatoire pour la rétrocompatibilité.
 * L'API Next.js normalise cette structure avant de la renvoyer au frontend.
 */
export interface N8nChatResponse {
  /** Texte principal du message assistant */
  reply: string;

  /** Intent détecté par n8n */
  intent?: ChatIntent;

  /** Nouveau stage de la conversation */
  stage?: ChatStage;

  /** Température du lead calculée */
  leadTemperature?: LeadTemperature;

  /** Score de qualification 0–100 */
  qualificationScore?: number;

  /** Lead data extraite du message courant */
  leadUpdate?: Partial<LeadData>;

  /** Villas recommandées */
  suggestedVillas?: SuggestedVilla[];

  /** Données de comparaison */
  comparisonData?: ComparisonData;

  /** Payload pré-réservation */
  preBooking?: PreBookingPayload;

  /** CTA à afficher */
  cta?: ChatCta;

  /** Chips de suggestion rapide */
  suggestedQuickReplies?: string[];

  /** Si true, l'UI doit proposer un transfert humain */
  shouldEscalateToHuman?: boolean;
  humanHandoffReason?: string;

  /** Avertissements non bloquants (logs internes) */
  warnings?: string[];

  /** Données de debug (filtrées par l'API avant envoi au frontend) */
  debug?: Record<string, unknown>;
}

// ---------------------------------------------------------------------------
// 10. CHATBOT RESPONSE — /api/chat → Chatbot.tsx
// ---------------------------------------------------------------------------

/**
 * Réponse finale retournée par /api/chat.
 * Surface minimale exposée au navigateur — pas de données Supabase brutes.
 */
export interface ChatbotResponse {
  success: true;
  /** Texte du message assistant */
  reply: string;
  /** Session ID confirmé ou généré par l'API */
  sessionId: string;
  intent?: ChatIntent;
  stage?: ChatStage;
  leadTemperature?: LeadTemperature;
  leadUpdate?: Partial<LeadData>;
  suggestedVillas?: SuggestedVilla[];
  comparisonData?: ComparisonData;
  preBooking?: PreBookingPayload;
  cta?: ChatCta;
  suggestedQuickReplies?: string[];
  shouldEscalateToHuman?: boolean;
  humanHandoffReason?: string;
}

export interface ChatbotErrorResponse {
  success: false;
  error: string;
}

export type ChatbotApiResponse = ChatbotResponse | ChatbotErrorResponse;

// ---------------------------------------------------------------------------
// 11. CHAT MESSAGE (état local du composant React)
// ---------------------------------------------------------------------------

/**
 * Message stocké dans le state React de Chatbot.tsx.
 * Étend le format minimal actuel { role, content } avec les métadonnées UI.
 */
export interface ChatMessage {
  /** UUID v4 généré côté client pour la key React */
  id: string;
  role: "user" | "assistant";
  content: string;
  /** Date.now() au moment de l'ajout */
  timestamp: number;
  metadata?: {
    intent?: ChatIntent;
    stage?: ChatStage;
    cta?: ChatCta;
    suggestedVillas?: SuggestedVilla[];
    comparisonData?: ComparisonData;
    preBooking?: PreBookingPayload;
    shouldEscalate?: boolean;
  };
}

// ---------------------------------------------------------------------------
// 12. CHATBOT STATE (état global du hook useChatbot)
// ---------------------------------------------------------------------------

/**
 * État complet du chatbot — destiné à un hook `useChatbot` dédié.
 */
export interface ChatbotState {
  sessionId: string;
  stage: ChatStage;
  leadData: Partial<LeadData>;
  messages: ChatMessage[];
  isLoading: boolean;
  isOpen: boolean;
  isFullscreen: boolean;
  currentQuickSuggestions: string[];
}
