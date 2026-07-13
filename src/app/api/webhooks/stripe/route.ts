import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getStripe } from "@/lib/billing/stripe";
import { topUpCredits, hasProcessedReference } from "@/lib/billing/credits";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Stripe webhook: credits the wallet on a completed checkout / paid invoice.
 * Idempotent via the ledger's reference id (PRD §6.7 ledger-first).
 */
export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!signature || !secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    return NextResponse.json(
      { error: `Webhook signature verification failed: ${(err as Error).message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const customerId =
      typeof session.customer === "string" ? session.customer : null;
    const credits = Number(session.metadata?.credits ?? 0);

    if (customerId && credits > 0) {
      const [user] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.stripeCustomerId, customerId));

      if (user && !(await hasProcessedReference(user.id, session.id))) {
        await topUpCredits(user.id, credits, session.id);
      }
    }
  }

  return NextResponse.json({ received: true });
}
