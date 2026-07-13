import "server-only";
import { betaJSONSchemaOutputFormat } from "@anthropic-ai/sdk/helpers/beta/json-schema";
import { getAnthropic, MODEL } from "./anthropic";

/**
 * AI co-writer + auto-breakdown (PRD Module 1).
 *
 * Uses Claude with structured outputs (JSON-schema-constrained) so the model
 * returns validated, typed data the app persists straight into the project
 * graph — no brittle text parsing.
 */

// --- Screenplay generation (1.2) -------------------------------------------
const SCREENPLAY_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string", description: "A short, evocative project title." },
    logline: { type: "string", description: "A one-sentence logline." },
    styleHeader: {
      type: "object",
      description: "Locked project style header (PRD §4.4).",
      properties: {
        palettePrimary: { type: "string" },
        paletteSecondary: { type: "string" },
        paletteAccent: { type: "string" },
        grade: { type: "string", description: "e.g. 'warm teal-orange'." },
        grain: { type: "string", description: "Film grain / texture note." },
        notes: { type: "string", description: "One-line visual direction." },
      },
      required: [
        "palettePrimary",
        "paletteSecondary",
        "paletteAccent",
        "grade",
        "grain",
        "notes",
      ],
      additionalProperties: false,
    },
    scenes: {
      type: "array",
      description: "Ordered scenes.",
      items: {
        type: "object",
        properties: {
          heading: {
            type: "string",
            description: "Slugline, e.g. 'INT. WAREHOUSE - NIGHT'.",
          },
          body: {
            type: "string",
            description: "Action lines and dialogue in screenplay style.",
          },
        },
        required: ["heading", "body"],
        additionalProperties: false,
      },
    },
  },
  required: ["title", "logline", "styleHeader", "scenes"],
  additionalProperties: false,
} as const;

export type GeneratedScreenplay = {
  title: string;
  logline: string;
  styleHeader: {
    palettePrimary: string;
    paletteSecondary: string;
    paletteAccent: string;
    grade: string;
    grain: string;
    notes: string;
  };
  scenes: { heading: string; body: string }[];
};

export async function generateScreenplay(
  idea: string,
  opts?: { format?: string; sceneCount?: number },
): Promise<GeneratedScreenplay> {
  const sceneCount = opts?.sceneCount ?? 3;
  const format = opts?.format ?? "short film";

  const message = await getAnthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 8000,
    system:
      "You are a film director and screenwriter. Turn a rough idea into a tight, " +
      "shootable screenplay with a strong visual identity. Write vivid, filmable " +
      "action. Keep it concise and production-ready.",
    messages: [
      {
        role: "user",
        content:
          `Idea: ${idea}\n\n` +
          `Write a ${format} in roughly ${sceneCount} scenes. ` +
          `Give it a title, a logline, a cohesive visual style header, and the scenes.`,
      },
    ],
    output_format: betaJSONSchemaOutputFormat(SCREENPLAY_SCHEMA),
  });

  if (!message.parsed_output) {
    throw new Error("The co-writer returned no usable screenplay.");
  }
  return message.parsed_output as GeneratedScreenplay;
}

// --- Auto-breakdown (1.3) --------------------------------------------------
const BREAKDOWN_SCHEMA = {
  type: "object",
  properties: {
    characters: {
      type: "array",
      description: "Speaking and featured characters.",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          appearance: {
            type: "string",
            description: "Canonical physical description for continuity.",
          },
          outfits: {
            type: "array",
            description: "Wardrobe outfits worn in the script.",
            items: {
              type: "object",
              properties: {
                name: { type: "string", description: "e.g. 'red coat'." },
                description: { type: "string" },
              },
              required: ["name", "description"],
              additionalProperties: false,
            },
          },
        },
        required: ["name", "appearance", "outfits"],
        additionalProperties: false,
      },
    },
    props: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          appearance: { type: "string" },
        },
        required: ["name", "appearance"],
        additionalProperties: false,
      },
    },
    locations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: { type: "string" },
          appearance: { type: "string" },
        },
        required: ["name", "appearance"],
        additionalProperties: false,
      },
    },
  },
  required: ["characters", "props", "locations"],
  additionalProperties: false,
} as const;

export type ScreenplayBreakdown = {
  characters: {
    name: string;
    appearance: string;
    outfits: { name: string; description: string }[];
  }[];
  props: { name: string; appearance: string }[];
  locations: { name: string; appearance: string }[];
};

export async function breakdownScreenplay(
  scriptText: string,
): Promise<ScreenplayBreakdown> {
  const message = await getAnthropic().beta.messages.parse({
    model: MODEL,
    max_tokens: 4000,
    system:
      "You are a first assistant director doing a script breakdown. Extract every " +
      "character (with a canonical appearance and their wardrobe), prop, and location. " +
      "Only extract entities that appear in the script. Keep descriptions concrete and " +
      "reusable so they lock continuity across shots.",
    messages: [
      {
        role: "user",
        content: `Break down this screenplay into tagged entities:\n\n${scriptText}`,
      },
    ],
    output_format: betaJSONSchemaOutputFormat(BREAKDOWN_SCHEMA),
  });

  if (!message.parsed_output) {
    throw new Error("The breakdown returned no usable entities.");
  }
  return message.parsed_output as ScreenplayBreakdown;
}
