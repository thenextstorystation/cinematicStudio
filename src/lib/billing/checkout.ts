import "server-only";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getStripe } from "./stripe";
import { CREDIT_PACKS } from "./packs";

/** Get or lazily create the Stripe customer for a user, persisting the id. */
async function ensureStripeCustomer(user: {
  id: string;
  email: string;
  stripeCustomerId: string | null;
  displayName: string | null;
}): Promise<string> {
  if (user.stripeCustomerId) return user.stripeCustomerId;

  const customer = await getStripe().customers.create({
    email: user.email,
    name: user.displayName ?? undefined,
    metadata: { userId: user.id },
  });

  await db
    .update(users)
    .set({ stripeCustomerId: customer.id, updatedAt: sql`now()` })
    .where(eq(users.id, user.id));

  return customer.id;
}

/**
 * Create a Stripe Checkout session for a credit pack and return its URL.
 * On payment, the `checkout.session.completed` webhook credits the wallet
 * from `metadata.credits` (idempotently) — see api/webhooks/stripe.
 */
export async function createCreditCheckout(
  user: {
    id: string;
    email: string;
    stripeCustomerId: string | null;
    displayName: string | null;
  },
  packKey: string,
): Promise<string> {
  const pack = CREDIT_PACKS[packKey];
  if (!pack) throw new Error("Unknown credit pack");

  const customerId = await ensureStripeCustomer(user);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const session = await getStripe().checkout.sessions.create({
    mode: "payment",
    customer: customerId,
    line_items: [
      {
        quantity: 1,
        price_data: {
          currency: "usd",
          unit_amount: pack.amountCents,
          product_data: {
            name: `${pack.credits.toLocaleString()} credits — ${pack.label} pack`,
          },
        },
      },
    ],
    // The webhook reads these off the completed session.
    metadata: { credits: String(pack.credits), pack: pack.key, userId: user.id },
    success_url: `${appUrl}/dashboard/billing?status=success`,
    cancel_url: `${appUrl}/dashboard/billing?status=cancel`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL");
  return session.url;
}
