/**
 * Timeline export formats (PRD §12.5 / §6.11 interoperability).
 *
 * Pure functions: an assembled sequence → NLE handoff artifacts. No ffmpeg —
 * these are the edit-decision documents (EDL / FCPXML / OTIO) plus a shot-list
 * CSV (§17.1) and the full project JSON. The rendered media stays where the
 * storage provider put it; these files reference it by URL.
 */

export type SequenceClip = {
  sceneIndex: number;
  shotIndex: number;
  name: string;
  durationSec: number;
  url: string | null;
};

export type SequenceMeta = {
  title: string;
  fps: number; // default 24 (PRD §13.1)
  width: number;
  height: number;
};

const pad = (n: number, w = 2) => String(n).padStart(w, "0");

/** Seconds → SMPTE timecode HH:MM:SS:FF at the given fps. */
export function timecode(seconds: number, fps: number): string {
  const totalFrames = Math.round(seconds * fps);
  const f = totalFrames % fps;
  const s = Math.floor(totalFrames / fps) % 60;
  const m = Math.floor(totalFrames / (fps * 60)) % 60;
  const h = Math.floor(totalFrames / (fps * 3600));
  return `${pad(h)}:${pad(m)}:${pad(s)}:${pad(f)}`;
}

/** CMX3600 EDL. */
export function buildEdl(clips: SequenceClip[], meta: SequenceMeta): string {
  const lines = [`TITLE: ${meta.title}`, "FCM: NON-DROP FRAME", ""];
  let recIn = 0;
  clips.forEach((clip, i) => {
    const dur = clip.durationSec;
    const srcIn = timecode(0, meta.fps);
    const srcOut = timecode(dur, meta.fps);
    const recStart = timecode(recIn, meta.fps);
    const recEnd = timecode(recIn + dur, meta.fps);
    lines.push(
      `${pad(i + 1, 3)}  AX       V     C        ${srcIn} ${srcOut} ${recStart} ${recEnd}`,
    );
    lines.push(`* FROM CLIP NAME: ${clip.name}`);
    if (clip.url) lines.push(`* SOURCE FILE: ${clip.url}`);
    lines.push("");
    recIn += dur;
  });
  return lines.join("\n");
}

/** Minimal FCPXML (v1.10) with a spine of asset-clips. Best-effort handoff. */
export function buildFcpxml(clips: SequenceClip[], meta: SequenceMeta): string {
  const frameDuration = `1/${meta.fps}s`;
  const total = clips.reduce((a, c) => a + c.durationSec, 0);

  const assets = clips
    .filter((c) => c.url)
    .map(
      (c, i) =>
        `    <asset id="a${i}" name="${xml(c.name)}" start="0s" duration="${c.durationSec}s" hasVideo="1" format="r1">
      <media-rep kind="original-media" src="${xml(c.url!)}"/>
    </asset>`,
    )
    .join("\n");

  let offset = 0;
  const spine = clips
    .map((c, i) => {
      const el = c.url
        ? `      <asset-clip ref="a${i}" offset="${offset}s" name="${xml(c.name)}" duration="${c.durationSec}s"/>`
        : `      <gap offset="${offset}s" name="${xml(c.name)}" duration="${c.durationSec}s"/>`;
      offset += c.durationSec;
      return el;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE fcpxml>
<fcpxml version="1.10">
  <resources>
    <format id="r1" name="FFVideoFormat" frameDuration="${frameDuration}" width="${meta.width}" height="${meta.height}"/>
${assets}
  </resources>
  <library>
    <event name="${xml(meta.title)}">
      <project name="${xml(meta.title)}">
        <sequence format="r1" duration="${total}s">
          <spine>
${spine}
          </spine>
        </sequence>
      </project>
    </event>
  </library>
</fcpxml>`;
}

/** OpenTimelineIO (OTIO) JSON — a timeline with one video track of clips. */
export function buildOtio(clips: SequenceClip[], meta: SequenceMeta): string {
  const rate = meta.fps;
  const otio = {
    OTIO_SCHEMA: "Timeline.1",
    name: meta.title,
    tracks: {
      OTIO_SCHEMA: "Stack.1",
      children: [
        {
          OTIO_SCHEMA: "Track.1",
          name: "V1",
          kind: "Video",
          children: clips.map((c) => ({
            OTIO_SCHEMA: "Clip.1",
            name: c.name,
            source_range: {
              OTIO_SCHEMA: "TimeRange.1",
              start_time: { OTIO_SCHEMA: "RationalTime.1", value: 0, rate },
              duration: {
                OTIO_SCHEMA: "RationalTime.1",
                value: Math.round(c.durationSec * rate),
                rate,
              },
            },
            media_reference: c.url
              ? {
                  OTIO_SCHEMA: "ExternalReference.1",
                  target_url: c.url,
                }
              : { OTIO_SCHEMA: "MissingReference.1" },
          })),
        },
      ],
    },
  };
  return JSON.stringify(otio, null, 2);
}

/** Shot-list CSV (PRD §17.1). */
export function buildShotListCsv(
  rows: {
    scene: number;
    shot: number;
    size?: string;
    angle?: string;
    lensMm?: number;
    movement?: string;
    durationSec?: number;
    status: string;
    takes: number;
    creditCost: number;
  }[],
): string {
  const header = [
    "Scene",
    "Shot",
    "Size",
    "Angle",
    "Lens(mm)",
    "Movement",
    "Duration(s)",
    "Status",
    "Takes",
    "Credits",
  ];
  const lines = [header.join(",")];
  for (const r of rows) {
    lines.push(
      [
        r.scene,
        r.shot,
        csv(r.size ?? ""),
        csv(r.angle ?? ""),
        r.lensMm ?? "",
        csv(r.movement ?? ""),
        r.durationSec ?? "",
        r.status,
        r.takes,
        r.creditCost,
      ].join(","),
    );
  }
  return lines.join("\n");
}

function xml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function csv(s: string): string {
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}
