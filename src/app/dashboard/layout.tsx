import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { getCurrentUser } from "@/server/auth";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[var(--color-border)] bg-[var(--color-bg)]/90 px-6 py-3 backdrop-blur">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="inline-block h-5 w-5 rounded bg-[var(--color-accent)]" />
            Cinematic Studio
          </Link>
          <nav className="hidden gap-4 text-sm text-[var(--color-muted)] sm:flex">
            <Link href="/dashboard" className="transition hover:text-[var(--color-text)]">
              Projects
            </Link>
            <Link
              href="/dashboard/queue"
              className="transition hover:text-[var(--color-text)]"
            >
              Queue
            </Link>
            <Link
              href="/dashboard/billing"
              className="transition hover:text-[var(--color-text)]"
            >
              Billing
            </Link>
          </nav>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/billing"
            className="rounded-full border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-1 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)]"
          >
            {user?.creditBalance ?? 0} credits
          </Link>
          <UserButton afterSignOutUrl="/" />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
