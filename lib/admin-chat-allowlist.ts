/**
 * Accès à POST /api/admin/chat réservé équipe / gérant.
 * Configurer ADMIN_CHAT_ALLOWED_EMAILS et/ou ADMIN_CHAT_ALLOWED_USER_IDS (CSV).
 * Sans allowlist : accès refusé (403).
 */

export function isAdminChatAllowedUser(user: {
  id: string;
  email?: string | null;
}): boolean {
  const ids = (process.env.ADMIN_CHAT_ALLOWED_USER_IDS || "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  const emails = (process.env.ADMIN_CHAT_ALLOWED_EMAILS || "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);

  if (ids.length === 0 && emails.length === 0) {
    return false;
  }

  if (ids.includes(user.id)) return true;
  const em = user.email?.toLowerCase();
  if (em && emails.includes(em)) return true;
  return false;
}
