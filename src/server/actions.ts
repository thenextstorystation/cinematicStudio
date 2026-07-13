"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireUser } from "./auth";
import { createProject } from "./projects";

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
