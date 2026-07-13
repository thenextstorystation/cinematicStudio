/**
 * Craft translation dictionaries (PRD §6.2 "craft translation" stage).
 *
 * Maps the Shot Designer's UI enums into cinematography language that models
 * respond to. Plain-language ↔ film-language mapping lives here so the compiler,
 * the Learn-mode microcopy, and the Quick/Studio views all share one source.
 */

export const SHOT_SIZES = [
  { key: "EWS", label: "Extreme Wide", phrase: "extreme wide establishing shot", emotion: "isolation, scale" },
  { key: "WS", label: "Wide", phrase: "wide shot", emotion: "context, environment" },
  { key: "MWS", label: "Medium Wide", phrase: "medium-wide shot", emotion: "body language" },
  { key: "MS", label: "Medium", phrase: "medium shot", emotion: "conversational" },
  { key: "MCU", label: "Medium Close-Up", phrase: "medium close-up", emotion: "engagement" },
  { key: "CU", label: "Close-Up", phrase: "close-up", emotion: "emotion, intimacy" },
  { key: "ECU", label: "Extreme Close-Up", phrase: "extreme close-up", emotion: "tension, detail" },
] as const;

export const ANGLES = [
  { key: "eye", label: "Eye Level", phrase: "shot at eye level", emotion: "neutral, natural" },
  { key: "low", label: "Low Angle", phrase: "low-angle shot looking up at the subject", emotion: "power, dominance" },
  { key: "high", label: "High Angle", phrase: "high-angle shot looking down at the subject", emotion: "vulnerability" },
  { key: "worm", label: "Worm's Eye", phrase: "worm's-eye view from ground level", emotion: "overwhelming scale" },
  { key: "top-down", label: "Top-Down", phrase: "top-down overhead shot", emotion: "abstraction, order" },
  { key: "dutch", label: "Dutch Tilt", phrase: "dutch-tilted canted frame", emotion: "unease, disorientation" },
  { key: "pov", label: "POV", phrase: "first-person point-of-view shot", emotion: "immersion" },
] as const;

/** Named camera moves; each requires an intent tag in the Shot Designer. */
export const MOVEMENTS = [
  { key: "static", label: "Static", phrase: "locked-off static camera" },
  { key: "slow-push", label: "Slow Push", phrase: "slow dolly push-in" },
  { key: "crash-zoom", label: "Crash Zoom", phrase: "sudden crash zoom" },
  { key: "orbit", label: "360 Orbit", phrase: "smooth 360-degree orbit around the subject" },
  { key: "crane", label: "Crane Reveal", phrase: "rising crane reveal" },
  { key: "handheld", label: "Handheld Follow", phrase: "handheld follow with organic motion" },
  { key: "pan", label: "Pan", phrase: "horizontal pan" },
  { key: "tilt", label: "Tilt", phrase: "vertical tilt" },
  { key: "tracking", label: "Tracking", phrase: "lateral tracking shot" },
] as const;

export const LIGHTING = [
  { key: "three-point", label: "Three-Point", phrase: "balanced three-point lighting" },
  { key: "high-key", label: "High Key", phrase: "bright high-key lighting, low contrast" },
  { key: "low-key", label: "Low Key", phrase: "dramatic low-key lighting, deep shadows" },
  { key: "golden-hour", label: "Golden Hour", phrase: "warm golden-hour sunlight, long shadows" },
  { key: "neon", label: "Neon", phrase: "moody neon practicals, teal-and-magenta wash" },
  { key: "silhouette", label: "Silhouette", phrase: "strong backlight rendering the subject in silhouette" },
  { key: "overcast", label: "Overcast", phrase: "soft diffuse overcast light" },
] as const;

export const COMPOSITIONS = [
  { key: "thirds", label: "Rule of Thirds", phrase: "subject placed on a rule-of-thirds power point" },
  { key: "centered", label: "Centered", phrase: "symmetrical centered composition" },
  { key: "golden", label: "Golden Spiral", phrase: "golden-ratio spiral composition" },
  { key: "leading", label: "Leading Lines", phrase: "leading lines drawing the eye to the subject" },
  { key: "frame-in-frame", label: "Frame in Frame", phrase: "frame-within-a-frame composition" },
] as const;

/** Focal length → perceptual description (lens picker, PRD §3.2). */
export function lensPhrase(mm?: number): string | null {
  if (!mm) return null;
  if (mm <= 18) return `${mm}mm ultra-wide lens, expansive perspective`;
  if (mm <= 35) return `${mm}mm wide lens, natural depth`;
  if (mm <= 55) return `${mm}mm standard lens, human perspective`;
  if (mm <= 85) return `${mm}mm short-telephoto, flattering compression`;
  return `${mm}mm telephoto lens, strong compression and shallow depth`;
}

export function phraseFor<T extends { key: string; phrase: string }>(
  table: readonly T[],
  key?: string,
): string | null {
  if (!key) return null;
  return table.find((r) => r.key === key)?.phrase ?? null;
}
