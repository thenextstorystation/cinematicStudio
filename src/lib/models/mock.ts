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
 * Mock generation adapter.
 *
 * Stands in for a real provider (Higgsfield/Seedance/Veo…) so the full
 * generation lifecycle — dispatch → poll → succeed — runs end-to-end without a
 * provider key or GPU. It "renders" a self-contained SVG placeholder derived
 * from the prompt. Swap this for a real adapter in the registry and the
 * orchestrator (server/generation.ts) is unchanged.
 *
 * Set the label to include "fail" (e.g. a shot whose action text says so) to
 * exercise the failure + auto-refund path.
 */
const jobs = new Map<string, { text: string; isDraft: boolean }>();
let counter = 0;

export class MockAdapter implements ModelAdapter {
  info(): ModelInfo {
    return {
      id: "mock:preview",
      displayName: "Preview (mock renderer)",
      provider: "mock",
      capabilities: this.capabilities(),
    };
  }

  capabilities(): ModelCapability[] {
    return ["text-to-image", "text-to-video", "image-to-video"];
  }

  estimateCost(input: CompileInput & { isDraft: boolean }): CostEstimate {
    const base = input.isDraft ? 8 : 40;
    const refs = (input.references?.length ?? 0) * 2;
    return { credits: base + refs, breakdown: { base, references: refs } };
  }

  compile(input: CompileInput): CompiledPrompt {
    return {
      text: JSON.stringify({ ...input.styleHeader, ...input.ir }),
      params: { references: input.references ?? [] },
    };
  }

  async dispatch(input: DispatchInput): Promise<DispatchResult> {
    const jobId = `mock_${++counter}`;
    jobs.set(jobId, { text: input.compiled.text, isDraft: input.isDraft });
    return { jobId };
  }

  async poll(jobId: string): Promise<JobStatus> {
    const job = jobs.get(jobId);
    if (!job) {
      return {
        state: "failed",
        reason: "Unknown job.",
        category: "unknown",
      };
    }
    // Simulate a provider safety block when the prompt asks for it, so the
    // auto-refund path is demonstrable.
    if (/\bfail\b/i.test(job.text)) {
      return {
        state: "failed",
        reason: "Simulated provider safety block.",
        category: "safety",
      };
    }
    jobs.delete(jobId);
    return {
      state: "succeeded",
      assetUrl: placeholder(job.isDraft),
      kind: "image",
    };
  }

  async cancel(jobId: string): Promise<void> {
    jobs.delete(jobId);
  }
}

/** A tiny, self-contained SVG data URI standing in for the rendered frame. */
function placeholder(isDraft: boolean): string {
  const label = isDraft ? "DRAFT" : "FINAL";
  const bg = isDraft ? "#1c1c21" : "#20160a";
  const accent = isDraft ? "#6c5ce7" : "#e5a94e";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
<rect width="640" height="360" fill="${bg}"/>
<circle cx="520" cy="90" r="120" fill="${accent}" opacity="0.18"/>
<text x="40" y="300" font-family="sans-serif" font-size="64" fill="${accent}" font-weight="700">${label}</text>
<text x="40" y="340" font-family="sans-serif" font-size="20" fill="#9a9aa6">Cinematic Studio preview render</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}
