import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  entities,
  projects,
  promptVersions,
  scenes,
  shots,
  type ShotDesign,
} from "@/db/schema";

/** Verify a scene belongs to a project the user owns, returning it. */
async function assertSceneOwned(ownerId: string, sceneId: string) {
  const [row] = await db
    .select({ sceneId: scenes.id, projectId: scenes.projectId })
    .from(scenes)
    .innerJoin(projects, eq(projects.id, scenes.projectId))
    .where(and(eq(scenes.id, sceneId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Scene not found");
  return row;
}

async function assertShotOwned(ownerId: string, shotId: string) {
  const [row] = await db
    .select({ shotId: shots.id, sceneId: shots.sceneId })
    .from(shots)
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .innerJoin(projects, eq(projects.id, scenes.projectId))
    .where(and(eq(shots.id, shotId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Shot not found");
  return row;
}

export async function createShot(ownerId: string, sceneId: string) {
  await assertSceneOwned(ownerId, sceneId);
  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(shots)
    .where(eq(shots.sceneId, sceneId));

  const [shot] = await db
    .insert(shots)
    .values({ sceneId, index: count, status: "planned", design: {} })
    .returning();
  return shot;
}

export async function updateShotDesign(
  ownerId: string,
  shotId: string,
  design: ShotDesign,
  compiled?: { text: string; targetModel: string; ir: Record<string, unknown> },
) {
  await assertShotOwned(ownerId, shotId);

  await db
    .update(shots)
    .set({
      design,
      status: "designed",
      updatedAt: sql`now()`,
    })
    .where(eq(shots.id, shotId));

  // Persist a PromptVersion snapshot so hand-edits/compiles keep lineage.
  if (compiled) {
    const [{ maxV }] = await db
      .select({ maxV: sql<number>`coalesce(max(${promptVersions.version}), 0)::int` })
      .from(promptVersions)
      .where(eq(promptVersions.shotId, shotId));

    await db.insert(promptVersions).values({
      shotId,
      version: maxV + 1,
      ir: compiled.ir,
      compiledText: compiled.text,
      targetModel: compiled.targetModel,
    });
  }
}

export async function createEntity(
  ownerId: string,
  projectId: string,
  kind: "character" | "prop" | "location",
  name: string,
  appearance?: string,
) {
  const [project] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  if (!project) throw new Error("Project not found");

  const [entity] = await db
    .insert(entities)
    .values({
      projectId,
      kind,
      name: name.trim(),
      descriptors: appearance ? { appearance } : {},
      // Synthetic entities by default — real-person likeness requires consent
      // (PRD §25.7); this flag is set explicitly when a reference is a real person.
      requiresConsent: false,
    })
    .returning();
  return entity;
}
