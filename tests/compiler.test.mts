import { test } from "node:test";
import assert from "node:assert/strict";
import { compile } from "../src/lib/compiler/compile.ts";

const baseEntities = [
  { id: "1", kind: "character" as const, name: "Maya", descriptors: { appearance: "red coat" } },
  { id: "2", kind: "location" as const, name: "Lighthouse", descriptors: {} },
];

test("compiles craft language from design fields", () => {
  const r = compile({
    design: { size: "CU", angle: "low", lensMm: 85, lighting: "low-key", composition: "thirds", durationSec: 5 },
    entities: baseEntities,
    style: { palettePrimary: "#123" },
    targetModel: "generic",
  });
  assert.match(r.text, /close-up/);
  assert.match(r.text, /low-angle/);
  assert.match(r.text, /85mm/);
  assert.match(r.text, /Maya/);
  assert.match(r.text, /Lighthouse/);
});

test("auto-attaches an identity reference for characters", () => {
  const r = compile({
    design: { size: "MS" },
    entities: baseEntities,
    style: {},
    targetModel: "generic",
  });
  assert.equal(r.ir.references.filter((x) => x.role === "identity").length, 1);
  assert.equal(r.ir.references.filter((x) => x.role === "location").length, 1);
});

test("lints missing size and >3 stacked moves", () => {
  const r = compile({
    design: {
      movements: [
        { name: "pan", intent: "" },
        { name: "tilt", intent: "" },
        { name: "orbit", intent: "" },
        { name: "crane", intent: "" },
      ],
    },
    entities: [],
    style: {},
    targetModel: "generic",
  });
  assert.ok(r.lint.some((f) => f.level === "warn" && /shot size/i.test(f.message)));
  assert.ok(r.lint.some((f) => f.level === "error" && /3 stacked/i.test(f.message)));
});

test("target model changes the grammar, not the IR", () => {
  const design = { size: "WS", angle: "eye" };
  const generic = compile({ design, entities: baseEntities, style: {}, targetModel: "generic" });
  const veo = compile({ design, entities: baseEntities, style: {}, targetModel: "veo" });
  assert.notEqual(generic.text, veo.text);
  assert.match(veo.text, /Subject:/);
  assert.deepEqual(generic.ir.camera, veo.ir.camera); // same IR
});
