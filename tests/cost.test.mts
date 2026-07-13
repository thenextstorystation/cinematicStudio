import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateShotCredits } from "../src/lib/cost.ts";

test("final costs more than draft", () => {
  const design = { durationSec: 5 };
  const draft = estimateShotCredits({ design, referenceCount: 0, isDraft: true });
  const final = estimateShotCredits({ design, referenceCount: 0, isDraft: false });
  assert.ok(final > draft);
});

test("longer duration and more references cost more", () => {
  const short = estimateShotCredits({ design: { durationSec: 3 }, referenceCount: 0, isDraft: false });
  const long = estimateShotCredits({ design: { durationSec: 10 }, referenceCount: 0, isDraft: false });
  const withRefs = estimateShotCredits({ design: { durationSec: 3 }, referenceCount: 3, isDraft: false });
  assert.ok(long > short);
  assert.ok(withRefs > short);
});

test("never below 1 credit", () => {
  const c = estimateShotCredits({ design: {}, referenceCount: 0, isDraft: true });
  assert.ok(c >= 1);
});
