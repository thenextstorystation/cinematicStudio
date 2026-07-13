import type {
  CompileRequest,
  CompileResult,
  CompilerEntity,
  LintFinding,
  PromptIR,
  PromptReference,
} from "./types";
import {
  ANGLES,
  COMPOSITIONS,
  LIGHTING,
  MOVEMENTS,
  SHOT_SIZES,
  lensPhrase,
  phraseFor,
} from "./vocab.ts";
import { render } from "./grammars.ts";

/**
 * The prompt compiler (PRD §6.2). Pure and isomorphic so the Director Layer can
 * recompile live on the client (<200 ms, PRD §9) and the server can persist the
 * exact same output as a PromptVersion.
 *
 *   ShotDesign + Entities + StyleHeader
 *     → assemble references (role-labeled)
 *     → craft translation (design fields → cinematography language)
 *     → adapter render (model grammar)
 *     → lint
 */
export function compile(req: CompileRequest): CompileResult {
  const ir = assembleIR(req);
  const text = render(ir, req.targetModel);
  const lint = lintDesign(req, ir);
  return { ir, targetModel: req.targetModel, text, lint };
}

function assembleIR(req: CompileRequest): PromptIR {
  const { design, entities, style, action } = req;

  const characters = entities.filter((e) => e.kind === "character");
  const location = entities.find((e) => e.kind === "location");
  const props = entities.filter((e) => e.kind === "prop");

  const subject = buildSubject(characters, props, location);

  const camera = [
    phraseFor(SHOT_SIZES, design.size),
    phraseFor(ANGLES, design.angle),
    lensPhrase(design.lensMm),
    ...(design.movements ?? []).map(
      (m) =>
        phraseFor(MOVEMENTS, m.name) ??
        (m.name ? `${m.name} move` : null),
    ),
  ].filter((x): x is string => Boolean(x));

  const references = buildReferences(characters, location);

  return {
    subject,
    action: action?.trim() || undefined,
    camera,
    lighting: phraseFor(LIGHTING, design.lighting) ?? undefined,
    composition: phraseFor(COMPOSITIONS, design.composition) ?? undefined,
    style: style ?? {},
    references,
    durationSec: design.durationSec,
  };
}

function buildSubject(
  characters: CompilerEntity[],
  props: CompilerEntity[],
  location?: CompilerEntity,
): string {
  const names = characters.map((c) => describeEntity(c));
  const propText = props.length
    ? ` with ${props.map((p) => p.name).join(" and ")}`
    : "";
  const locText = location ? ` at ${location.name}` : "";
  const who = names.length ? names.join(" and ") : "the scene";
  return `${who}${propText}${locText}`;
}

function describeEntity(e: CompilerEntity): string {
  const d = e.descriptors ?? {};
  const desc = (d.appearance ?? d.description) as string | undefined;
  return desc ? `${e.name} (${desc})` : e.name;
}

/** Auto-attach canonical references so identity/location lock at compile time. */
function buildReferences(
  characters: CompilerEntity[],
  location?: CompilerEntity,
): PromptReference[] {
  const refs: PromptReference[] = [];
  for (const c of characters) {
    refs.push({ role: "identity", label: c.name, strength: 0.9 });
  }
  if (location) {
    refs.push({ role: "location", label: location.name, strength: 0.7 });
  }
  return refs;
}

/** Prompt linting (PRD §4.5). */
function lintDesign(req: CompileRequest, ir: PromptIR): LintFinding[] {
  const findings: LintFinding[] = [];
  const { design } = req;

  if (!design.size) {
    findings.push({ level: "warn", message: "No shot size selected." });
  }
  if (!design.angle) {
    findings.push({ level: "info", message: "No camera angle set; defaults to eye level." });
  }
  if ((design.movements?.length ?? 0) > 3) {
    findings.push({
      level: "error",
      message: "More than 3 stacked camera moves — reduce for a coherent shot.",
    });
  }
  for (const m of design.movements ?? []) {
    if (!m.intent) {
      findings.push({
        level: "warn",
        message: `Movement "${m.name}" is missing an intent tag.`,
      });
    }
  }
  if (!ir.references.some((r) => r.role === "identity")) {
    findings.push({
      level: "info",
      message: "No character entity attached; identity won't be locked.",
    });
  }
  if (design.durationSec && design.durationSec > 10) {
    findings.push({
      level: "info",
      message: "Long single shot — consider Extend or frame chaining.",
    });
  }
  return findings;
}
