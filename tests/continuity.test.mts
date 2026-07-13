import { test } from "node:test";
import assert from "node:assert/strict";
import { HeuristicScorer, FLAG_THRESHOLD } from "../src/lib/continuity/scorer.ts";

const scorer = new HeuristicScorer();

test("scoring is deterministic", () => {
  const a = scorer.score({ compiledText: "shot of Maya", identityRefCount: 1 });
  const b = scorer.score({ compiledText: "shot of Maya", identityRefCount: 1 });
  assert.equal(a.identity, b.identity);
});

test("no identity reference is penalized and can flag", () => {
  const withRef = scorer.score({ compiledText: "shot of Maya", identityRefCount: 1 });
  const without = scorer.score({ compiledText: "shot of Maya", identityRefCount: 0 });
  assert.equal(withRef.identity - without.identity, 25);
});

test("scores are bounded 0..100 and flag below threshold", () => {
  for (const txt of ["a", "bb", "lighthouse at dusk", "wide establishing shot"]) {
    for (const refs of [0, 1, 2]) {
      const s = scorer.score({ compiledText: txt, identityRefCount: refs });
      assert.ok(s.identity >= 0 && s.identity <= 100);
      assert.equal(s.flagged, s.identity < FLAG_THRESHOLD);
    }
  }
});
