import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import {
  getProject,
  getProjectScenes,
  getProjectEntities,
  getSceneShots,
} from "@/server/projects";
import { getShotTakes } from "@/server/generation";
import { DirectorLayer } from "@/components/design/DirectorLayer";

/** Design view — the Director Layer (PRD §7.2). */
export default async function DesignView({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const project = await getProject(user.id, projectId);
  if (!project) notFound();

  const [scenes, entities] = await Promise.all([
    getProjectScenes(projectId),
    getProjectEntities(projectId),
  ]);

  const scenesWithShots = await Promise.all(
    scenes.map(async (scene) => {
      const sceneShots = await getSceneShots(scene.id);
      const shotsWithTakes = await Promise.all(
        sceneShots.map(async (shot) => ({
          ...shot,
          takes: await getShotTakes(shot.id),
        })),
      );
      return {
        id: scene.id,
        heading: scene.heading,
        index: scene.index,
        shots: shotsWithTakes,
      };
    }),
  );

  return (
    <DirectorLayer
      projectId={projectId}
      styleHeader={project.styleHeader ?? {}}
      scenes={scenesWithShots.map((s) => ({
        id: s.id,
        heading: s.heading,
        index: s.index,
        shots: s.shots.map((shot) => ({
          id: shot.id,
          index: shot.index,
          status: shot.status,
          design: shot.design ?? {},
          takes: shot.takes.map((t) => ({
            id: t.id,
            state: t.state,
            isDraft: t.isDraft,
            url: t.url,
            creditCost: t.creditCost,
          })),
        })),
      }))}
      entities={entities.map((e) => ({
        id: e.id,
        kind: e.kind,
        name: e.name,
        descriptors: e.descriptors,
      }))}
    />
  );
}
