// lib/chatbot/conciergerie-context.ts
// Faits conciergerie pour le tunnel acquisition propriétaire (Agent A).
// Source de vérité : data/conciergerie-faq.ts — on en extrait des points clés.

export type OwnerLeadInput = {
  villasCount?: number;
  location?: string;
  email?: string;
  name?: string;
  sessionId?: string;
};

/** Points clés conciergerie injectés dans le contexte n8n (pas de hardcode chiffré ailleurs). */
export const CONCIERGERIE_FACTS = [
  "Commission Kayvila : 22 % du montant des nuitées réglé par le voyageur (ménage et blanchisserie exclus de la base de commission, facturés séparément aux voyageurs).",
  "Réservations directes via le site Kayvila : frais de traitement de 5 % (pas de commission plateforme).",
  "Synchronisation des calendriers Airbnb / Booking pour éviter les doubles réservations.",
  "Maintenance, ménage, accueil voyageurs et réassort des consommables gérés par Kayvila.",
  "Visibilité accrue : mise en avant sur le site Kayvila + plateformes OTA.",
  "Pack de démarrage 200 € à la première mise en service (consommables, boîte à clés sécurisée, guide).",
  "Rapport mensuel détaillé + facture de commission, réglable sous 8 jours (mandat SEPA possible).",
] as const;

export function validateOwnerLead(input: Partial<OwnerLeadInput>):
  | { ok: true; value: OwnerLeadInput }
  | { ok: false; error: string } {
  const hasCount = typeof input.villasCount === "number" && input.villasCount > 0;
  const hasLocation = !!(input.location && String(input.location).trim());
  if (!hasCount && !hasLocation && !input.email) {
    return { ok: false, error: "Aucune information de qualification fournie." };
  }
  return {
    ok: true,
    value: {
      villasCount: hasCount ? Math.floor(Number(input.villasCount)) : undefined,
      location: hasLocation ? String(input.location).trim().slice(0, 120) : undefined,
      email: input.email ? String(input.email).trim().slice(0, 160) : undefined,
      name: input.name ? String(input.name).trim().slice(0, 120) : undefined,
      sessionId: input.sessionId ? String(input.sessionId).slice(0, 80) : undefined,
    },
  };
}

/** Construit le lien vers le formulaire public, pré-rempli si possible. */
export function buildSubmissionUrl(input: { name?: string; email?: string; location?: string }): string {
  const params = new URLSearchParams();
  if (input.name) params.set("name", input.name);
  if (input.email) params.set("email", input.email);
  if (input.location) params.set("villa_location", input.location);
  const qs = params.toString();
  return qs ? `/soumettre-ma-villa?${qs}` : "/soumettre-ma-villa";
}
