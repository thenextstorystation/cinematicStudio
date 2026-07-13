"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "./auth";
import { createProject } from "./projects";
import { createShot, updateShotDesign, createEntity } from "./shots";
import {
  replaceScreenplay,
  applyBreakdown,
  getScriptText,
} from "./screenplay";
import { generateScreenplay, breakdownScreenplay } from "@/lib/ai/cowriter";
import type { ShotDesign } from "@/db/schema";

const createProjectSchema = z.object({
  title: z.string().min(1).max(120),
});

export async function createProjectAction(formData: FormData) {
  const user = await requireUser();
  const parsed = createProjectSchema.safeParse({
    title: formData.get("title"),
  });
  if (!parsed.success) {
    throw new Error("Please provide a project title.");
  }

  const project = await createProject(user.id, parsed.data.title);
  revalidatePath("/dashboard");
  redirect(`/dashboard/projects/${project.id}`);
}

const shotDesignSchema = z.object({
  size: z.string().optional(),
  angle: z.string().optional(),
  lensMm: z.number().optional(),
  movements: z
    .array(z.object({ name: z.string(), intent: z.string() }))
    .optional(),
  lighting: z.string().optional(),
  composition: z.string().optional(),
  durationSec: z.number().optional(),
});

export async function createShotAction(projectId: string, sceneId: string) {
  const user = await requireUser();
  await createShot(user.id, sceneId);
  revalidatePath(`/dashboard/projects/${projectId}/design`);
}

export async function saveShotDesignAction(input: {
  projectId: string;
  shotId: string;
  design: ShotDesign;
  compiled?: { text: string; targetModel: string; ir: Record<string, unknown> };
}) {
  const user = await requireUser();
  const design = shotDesignSchema.parse(input.design);
  await updateShotDesign(user.id, input.shotId, design, input.compiled);
  revalidatePath(`/dashboard/projects/${input.projectId}/design`);
}

const createEntitySchema = z.object({
  projectId: z.string().uuid(),
  kind: z.enum(["character", "prop", "location"]),
  name: z.string().min(1).max(120),
  appearance: z.string().max(500).optional(),
});

export async function createEntityAction(input: {
  projectId: string;
  kind: "character" | "prop" | "location";
  name: string;
  appearance?: string;
}) {
  const user = await requireUser();
  const parsed = createEntitySchema.parse(input);
  await createEntity(
    user.id,
    parsed.projectId,
    parsed.kind,
    parsed.name,
    parsed.appearance,
  );
  revalidatePath(`/dashboard/projects/${parsed.projectId}`);
  revalidatePath(`/dashboard/projects/${parsed.projectId}/design`);
}

// --- AI co-writer + auto-breakdown (Module 1) ------------------------------

const cowriteSchema = z.object({
  projectId: z.string().uuid(),
  idea: z.string().min(3).max(2000),
  format: z.string().max(60).optional(),
  sceneCount: z.number().int().min(1).max(9).optional(),
});

export async function cowriteScriptAction(input: {
  projectId: string;
  idea: string;
  format?: string;
  sceneCount?: number;
}) {
  const user = await requireUser();
  const parsed = cowriteSchema.parse(input);
  const screenplay = await generateScreenplay(parsed.idea, {
    format: parsed.format,
    sceneCount: parsed.sceneCount,
  });
  await replaceScreenplay(user.id, parsed.projectId, screenplay);
  revalidatePath(`/dashboard/projects/${parsed.projectId}`);
}

export async function breakdownScriptAction(projectId: string) {
  const user = await requireUser();
  z.string().uuid().parse(projectId);
  const scriptText = await getScriptText(projectId);
  if (!scriptText.trim()) {
    throw new Error("There's no script to break down yet.");
  }
  const breakdown = await breakdownScreenplay(scriptText);
  const result = await applyBreakdown(user.id, projectId, breakdown);
  revalidatePath(`/dashboard/projects/${projectId}`);
  revalidatePath(`/dashboard/projects/${projectId}/design`);
  return result;
}
