"use client";

import { useState, useTransition } from "react";
import { breakdownScriptAction } from "@/server/actions";

/** Auto-breakdown: extract characters, wardrobe, props, locations (Module 1.3). */
export function BreakdownButton({ projectId }: { projectId: string }) {
  const [msg, setMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-2">
      <button
        disabled={pending}
        onClick={() => {
          setMsg(null);
          setError(null);
          start(async () => {
            try {
              const res = await breakdownScriptAction(projectId);
              setMsg(
                res.added > 0
                  ? `Added ${res.added} entit${res.added === 1 ? "y" : "ies"}.`
                  : "No new entities found.",
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : "Breakdown failed.");
            }
          });
        }}
        className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition hover:border-[var(--color-accent)] disabled:opacity-50"
      >
        {pending ? "Analyzing script…" : "⚡ Auto-breakdown"}
      </button>
      {msg && <p className="text-xs text-[var(--color-muted)]">{msg}</p>}
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
