import Link from "next/link";
import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getProject } from "@/server/projects";

const VIEWS = [
  { slug: "", label: "Script" },
  { slug: "board", label: "Board" },
  { slug: "design", label: "Design" },
  { slug: "canvas", label: "Canvas" },
  { slug: "edit", label: "Edit" },
  { slug: "assistant", label: "Assistant" },
];

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const project = await getProject(user.id, projectId);
  if (!project) notFound();

  const base = `/dashboard/projects/${projectId}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/dashboard"
            className="text-xs text-[var(--color-muted)] hover:text-[var(--color-text)]"
          >
            ← All projects
          </Link>
          <h1 className="text-xl font-semibold">{project.title}</h1>
        </div>
      </div>

      {/* Five views are projections of one project graph (PRD §4, §7.1). */}
      <nav className="flex gap-1 border-b border-[var(--color-border)]">
        {VIEWS.map((v) => (
          <Link
            key={v.slug}
            href={v.slug ? `${base}/${v.slug}` : base}
            className="rounded-t-lg px-4 py-2 text-sm text-[var(--color-muted)] transition hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]"
          >
            {v.label}
          </Link>
        ))}
      </nav>

      <div>{children}</div>
    </div>
  );
}
