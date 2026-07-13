import type { PromptIR, TargetModel } from "./types";

/**
 * Adapter render stage (PRD §6.2). Each grammar turns the model-agnostic IR
 * into a model-specific prompt string. Model-agnostic project, model-specific
 * output — the same IR renders differently per target.
 */

function styleClause(ir: PromptIR): string | null {
  const s = ir.style ?? {};
  const parts = [
    s.palettePrimary && `palette ${s.palettePrimary}`,
    s.paletteSecondary && `secondary ${s.paletteSecondary}`,
    s.paletteAccent && `accent ${s.paletteAccent}`,
    s.grade && `${s.grade} grade`,
    s.grain && s.grain,
  ].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}

function refsClause(ir: PromptIR): string | null {
  if (!ir.references.length) return null;
  return ir.references
    .map(
      (r) =>
        `${r.role}:${r.label}${r.strength != null ? ` @${r.strength.toFixed(2)}` : ""}`,
    )
    .join(", ");
}

/** Generic natural-language grammar — the default, human-readable target. */
function renderGeneric(ir: PromptIR): string {
  const segments = [
    ir.subject,
    ir.action,
    ...ir.camera,
    ir.composition,
    ir.lighting,
    styleClause(ir),
  ].filter(Boolean);
  let text = segments.join(", ");
  const refs = refsClause(ir);
  if (refs) text += `\nReferences — ${refs}`;
  if (ir.durationSec) text += `\nDuration: ${ir.durationSec}s`;
  return text;
}

/** Veo-style five-part formula: Subject, Action, Scene, Camera, Style. */
function renderVeo(ir: PromptIR): string {
  const scene = ir.composition ?? "";
  const camera = ir.camera.join(", ");
  const style = [styleClause(ir), ir.lighting].filter(Boolean).join(", ");
  return [
    `Subject: ${ir.subject}`,
    `Action: ${ir.action ?? "subtle natural movement"}`,
    `Scene: ${scene}`,
    `Camera: ${camera}`,
    `Style: ${style}`,
  ].join("\n");
}

/** Seedance-style timecoded @element blocks (simplified). */
function renderSeedance(ir: PromptIR): string {
  const dur = ir.durationSec ?? 5;
  const camera = ir.camera.join("; ");
  return [
    `@subject { ${ir.subject} }`,
    `@action[0-${dur}s] { ${ir.action ?? "natural motion"} }`,
    `@camera { ${camera} }`,
    ir.lighting ? `@light { ${ir.lighting} }` : null,
    ir.composition ? `@frame { ${ir.composition} }` : null,
    styleClause(ir) ? `@style { ${styleClause(ir)} }` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Kling-style with explicit speaker/subject syntax (simplified). */
function renderKling(ir: PromptIR): string {
  return [
    `[subject] ${ir.subject}`,
    ir.action ? `[action] ${ir.action}` : null,
    `[camera] ${ir.camera.join(", ")}`,
    ir.lighting ? `[lighting] ${ir.lighting}` : null,
    styleClause(ir) ? `[style] ${styleClause(ir)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export function render(ir: PromptIR, target: TargetModel): string {
  switch (target) {
    case "veo":
      return renderVeo(ir);
    case "seedance":
      return renderSeedance(ir);
    case "kling":
      return renderKling(ir);
    case "generic":
    default:
      return renderGeneric(ir);
  }
}
