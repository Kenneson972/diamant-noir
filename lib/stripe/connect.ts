import Stripe from "stripe";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || "";
const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

let stripeInstance: Stripe | null = null;
function getStripe(): Stripe {
  if (!stripeInstance) {
    stripeInstance = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });
  }
  return stripeInstance;
}

/**
 * Crée un compte Connect Express pour un propriétaire.
 * Returns { accountId } or throws.
 */
export async function createConnectAccount(email: string): Promise<{ accountId: string }> {
  const stripe = getStripe();

  const account = await stripe.accounts.create({
    type: "express",
    email,
    capabilities: {
      transfers: { requested: true },
    },
    business_type: "individual",
    metadata: {
      source: "kayvila_owner_onboarding",
    },
  });

  return { accountId: account.id };
}

/**
 * Génère un lien d'onboarding Stripe Connect pour que le propriétaire
 * remplisse ses infos bancaires et fiscales.
 * Returns { url } or throws.
 */
export async function createOnboardingLink(accountId: string): Promise<{ url: string }> {
  const stripe = getStripe();

  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${baseUrl}/dashboard?connect=refresh`,
    return_url: `${baseUrl}/dashboard?connect=success`,
    type: "account_onboarding",
  });

  return { url: accountLink.url };
}

/**
 * Récupère les infos du compte Connect (statut, charges enabled, etc.)
 */
export async function getConnectAccount(accountId: string) {
  const stripe = getStripe();
  return await stripe.accounts.retrieve(accountId);
}

/**
 * Calcule les montants pour le split Stripe Connect (réservations directes Kayvila).
 *
 * Modèle commercial (FAQ conciergerie + spec Stripe Connect) :
 * - Propriétaire : 80 % du montant nuitées (séjour hors ménage/service)
 * - Kayvila : 20 % du séjour + 100 % frais de ménage + 100 % frais de service
 *
 * @param stayCents - Montant des nuitées uniquement
 * @param cleaningFeeCents - Frais de ménage (100 % Kayvila)
 * @param serviceFeeCents - Frais de service Kayvila (100 % Kayvila)
 * @param applicationFeePercent - Commission sur le séjour (défaut 20 %)
 */
export function calculateTransferAmounts(
  stayCents: number,
  cleaningFeeCents: number,
  serviceFeeCents: number,
  applicationFeePercent = 20
): { ownerAmountCents: number; platformFeeCents: number } {
  const commissionOnStayCents = Math.round(
    stayCents * (applicationFeePercent / 100)
  );
  const ownerAmountCents = stayCents - commissionOnStayCents;
  const platformFeeCents =
    commissionOnStayCents + cleaningFeeCents + serviceFeeCents;

  return { ownerAmountCents, platformFeeCents };
}
