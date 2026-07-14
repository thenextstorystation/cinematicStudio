/**
 * Continuity engine — Detect stage (PRD §6.5, §2.2).
 *
 * Every rendered take gets a post-render consistency score (0–100). A real
 * deployment computes this from an identity embedding distance against the
 * character's locked reference set plus a VLM wardrobe/palette check. Until a
 * vision model is wired, `HeuristicScorer` produces a deterministic, honest
 * placeholder driven by whether identity was locked at compile time — swap the
 * implementation, keep the interface.
 *
 * Acceptance target (§9): identity median ≥85, takes <70 auto-flagged.
 */
export const FLAG_THRESHOLD = 70;

export type ScoreInput = {
  /** The compiled prompt text this take rendered from. */
  compiledText: string;
  /** How many role-labeled identity references were attached (0 = unlocked). */
  identityRefCount: number;
  seed?: string | null;
};

export type ContinuityScore = {
  identity: number; // 0..100
  flagged: boolean;
};

export interface ContinuityScorer {
  score(input: ScoreInput): ContinuityScore;
}

/** Deterministic placeholder scorer. Replace with an embedding/VLM scorer. */
export class HeuristicScorer implements ContinuityScorer {
  score(input: ScoreInput): ContinuityScore {
    const h = hash(`${input.compiledText}|${input.seed ?? ""}`);
    // 60..95 spread from the prompt/seed, so scores vary but are reproducible.
    let identity = 60 + (h % 36);
    // No identity reference attached ⇒ real drift risk; penalize.
    if (input.identityRefCount === 0) identity -= 25;
    identity = Math.max(0, Math.min(100, identity));
    return { identity, flagged: identity < FLAG_THRESHOLD };
  }
}

/** Stable non-negative 32-bit hash (FNV-1a). */
function hash(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

export const continuityScorer: ContinuityScorer = new HeuristicScorer();
