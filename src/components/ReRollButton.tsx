"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateShotAction } from "@/server/actions";

/**
 * Continuity Repair (PRD §6.5): re-roll a flagged shot's final render. Reuses
 * the generation lifecycle, then refreshes so the new consistency score shows.
 */
export function ReRollButton({
  projectId,
  shotId,
}: {
  projectId: string;
  shotId: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <span className="inline-flex items-center gap-2">
      <button
        disabled={pending}
        onClick={() => {
          setError(null);
          start(async () => {
            const res = await generateShotAction({
              projectId,
              shotId,
              isDraft: false,
              targetModel: "generic",
            });
            if (!res.ok) setError(res.error);
            else router.refresh();
          });
        }}
        className="rounded-md border border-[var(--color-border)] px-2 py-1 text-xs transition hover:border-[var(--color-accent)] disabled:opacity-50"
      >
        {pending ? "Re-rolling…" : "Re-roll"}
      </button>
      {error && <span className="text-xs text-red-400">{error}</span>}
    </span>
  );
}
