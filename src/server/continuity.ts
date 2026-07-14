import "server-only";
import { and, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { projects, scenes, shots, takes, mediaAssets } from "@/db/schema";
import { FLAG_THRESHOLD } from "@/lib/continuity/scorer";

async function assertProjectOwned(ownerId: string, projectId: string) {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Project not found");
}

export type ShotAudit = {
  shotId: string;
  scene: number;
  shot: number;
  score: number | null;
  url: string | null;
  flagged: boolean;
};

export type ContinuityAudit = {
  medianIdentity: number | null;
  flaggedCount: number;
  scoredCount: number;
  threshold: number;
  shots: ShotAudit[];
};

/**
 * Project continuity audit (PRD §6.5 Detect / §16.4). For each shot, take the
 * best rendered take's identity score; flag anything below the threshold so it
 * can be re-rolled with promoted constraints (Repair).
 */
export async function auditProject(
  ownerId: string,
  projectId: string,
): Promise<ContinuityAudit> {
  await assertProjectOwned(ownerId, projectId);

  const shotRows = await db
    .select({
      shotId: shots.id,
      scene: scenes.index,
      shot: shots.index,
    })
    .from(shots)
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index, shots.index);

  const audits: ShotAudit[] = [];
  const scores: number[] = [];

  for (const s of shotRows) {
    const takeRows = await db
      .select({
        isDraft: takes.isDraft,
        score: takes.consistencyScore,
        url: mediaAssets.url,
      })
      .from(takes)
      .innerJoin(mediaAssets, eq(mediaAssets.id, takes.mediaAssetId))
      .where(and(eq(takes.shotId, s.shotId), eq(takes.state, "succeeded")))
      .orderBy(desc(takes.createdAt));

    const best = takeRows.find((t) => !t.isDraft) ?? takeRows[0];
    const score = best?.score ?? null;
    if (score != null) scores.push(score);

    audits.push({
      shotId: s.shotId,
      scene: s.scene + 1,
      shot: s.shot + 1,
      score,
      url: best?.url ?? null,
      flagged: score != null && score < FLAG_THRESHOLD,
    });
  }

  return {
    medianIdentity: median(scores),
    flaggedCount: audits.filter((a) => a.flagged).length,
    scoredCount: scores.length,
    threshold: FLAG_THRESHOLD,
    shots: audits,
  };
}

function median(nums: number[]): number | null {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}
