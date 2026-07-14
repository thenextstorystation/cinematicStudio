import "server-only";
import { and, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  scenes,
  shots,
  takes,
  mediaAssets,
  entities,
  outfits,
  type ShotDesign,
} from "@/db/schema";
import type { SequenceClip } from "@/lib/export/formats";

const DEFAULT_DURATION = 5;

async function assertProjectOwned(ownerId: string, projectId: string) {
  const [row] = await db
    .select({ id: projects.id, title: projects.title, aspectRatio: projects.aspectRatio })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Project not found");
  return row;
}

/** Pick the best rendered take for a shot: a final render, else any succeeded. */
async function bestTakeUrl(shotId: string): Promise<string | null> {
  const rows = await db
    .select({ isDraft: takes.isDraft, url: mediaAssets.url })
    .from(takes)
    .innerJoin(mediaAssets, eq(mediaAssets.id, takes.mediaAssetId))
    .where(and(eq(takes.shotId, shotId), eq(takes.state, "succeeded")))
    .orderBy(desc(takes.createdAt));
  const final = rows.find((r) => !r.isDraft);
  return (final ?? rows[0])?.url ?? null;
}

/**
 * Assemble the project's ordered sequence of clips (Edit view / Module 12).
 * One clip per shot, in scene→shot order, carrying its best rendered take.
 */
export async function getSequence(
  ownerId: string,
  projectId: string,
): Promise<{ clips: SequenceClip[]; title: string; aspectRatio: string }> {
  const project = await assertProjectOwned(ownerId, projectId);

  const sceneRows = await db
    .select({ id: scenes.id, index: scenes.index })
    .from(scenes)
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index);

  const clips: SequenceClip[] = [];
  for (const scene of sceneRows) {
    const shotRows = await db
      .select({ id: shots.id, index: shots.index, design: shots.design })
      .from(shots)
      .where(eq(shots.sceneId, scene.id))
      .orderBy(shots.index);

    for (const shot of shotRows) {
      const design = (shot.design ?? {}) as ShotDesign;
      clips.push({
        sceneIndex: scene.index,
        shotIndex: shot.index,
        name: `S${scene.index + 1}.${shot.index + 1}`,
        durationSec: design.durationSec ?? DEFAULT_DURATION,
        url: await bestTakeUrl(shot.id),
      });
    }
  }

  return { clips, title: project.title, aspectRatio: project.aspectRatio };
}

/** Rows for the shot-list CSV (Module 17.1) and the Edit view table. */
export async function getShotList(ownerId: string, projectId: string) {
  await assertProjectOwned(ownerId, projectId);

  const rows = await db
    .select({
      sceneIndex: scenes.index,
      shotIndex: shots.index,
      status: shots.status,
      design: shots.design,
      shotId: shots.id,
    })
    .from(shots)
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index, shots.index);

  return Promise.all(
    rows.map(async (r) => {
      const design = (r.design ?? {}) as ShotDesign;
      const takeRows = await db
        .select({ creditCost: takes.creditCost, state: takes.state })
        .from(takes)
        .where(eq(takes.shotId, r.shotId));
      const spent = takeRows
        .filter((t) => t.state === "succeeded")
        .reduce((a, t) => a + t.creditCost, 0);
      return {
        scene: r.sceneIndex + 1,
        shot: r.shotIndex + 1,
        size: design.size,
        angle: design.angle,
        lensMm: design.lensMm,
        movement: (design.movements ?? []).map((m) => m.name).join(" + "),
        durationSec: design.durationSec ?? DEFAULT_DURATION,
        status: r.status,
        takes: takeRows.length,
        creditCost: spent,
      };
    }),
  );
}

/** Full project graph export (project JSON, PRD §12.5 / §6.11). */
export async function getProjectExport(ownerId: string, projectId: string) {
  const project = await assertProjectOwned(ownerId, projectId);

  const [full] = await db
    .select()
    .from(projects)
    .where(eq(projects.id, projectId));

  const sceneRows = await db
    .select()
    .from(scenes)
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index);

  const entityRows = await db
    .select()
    .from(entities)
    .where(eq(entities.projectId, projectId));

  const entityIds = entityRows.map((e) => e.id);
  const outfitRows = entityIds.length
    ? await db.select().from(outfits).where(inArray(outfits.entityId, entityIds))
    : [];

  const shotRows = await db
    .select({
      id: shots.id,
      sceneId: shots.sceneId,
      index: shots.index,
      status: shots.status,
      design: shots.design,
    })
    .from(shots)
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index, shots.index);

  return {
    schema: "cinematic-studio/project-export@1",
    project: full,
    scenes: sceneRows,
    entities: entityRows.map((e) => ({
      ...e,
      outfits: outfitRows.filter((o) => o.entityId === e.id),
    })),
    shots: shotRows,
    exportedFor: project.title,
  };
}
