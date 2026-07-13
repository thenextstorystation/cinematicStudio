/**
 * Neon serverless Postgres client wired to Drizzle.
 *
 * Uses the HTTP driver, which is ideal for serverless / edge-adjacent Next.js
 * route handlers and server actions (no persistent socket to manage).
 */
import { drizzle } from "drizzle-orm/neon-http";
import { neon } from "@neondatabase/serverless";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not set. Copy .env.example to .env.local and add your Neon connection string.",
  );
}

const sql = neon(connectionString);

export const db = drizzle(sql, { schema });

export { schema };
export type Database = typeof db;
