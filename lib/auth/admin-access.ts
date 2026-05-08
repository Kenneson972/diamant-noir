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

/** True if either profile role or JWT metadata role is admin (avoids lockout when one source is stale). */
export function isStaffAdmin(
  profileRole: string | null | undefined,
  metadataRole: string | null | undefined,
  email?: string | null
): boolean {
  return (
    isAdminRole(profileRole) ||
    isAdminRole(metadataRole ?? undefined) ||
    isEmailStaffAdmin(email ?? undefined)
  );
}

/**
 * Propriétaire (accès /dashboard) : priorité au profil — les JWT ont souvent role absent ou "client".
 */
export function isOwnerRole(
  profileRole: string | null | undefined,
  metadataRole: string | null | undefined
): boolean {
  if (normalizeRole(profileRole) === "owner") return true;
  return normalizeRole(metadataRole) === "owner";
}

/**
 * Après login mot de passe : un compte staff ne doit pas atterrir sur /dashboard (proprio)
 * Hub legacy grille villas : /admin/hub-classique (plus /dashboard/proprio pour le staff).
 * Idem pour /espace-client (callback magic link par défaut).
 */
export function postLoginDestination(opts: {
  requestedRedirect: string;
  profileRole: string | null | undefined;
  metadataRole: string | null | undefined;
  email?: string | null;
}): string {
  const { requestedRedirect, profileRole, metadataRole, email } = opts;
  if (!isStaffAdmin(profileRole, metadataRole, email)) {
    return requestedRedirect;
  }
  if (requestedRedirect.startsWith("/admin")) {
    return requestedRedirect;
  }
  if (
    requestedRedirect === "/dashboard" ||
    requestedRedirect.startsWith("/dashboard/")
  ) {
    return "/admin";
  }
  if (
    requestedRedirect === "/espace-client" ||
    requestedRedirect.startsWith("/espace-client/")
  ) {
    return "/admin";
  }
  return requestedRedirect;
}
