import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { listProjects } from "@/server/projects";
import { createProjectAction } from "@/server/actions";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const projects = await listProjects(user.id);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Your projects</h1>
          <p className="text-sm text-[var(--color-muted)]">
            Every project is one graph — Script, Board, Design, Canvas, Edit.
          </p>
        </div>
        <form action={createProjectAction} className="flex items-center gap-2">
          <input
            name="title"
            placeholder="New project title"
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
          />
          <button
            type="submit"
            className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90"
          >
            Create
          </button>
        </form>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center">
          <p className="text-[var(--color-muted)]">
            No projects yet. Create your first film above to open the Studio.
          </p>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {projects.map((p) => (
            <li key={p.id}>
              <Link
                href={`/dashboard/projects/${p.id}`}
                className="block rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 transition hover:border-[var(--color-accent)]"
              >
                <div className="aspect-video w-full rounded-lg bg-[var(--color-surface-2)]" />
                <h3 className="mt-4 font-medium">{p.title}</h3>
                <p className="mt-1 text-xs text-[var(--color-muted)]">
                  {p.aspectRatio} · updated{" "}
                  {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
