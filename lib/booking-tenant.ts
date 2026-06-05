/** Normalise l'email locataire (comparaison RLS + espace client). */
export function normalizeGuestEmail(email: string | null | undefined): string | null {
  if (!email || typeof email !== "string") return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** Filtre Supabase `.or()` pour les réservations d'un locataire connecté. */
export function tenantBookingsOrFilter(userId: string, email: string | null | undefined): string {
  const normalized = normalizeGuestEmail(email);
  if (normalized) {
    return `client_user_id.eq.${userId},guest_email.eq.${normalized}`;
  }
  return `client_user_id.eq.${userId}`;
}

export function bookingBelongsToTenant(
  booking: { guest_email?: string | null; client_user_id?: string | null },
  user: { id: string; email?: string | null }
): boolean {
  if (booking.client_user_id && booking.client_user_id === user.id) return true;
  const bookingEmail = normalizeGuestEmail(booking.guest_email);
  const userEmail = normalizeGuestEmail(user.email);
  return Boolean(bookingEmail && userEmail && bookingEmail === userEmail);
}

/** Email à enregistrer sur la réservation (formulaire + session auth). */
export function resolveBookingGuestEmail(
  formEmail: string | null | undefined,
  authEmail: string | null | undefined
): string | null {
  return normalizeGuestEmail(formEmail || authEmail);
}

/** Associe un compte existant via l'email (webhook / sync Stripe). */
export async function lookupClientUserIdByEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: any,
  email: string | null | undefined
): Promise<string | null> {
  const normalized = normalizeGuestEmail(email);
  if (!normalized) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();
  return (data as { id: string } | null)?.id ?? null;
}
