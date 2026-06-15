// lib/chatbot/rate-limit.ts
// Rate limiting partagé pour les endpoints chatbot publics.
// En production : utiliser Upstash Redis.

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

/**
 * Vérifie si une IP est sous la limite. Retourne true si la requête est autorisée.
 * Fenêtre glissante simple — en production, remplacer par Upstash Redis.
 */
export function checkRateLimit(
  ip: string,
  maxRequests = 30,
  windowMs = 3_600_000
): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= maxRequests) return false;
  record.count++;
  return true;
}

/** Extrait l'IP client depuis les en-têtes HTTP standard. */
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}
