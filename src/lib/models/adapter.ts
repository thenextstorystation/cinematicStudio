/**
 * Model adapter interface (PRD §6.4).
 *
 * Generation models are the "buy" side of the build/buy split. Each provider
 * ships a server plugin implementing this contract, so no capability depends on
 * a single vendor (portability drills, one-click re-target through the IR).
 */

export type ModelCapability = "text-to-image" | "image-to-video" | "text-to-video" | "upscale" | "relight";

export type ModelInfo = {
  id: string; // e.g. "higgsfield:seedance-2"
  displayName: string;
  provider: string;
  capabilities: ModelCapability[];
};

export type CompileInput = {
  /** Model-agnostic intermediate representation from the prompt compiler. */
  ir: Record<string, unknown>;
  styleHeader?: Record<string, unknown>;
  references?: { role: string; url: string; strength?: number }[];
};

export type CompiledPrompt = {
  /** Rendered model-specific prompt text (Seedance @elements, Veo 5-part…). */
  text: string;
  params: Record<string, unknown>;
};

export type CostEstimate = {
  /** Credits, integer. Live estimate shown on every generate button. */
  credits: number;
  breakdown?: Record<string, number>;
};

export type DispatchInput = {
  compiled: CompiledPrompt;
  isDraft: boolean;
  seed?: string;
};

export type DispatchResult = {
  /** Provider job id for polling. */
  jobId: string;
};

export type JobStatus =
  | { state: "running"; progress?: number }
  | { state: "succeeded"; assetUrl: string; seed?: string; kind: "image" | "video" | "audio" }
  | { state: "failed"; reason: string; category: "safety" | "model_error" | "timeout" | "unknown" };

export interface ModelAdapter {
  info(): ModelInfo;
  capabilities(): ModelCapability[];
  estimateCost(input: CompileInput & { isDraft: boolean }): CostEstimate;
  compile(input: CompileInput): CompiledPrompt;
  dispatch(input: DispatchInput): Promise<DispatchResult>;
  poll(jobId: string): Promise<JobStatus>;
  cancel(jobId: string): Promise<void>;
}
