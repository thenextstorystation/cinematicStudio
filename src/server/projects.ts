import "server-only";
import { and, desc, eq, isNull } from "drizzle-orm";
import { db } from "@/db";
import { projects, scenes, entities, shots } from "@/db/schema";

/** List a user's non-archived projects, newest first. */
export function listProjects(ownerId: string) {
  return db
    .select()
    .from(projects)
    .where(and(eq(projects.ownerId, ownerId), isNull(projects.archivedAt)))
    .orderBy(desc(projects.updatedAt));
}

export async function getProject(ownerId: string, projectId: string) {
  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  return project ?? null;
}

export async function createProject(ownerId: string, title: string) {
  const [project] = await db
    .insert(projects)
    .values({ ownerId, title: title.trim() || "Untitled Project" })
    .returning();

  // Seed an opening scene so the Script view is never an empty state
  // (PRD §7.1 zero-empty-state rule).
  await db.insert(scenes).values({
    projectId: project.id,
    index: 0,
    heading: "INT. OPENING - DAY",
    body: "",
  });

  return project;
}

export async function getProjectScenes(projectId: string) {
  return db
    .select()
    .from(scenes)
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index);
}

export async function getProjectEntities(projectId: string) {
  return db
    .select()
    .from(entities)
    .where(eq(entities.projectId, projectId))
    .orderBy(entities.kind, entities.name);
}

export async function getSceneShots(sceneId: string) {
  return db
    .select()
    .from(shots)
    .where(eq(shots.sceneId, sceneId))
    .orderBy(shots.index);
}
