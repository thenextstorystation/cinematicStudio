import Link from "next/link";
import { getCurrentUser } from "@/server/auth";
import { getRecentJobs } from "@/server/queue";

const STATE_STYLE: Record<string, string> = {
  succeeded: "bg-emerald-500/20 text-emerald-300",
  running: "bg-[var(--color-accent)]/20 text-[var(--color-accent)]",
  queued: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
  failed: "bg-red-500/20 text-red-300",
  canceled: "bg-[var(--color-surface-2)] text-[var(--color-muted)]",
};

export default async function QueuePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const jobs = await getRecentJobs(user.id, 100);
  const running = jobs.filter((j) => j.state === "running" || j.state === "queued").length;
  const failed = jobs.filter((j) => j.state === "failed").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Queue</h1>
        <p className="text-sm text-[var(--color-muted)]">
          Generation jobs across all your projects.{" "}
          {running > 0 && `${running} active · `}
          {failed > 0 && `${failed} failed (auto-refunded)`}
        </p>
      </div>

      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-12 text-center text-[var(--color-muted)]">
          No jobs yet. Generate a shot in the Design view and it shows up here.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-[var(--color-muted)]">
              <tr>
                {["", "Project", "Shot", "Model", "Tier", "Cost", "Score", "Status", "When"].map(
                  (h) => (
                    <th key={h} className="px-4 py-3 font-medium">
                      {h}
                    </th>
                  ),
                )}
              </tr>
            </thead>
            <tbody>
              {jobs.map((j) => (
                <tr key={j.id} className="border-t border-[var(--color-border)]">
                  <td className="px-4 py-2">
                    <div className="h-8 w-12 overflow-hidden rounded bg-[var(--color-surface-2)]">
                      {j.url && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={j.url}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <Link
                      href={`/dashboard/projects/${j.projectId}/design`}
                      className="hover:text-[var(--color-accent)]"
                    >
                      {j.projectTitle}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs text-[var(--color-muted)]">
                    S{j.sceneIndex + 1}.{j.shotIndex + 1}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {j.model ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {j.isDraft ? "draft" : "final"}
                  </td>
                  <td className="px-4 py-2">{j.creditCost}</td>
                  <td className="px-4 py-2 text-[var(--color-muted)]">
                    {j.consistencyScore ?? "—"}
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        STATE_STYLE[j.state] ?? ""
                      }`}
                    >
                      {j.state}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-xs text-[var(--color-muted)]">
                    {new Date(j.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
