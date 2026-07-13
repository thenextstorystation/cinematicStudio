export function ViewPlaceholder({
  title,
  module,
  children,
}: {
  title: string;
  module: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] p-10">
      <p className="text-xs uppercase tracking-widest text-[var(--color-accent)]">
        {module}
      </p>
      <h2 className="mt-2 text-lg font-semibold">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm text-[var(--color-muted)]">
        {children}
      </p>
    </div>
  );
}
