"use client";

import { useState, useTransition } from "react";
import { createEntityAction } from "@/server/actions";

export function AddEntity({ projectId }: { projectId: string }) {
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<"character" | "prop" | "location">(
    "character",
  );
  const [name, setName] = useState("");
  const [appearance, setAppearance] = useState("");
  const [pending, start] = useTransition();

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
      >
        + Add entity
      </button>
    );
  }

  return (
    <div className="space-y-2 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-3">
      <select
        value={kind}
        onChange={(e) => setKind(e.target.value as typeof kind)}
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm"
      >
        <option value="character">Character</option>
        <option value="prop">Prop</option>
        <option value="location">Location</option>
      </select>
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name (e.g. Maya)"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm"
      />
      <input
        value={appearance}
        onChange={(e) => setAppearance(e.target.value)}
        placeholder="Appearance (optional)"
        className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1.5 text-sm"
      />
      <div className="flex gap-2">
        <button
          disabled={pending || !name.trim()}
          onClick={() =>
            start(async () => {
              await createEntityAction({
                projectId,
                kind,
                name,
                appearance: appearance || undefined,
              });
              setName("");
              setAppearance("");
              setOpen(false);
            })
          }
          className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-1.5 text-sm font-medium text-black disabled:opacity-50"
        >
          {pending ? "Adding…" : "Add"}
        </button>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg border border-[var(--color-border)] px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
