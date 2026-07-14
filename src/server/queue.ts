import "server-only";
import { desc, eq } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  scenes,
  shots,
  takes,
  mediaAssets,
} from "@/db/schema";

/**
 * Queue panel data (PRD §22.1): the user's recent generation jobs (takes)
 * across all projects, with status, cost, model, and a link back to the shot.
 */
export function getRecentJobs(ownerId: string, limit = 50) {
  return db
    .select({
      id: takes.id,
      state: takes.state,
      isDraft: takes.isDraft,
      model: takes.model,
      creditCost: takes.creditCost,
      consistencyScore: takes.consistencyScore,
      error: takes.error,
      createdAt: takes.createdAt,
      url: mediaAssets.url,
      projectId: projects.id,
      projectTitle: projects.title,
      sceneIndex: scenes.index,
      shotIndex: shots.index,
    })
    .from(takes)
    .innerJoin(shots, eq(shots.id, takes.shotId))
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .innerJoin(projects, eq(projects.id, scenes.projectId))
    .leftJoin(mediaAssets, eq(mediaAssets.id, takes.mediaAssetId))
    .where(eq(projects.ownerId, ownerId))
    .orderBy(desc(takes.createdAt))
    .limit(limit);
}
