import Stripe from "stripe";

/** Version API Stripe — alignée fix Elise (2025-03-31.basil). */
export const STRIPE_API_VERSION = "2025-03-31.basil" as Stripe.LatestApiVersion;

let stripeInstance: Stripe | null = null;

export function getStripeServer(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;

  if (!stripeInstance) {
    stripeInstance = new Stripe(secretKey, { apiVersion: STRIPE_API_VERSION });
  }
  return stripeInstance;
}

export function requireStripeServer(): Stripe {
  const stripe = getStripeServer();
  if (!stripe) {
    throw new Error("STRIPE_SECRET_KEY manquante");
  }
  return stripe;
}
