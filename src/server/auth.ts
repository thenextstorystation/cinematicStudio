import "server-only";
import { auth, currentUser } from "@clerk/nextjs/server";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { grantCredits } from "@/lib/billing/credits";

/** Signup grant so first-run onboarding (PRD §20.1) works out of the box. */
const SIGNUP_CREDITS = 500;

/**
 * Resolves the current Clerk user to our local `users` row, creating it on
 * first sight (JIT provisioning) and seeding signup credits. Returns null when
 * unauthenticated.
 */
export async function getCurrentUser() {
  const { userId: clerkId } = await auth();
  if (!clerkId) return null;

  const existing = await db.query.users.findFirst({
    where: eq(users.clerkId, clerkId),
  });
  if (existing) return existing;

  const clerk = await currentUser();
  const email =
    clerk?.primaryEmailAddress?.emailAddress ??
    clerk?.emailAddresses[0]?.emailAddress ??
    `${clerkId}@placeholder.local`;

  const [created] = await db
    .insert(users)
    .values({
      clerkId,
      email,
      displayName:
        [clerk?.firstName, clerk?.lastName].filter(Boolean).join(" ") || null,
      imageUrl: clerk?.imageUrl ?? null,
    })
    .onConflictDoUpdate({
      target: users.clerkId,
      set: { updatedAt: sql`now()` },
    })
    .returning();

  await grantCredits(created.id, SIGNUP_CREDITS, { source: "signup" });

  // Re-read to reflect the granted balance.
  return db.query.users.findFirst({ where: eq(users.id, created.id) });
}

/** Like getCurrentUser but throws — for server actions that require auth. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
