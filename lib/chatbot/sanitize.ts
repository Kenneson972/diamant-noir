// ============================================================
// Diamant Noir — Sanitisation des messages chatbot
// Protection contre l'injection de prompt et les payloads malveillants
// ============================================================

// Patterns d'injection de prompt courants
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above)\s+(instructions?|rules?|prompts?)/i,
  /disregard\s+(all\s+)?(previous|prior)\s+(instructions?|rules?)/i,
  /you\s+are\s+now\s+(?:a|an)\s+/i,
  /forget\s+(everything|all|your\s+instructions?)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(?:a|an)\s+/i,
  /jailbreak/i,
  /system\s*prompt/i,
  /\[INST\]/i,
  /<<SYS>>/i,
  /<\|im_start\|>/i,
  /###\s*instruction/i,
  /do\s+anything\s+now/i,
  /DAN\s*:/i,
];

// Taille max du message (caractères)
const MAX_MESSAGE_LENGTH = 1000;

// Taille max du résumé de conversation
const MAX_SUMMARY_LENGTH = 2000;

export interface SanitizeResult {
  safe: boolean;
  sanitized: string;
  reason?: string;
}

/**
 * Sanitise un message utilisateur pour le chatbot.
 * Retourne { safe: false } si une tentative d'injection est détectée.
 */
export function sanitizeUserMessage(raw: string): SanitizeResult {
  if (!raw || typeof raw !== "string") {
    return { safe: false, sanitized: "", reason: "empty_or_invalid" };
  }

  // Tronquer
  const truncated = raw.slice(0, MAX_MESSAGE_LENGTH).trim();

  if (!truncated) {
    return { safe: false, sanitized: "", reason: "empty_after_trim" };
  }

  // Détecter injection
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(truncated)) {
      return {
        safe: false,
        sanitized: truncated,
        reason: "prompt_injection_detected",
      };
    }
  }

  // Nettoyer les caractères de contrôle (sauf \n \t)
  const cleaned = truncated.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");

  return { safe: true, sanitized: cleaned };
}

/**
 * Sanitise le résumé de conversation envoyé par le frontend.
 */
export function sanitizeConversationSummary(raw: string): string {
  if (!raw || typeof raw !== "string") return "";
  return raw.slice(0, MAX_SUMMARY_LENGTH).trim();
}

/**
 * Sanitise les données lead partielles envoyées par le frontend.
 * Filtre les champs inattendus et valide les formats basiques.
 */
export function sanitizeLeadData(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  const allowed = [
    "firstName", "lastName", "email", "phone", "budget",
    "villaPreference", "stayPurpose", "specialRequests",
    "checkIn", "checkOut", "guestCount",
  ];

  const result: Record<string, unknown> = {};
  const input = raw as Record<string, unknown>;

  for (const key of allowed) {
    if (key in input) {
      const val = input[key];
      if (key === "guestCount") {
        const n = Number(val);
        if (Number.isFinite(n) && n > 0 && n <= 50) result[key] = n;
      } else if (typeof val === "string") {
        const trimmed = val.trim().slice(0, 200);
        if (trimmed) result[key] = trimmed;
      }
    }
  }

  // Validation email basique
  if (result.email && typeof result.email === "string") {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
      delete result.email;
    }
  }

  return result;
}
