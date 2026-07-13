import Stripe from "stripe";

/**
 * Shared Stripe client. Instantiated lazily so importing this module during
 * build/typecheck (when the key is absent) doesn't throw.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set.");
  }
  client = new Stripe(key, { apiVersion: "2025-02-24.acacia" });
  return client;
}

/** Credit packs / subscription price mapping. Amounts in credits. */
export const CREDIT_PRICES: Record<string, { priceEnv: string; credits: number }> =
  {
    creator: { priceEnv: "STRIPE_PRICE_CREATOR", credits: 2000 },
    pro: { priceEnv: "STRIPE_PRICE_PRO", credits: 8000 },
  };
