import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-10 px-6 text-center">
      <div className="space-y-4">
        <p className="text-sm font-medium uppercase tracking-[0.2em] text-[var(--color-accent)]">
          AI Filmmaking Workspace
        </p>
        <h1 className="text-balance text-5xl font-semibold leading-tight sm:text-6xl">
          One click to start.
          <br />
          Full craft to finish.
        </h1>
        <p className="mx-auto max-w-2xl text-balance text-lg text-[var(--color-muted)]">
          Cinematic Studio takes you from idea to published film — screenplay,
          storyboard, character &amp; wardrobe continuity, cinematography design,
          multi-model generation, finishing, and edit — in one project graph.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3">
        <SignedOut>
          <Link
            href="/sign-up"
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-black transition hover:opacity-90"
          >
            Start free
          </Link>
          <Link
            href="/sign-in"
            className="rounded-full border border-[var(--color-border)] px-6 py-3 font-medium transition hover:bg-[var(--color-surface)]"
          >
            Sign in
          </Link>
        </SignedOut>
        <SignedIn>
          <Link
            href="/dashboard"
            className="rounded-full bg-[var(--color-accent)] px-6 py-3 font-medium text-black transition hover:opacity-90"
          >
            Open Studio
          </Link>
        </SignedIn>
      </div>

      <div className="grid w-full grid-cols-1 gap-4 pt-8 sm:grid-cols-3">
        {[
          ["Director Layer", "Visual film craft compiled into model-specific prompts."],
          ["Quick Create", "One-click apps, motion presets, and Magic Prompt."],
          ["Continuity Engine", "Character & wardrobe locked across every shot."],
        ].map(([title, body]) => (
          <div
            key={title}
            className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5 text-left"
          >
            <h3 className="font-medium text-[var(--color-accent)]">{title}</h3>
            <p className="mt-2 text-sm text-[var(--color-muted)]">{body}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
