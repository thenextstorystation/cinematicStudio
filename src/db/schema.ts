/**
 * Cinematic Studio — database schema (Drizzle / Postgres).
 *
 * Models the "project graph" from PRD §6.1. A Project is the root; the five
 * Studio views (Script / Board / Design / Canvas / Edit) are projections over
 * these tables. Immutable Takes, ledger-first accounting, and entity re-use
 * are the load-bearing invariants.
 */
import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";

// ---------------------------------------------------------------------------
// Enums
// ---------------------------------------------------------------------------
export const entityKind = pgEnum("entity_kind", [
  "character",
  "prop",
  "location",
]);

export const shotStatus = pgEnum("shot_status", [
  "planned",
  "designed",
  "drafted",
  "rendered",
  "approved",
  "in_edit",
]);

export const takeState = pgEnum("take_state", [
  "queued",
  "running",
  "succeeded",
  "failed",
  "canceled",
]);

export const ledgerReason = pgEnum("ledger_reason", [
  "grant", // subscription / signup credits
  "topup", // purchased credits
  "spend", // generation cost
  "refund", // auto-refund on failure (PRD §24.2)
  "rollover",
  "expiry",
  "adjustment",
]);

export const mediaKind = pgEnum("media_kind", [
  "image",
  "video",
  "audio",
  "document",
]);

// ---------------------------------------------------------------------------
// Users & billing
// ---------------------------------------------------------------------------
export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    clerkId: text("clerk_id").notNull(),
    email: text("email").notNull(),
    displayName: text("display_name"),
    imageUrl: text("image_url"),
    // Denormalized running balance; the ledger is the source of truth.
    creditBalance: integer("credit_balance").notNull().default(0),
    stripeCustomerId: text("stripe_customer_id"),
    plan: text("plan").notNull().default("free"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    uniqueIndex("users_clerk_id_idx").on(t.clerkId),
    uniqueIndex("users_email_idx").on(t.email),
  ],
);

/**
 * Ledger-first accounting (PRD §6.7). Every credit movement is an append-only
 * row; `users.creditBalance` is a cache reconciled from the sum of entries.
 */
export const creditLedger = pgTable(
  "credit_ledger",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    reason: ledgerReason("reason").notNull(),
    // Signed: grants/topups/refunds positive, spends/expiry negative.
    amount: integer("amount").notNull(),
    balanceAfter: integer("balance_after").notNull(),
    // Links a spend to the take it paid for, or a topup to a Stripe object.
    referenceType: text("reference_type"),
    referenceId: text("reference_id"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("credit_ledger_user_idx").on(t.userId, t.createdAt)],
);

// ---------------------------------------------------------------------------
// Projects & style header
// ---------------------------------------------------------------------------
export const projects = pgTable(
  "projects",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull().default("Untitled Project"),
    logline: text("logline"),
    // Locked project style header prepended to every compiled prompt
    // (PRD §4.4): palette 60/30/10, grade, grain, aspect ratio, etc.
    styleHeader: jsonb("style_header").$type<StyleHeader>().default({}),
    aspectRatio: text("aspect_ratio").notNull().default("16:9"),
    archivedAt: timestamp("archived_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("projects_owner_idx").on(t.ownerId)],
);

export type StyleHeader = {
  palettePrimary?: string;
  paletteSecondary?: string;
  paletteAccent?: string;
  grade?: string;
  grain?: string;
  notes?: string;
};

// ---------------------------------------------------------------------------
// Screenplay: scenes
// ---------------------------------------------------------------------------
export const scenes = pgTable(
  "scenes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    index: integer("index").notNull().default(0),
    heading: text("heading"), // e.g. "INT. WAREHOUSE - NIGHT"
    body: text("body"),
    // Top-down blocking map (PRD §3.4): entities, camera wedge, axis of action.
    blockingMap: jsonb("blocking_map").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("scenes_project_idx").on(t.projectId, t.index)],
);

// ---------------------------------------------------------------------------
// Entities: characters, props, locations (continuity system, Module 2)
// ---------------------------------------------------------------------------
export const entities = pgTable(
  "entities",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: entityKind("kind").notNull(),
    name: text("name").notNull(),
    // Canonical descriptors used to prevent drift at compile time (PRD §6.5).
    descriptors: jsonb("descriptors").$type<Record<string, unknown>>(),
    // Persistent reference set + embedding reused in every generation (2.2).
    referenceSetId: uuid("reference_set_id"),
    // Real-person-derived entities are locked until a consent record exists
    // (PRD §25.7). Synthetic entities leave this false.
    requiresConsent: boolean("requires_consent").notNull().default(false),
    consentRecordId: uuid("consent_record_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("entities_project_idx").on(t.projectId, t.kind)],
);

/** Wardrobe outfits as versioned sub-assets of a character (PRD §2.3). */
export const outfits = pgTable(
  "outfits",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    entityId: uuid("entity_id")
      .notNull()
      .references(() => entities.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    version: integer("version").notNull().default(1),
    descriptors: jsonb("descriptors").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("outfits_entity_idx").on(t.entityId)],
);

// ---------------------------------------------------------------------------
// Shots, prompt versions, takes (Director Layer + generation)
// ---------------------------------------------------------------------------
export const shots = pgTable(
  "shots",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sceneId: uuid("scene_id")
      .notNull()
      .references(() => scenes.id, { onDelete: "cascade" }),
    index: integer("index").notNull().default(0),
    status: shotStatus("status").notNull().default("planned"),
    // Shot Designer output (PRD §3.2): size, angle, lens, movement, lighting,
    // composition. Model-agnostic; the compiler renders model-specific grammar.
    design: jsonb("design").$type<ShotDesign>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("shots_scene_idx").on(t.sceneId, t.index)],
);

export type ShotDesign = {
  size?: string; // EWS..ECU
  angle?: string; // eye/low/high/worm/top-down/dutch/POV
  lensMm?: number;
  movements?: { name: string; intent: string }[];
  lighting?: string;
  composition?: string;
  durationSec?: number;
};

/** Hand edits + compiler output create versioned prompts with diff lineage. */
export const promptVersions = pgTable(
  "prompt_versions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shotId: uuid("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    version: integer("version").notNull().default(1),
    // Intermediate representation (model-agnostic) + rendered per-model text.
    ir: jsonb("ir").$type<Record<string, unknown>>(),
    compiledText: text("compiled_text"),
    targetModel: text("target_model"),
    promptHash: text("prompt_hash"),
    parentVersionId: uuid("parent_version_id"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("prompt_versions_shot_idx").on(t.shotId, t.version)],
);

/**
 * Takes are immutable render results (PRD §6.1 invariant, §6.8 reproducibility).
 * Every take records model+version, seed, params, and reference hashes.
 */
export const takes = pgTable(
  "takes",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    shotId: uuid("shot_id")
      .notNull()
      .references(() => shots.id, { onDelete: "cascade" }),
    promptVersionId: uuid("prompt_version_id").references(
      () => promptVersions.id,
      { onDelete: "set null" },
    ),
    label: text("label"), // A / B / C take management
    state: takeState("state").notNull().default("queued"),
    isDraft: boolean("is_draft").notNull().default(true),
    model: text("model"),
    modelVersion: text("model_version"),
    seed: text("seed"),
    params: jsonb("params").$type<Record<string, unknown>>(),
    referenceHashes: jsonb("reference_hashes").$type<string[]>(),
    // Cost in credits, reconciled against the ledger.
    creditCost: integer("credit_cost").notNull().default(0),
    // Post-render consistency score (PRD §2.2), 0-100; null until measured.
    consistencyScore: integer("consistency_score"),
    mediaAssetId: uuid("media_asset_id"),
    error: jsonb("error").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("takes_shot_idx").on(t.shotId)],
);

// ---------------------------------------------------------------------------
// Media assets (storage abstraction — Cloudinary / Synology)
// ---------------------------------------------------------------------------
export const mediaAssets = pgTable(
  "media_assets",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    projectId: uuid("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    kind: mediaKind("kind").notNull(),
    provider: text("provider").notNull(), // cloudinary | synology
    // Provider-specific handle (public_id, object key) for later delete/transform.
    storageKey: text("storage_key").notNull(),
    url: text("url").notNull(),
    width: integer("width"),
    height: integer("height"),
    durationSec: integer("duration_sec"),
    bytes: integer("bytes"),
    contentHash: text("content_hash"),
    metadata: jsonb("metadata").$type<Record<string, unknown>>(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => [index("media_assets_project_idx").on(t.projectId, t.kind)],
);

// ---------------------------------------------------------------------------
// Relations
// ---------------------------------------------------------------------------
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  ledger: many(creditLedger),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  scenes: many(scenes),
  entities: many(entities),
  mediaAssets: many(mediaAssets),
}));

export const scenesRelations = relations(scenes, ({ one, many }) => ({
  project: one(projects, {
    fields: [scenes.projectId],
    references: [projects.id],
  }),
  shots: many(shots),
}));

export const entitiesRelations = relations(entities, ({ one, many }) => ({
  project: one(projects, {
    fields: [entities.projectId],
    references: [projects.id],
  }),
  outfits: many(outfits),
}));

export const shotsRelations = relations(shots, ({ one, many }) => ({
  scene: one(scenes, { fields: [shots.sceneId], references: [scenes.id] }),
  promptVersions: many(promptVersions),
  takes: many(takes),
}));

export const takesRelations = relations(takes, ({ one }) => ({
  shot: one(shots, { fields: [takes.shotId], references: [shots.id] }),
  promptVersion: one(promptVersions, {
    fields: [takes.promptVersionId],
    references: [promptVersions.id],
  }),
}));

// Convenience: a raw SQL default for "now" if ever needed outside Drizzle.
export const NOW = sql`now()`;
