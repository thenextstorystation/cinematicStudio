import { getProjectScenes, getProjectEntities } from "@/server/projects";
import { AddEntity } from "@/components/AddEntity";

/** Script view — the default projection of the project graph. */
export default async function ScriptView({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const [scenes, entities] = await Promise.all([
    getProjectScenes(projectId),
    getProjectEntities(projectId),
  ]);

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <section className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Screenplay
        </h2>
        {scenes.map((scene) => (
          <article
            key={scene.id}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5"
          >
            <h3 className="font-mono text-sm font-semibold tracking-wide">
              {scene.heading ?? `SCENE ${scene.index + 1}`}
            </h3>
            <p className="mt-3 whitespace-pre-wrap text-sm text-[var(--color-muted)]">
              {scene.body || "Write the action and dialogue for this scene…"}
            </p>
          </article>
        ))}
      </section>

      <aside className="space-y-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Entities
        </h2>
        <AddEntity projectId={projectId} />
        {entities.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No entities yet. The auto-breakdown will extract characters,
            wardrobe, props, and locations from your script (Module 1.3).
          </p>
        ) : (
          <ul className="space-y-2">
            {entities.map((e) => (
              <li
                key={e.id}
                className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
              >
                <span>{e.name}</span>
                <span className="text-xs uppercase text-[var(--color-muted)]">
                  {e.kind}
                </span>
              </li>
            ))}
          </ul>
        )}
      </aside>
    </div>
  );
}
