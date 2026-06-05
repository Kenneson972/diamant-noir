import { getSupabaseServer } from "@/lib/supabase-server";
import { isStaffAdmin } from "@/lib/auth/admin-access";

// ─── Token extraction ──────────────────────────────────────────────────────

function getBearer(request: Request): string | null {
  const authHeader = request.headers.get("authorization") || "";
  return authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
}

// ─── User resolution ───────────────────────────────────────────────────────

export async function getUserFromRequest(request: Request) {
  const token = getBearer(request);
  if (!token) return { user: null };

  const supabase = await getSupabaseServer();
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return { user: null };

  return { user: { id: data.user.id, email: data.user.email } };
}

// ─── Guards (throw on failure — caller catches and returns HTTP response) ──

export class AuthError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
    this.name = "AuthError";
  }
}

/**
 * Require a valid user session. Throws AuthError(401) if not authenticated.
 * Returns the authenticated user's id.
 */
export async function requireAuth(request: Request): Promise<string> {
  const { user } = await getUserFromRequest(request);
  if (!user) throw new AuthError("Authentification requise", 401);
  return user.id;
}

/**
 * Require admin role. Throws AuthError(403) if not admin.
 * Returns the authenticated admin's user id.
 */
export async function requireAdmin(request: Request): Promise<string> {
  const { user } = await getUserFromRequest(request);
  if (!user) throw new AuthError("Authentification requise", 401);

  const supabase = await getSupabaseServer();
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  const admin = isStaffAdmin(
    profile?.role ?? null,
    null,
    user.email ?? null,
  );

  if (!admin) throw new AuthError("Accès administrateur requis", 403);
  return user.id;
}

/**
 * Verify the request carries a valid CRON_API_KEY (for webhook/cron routes).
 * Returns true if the Bearer token matches process.env.CRON_API_KEY.
 */
export function verifyApiKey(request: Request): boolean {
  const key = process.env.CRON_API_KEY;
  if (!key) return false;
  const token = getBearer(request);
  return token === key;
}
