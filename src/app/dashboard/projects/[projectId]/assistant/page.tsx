import { AssistantChat } from "@/components/AssistantChat";

/** Director's Assistant view (Module 11.1). */
export default async function AssistantView({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-sm font-medium uppercase tracking-wide text-[var(--color-muted)]">
          Director&apos;s Assistant
        </h2>
        <p className="text-xs text-[var(--color-muted)]">
          Project-aware and read-only. Grounded in your graph; injection-hardened.
        </p>
      </div>
      <AssistantChat projectId={projectId} />
    </div>
  );
}
