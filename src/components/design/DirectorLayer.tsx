"use client";

import { useMemo, useState, useTransition } from "react";
import type { ShotDesign, StyleHeader } from "@/db/schema";
import {
  compile,
  SHOT_SIZES,
  ANGLES,
  MOVEMENTS,
  LIGHTING,
  COMPOSITIONS,
  type CompilerEntity,
  type TargetModel,
} from "@/lib/compiler";
import { estimateShotCredits } from "@/lib/cost";
import {
  createShotAction,
  saveShotDesignAction,
  generateShotAction,
} from "@/server/actions";

type Entity = {
  id: string;
  kind: "character" | "prop" | "location";
  name: string;
  descriptors?: Record<string, unknown> | null;
};

type Take = {
  id: string;
  state: string;
  isDraft: boolean;
  url: string | null;
  creditCost: number;
};

type Shot = {
  id: string;
  index: number;
  status: string;
  design: ShotDesign;
  takes: Take[];
};

type Scene = {
  id: string;
  heading: string | null;
  index: number;
  shots: Shot[];
};

const TARGETS: { key: TargetModel; label: string }[] = [
  { key: "generic", label: "Generic" },
  { key: "veo", label: "Veo" },
  { key: "seedance", label: "Seedance" },
  { key: "kling", label: "Kling" },
];

export function DirectorLayer({
  projectId,
  styleHeader,
  scenes,
  entities,
}: {
  projectId: string;
  styleHeader: StyleHeader;
  scenes: Scene[];
  entities: Entity[];
}) {
  const [sceneId, setSceneId] = useState(scenes[0]?.id ?? "");
  const scene = scenes.find((s) => s.id === sceneId) ?? scenes[0];
  const [shotId, setShotId] = useState(scene?.shots[0]?.id ?? "");
  const shot = scene?.shots.find((s) => s.id === shotId) ?? scene?.shots[0];

  if (!scene) {
    return (
      <p className="text-sm text-[var(--color-muted)]">
        No scenes yet — add one in the Script view first.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_1fr_360px]">
      {/* Shot navigator */}
      <aside className="space-y-3">
        <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
          Scene
        </label>
        <select
          value={scene.id}
          onChange={(e) => {
            setSceneId(e.target.value);
            const next = scenes.find((s) => s.id === e.target.value);
            setShotId(next?.shots[0]?.id ?? "");
          }}
          className="w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm"
        >
          {scenes.map((s) => (
            <option key={s.id} value={s.id}>
              {s.heading ?? `Scene ${s.index + 1}`}
            </option>
          ))}
        </select>

        <div className="space-y-1">
          {scene.shots.map((s) => (
            <button
              key={s.id}
              onClick={() => setShotId(s.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                s.id === shot?.id
                  ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                  : "border-[var(--color-border)] bg-[var(--color-surface)] hover:border-[var(--color-accent)]"
              }`}
            >
              <span>Shot {s.index + 1}</span>
              <StatusPip status={s.status} />
            </button>
          ))}
          <AddShotButton projectId={projectId} sceneId={scene.id} />
        </div>
      </aside>

      {shot ? (
        <ShotEditor
          key={shot.id}
          projectId={projectId}
          shot={shot}
          entities={entities}
          styleHeader={styleHeader}
        />
      ) : (
        <p className="text-sm text-[var(--color-muted)]">
          No shots in this scene yet. Add one to start designing.
        </p>
      )}
    </div>
  );
}

function StatusPip({ status }: { status: string }) {
  const color =
    status === "rendered" || status === "approved"
      ? "bg-emerald-500"
      : status === "designed"
        ? "bg-[var(--color-accent)]"
        : "bg-[var(--color-muted)]";
  return <span className={`h-2 w-2 rounded-full ${color}`} />;
}

function AddShotButton({
  projectId,
  sceneId,
}: {
  projectId: string;
  sceneId: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      disabled={pending}
      onClick={() => start(() => createShotAction(projectId, sceneId))}
      className="w-full rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-muted)] transition hover:border-[var(--color-accent)] hover:text-[var(--color-text)] disabled:opacity-50"
    >
      {pending ? "Adding…" : "+ Add shot"}
    </button>
  );
}

function ShotEditor({
  projectId,
  shot,
  entities,
  styleHeader,
}: {
  projectId: string;
  shot: Shot;
  entities: Entity[];
  styleHeader: StyleHeader;
}) {
  const [design, setDesign] = useState<ShotDesign>(shot.design ?? {});
  const [action, setAction] = useState("");
  const [target, setTarget] = useState<TargetModel>("generic");
  const [includedIds, setIncludedIds] = useState<string[]>(
    entities.map((e) => e.id),
  );
  const [saved, setSaved] = useState(false);
  const [pending, start] = useTransition();
  const [genPending, startGen] = useTransition();
  const [genError, setGenError] = useState<string | null>(null);
  const [genNote, setGenNote] = useState<string | null>(null);

  const includedEntities: CompilerEntity[] = useMemo(
    () =>
      entities
        .filter((e) => includedIds.includes(e.id))
        .map((e) => ({
          id: e.id,
          kind: e.kind,
          name: e.name,
          descriptors: e.descriptors,
        })),
    [entities, includedIds],
  );

  const result = useMemo(
    () =>
      compile({
        design,
        entities: includedEntities,
        style: styleHeader,
        action,
        targetModel: target,
      }),
    [design, includedEntities, styleHeader, action, target],
  );

  const draftCost = estimateShotCredits({
    design,
    referenceCount: result.ir.references.length,
    isDraft: true,
  });
  const finalCost = estimateShotCredits({
    design,
    referenceCount: result.ir.references.length,
    isDraft: false,
  });

  const latestRender = shot.takes.find(
    (t) => t.state === "succeeded" && t.url,
  );

  function patch(next: Partial<ShotDesign>) {
    setDesign((d) => ({ ...d, ...next }));
    setSaved(false);
  }

  function toggleMovement(name: string) {
    setDesign((d) => {
      const moves = d.movements ?? [];
      const exists = moves.find((m) => m.name === name);
      const nextMoves = exists
        ? moves.filter((m) => m.name !== name)
        : [...moves, { name, intent: "" }];
      return { ...d, movements: nextMoves };
    });
    setSaved(false);
  }

  function setMovementIntent(name: string, intent: string) {
    setDesign((d) => ({
      ...d,
      movements: (d.movements ?? []).map((m) =>
        m.name === name ? { ...m, intent } : m,
      ),
    }));
    setSaved(false);
  }

  function save() {
    start(async () => {
      await saveShotDesignAction({
        projectId,
        shotId: shot.id,
        design,
        compiled: {
          text: result.text,
          targetModel: result.targetModel,
          ir: result.ir as unknown as Record<string, unknown>,
        },
      });
      setSaved(true);
    });
  }

  function generate(isDraft: boolean) {
    setGenError(null);
    setGenNote(null);
    startGen(async () => {
      // Persist the current design first so the server compiles what you see.
      await saveShotDesignAction({
        projectId,
        shotId: shot.id,
        design,
        compiled: {
          text: result.text,
          targetModel: result.targetModel,
          ir: result.ir as unknown as Record<string, unknown>,
        },
      });
      const res = await generateShotAction({
        projectId,
        shotId: shot.id,
        isDraft,
        targetModel: target,
      });
      if (res.ok) {
        setGenNote(
          `${isDraft ? "Draft" : "Final"} rendered · ${res.creditCost} cr spent.`,
        );
      } else {
        setGenError(
          res.refunded
            ? `${res.error} (${res.refunded} cr refunded.)`
            : res.error,
        );
      }
    });
  }

  const selectedMoves = new Set((design.movements ?? []).map((m) => m.name));

  return (
    <>
      {/* Center stage: Frame controls */}
      <section className="space-y-6 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        {/* Previz stage — shows the latest rendered take, or a gray mannequin. */}
        <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-xl bg-[var(--color-surface-2)] text-sm text-[var(--color-muted)]">
          {latestRender ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={latestRender.url ?? ""}
              alt="Latest render"
              className="h-full w-full object-cover"
            />
          ) : (
            "Previz — gray mannequin stage (design before you render)"
          )}
          {genPending && (
            <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-bg)]/70 text-sm">
              Generating…
            </div>
          )}
        </div>

        <Ladder
          label="Shot size"
          options={SHOT_SIZES.map((s) => ({
            key: s.key,
            label: s.label,
            hint: s.emotion,
          }))}
          value={design.size}
          onChange={(v) => patch({ size: v })}
        />

        <Ladder
          label="Angle"
          options={ANGLES.map((a) => ({
            key: a.key,
            label: a.label,
            hint: a.emotion,
          }))}
          value={design.angle}
          onChange={(v) => patch({ angle: v })}
        />

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Lens
            </label>
            <span className="text-sm">{design.lensMm ?? 35}mm</span>
          </div>
          <input
            type="range"
            min={16}
            max={135}
            step={1}
            value={design.lensMm ?? 35}
            onChange={(e) => patch({ lensMm: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Movement (≤3, each needs an intent)
          </label>
          <div className="mt-2 flex flex-wrap gap-2">
            {MOVEMENTS.map((m) => (
              <button
                key={m.key}
                onClick={() => toggleMovement(m.key)}
                className={`rounded-full border px-3 py-1 text-xs transition ${
                  selectedMoves.has(m.key)
                    ? "border-[var(--color-accent)] bg-[var(--color-surface-2)] text-[var(--color-text)]"
                    : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)]"
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
          {(design.movements ?? []).map((m) => (
            <input
              key={m.name}
              value={m.intent}
              placeholder={`Intent for "${m.name}" (why this move?)`}
              onChange={(e) => setMovementIntent(m.name, e.target.value)}
              className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
            />
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Lighting"
            options={LIGHTING}
            value={design.lighting}
            onChange={(v) => patch({ lighting: v })}
          />
          <Select
            label="Composition"
            options={COMPOSITIONS}
            value={design.composition}
            onChange={(v) => patch({ composition: v })}
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Duration
            </label>
            <span className="text-sm">{design.durationSec ?? 5}s</span>
          </div>
          <input
            type="range"
            min={2}
            max={15}
            step={1}
            value={design.durationSec ?? 5}
            onChange={(e) => patch({ durationSec: Number(e.target.value) })}
            className="mt-2 w-full accent-[var(--color-accent)]"
          />
        </div>

        <div>
          <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
            Action / description
          </label>
          <textarea
            value={action}
            onChange={(e) => {
              setAction(e.target.value);
              setSaved(false);
            }}
            rows={2}
            placeholder="What happens in this shot?"
            className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
          />
        </div>

        {entities.length > 0 && (
          <div>
            <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Entities in shot
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {entities.map((e) => (
                <button
                  key={e.id}
                  onClick={() =>
                    setIncludedIds((ids) =>
                      ids.includes(e.id)
                        ? ids.filter((x) => x !== e.id)
                        : [...ids, e.id],
                    )
                  }
                  className={`rounded-full border px-3 py-1 text-xs transition ${
                    includedIds.includes(e.id)
                      ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                      : "border-[var(--color-border)] text-[var(--color-muted)]"
                  }`}
                >
                  {e.name}
                  <span className="ml-1 opacity-60">{e.kind[0]}</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Prompt Panel */}
      <aside className="space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium">Compiled prompt</h3>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as TargetModel)}
            className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 py-1 text-xs"
          >
            {TARGETS.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </select>
        </div>

        <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-[var(--color-bg)] p-3 text-xs leading-relaxed text-[var(--color-text)]">
          {result.text || "Design the shot to compile a prompt…"}
        </pre>

        {result.lint.length > 0 && (
          <ul className="space-y-1 text-xs">
            {result.lint.map((f, i) => (
              <li
                key={i}
                className={
                  f.level === "error"
                    ? "text-red-400"
                    : f.level === "warn"
                      ? "text-[var(--color-accent)]"
                      : "text-[var(--color-muted)]"
                }
              >
                {f.level === "error" ? "⛔" : f.level === "warn" ? "⚠" : "ℹ"}{" "}
                {f.message}
              </li>
            ))}
          </ul>
        )}

        <div className="flex items-center gap-2">
          <button
            onClick={() => generate(true)}
            disabled={genPending}
            title="Draft render auto-downshifts resolution/duration"
            className="flex-1 rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition hover:border-[var(--color-accent)] disabled:opacity-50"
          >
            Draft · {draftCost} cr
          </button>
          <button
            onClick={() => generate(false)}
            disabled={genPending}
            className="flex-1 rounded-lg bg-[var(--color-accent)] px-3 py-2 text-sm font-medium text-black transition hover:opacity-90 disabled:opacity-50"
          >
            Final · {finalCost} cr
          </button>
        </div>
        <p className="text-[11px] text-[var(--color-muted)]">
          Spends from your credit wallet; failures auto-refund. Costs are live
          estimates (±10%).
        </p>
        {genNote && <p className="text-xs text-emerald-400">{genNote}</p>}
        {genError && <p className="text-xs text-red-400">{genError}</p>}

        {/* Takes strip (A/B/C lineage) */}
        {shot.takes.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
              Takes
            </h4>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {shot.takes.map((t) => (
                <div key={t.id} className="shrink-0">
                  <div className="h-14 w-24 overflow-hidden rounded border border-[var(--color-border)] bg-[var(--color-surface-2)]">
                    {t.url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={t.url}
                        alt="take"
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-[10px] text-[var(--color-muted)]">
                        {t.state}
                      </div>
                    )}
                  </div>
                  <p className="mt-1 text-[10px] text-[var(--color-muted)]">
                    {t.isDraft ? "draft" : "final"} · {t.creditCost}cr
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={save}
          disabled={pending}
          className="w-full rounded-lg border border-[var(--color-border)] px-3 py-2 text-sm transition hover:border-[var(--color-accent)] disabled:opacity-50"
        >
          {pending ? "Saving…" : saved ? "Saved ✓" : "Save shot design"}
        </button>
      </aside>
    </>
  );
}

function Ladder({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string; hint?: string }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {options.map((o) => (
          <button
            key={o.key}
            title={o.hint}
            onClick={() => onChange(o.key)}
            className={`rounded-lg border px-2.5 py-1.5 text-xs transition ${
              value === o.key
                ? "border-[var(--color-accent)] bg-[var(--color-surface-2)]"
                : "border-[var(--color-border)] text-[var(--color-muted)] hover:border-[var(--color-accent)]"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function Select({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly { key: string; label: string }[];
  value?: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-[var(--color-muted)]">
        {label}
      </label>
      <select
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
        className="mt-2 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-sm"
      >
        <option value="">—</option>
        {options.map((o) => (
          <option key={o.key} value={o.key}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}
