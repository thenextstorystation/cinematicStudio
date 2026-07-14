"use client";

import { useRef, useState, useTransition } from "react";
import { askAssistantAction } from "@/server/actions";

type Turn = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "What's left to render?",
  "How many credits have I spent?",
  "Which shots are flagged for continuity?",
  "Summarize scene 1.",
];

/** Project-aware read-only chat (Module 11.1). */
export function AssistantChat({ projectId }: { projectId: string }) {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const listRef = useRef<HTMLDivElement>(null);

  function send(question: string) {
    const q = question.trim();
    if (!q || pending) return;
    setError(null);
    const history = turns;
    setTurns((t) => [...t, { role: "user", content: q }]);
    setInput("");
    start(async () => {
      try {
        const answer = await askAssistantAction({
          projectId,
          question: q,
          history,
        });
        setTurns((t) => [...t, { role: "assistant", content: answer }]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The assistant is unavailable.");
      }
      requestAnimationFrame(() => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
      });
    });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)]">
      <div ref={listRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {turns.length === 0 && (
          <div className="space-y-3">
            <p className="text-sm text-[var(--color-muted)]">
              Ask about your project — scenes, shots, cost, continuity. I read the
              whole graph and answer, but I can&apos;t change anything.
            </p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-[var(--color-border)] px-3 py-1 text-xs text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {turns.map((t, i) => (
          <div
            key={i}
            className={t.role === "user" ? "flex justify-end" : "flex justify-start"}
          >
            <div
              className={`max-w-[80%] whitespace-pre-wrap rounded-2xl px-4 py-2 text-sm ${
                t.role === "user"
                  ? "bg-[var(--color-accent)] text-black"
                  : "border border-[var(--color-border)] bg-[var(--color-surface-2)]"
              }`}
            >
              {t.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface-2)] px-4 py-2 text-sm text-[var(--color-muted)]">
              Thinking…
            </div>
          </div>
        )}
      </div>

      {error && <p className="px-5 text-xs text-red-400">{error}</p>}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex gap-2 border-t border-[var(--color-border)] p-3"
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about this project…"
          className="flex-1 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
        />
        <button
          type="submit"
          disabled={pending || !input.trim()}
          className="rounded-lg bg-[var(--color-accent)] px-4 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
        >
          Ask
        </button>
      </form>
    </div>
  );
}
