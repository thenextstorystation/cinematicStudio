import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  projects,
  scenes,
  shots,
  takes,
  promptVersions,
  mediaAssets,
  entities as entitiesTable,
  type ShotDesign,
  type StyleHeader,
} from "@/db/schema";
import { compile, type CompilerEntity, type TargetModel } from "@/lib/compiler";
import { estimateShotCredits } from "@/lib/cost";
import { getAdapter } from "@/lib/models/registry";
import { spendCredits, refundCredits, InsufficientCreditsError } from "@/lib/billing/credits";
import { continuityScorer } from "@/lib/continuity/scorer";

/** The default generation target until a real provider key is configured. */
const GENERATION_MODEL = "mock:preview";

type GenerateResult =
  | {
      ok: true;
      takeId: string;
      state: "succeeded";
      url: string;
      creditCost: number;
      isDraft: boolean;
      consistencyScore: number;
    }
  | {
      ok: false;
      takeId?: string;
      error: string;
      refunded?: number;
    };

/** Load the shot, its owning project, style header, and project entities. */
async function loadShotContext(ownerId: string, shotId: string) {
  const [row] = await db
    .select({
      shotId: shots.id,
      design: shots.design,
      projectId: projects.id,
      styleHeader: projects.styleHeader,
    })
    .from(shots)
    .innerJoin(scenes, eq(scenes.id, shots.sceneId))
    .innerJoin(projects, eq(projects.id, scenes.projectId))
    .where(and(eq(shots.id, shotId), eq(projects.ownerId, ownerId)));
  if (!row) throw new Error("Shot not found");

  const ents = await db
    .select({
      id: entitiesTable.id,
      kind: entitiesTable.kind,
      name: entitiesTable.name,
      descriptors: entitiesTable.descriptors,
    })
    .from(entitiesTable)
    .where(eq(entitiesTable.projectId, row.projectId));

  return {
    projectId: row.projectId,
    design: (row.design ?? {}) as ShotDesign,
    styleHeader: (row.styleHeader ?? {}) as StyleHeader,
    entities: ents as CompilerEntity[],
  };
}

/**
 * Generate a shot end-to-end (PRD §6.1 / §6.7 / §24.2):
 *   compile (server-authoritative) → estimate → spend credits → create Take
 *   → dispatch to the model adapter → poll → on success store the media asset
 *   and mark the shot rendered; on failure auto-refund the credits.
 *
 * Ledger-first: credits are debited before dispatch and refunded on any
 * failure, so the wallet is never wrong even if the provider errors.
 */
export async function generateShot(
  ownerId: string,
  userId: string,
  input: { shotId: string; isDraft: boolean; targetModel?: TargetModel },
): Promise<GenerateResult> {
  const ctx = await loadShotContext(ownerId, input.shotId);

  const result = compile({
    design: ctx.design,
    entities: ctx.entities,
    style: ctx.styleHeader,
    targetModel: input.targetModel ?? "generic",
  });

  const creditCost = estimateShotCredits({
    design: ctx.design,
    referenceCount: result.ir.references.length,
    isDraft: input.isDraft,
  });

  const adapter = getAdapter(GENERATION_MODEL);
  if (!adapter) return { ok: false, error: "No generation adapter available." };

  // Snapshot the prompt version this take renders (lineage).
  const [{ maxV }] = await db
    .select({
      maxV: sql<number>`coalesce(max(${promptVersions.version}), 0)::int`,
    })
    .from(promptVersions)
    .where(eq(promptVersions.shotId, input.shotId));
  const [pv] = await db
    .insert(promptVersions)
    .values({
      shotId: input.shotId,
      version: maxV + 1,
      ir: result.ir as unknown as Record<string, unknown>,
      compiledText: result.text,
      targetModel: result.targetModel,
    })
    .returning({ id: promptVersions.id });

  // Debit first (ledger-first). Aborts here if the wallet is short.
  try {
    // A take id is needed as the ledger reference; create the take first.
    const [take] = await db
      .insert(takes)
      .values({
        shotId: input.shotId,
        promptVersionId: pv.id,
        state: "running",
        isDraft: input.isDraft,
        model: adapter.info().id,
        creditCost,
      })
      .returning({ id: takes.id });

    try {
      await spendCredits(userId, creditCost, take.id);
    } catch (e) {
      // Roll the take into a failed state; nothing was charged.
      await db
        .update(takes)
        .set({ state: "failed", creditCost: 0, error: { reason: "insufficient_credits" } })
        .where(eq(takes.id, take.id));
      if (e instanceof InsufficientCreditsError) {
        return {
          ok: false,
          takeId: take.id,
          error: `Not enough credits — need ${e.required}, have ${e.available}.`,
        };
      }
      throw e;
    }

    // Dispatch + poll the adapter.
    const compiled = adapter.compile({
      ir: result.ir as unknown as Record<string, unknown>,
      styleHeader: ctx.styleHeader as Record<string, unknown>,
      references: result.ir.references.map((r) => ({
        role: r.role,
        url: r.url ?? "",
        strength: r.strength,
      })),
    });
    const { jobId } = await adapter.dispatch({ compiled, isDraft: input.isDraft });
    const status = await adapter.poll(jobId);

    if (status.state !== "succeeded") {
      // Auto-refund (PRD §24.2).
      await refundCredits(userId, creditCost, take.id, {
        reason: status.state === "failed" ? status.reason : "not_completed",
      });
      await db
        .update(takes)
        .set({
          state: "failed",
          error:
            status.state === "failed"
              ? { reason: status.reason, category: status.category }
              : { reason: "not_completed" },
        })
        .where(eq(takes.id, take.id));
      return {
        ok: false,
        takeId: take.id,
        error: status.state === "failed" ? status.reason : "Generation did not complete.",
        refunded: creditCost,
      };
    }

    // Persist the rendered asset and finalize the take + shot.
    const [asset] = await db
      .insert(mediaAssets)
      .values({
        projectId: ctx.projectId,
        kind: status.kind === "video" ? "video" : status.kind === "audio" ? "audio" : "image",
        provider: adapter.info().provider,
        storageKey: jobId,
        url: status.assetUrl,
      })
      .returning({ id: mediaAssets.id });

    // Detect stage: post-render consistency score (PRD §6.5 / §2.2).
    const continuity = continuityScorer.score({
      compiledText: result.text,
      identityRefCount: result.ir.references.filter((r) => r.role === "identity")
        .length,
      seed: status.seed,
    });

    await db
      .update(takes)
      .set({
        state: "succeeded",
        mediaAssetId: asset.id,
        seed: status.seed,
        consistencyScore: continuity.identity,
      })
      .where(eq(takes.id, take.id));

    if (!input.isDraft) {
      await db
        .update(shots)
        .set({ status: "rendered", updatedAt: sql`now()` })
        .where(eq(shots.id, input.shotId));
    }

    return {
      ok: true,
      takeId: take.id,
      state: "succeeded",
      url: status.assetUrl,
      creditCost,
      isDraft: input.isDraft,
      consistencyScore: continuity.identity,
    };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Generation failed." };
  }
}

/** Takes for a shot, newest first, with their media URL. */
export function getShotTakes(shotId: string) {
  return db
    .select({
      id: takes.id,
      label: takes.label,
      state: takes.state,
      isDraft: takes.isDraft,
      model: takes.model,
      creditCost: takes.creditCost,
      consistencyScore: takes.consistencyScore,
      url: mediaAssets.url,
      createdAt: takes.createdAt,
    })
    .from(takes)
    .leftJoin(mediaAssets, eq(mediaAssets.id, takes.mediaAssetId))
    .where(eq(takes.shotId, shotId))
    .orderBy(desc(takes.createdAt));
}
