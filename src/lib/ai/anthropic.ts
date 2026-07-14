import "server-only";
import Anthropic from "@anthropic-ai/sdk";

/**
 * Shared Anthropic client (Claude). Instantiated lazily so importing this module
 * during build/typecheck (when the key is absent) doesn't throw. The AI
 * co-writer and auto-breakdown (PRD Module 1) run through this.
 */
let client: Anthropic | null = null;

export function getAnthropic(): Anthropic {
  if (client) return client;
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error(
      "ANTHROPIC_API_KEY is not set. Add it to .env.local to enable AI co-writing and breakdown.",
    );
  }
  client = new Anthropic();
  return client;
}

/** Latest, most capable Claude model — the default for all app AI features. */
export const MODEL = "claude-opus-4-8";
