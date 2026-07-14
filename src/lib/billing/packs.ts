/**
 * Credit packs (top-ups). Priced inline via Stripe Checkout `price_data`, so no
 * pre-created Stripe Price objects are required to run. Shared between the
 * billing UI and the checkout builder.
 */
export type CreditPack = {
  key: string;
  label: string;
  credits: number;
  amountCents: number; // USD
};

export const CREDIT_PACKS: Record<string, CreditPack> = {
  starter: { key: "starter", label: "Starter", credits: 1000, amountCents: 900 },
  pro: { key: "pro", label: "Pro", credits: 5000, amountCents: 3900 },
  studio: { key: "studio", label: "Studio", credits: 15000, amountCents: 9900 },
};

export const CREDIT_PACK_LIST = Object.values(CREDIT_PACKS);
