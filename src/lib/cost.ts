import type { ShotDesign } from "@/db/schema";

/**
 * Isomorphic cost estimate (PRD §6.4, §6.7). Used both on the client for the
 * live "cost on every generate button" and on the server before spending. The
 * authoritative estimate at dispatch time comes from the chosen adapter's
 * estimateCost(); this shared curve keeps the UI honest within ±10% (PRD §9).
 */
export function estimateShotCredits(params: {
  design: ShotDesign;
  referenceCount: number;
  isDraft: boolean;
}): number {
  const { design, referenceCount, isDraft } = params;
  const duration = design.durationSec ?? 5;
  const perSecond = isDraft ? 2 : 8;
  const base = duration * perSecond;
  const refSurcharge = referenceCount * 2;
  const moveSurcharge = (design.movements?.length ?? 0) * 1;
  return Math.max(1, Math.round(base + refSurcharge + moveSurcharge));
}
