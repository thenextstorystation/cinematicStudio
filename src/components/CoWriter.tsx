"use client";

import { useState, useTransition } from "react";
import { cowriteScriptAction } from "@/server/actions";

/** Magic-Prompt-style co-writer: one rough idea → a full screenplay (Module 1.2). */
export function CoWriter({ projectId }: { projectId: string }) {
  const [idea, setIdea] = useState("");
  const [sceneCount, setSceneCount] = useState(3);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div>
        <h2 className="text-sm font-medium">AI co-writer</h2>
        <p className="text-xs text-[var(--color-muted)]">
          One rough idea → logline, style header, and scenes. Replaces the
          current draft.
        </p>
      </div>
      <textarea
        value={idea}
        onChange={(e) => setIdea(e.target.value)}
        rows={2}
        placeholder="e.g. A lighthouse keeper discovers the light is alive."
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
      />
      <div className="flex items-center gap-3">
        <label className="text-xs text-[var(--color-muted)]">Scenes</label>
        <input
          type="number"
          min={1}
          max={9}
          value={sceneCount}
          onChange={(e) => setSceneCount(Number(e.target.value))}
          className="w-16 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-sm"
        />
        <button
          disabled={pending || idea.trim().length < 3}
          onClick={() => {
            setError(null);
            start(async () => {
              try {
                await cowriteScriptAction({
                  projectId,
                  idea,
                  sceneCount,
                });
              } catch (e) {
                setError(
                  e instanceof Error ? e.message : "Failed to generate.",
                );
              }
            });
          }}
          className="ml-auto rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        >
          {pending ? "Writing…" : "Co-write"}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
