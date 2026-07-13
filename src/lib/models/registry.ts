import type { ModelAdapter, ModelCapability } from "./adapter";
import { HiggsfieldAdapter } from "./higgsfield";

/**
 * Model registry. The generation engine routes each shot to a registered
 * adapter (PRD §6.1 multi-model routing). Launch target: ≥2 video + 2 image
 * adapters. Register additional providers here — nothing else changes.
 */
const adapters: ModelAdapter[] = [
  new HiggsfieldAdapter("seedance-2", ["text-to-video", "image-to-video"]),
  new HiggsfieldAdapter("soul-image", ["text-to-image"]),
  new HiggsfieldAdapter("upscaler", ["upscale"]),
];

const byId = new Map(adapters.map((a) => [a.info().id, a]));

export function listModels() {
  return adapters.map((a) => a.info());
}

export function getAdapter(id: string): ModelAdapter | undefined {
  return byId.get(id);
}

export function recommendAdapter(
  capability: ModelCapability,
): ModelAdapter | undefined {
  return adapters.find((a) => a.capabilities().includes(capability));
}
