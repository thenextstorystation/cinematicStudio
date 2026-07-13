import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { creditLedger, users } from "@/db/schema";

/**
 * Ledger-first credit engine (PRD §6.7, §24).
 *
 * Every movement appends a row to `credit_ledger` and updates the cached
 * balance on `users` atomically. Spends are validated against the current
 * balance; failed generations get auto-refunded (PRD §24.2).
 */

export class InsufficientCreditsError extends Error {
  constructor(
    readonly required: number,
    readonly available: number,
  ) {
    super(`Insufficient credits: need ${required}, have ${available}.`);
    this.name = "InsufficientCreditsError";
  }
}

type Reason = (typeof creditLedger.$inferInsert)["reason"];

async function applyDelta(params: {
  userId: string;
  delta: number; // signed
  reason: Reason;
  referenceType?: string;
  referenceId?: string;
  metadata?: Record<string, unknown>;
  allowNegative?: boolean;
}) {
  const {
    userId,
    delta,
    reason,
    referenceType,
    referenceId,
    metadata,
    allowNegative = false,
  } = params;

  return db.transaction(async (tx) => {
    const [user] = await tx
      .select({ balance: users.creditBalance })
      .from(users)
      .where(eq(users.id, userId))
      .for("update");

    if (!user) throw new Error(`Unknown user ${userId}`);

    const next = user.balance + delta;
    if (next < 0 && !allowNegative) {
      throw new InsufficientCreditsError(-delta, user.balance);
    }

    await tx
      .update(users)
      .set({ creditBalance: next, updatedAt: sql`now()` })
      .where(eq(users.id, userId));

    const [entry] = await tx
      .insert(creditLedger)
      .values({
        userId,
        reason,
        amount: delta,
        balanceAfter: next,
        referenceType,
        referenceId,
        metadata,
      })
      .returning();

    return { balance: next, entry };
  });
}

/** Grant subscription/signup credits. */
export function grantCredits(
  userId: string,
  amount: number,
  metadata?: Record<string, unknown>,
) {
  return applyDelta({ userId, delta: Math.abs(amount), reason: "grant", metadata });
}

/** Add purchased credits from a completed Stripe checkout. */
export function topUpCredits(
  userId: string,
  amount: number,
  stripeReferenceId: string,
) {
  return applyDelta({
    userId,
    delta: Math.abs(amount),
    reason: "topup",
    referenceType: "stripe.checkout",
    referenceId: stripeReferenceId,
  });
}

/** Spend credits against a take. Throws InsufficientCreditsError if short. */
export function spendCredits(
  userId: string,
  amount: number,
  takeId: string,
) {
  return applyDelta({
    userId,
    delta: -Math.abs(amount),
    reason: "spend",
    referenceType: "take",
    referenceId: takeId,
  });
}

/** Auto-refund a failed/canceled take (PRD §24.2). */
export function refundCredits(
  userId: string,
  amount: number,
  takeId: string,
  metadata?: Record<string, unknown>,
) {
  return applyDelta({
    userId,
    delta: Math.abs(amount),
    reason: "refund",
    referenceType: "take",
    referenceId: takeId,
    metadata,
  });
}

export async function getBalance(userId: string): Promise<number> {
  const [row] = await db
    .select({ balance: users.creditBalance })
    .from(users)
    .where(eq(users.id, userId));
  return row?.balance ?? 0;
}

export function getLedger(userId: string, limit = 50) {
  return db
    .select()
    .from(creditLedger)
    .where(eq(creditLedger.userId, userId))
    .orderBy(desc(creditLedger.createdAt))
    .limit(limit);
}

/** Idempotency guard: has this Stripe object already been credited? */
export async function hasProcessedReference(
  userId: string,
  referenceId: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: creditLedger.id })
    .from(creditLedger)
    .where(
      and(
        eq(creditLedger.userId, userId),
        eq(creditLedger.referenceId, referenceId),
      ),
    )
    .limit(1);
  return Boolean(row);
}
