export type AppRole = "admin" | "owner" | "tenant" | "client" | "proprio";

/** Normalise le rôle (casse, espaces, alias DB). */
export function normalizeRole(role: string | null | undefined): AppRole {
  if (!role) return "client";
  const r = role.trim().toLowerCase();
  if (r === "proprio" || r === "owner") return "owner";
  if (r === "admin") return "admin";
  if (r === "tenant") return "tenant";
  if (r === "client") return "client";
  return "client";
}

export function isAdminRole(role: string | null | undefined): boolean {
  return normalizeRole(role) === "admin";
}

/**
 * Liste d’emails staff (secours si `profiles.role` pas encore `admin`).
 * STAFF_ADMIN_EMAILS ou ADMIN_STAFF_EMAILS — séparés par virgule, insensible à la casse.
 */
export function isEmailStaffAdmin(email: string | null | undefined): boolean {
  if (!email?.trim()) return false;
  const raw =
    process.env.STAFF_ADMIN_EMAILS ?? process.env.ADMIN_STAFF_EMAILS ?? "";
  const allow = raw
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  return allow.includes(email.trim().toLowerCase());
}

/**
 * Staff admin. Ne JAMAIS se fier à `user_metadata.role` du JWT : ce champ est
 * modifiable par l'utilisateur lui-même via auth.updateUser(), donc n'importe
 * quel compte pouvait s'auto-promouvoir admin (audit préprod 2026-08-29).
 * Sources de confiance : `profiles.role` (écrit côté serveur) et la liste
 * STAFF_ADMIN_EMAILS, qui sert déjà de filet anti-lockout.
 */
export function isStaffAdmin(
  profileRole: string | null | undefined,
  email?: string | null
): boolean {
  return isAdminRole(profileRole) || isEmailStaffAdmin(email ?? undefined);
}

/**
 * Propriétaire (accès /dashboard) : `profiles.role` uniquement, même raison que
 * pour isStaffAdmin — `user_metadata` n'est pas une source de confiance.
 */
export function isOwnerRole(profileRole: string | null | undefined): boolean {
  return normalizeRole(profileRole) === "owner";
}

/**
 * Après login mot de passe : un compte staff ne doit pas atterrir sur /dashboard (proprio)
 * Hub legacy grille villas : /admin/hub-classique (plus /dashboard/proprio pour le staff).
 * Idem pour /espace-client (callback magic link par défaut).
 */
export function postLoginDestination(opts: {
  requestedRedirect: string;
  profileRole: string | null | undefined;
  email?: string | null;
}): string {
  const { requestedRedirect, profileRole, email } = opts;
  // Destination admin : absolue en prod (admin.kayvila.com), relative en dev
  const adminDest =
    process.env.NODE_ENV === "development"
      ? "/admin"
      : `${process.env.NEXT_PUBLIC_ADMIN_URL || "https://admin.kayvila.com"}/admin`;
  if (!isStaffAdmin(profileRole, email)) {
    return requestedRedirect;
  }
  if (requestedRedirect.startsWith("/admin")) {
    return adminDest;
  }
  if (
    requestedRedirect === "/dashboard" ||
    requestedRedirect.startsWith("/dashboard/")
  ) {
    return adminDest;
  }
  if (
    requestedRedirect === "/espace-client" ||
    requestedRedirect.startsWith("/espace-client/")
  ) {
    return adminDest;
  }
  return requestedRedirect;
}
