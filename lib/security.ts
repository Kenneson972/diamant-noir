/* ─── Utilitaires de sécurité ──────────────────────────────── */

/**
 * Vérifie qu'une requête API est authentifiée avec un Bearer token
 * valide (soit un token Supabase, soit une API key interne).
 */
export async function verifyApiAuth(authHeader: string): Promise<{ authorized: boolean; userId?: string; error?: string }> {
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!token) {
    return { authorized: false, error: "Unauthorized" };
  }

  // Vérifier l'API key interne d'abord (pour les routes internes)
  const internalApiKey = process.env.API_SECRET_KEY;
  if (internalApiKey && token === internalApiKey) {
    return { authorized: true };
  }

  // Sinon, vérifier via Supabase Auth
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
    const client = createClient(supabaseUrl, supabaseAnonKey, { auth: { persistSession: false } });
    const { data: userData, error } = await client.auth.getUser(token);
    if (error || !userData?.user) {
      return { authorized: false, error: "Unauthorized" };
    }
    return { authorized: true, userId: userData.user.id };
  } catch {
    return { authorized: false, error: "Unauthorized" };
  }
}

/**
 * Rate limiter in-memory simple (redémarrage = reset).
 * Utilise globalThis pour persister entre hot-reloads.
 */
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const BUCKETS: Map<string, RateLimitBucket> =
  (globalThis as any).__dn_rate_limit ??
  (((globalThis as any).__dn_rate_limit = new Map<string, RateLimitBucket>()));

export function checkRateLimit(
  key: string,
  maxRequests: number = 30,
  windowMs: number = 60_000
): boolean {
  const now = Date.now();
  const bucket = BUCKETS.get(key);

  if (!bucket || bucket.resetAt <= now) {
    BUCKETS.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  bucket.count += 1;
  if (bucket.count > maxRequests) {
    return false;
  }
  return true;
}

/**
 * Extrait l'IP d'une requête.
 */
export function ipFromRequest(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]?.trim() || "unknown";
  const xr = request.headers.get("x-real-ip");
  return xr || "unknown";
}

/**
 * Vérifie le header CSRF simple (Origin / Referer).
 */
export function verifyOrigin(request: Request, allowedOrigins?: string[]): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  if (process.env.NODE_ENV === "development") return true;

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const origins = allowedOrigins || [baseUrl];

  if (origin && origins.some((o) => origin.startsWith(o))) return true;
  if (referer && origins.some((o) => referer.startsWith(o))) return true;

  return false;
}

import { NextResponse } from "next/server";

/**
 * Inline CSRF check for mutation routes.
 * Returns null if OK, or NextResponse 403 if blocked.
 * Usage: const csrf = checkCsrf(request); if (csrf) return csrf;
 */
export function checkCsrf(request: Request): NextResponse | null {
  if (!verifyOrigin(request)) {
    return NextResponse.json({ error: "Invalid origin" }, { status: 403 });
  }
  return null;
}

/**
 * CSRF wrapper for mutation routes.
 * Usage: export const POST = withCsrf(async (request) => { ... })
 */
export function withCsrf(
  handler: (request: Request, ...args: any[]) => Promise<Response>
) {
  return async (request: Request, ...args: any[]): Promise<Response> => {
    if (!verifyOrigin(request)) {
      return new Response(JSON.stringify({ error: "Invalid origin" }), {
        status: 403,
        headers: { "Content-Type": "application/json" },
      });
    }
    return handler(request, ...args);
  };
}

/**
 * Extrait le token Bearer d'une requête.
 */
export function extractToken(request: Request): string | null {
  const auth = request.headers.get("authorization") || "";
  if (auth.startsWith("Bearer ")) return auth.slice(7);
  return null;
}
