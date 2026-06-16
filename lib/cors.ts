const ALLOWED_ORIGIN =
  process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  "https://kayvila.com";

/** En-têtes CORS avec origine explicite (jamais "*" — audit Sec#1). */
export function corsHeaders(methods: string): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": ALLOWED_ORIGIN,
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Vary": "Origin",
  };
}
