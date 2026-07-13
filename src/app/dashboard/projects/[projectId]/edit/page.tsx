import { notFound } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { getSequence, getShotList } from "@/server/edit";

/** Edit view — assemble the sequence, review the shot list, export handoffs (Module 12). */
export default async function EditView({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const [{ clips, aspectRatio }, shotList] = await Promise.all([
    getSequence(user.id, projectId),
    getShotList(user.id, projectId),
  ]);

  const totalDuration = clips.reduce((a, c) => a + c.durationSec, 0);
  const rendered = clips.filter((c) => c.url).length;
  const spent = shotList.reduce((a, r) => a + r.creditCost, 0);

  const base = `/api/projects/${projectId}/export`;
  const exports = [
    { label: "MP4 (H.264)", href: "", disabled: true, note: "needs render pipeline" },
    { label: "FCPXML", href: `${base}/fcpxml` },
    { label: "OTIO", href: `${base}/otio` },
    { label: "EDL", href: `${base}/edl` },
    { label: "Shot list CSV", href: `${base}/csv` },
    { label: "Project JSON", href: `${base}/json` },
  ];

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Clips" value={String(clips.length)} />
        <Stat label="Rendered" value={`${rendered}/${clips.length}`} />
        <Stat label="Runtime" value={`${totalDuration}s`} />
        <Stat label="Credits spent" value={String(spent)} />
      </div>

      {/* Timeline strip */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Sequence · {aspectRatio}
        </h2>
        {clips.length === 0 ? (
          <p className="text-sm text-[var(--color-muted)]">
            No shots yet. Design and render shots in the Design view — they
            assemble here in order.
          </p>
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2">
            {clips.map((c) => (
              <div
                key={c.name}
                className="shrink-0"
                style={{ width: Math.max(80, c.durationSec * 16) }}
              >
                <div className="flex h-20 items-center justify-center overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                  {c.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={c.url}
                      alt={c.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] text-[var(--color-muted)]">
                      no render
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                  {c.name} · {c.durationSec}s
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Exports */}
      <section className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Export &amp; handoff
        </h2>
        <div className="flex flex-wrap gap-2">
          {exports.map((e) =>
            e.disabled ? (
              <span
                key={e.label}
                title={e.note}
                className="cursor-not-allowed rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm text-[var(--color-muted)] opacity-60"
              >
                {e.label}
              </span>
            ) : (
              <a
                key={e.label}
                href={e.href}
                className="rounded-lg border border-[var(--color-border)] px-4 py-2 text-sm transition hover:border-[var(--color-accent)]"
              >
                {e.label}
              </a>
            ),
          )}
        </div>
        <p className="mt-3 text-[11px] text-[var(--color-muted)]">
          Round-trip handoff to Premiere/Resolve (FCPXML/OTIO/EDL) references the
          rendered media by URL. Final MP4 export arrives with the render/conform
          pipeline (Module 13).
        </p>
      </section>

      {/* Shot list */}
      <section className="overflow-x-auto rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Shot list
        </h2>
        <table className="w-full text-left text-sm">
          <thead className="text-xs uppercase text-[var(--color-muted)]">
            <tr>
              {["Scene", "Shot", "Size", "Angle", "Lens", "Dur", "Status", "Takes", "Cr"].map(
                (h) => (
                  <th key={h} className="py-2 pr-4 font-medium">
                    {h}
                  </th>
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {shotList.map((r) => (
              <tr
                key={`${r.scene}-${r.shot}`}
                className="border-t border-[var(--color-border)]"
              >
                <td className="py-2 pr-4">{r.scene}</td>
                <td className="py-2 pr-4">{r.shot}</td>
                <td className="py-2 pr-4">{r.size ?? "—"}</td>
                <td className="py-2 pr-4">{r.angle ?? "—"}</td>
                <td className="py-2 pr-4">{r.lensMm ? `${r.lensMm}mm` : "—"}</td>
                <td className="py-2 pr-4">{r.durationSec}s</td>
                <td className="py-2 pr-4">{r.status}</td>
                <td className="py-2 pr-4">{r.takes}</td>
                <td className="py-2 pr-4">{r.creditCost}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="text-xs text-[var(--color-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  );
}
