import type {
  CompileInput,
  CompiledPrompt,
  CostEstimate,
  DispatchInput,
  DispatchResult,
  JobStatus,
  ModelAdapter,
  ModelCapability,
  ModelInfo,
} from "./adapter";

/**
 * Higgsfield adapter (skeleton).
 *
 * A Higgsfield generation MCP/API surface is available in this environment
 * (generate_image / generate_video / upscale / etc.). This adapter maps our
 * model-agnostic IR onto that surface. Dispatch/poll are stubbed to throw until
 * the server-side generation orchestrator (PRD §10 Temporal-class) is wired,
 * so the cost/compile path can be exercised without spending credits.
 */
export class HiggsfieldAdapter implements ModelAdapter {
  constructor(
    private readonly modelId: string,
    private readonly caps: ModelCapability[],
  ) {}

  info(): ModelInfo {
    return {
      id: `higgsfield:${this.modelId}`,
      displayName: `Higgsfield ${this.modelId}`,
      provider: "higgsfield",
      capabilities: this.caps,
    };
  }

  capabilities(): ModelCapability[] {
    return this.caps;
  }

  estimateCost(input: CompileInput & { isDraft: boolean }): CostEstimate {
    // Placeholder curve: drafts auto-downshift resolution/duration (PRD §6.7).
    const base = input.isDraft ? 8 : 40;
    const refSurcharge = (input.references?.length ?? 0) * 2;
    return { credits: base + refSurcharge, breakdown: { base, references: refSurcharge } };
  }

  compile(input: CompileInput): CompiledPrompt {
    // The real prompt compiler (PRD §6.2) renders model-specific grammar from
    // the IR. Here we serialize the IR as a readable, editable prompt string.
    const text = JSON.stringify({ ...input.styleHeader, ...input.ir }, null, 0);
    return { text, params: { references: input.references ?? [] } };
  }

  async dispatch(_input: DispatchInput): Promise<DispatchResult> {
    throw new Error(
      "HiggsfieldAdapter.dispatch is not wired yet — pending the generation orchestrator.",
    );
  }

  async poll(_jobId: string): Promise<JobStatus> {
    throw new Error("HiggsfieldAdapter.poll is not wired yet.");
  }

  async cancel(_jobId: string): Promise<void> {
    throw new Error("HiggsfieldAdapter.cancel is not wired yet.");
  }
}
