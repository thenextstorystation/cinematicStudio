import type { ShotDesign, StyleHeader } from "@/db/schema";

/**
 * The model-agnostic Intermediate Representation (PRD §6.2).
 * ShotDesign + Entities + StyleHeader → IR → adapter grammar → model prompt.
 * The IR is what "one-click re-target" (PRD §6.4) recompiles from.
 */
export type ReferenceRole =
  | "identity"
  | "wardrobe"
  | "style"
  | "structure"
  | "motion"
  | "location";

export type PromptReference = {
  role: ReferenceRole;
  label: string;
  url?: string;
  strength?: number; // 0..1 per-reference strength slider (PRD §6.3)
};

export type PromptIR = {
  /** Who/what is in frame, assembled from entities + action line. */
  subject: string;
  action?: string;
  /** Craft-translated cinematography phrases. */
  camera: string[];
  lighting?: string;
  composition?: string;
  /** Locked project style header, prepended everywhere (PRD §4.4). */
  style: StyleHeader;
  references: PromptReference[];
  durationSec?: number;
};

export type CompilerEntity = {
  id: string;
  kind: "character" | "prop" | "location";
  name: string;
  descriptors?: Record<string, unknown> | null;
};

export type CompileRequest = {
  design: ShotDesign;
  entities: CompilerEntity[];
  style: StyleHeader;
  action?: string;
  targetModel: TargetModel;
};

export type TargetModel = "generic" | "veo" | "seedance" | "kling";

export type CompileResult = {
  ir: PromptIR;
  targetModel: TargetModel;
  text: string;
  /** Lint findings (PRD §4.5): ambiguity, conflicts, missing constraints. */
  lint: LintFinding[];
};

export type LintFinding = {
  level: "info" | "warn" | "error";
  message: string;
};
