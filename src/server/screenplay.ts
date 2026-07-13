import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { projects, scenes, entities, outfits } from "@/db/schema";
import type { GeneratedScreenplay, ScreenplayBreakdown } from "@/lib/ai/cowriter";

async function assertProjectOwned(ownerId: string, projectId: string) {
  const [row] = await db
    .select({ id: projects.id })
    .from(projects)
    .where(and(eq(projects.id, projectId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Project not found");
}

/**
 * Replace a project's screenplay with a co-written one: title, logline,
 * style header, and scenes. Existing scenes (and their shots) are cleared —
 * this is a fresh draft, not a merge.
 */
export async function replaceScreenplay(
  ownerId: string,
  projectId: string,
  generated: GeneratedScreenplay,
) {
  await assertProjectOwned(ownerId, projectId);

  await db.transaction(async (tx) => {
    await tx
      .update(projects)
      .set({
        title: generated.title,
        logline: generated.logline,
        styleHeader: generated.styleHeader,
        updatedAt: sql`now()`,
      })
      .where(eq(projects.id, projectId));

    await tx.delete(scenes).where(eq(scenes.projectId, projectId));

    if (generated.scenes.length > 0) {
      await tx.insert(scenes).values(
        generated.scenes.map((s, i) => ({
          projectId,
          index: i,
          heading: s.heading,
          body: s.body,
        })),
      );
    }
  });
}

/**
 * Merge an auto-breakdown into the project's entity registry. Entities already
 * present (by name within a kind) are left untouched; new ones are added with
 * their canonical descriptors, synthetic-by-default (PRD §25.7).
 */
export async function applyBreakdown(
  ownerId: string,
  projectId: string,
  breakdown: ScreenplayBreakdown,
) {
  await assertProjectOwned(ownerId, projectId);

  const existing = await db
    .select({ kind: entities.kind, name: entities.name })
    .from(entities)
    .where(eq(entities.projectId, projectId));
  const seen = new Set(existing.map((e) => `${e.kind}:${e.name.toLowerCase()}`));

  let added = 0;

  for (const c of breakdown.characters) {
    const key = `character:${c.name.toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    added++;
    const [entity] = await db
      .insert(entities)
      .values({
        projectId,
        kind: "character",
        name: c.name,
        descriptors: { appearance: c.appearance },
      })
      .returning({ id: entities.id });

    if (c.outfits.length > 0) {
      await db.insert(outfits).values(
        c.outfits.map((o) => ({
          entityId: entity.id,
          name: o.name,
          version: 1,
          descriptors: { description: o.description },
        })),
      );
    }
  }

  for (const kind of ["prop", "location"] as const) {
    const list = kind === "prop" ? breakdown.props : breakdown.locations;
    for (const item of list) {
      const key = `${kind}:${item.name.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      added++;
      await db.insert(entities).values({
        projectId,
        kind,
        name: item.name,
        descriptors: { appearance: item.appearance },
      });
    }
  }

  return { added };
}

/** Concatenate a project's scenes into a single script string for breakdown. */
export async function getScriptText(projectId: string): Promise<string> {
  const rows = await db
    .select({ heading: scenes.heading, body: scenes.body })
    .from(scenes)
    .where(eq(scenes.projectId, projectId))
    .orderBy(scenes.index);
  return rows
    .map((s) => `${s.heading ?? ""}\n${s.body ?? ""}`.trim())
    .join("\n\n");
}
