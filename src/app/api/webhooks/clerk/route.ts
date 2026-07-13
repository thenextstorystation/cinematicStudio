import { NextResponse, type NextRequest } from "next/server";
import { verifyWebhook } from "@clerk/nextjs/webhooks";
import { eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";

/**
 * Clerk webhook: keeps the local `users` row in sync with Clerk profile
 * changes and handles deletion. Creation is also handled just-in-time in
 * server/auth.ts, so this endpoint is a durability backstop.
 */
export async function POST(req: NextRequest) {
  let evt;
  try {
    evt = await verifyWebhook(req);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const { type, data } = evt;

  if (type === "user.updated") {
    const email = data.email_addresses?.[0]?.email_address;
    await db
      .update(users)
      .set({
        email: email ?? undefined,
        displayName:
          [data.first_name, data.last_name].filter(Boolean).join(" ") || null,
        imageUrl: data.image_url ?? null,
        updatedAt: sql`now()`,
      })
      .where(eq(users.clerkId, data.id));
  }

  if (type === "user.deleted" && data.id) {
    await db.delete(users).where(eq(users.clerkId, data.id));
  }

  return NextResponse.json({ received: true });
}
