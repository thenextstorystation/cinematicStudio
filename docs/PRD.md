# Cinematic Studio — Master Product Requirements Document

**Version:** 2.0 (consolidates v1.0 PRD, v1.1 Deep Dive, v1.2 Gap Closure, v1.3 Competitive Parity) · **Date:** July 2026 · **Status:** Consolidated draft for approval

**Change of scope in this version:** Face swap, video face swap, and expression transfer are **removed** from the product by decision. Subject replacement (Recast) is retained but restricted to **synthetic Entities only** — the product will not map real people's faces onto media. Rationale: deepfake risk, regulatory exposure, and brand positioning as a *filmmaking* tool rather than an identity-manipulation tool. Talking avatars, motion transfer, and outfit swap remain, gated by the consent framework (§25).

---

## 1. Executive Summary

Cinematic Studio is an all-in-one AI filmmaking application: one workspace that takes a creator from idea to published film — screenplay, storyboard, character and wardrobe continuity, cinematography design, skill-based prompting, multi-model image and video generation, finishing/enhancement, editing, analysis, and publishing.

**The one-sentence strategy:** competitors ship either raw power (Higgsfield: 15+ models, 80+ apps), a single-vendor generation workspace (Google Flow), or best-in-class finishing (Magnific) — none treats the user as a *director*. Cinematic Studio's moat is the **Director Layer** (visual film craft compiled into model-specific prompts) fused with a **Quick Create Layer** (one-click ease), both views of a single project graph: *one click to start, full craft to finish.*

## 2. Market Context (condensed, July 2026)

| Competitor | Position | Their weakness we exploit |
|---|---|---|
| **Google Flow** | Veo-powered generation workspace; Ingredients, Frames-to-Video, Extend, agent | Single vendor; no screenplay/craft/analysis layers |
| **Higgsfield** | Multi-model aggregator (Seedance 2.0, Kling 3.0, Veo 3.1…), Cinema Studio optics, Soul ID, 80+ apps | Fragmented UX; clip generator not a pipeline; credit-trust complaints (no rollover, expiring top-ups) |
| **Magnific** (rebranded Freepik, ~$230M ARR) | Creative upscaling/relight/style transfer, Mystic generation | Image-finishing centric; no narrative pipeline |
| **LTX Studio** | Script→storyboard automation, Elements | Weaker cinematography depth; limited models |

Validated pains: character/wardrobe drift (#1), fragmented pipeline, prompt-skill gap, credit anxiety and waste, no craft scaffolding, no path for existing footage. The market's structural pattern: winners run a **two-speed product** (expert layer + one-click layer); our correction is to make both speeds share one editable project graph.

## 3. Target Users

Solo AI filmmakers (beachhead), content creators/YouTubers, agency/brand teams, traditional filmmakers (pre-viz), and film students/learners — detailed personas per v1.0 §4 stand unchanged.

## 4. Product Principles

1. **One project, two speeds, five views.** Quick Create and Studio are entrances to the same graph; Script / Board / Design / Canvas / Edit are synchronized projections of it. Nothing is a dead end; everything opens in Studio fully editable.
2. **Direct manipulation over text boxes** — prompts are the *output* of the UI (always visible, hand-editable).
3. **Plain language in Quick, film language in Studio** — mapped 1:1 to the same fields; the app teaches craft in both directions.
4. **Money always visible** — cost on every generate button; drafts by default.
5. **Progressive disclosure** — presets first, granular controls beneath; three-tap ceiling in Quick Mode.
6. **Honesty** — consistency scores are guidance, never guarantees; provider outages visibly attributed.

## 5. Functional Requirements

Priorities: **[M]** Must · **[S]** Should · **[C]** Could. (Consolidated and renumbered; acceptance criteria in §9.)

### Module 1 — Story & Screenplay
- **1.1 [M]** Industry-format screenplay editor; Fountain/FDX import-export, PDF import (OCR+parse) [S].
- **1.2 [M]** AI co-writer: idea → logline → beat sheet (three-act, Kishotenketsu, trailer, vignette) → script; rewrite-in-place; **script-stage skills** (genre structures: 30s commercial, retention-engineered YouTube, short-film, mockumentary) via the skill system (Module 4).
- **1.3 [M]** Auto-breakdown: scenes, shots, characters, wardrobe, props, locations extracted as tagged Entities.
- **1.4 [S]** Dialogue tools: subtext suggestions; castable TTS read-through.
- **1.5 [C]** Script diagnostics: pacing curve, character screen-time, structure notes.

### Module 2 — Characters, Wardrobe & World (Continuity System)
- **2.1 [M]** Character Builder from text/reference/generation → character sheet (front/¾/profile, expressions, full body) on neutral ground.
- **2.2 [M]** Identity locking: persistent reference set + embedding reused in every generation; post-render consistency score; one-click re-roll of failures.
- **2.3 [M]** Wardrobe Manager: outfits as versioned sub-assets; outfit-per-scene assignment; ghost-mannequin sheets; continuity warnings on mismatch.
- **2.4 [M]** Props & Locations registry: multi-angle reference sheets and empty plates.
- **2.5 [S]** Voice casting per character (TTS / consented clone).
- **2.6 [S]** Entity-scene relationship views (call-sheet style).

### Module 3 — Storyboard & Director Layer
- **3.1 [M]** Script-to-storyboard with entity injection; 9-frame scene templates; drag-reorder.
- **3.2 [M]** Shot Designer: shot-size ladder (EWS→ECU) with emotional intent labels; angle selector (eye/low/high/worm/top-down/dutch/POV); lens picker (16–135mm + anamorphic) with live FOV/compression preview; movement builder (≤3 stacked moves, each requiring an intent tag).
- **3.3 [M]** Composition overlays: rule of thirds, golden ratio/spiral, symmetry, leading lines, frame-in-frame; snap-to-power-point subject anchors; headroom/lead-room guides.
- **3.4 [M]** Spatial blocking map: top-down floor plan per scene — entities, props, camera wedge with FOV, lights; **180°-rule and eyeline enforcement** across the scene's shots; compiles to a location-scheme prompt block.
- **3.5 [M]** Lighting designer: three-point and mood presets, motivated sources placed on the map, time-of-day, color temperature, contrast-ratio meter; compiles to lighting prompt language.
- **3.6 [S]** Depth staging (fore/mid/background layers per frame).
- **3.7 [S]** Animatic playback; pitch-deck PDF export.
- **3.8 [S]** Learn mode microcopy on every control (owned by Module 20 content).

### Module 4 — Prompt Intelligence & Skills
- **4.1 [M]** Prompt compiler: shot design + entities + style header → intermediate representation → **model-specific grammar** (Seedance timecoded @element blocks; Veo five-part formula; Kling speaker syntax). Model-agnostic project, model-specific output; compiled prompt always visible and editable.
- **4.2 [M]** Skill system: installable YAML skills for prompting **and script writing** (`stage: prompt | script`); genre skills (cinematic, fight, cartoon, 3D CGI, VFX-on-real, ads, physics-first motion); user-authorable and shareable.
- **4.3 [M]** Refinement loop: cheap draft render → AI critique vs. the shot design → suggested prompt diffs → re-draft → promote to final; A/B/C take management with lineage.
- **4.4 [M]** Prompt library: versioned per shot with outcome thumbnails; locked project style header (60:30:10 palette, grade, grain) prepended everywhere.
- **4.5 [S]** Prompt linting: ambiguity, conflicts, missing constraints, per-model token budgets.
- **4.6 [C]** Skill/prompt marketplace (operations in Module 28).

### Module 5 — Canvas & Workflow
- **5.1 [M]** Infinite node canvas: prompts, images, videos, entities, skills, and enhance operations as connectable, re-runnable nodes.
- **5.2 [M]** Pipeline templates: reusable graphs shareable across projects (also the engine behind Quick Apps).
- **5.3 [M]** Unified asset manager: search, auto-tagging, version history on everything.
- **5.4 [S]** Real-time multi-user canvas, comments, approval states.
- **5.5 [C]** User-defined mini-tools (custom nodes).

### Module 6 — Generation Engine (video)
- **6.1 [M]** Multi-model routing (launch: ≥2 video + 2 image adapters; Phase 2: ≥5 video incl. Seedance-, Kling-, Veo-, Wan-class) with per-shot auto-recommendation from telemetry.
- **6.2 [M]** Multi-shot generation (timecoded where supported); first/last-frame control; frame chaining.
- **6.3 [M]** Reference conditioning with role labels (identity / wardrobe / style / structure / motion / location) and **per-reference strength sliders**.
- **6.4 [M]** Cost transparency: live estimate on every generate button; scene/project budget meters.
- **6.5 [S]** Batch queues, priorities, retry policies.
- **6.6 [S]** VFX-on-real-footage: lock the filmed performance, change exactly one variable (environment/element/relight).
- **6.7 [M]** **Extend**: continue any clip in place (+N s) preserving motion and look; transparent fallback to last-frame chaining.
- **6.8 [S]** Native audio generation per shot where supported (details Module 14).

### Module 7 — Image Studio
- **7.1 [M]** Text-to-image and image-to-image with the same entity/skill/style injection as video.
- **7.2 [M]** Inpaint (brush), outpaint/expand, object remove — on any still, board frame, or extracted video frame.
- **7.3 [M]** Frame extraction: any video frame → editable still → re-enters pipeline as first/last-frame or reference.
- **7.4 [S]** Sheet generators: character sheet, wardrobe ghost-mannequin, location plates; **Angles mode** — N alternate camera angles of an existing still (contact-sheet method).
- **7.5 [S]** Poster/thumbnail composer with brand kit.
- **7.6 [C]** Batch variation grids with pick-and-promote.

### Module 8 — Enhance & Finishing Suite
- **8.1 [M]** Creative Upscale: generative detail enhancement to 16x with prompt guidance and sliders (Creativity, Resemblance, HDR, Detail Density); A/B compare.
- **8.2 [M]** Precision Upscale: faithful, non-generative, to 4K+.
- **8.3 [S]** Content-aware presets (Portrait soft/hard, Film, 3D Render, Illustration, Landscape, Product) auto-suggested.
- **8.4 [S]** Restoration: denoise, compression-artifact removal, old-footage cleanup.
- **8.5 [M]** Relight 2.0: driven by lighting rig, text, or a **reference image**; environment follows the light; multi-face scenes auto-run identity checks post-relight.
- **8.6 [M]** Style Transfer & dual-reference generation: independent style + structure references with strength sliders; project style header exportable as a style reference.
- **8.7 [S]** Face/skin repair for AI artifacts (identity-checked so characters never drift).
- **8.8 [M]** Temporal stabilizer: de-flicker/anti-artifact video pass, auto-offered when analysis detects instability.
- **8.9 [S]** Video background removal/replacement (alpha or composite).
- **8.10 [C]** Batch-apply an enhancement recipe to a whole scene.

### Module 9 — Performance & Scene Transfer *(revised: no face swap)*
Consent framework (§25) gates anything touching real-person likeness; **no real-face mapping features exist in the product.**
- **9.1 [M]** Recast — **synthetic Entities only**: replace a subject in footage while preserving motion, camera, lighting, atmosphere (e.g., placeholder actor → final character; human → creature). Real-person face replacement is explicitly out of scope.
- **9.2 [M]** Talking Avatar: Entity portrait + audio/script → long-form lip-synced presenter; pipes from screenplay dialogue and TTS; real-person avatars only via the consent registry (self-avatars and consented spokespeople).
- **9.3 [M]** Motion transfer: drive an Entity with a reference clip's body movement; motion clips become reusable library assets; pairs with fight/action skills.
- **9.4 [S]** Outfit swap on existing media: apply any Wardrobe asset to finished stills/clips — retroactive continuity fixes without regeneration.
- **9.5 [S]** Product placement: composite a product Entity into any scene with matched perspective/lighting/shadows; product pixels stay faithful to the reference sheet.

### Module 10 — Quick Create Layer
Rule: every Quick output is a real project — "Open in Studio" always shows fully editable data.
- **10.1 [M]** Apps gallery: one-input-one-button tools (Headshot, Character Sheet, Location Plate, Upscale, Relight, Talking Avatar, Sketch-to-Scene, Poster…), each a preconfigured pipeline + skill; usable in <60 s cold.
- **10.2 [M]** Named motion presets: 50+ one-click camera moves (Crash Zoom, Slow Push, 360 Orbit, Bullet Time, Crane Reveal, Handheld Follow…) with preview thumbnails; presets fill the movement builder and are inspectable/tweakable/saveable.
- **10.3 [S]** VFX presets (explosions, transformations, weather, transitions), each backed by a certified skill.
- **10.4 [S]** URL-to-ad: product URL → entities → auto-scripted 15/30s ad in three formats; opens in Studio.
- **10.5 [S]** Draw-to-video / sketch-to-edit: draw over frames or blank canvas; sketches double as structure references.
- **10.6 [M]** Magic Prompt: one rough line → proposed mini-script + 4–6 designed shots + style → generate drafts; the zero-to-first-film path.
- **10.7 [S]** Community presets/apps via marketplace pipeline.

### Module 11 — Director's Assistant
- **11.1 [M]** Project-aware chat in every view: answers over the whole graph ("why does shot 5 feel flat?", "what's left in scene 3?", "cost so far?").
- **11.2 [M]** Tool-use over the app with previewed, undoable, user-confirmed actions; never spends credits without an explicit confirmation showing cost.
- **11.3 [M]** Craft advisor grounded in the skill library and Learn content; cites the principle behind each suggestion.
- **11.4 [S]** Prompt-learning loop: biases compilation toward patterns behind the user's starred takes (opt-in, per-project memory).
- **11.5 [S]** Voice input via mobile companion.
- **11.6 [M]** Injection-hardened: user assets and skills are untrusted input; instructions inside them are never executed (§26 threat model).

### Module 12 — Video Editing & Post
- **12.1 [M]** Multi-track timeline: trim/split/reorder; cut intents (cut-on-action, match cut, cross-cut) with AI-suggested cut points.
- **12.2 [M]** In-place retake: regenerate any clip preserving trims and sync.
- **12.3 [M]** Color: project grade/LUT across all clips; per-clip correction.
- **12.4 [S]** Text/titles/captions on the timeline (Module 15); platform resizing 16:9 / 9:16 / 1:1 / 21:9 with subject-tracking crop.
- **12.5 [M]** Export: MP4 (H.264/H.265) to 4K; FCPXML + OTIO + EDL handoff to Premiere/Resolve with round-trip fidelity (trims, order, markers); SRT/VTT; full project JSON.

### Module 13 — Media Engineering
- **13.1 [M]** Conform pipeline: normalize fps (default 24, motion-compensated conversion), resolution, color space (Rec.709/sRGB tagged) on ingest; mismatches surfaced, never silently stretched.
- **13.2 [M]** Per-model color-response profiles so multi-model clips grade together.
- **13.3 [M]** Video upscale to 4K, denoise, frame interpolation (slow-mo, stutter smoothing).
- **13.4 [M]** Proxy workflow for scrubbing; full-res only at export.
- **13.5 [S]** Long-form: 30 min / 2,000 shots; chunked resumable export.
- **13.6 [S]** Licensed stock video/image search inside the asset manager (rights ledger recorded).
- **13.7 [C]** HDR (HLG/PQ) export.

### Module 14 — Audio & Sound Design
- **14.1 [M]** Native AV generation per shot where supported (toggleable for cost).
- **14.2 [M]** Dialogue pipeline: script lines → cast voices → lip-synced render in 8+ languages; per-line re-take without re-rendering video.
- **14.3 [M]** VO/narration: record in-browser or TTS; auto-ducking.
- **14.4 [S]** SFX: text-to-SFX + licensed library; markers snap to detected action beats.
- **14.5 [S]** Music: licensed library + AI generation; beat-grid cut snapping; stem ducking.
- **14.6 [S]** Mix: track gain/pan/EQ presets; loudness normalization (-14 LUFS YouTube, -16 social).
- **14.7 [C]** Dubbing/localization with lip-sync re-render per language.
- **14.8 [M]** Audio rights ledger; export blocks on unlicensed tracks (override with warning).

### Module 15 — Titles, Graphics & Subtitles
- **15.1 [M]** Animated titles/lower-thirds styled by the project style header; safe areas per aspect.
- **15.2 [M]** Auto-captions: transcription, editable track, styled presets, burn-in or sidecar.
- **15.3 [S]** End cards & credits generated from the Entity registry and rights ledger.
- **15.4 [S]** Brand kit enforcement for teams.
- **15.5 [C]** Garbled in-frame AI text detection → flag for retake or overlay.

### Module 16 — Video Analysis & Video-to-Prompt
- **16.1 [M]** Shot detection on uploads: boundaries, durations, thumbnails.
- **16.2 [M]** Per-shot cinematography estimation in Shot-Designer vocabulary: size, angle, movement (optical flow), lens feel, lighting character, palette, composition pattern, audio tags.
- **16.3 [M]** Video-to-prompt: editable, model-targeted prompts recreating each analyzed shot; batch converts a reference video into a storyboard of designed shots; modes: Recreate / Extend-style / Learn.
- **16.4 [S]** Continuity audit of generated projects: identity trend per character, wardrobe mismatches, 180° violations, palette drift — with one-click fixes (re-roll or outfit swap 9.4).
- **16.5 [C]** Reference deconstruction lessons; social-format pacing heatmaps.
- Guardrail: analysis of third-party footage yields craft parameters; recreations targeting protected characters/likenesses are warned and policy-checked.

### Module 17 — Production Management
- **17.1 [M]** Shot list view (scene, size, angle, lens, movement, entities, status, cost, takes); CSV export.
- **17.2 [M]** Status workflow: Planned → Designed → Drafted → Rendered → Approved → In Edit; kanban + list.
- **17.3 [M]** Budget dashboard: planned vs actual credits, burn projection, hard/soft caps.
- **17.4 [S]** Task assignment, due dates, "my tasks" inbox.
- **17.5 [S]** Production report PDF (shot list + boards + budget).
- **17.6 [C]** Milestones with ICS sync.

### Module 18 — Review & Client Sharing
- **18.1 [M]** Tokenized view-only share links (password/expiry optional; no reviewer login).
- **18.2 [M]** Frame-accurate timestamped comments and region annotations; comments become tasks.
- **18.3 [M]** Version compare (side-by-side / A-B); approval locks a version.
- **18.4 [S]** Configurable approval gates between phases (agency mode).
- **18.5 [C]** Guest reference-upload inbox.

### Module 19 — Publishing & Distribution
- **19.1 [M]** Direct YouTube publish (metadata, thumbnail, schedule); TikTok/IG-correct export presets.
- **19.2 [S]** Packaging assistant: titles, description, chapters, hashtags from the script; thumbnail generator.
- **19.3 [S]** Multi-format derivation from one master (auto-reframe with subject tracking).
- **19.4 [C]** Post-publish stats against the project.
- **19.5 [M]** Provenance: C2PA/SynthID-class watermark + AI-disclosure metadata at export/publish.

### Module 20 — Onboarding & Learning
- **20.1 [M]** First-run guided 3-shot project (<15 min) on signup credits, completable entirely in Quick Mode.
- **20.2 [S]** Learn-mode toggle: 2-sentence craft explanations with visual examples on every Director Layer control.
- **20.3 [S]** Genre template gallery pre-wired with skills, style headers, example entities.
- **20.4 [S]** Interactive lessons: analyze a reference (16.3 Learn mode) → recreate → graded composition/lighting match.
- **20.5 [C]** Skill-progression profile adapting default UI depth.

### Module 21 — Search, Versioning & Project Ops
- **21.1 [M]** Global + semantic search ("all low-angle shots of Maya in the red coat").
- **21.2 [M]** Snapshots (manual + pre-destructive-action); restore-as-branch.
- **21.3 [S]** Branching with diff view (entities, prompts, takes).
- **21.4 [M]** 30-day trash/restore for everything.
- **21.5 [S]** Duplicate detection; storage quota dashboard.

### Module 22 — Queue & Notifications
- **22.1 [M]** Queue panel: pending/running/failed jobs with cost, ETA, model, cancel/retry.
- **22.2 [M]** Async notify (in-app, push, email) deep-linking to results.
- **22.3 [S]** Smart batching ordered for reference reuse.
- **22.4 [S]** Failure taxonomy (safety block / model error / timeout) with suggested fixes; configurable auto-retry.
- **22.5 [C]** Off-peak discount scheduling.

### Module 23 — Teams, Admin & Governance
- **23.1 [M]** Roles: Owner, Admin, Director, Editor, Reviewer, Finance.
- **23.2 [M]** Shared team libraries (entities, style headers, skills) with propagated updates.
- **23.3 [S]** SSO/SCIM, audit log.
- **23.4 [S]** Org content-policy controls; consent registry binding; export-approval toggle.
- **23.5 [C]** Private model endpoints (org keys/VPC).

### Module 24 — Billing & Plans
- **24.1 [M]** Credit wallet (subscription grants + top-ups), in-app per-model price table, ledger-first accounting.
- **24.2 [M]** Auto-refund on platform/model failures within minutes, itemized — a marketed trust differentiator versus competitors' expiring, non-rollover credits.
- **24.3 [M]** Plan lifecycle: proration, 1-month rollover on paid tiers, 90-day read-only grace on cancel.
- **24.4 [M]** Card + PayPal, merchant-of-record tax, invoices, consolidated team billing.
- **24.5 [S]** Per-seat spend controls; PO/invoice on Studio tier.
- **24.6 [S]** Dunning grace mode (read-only, no data loss).

### Module 25 — Compliance, Privacy & Data Governance
- **25.1 [M]** Self-serve data export and deletion (GDPR/CCPA) with backup-propagation SLA.
- **25.2 [M]** No training on user content by default; explicit per-project opt-in; stated in-app.
- **25.3 [M]** EU AI Act alignment: disclosure metadata, labeling defaults, transparency docs.
- **25.4 [M]** 18+ age gate; regional feature flags.
- **25.5 [M]** DMCA notice-and-takedown; repeat-infringer policy.
- **25.6 [S]** EU/US data residency (Studio tier); sub-processor registry.
- **25.7 [M]** Likeness & voice consent framework: real-person-derived Entities and cloned voices locked until a consent record exists; periodic re-verification for commercial use. (With face swap removed, this framework governs only talking avatars 9.2 and voice cloning 2.5.)

### Module 26 — Platform Ops & Support
- **26.1 [M]** 99.9% availability target; public status page including per-provider model health.
- **26.2 [M]** Backup/DR: RPO ≤ 1 h, RTO ≤ 4 h; cross-region media replication.
- **26.3 [M]** Help center, contextual docs, diagnostics-attached tickets.
- **26.4 [S]** Feedback + rate-this-take program (feeds quality telemetry).
- **26.5 [S]** Incident banners with affected-queue estimates.

### Module 27 — Mobile Companion
Scope: review, capture, control — not authoring (Phases 1–2).
- **27.1 [M]** Review & approve with frame-accurate comments.
- **27.2 [M]** Queue monitoring + push on completion.
- **27.3 [S]** Reference capture (photos → auto-tagged assets); voice notes to the Assistant.
- **27.4 [S]** Script reading mode with dialogue TTS.
- **27.5 [C]** Phase-3 gate: on-device generation only if companion MAU > 30% of web.

### Module 28 — Community & Developer Ecosystem
- **28.1 [S]** Opt-in gallery with visible sanitized shot designs; remix imports the *design*, never the creator's entities.
- **28.2 [S]** Skill/preset marketplace: review, versioning, ratings, 80/20 creator revenue share; certification via the eval harness.
- **28.3 [S]** Public API + TS/Python SDKs (project CRUD, compile, generate, analyze), plan-based rate limits.
- **28.4 [S]** MCP server exposing project operations to external AI agents.
- **28.5 [C]** Developer program: sandbox credits, webhook catalog.

### Module 29 — Telemetry & Product Analytics
- **29.1 [M]** Instrumentation for all §12 metrics; no prompt content in analytics by default.
- **29.2 [M]** Per-model quality telemetry (retakes, consistency, failures) feeding auto-recommendation.
- **29.3 [S]** User-facing project insights (waste ratio, cost per finished second) with tips.
- **29.4 [S]** A/B framework for compiler/skill changes, measured by retake rate.

---

## 6. Core System Specifications (consolidated)

### 6.1 Project Graph
Single graph; five views are projections. Nodes: Project → StyleHeader, Script(Scenes), Entities (Character+Outfits, Prop, Location+Plates), Scene → BlockingMap + Shots (Design, PromptVersions, Takes), CanvasGraph, Timeline, Skills, Ledger. Invariants: Takes immutable; entity deletion requires re-assignment; BlockingMap.axisOfAction sources 180° validation; ledger-first spending.

### 6.2 Prompt Compiler
ShotDesign + Entities + StyleHeader → **IR** → adapter template → model prompt. Stages: assemble references (role-labeled) → craft translation (design fields → cinematography language) → skill application → adapter render (Seedance timecoded @elements / Veo five-part / Kling speaker syntax) → lint. Hand edits create PromptVersions with diff lineage.

### 6.3 Skill Format
YAML: `skill, version, stage: prompt|script, targets, applies_when, grammar (ordering, vocabulary prefer/avoid), constraints, templates, examples, lint_rules`. Declarative-only sandbox; marketplace skills certified against the eval harness.

### 6.4 Model Adapters
Server plugins: `capabilities() / estimateCost() / compile() / dispatch-poll-cancel / qualityHints()`; normalized failure taxonomy; lifecycle `active → deprecated (90-day) → sunset` with **one-click project re-target** through the IR; quarterly portability drills; no capability may depend on one provider.

### 6.5 Continuity Engine
Prevent (canonical descriptors, auto-attached reference sheets, compile-time wardrobe resolution, location schemes) → Detect (identity embedding score, VLM wardrobe check, palette drift, blocking-map geometry/eyeline/axis checks) → Repair (per-dimension report, targeted re-roll with promoted constraints, frame chaining, retroactive outfit swap 9.4). Scores are guidance, never guarantees.

### 6.6 Video Analysis Pipeline
Ingest/transcode → shot cuts → per-shot estimators (size, angle, optical-flow movement, lens feel, lighting, palette, composition, audio) → outputs in Shot-Designer enums (analyzed shots open in the Designer) → prompt synthesis via the compiler → Recreate/Extend/Learn modes.

### 6.7 Cost Engine
Live `estimateCost()` on every button; draft tier auto-downshifts res/duration; promotion reuses the exact PromptVersion; waste-ratio analytics; hard caps block, soft caps warn; auto-refund pipeline (24.2) driven by the failure taxonomy.

### 6.8 Reproducibility
Every Take stores model+version, seed (where exposed), full params, prompt hash, reference hashes. Three distinct actions: **Regenerate exact** / **Retake** (new seed) / **Revise** (new PromptVersion). UI states when a provider can't be deterministic.

### 6.9 Quality Evaluation Harness
~50-shot golden suite; prompt-snapshot regression tests per adapter; scheduled draft renders scored on continuity metrics + VLM prompt-adherence; trend dashboards gate adapter bumps and marketplace skill certification.

### 6.10 Security Threat Model
Prompt injection: all user assets/skills are untrusted; assistant tool-calls are typed and user-confirmed. Abuse: fingerprinting, rate limits, anomaly detection on credits. Scraping: signed expiring URLs, revocable shares, free-tier watermarks. Accounts: passkeys, TOTP, session UI. Supply chain: signed adapters, skill static analysis, SBOM.

### 6.11 Interoperability
In: Fountain/FDX/PDF/plain scripts; MP4/MOV/WebM, PNG/JPG/WebP, WAV/MP3, SRT/VTT. Out: MP4 to 4K, FCPXML+OTIO+EDL (round-trip QA'd), PDF decks, PNG sequences, SRT/VTT, project JSON, CSV. Declared unsupported: ComfyUI import, AAF.

### 6.12 Localization
i18n framework from Phase 1 (English launch); Phase 2: ES, PT-BR, JA, KO, FR, DE; RTL Phase 3; craft microcopy translated via MT + human review; locale currency/date formats.

---

## 7. UX Specification (consolidated)

### 7.1 Dual-mode structure
Home offers **Quick Create** (apps grid, Magic Prompt bar, preset carousels) and **Studio** (five views: Script / Board / Design / Canvas / Edit). "Open in Studio" on every Quick result; "Save as App" on every Studio pipeline. Zero-empty-state rule; three-tap ceiling in Quick; cost on every generate button; plain-language ↔ film-language mapping between modes.

### 7.2 Director Layer (Design view)
Three-pane stage: shot navigator (status pips, cost badges) · center stage with `Frame | Floor Plan | Light` tabs · Prompt Panel (live compiled prompt, active skills, lint, Draft▸Final generate).
- **Frame:** overlays (thirds, golden, symmetry, leading lines, safe areas); draggable entity chips snapping to power points; size ladder with emotion microcopy; lens slider with live FOV/compression; angle dial; movement chips (≤3) each requiring an intent tag; preset shelf first (10.2), granular beneath.
- **Floor Plan:** top-down blocking; entities with facing arrows; camera wedge with FOV; axis-of-action with 180° warning + one-tap mirror fix; eyeline arrows; scene shot-strip with coverage-gap ghosts; compiles live to the location-scheme block.
- **Light:** drag key/fill/rim/practical nodes with color-temp rings; motivated-source linking; mood presets; fast relight preview on the previz still; contrast-ratio meter with genre hints.
- **States:** gray previz mannequins pre-generation (Designer fully usable before any render); dimmed stage with cost/ETA ring while generating; failure cards with taxonomy + suggested fix. All interactions ≤100 ms.

### 7.3 Key flows (validated end-to-end)
1. **Idea→film (golden path):** Magic Prompt or co-writer → breakdown → character+outfit → boards → design 3 shots → batch drafts (cost shown) → critique-driven retakes → promote → auto-assemble → captions → export. ≤90 min, ≤20% waste.
2. **Reference recreation:** upload clip → analysis → swap in own Entity → recreate → side-by-side.
3. **Agency campaign:** brand kit + locked spokesperson (consented) → variants branched → approval gates → 3 formats → client link → notes → publish scheduled.
4. **Continuity save:** audit flags outfit mismatch → retroactive outfit swap (9.4) or constrained re-roll → clip swaps in place.
5. **Learner:** analyze lesson clip → recreate → graded match → UI depth expands.

## 8. Non-Functional Requirements
Canvas <100 ms; project load <3 s @500 assets; responsive web desktop-first + companion mobile; autosave/version history/queue survive disconnects; budget caps; SOC 2 path; provenance watermarking; consent workflows; WCAG 2.2 AA; keyboard-first canvas; adapter-plugin extensibility; 99.9% availability; RPO ≤1 h / RTO ≤4 h.

## 9. MVP Acceptance Criteria (unchanged from v1.1 Part D, renumber-mapped)
Breakdown ≥95% character / ≥90% wardrobe-prop-location extraction; identity median ≥85 with <70 auto-flagged; wardrobe mismatch warning ≤30 s post-take; snap ≤12 px with prompt update ≤200 ms; 180° warning blocks ungated generation; model switch re-renders grammar with zero manual edits; critique yields ≥1 concrete diff per failed dimension; cost estimate within ±10% of billed; in-place retake preserves trims/sync; 60 s video analyzed ≤3 min with designer-openable shots. Quick Mode additions: cold-start app <60 s; Magic-Prompt draft film <10 min on signup credits; Quick→Studio zero data loss; SUS ≥80 pre-GA.

## 10. Technical Architecture (condensed)
React/TS client; WebGL/WebGPU canvas surfaces; CRDT realtime; GraphQL + REST/webhooks + WS events; Postgres event-sourced project graph (snapshots/branching); stateless compiler + skill engine; Temporal-class generation orchestrator with ledger-first accounting and reference-reuse batching; object storage + CDN + ffmpeg transcode/proxy pipeline; GPU analysis pool (autoscale-to-zero); provenance signing; consent registry; policy filters pre-dispatch. **Build:** graph, compiler+skills, continuity, Director Layer, analysis orchestration, cost engine. **Buy:** all generation models (adapters), transcription, music/SFX libraries, billing. **Defer:** proprietary draft model until waste-ratio data proves the margin case. Model API spend is the dominant COGS: draft-default, batching, and per-adapter price monitoring are P0.

## 11. Roadmap (final consolidation)

**Phase 1 — months 0–8 · "Script → consistent, finished shots" (20 heads)**
Modules 1, 2, 3 (Frame view + thirds; Floor Plan basic), 4 (compiler, 2+2 adapters, refinement loop), 6 (core + Extend), 7 (core), 8 (Creative/Precision upscale, Relight, temporal stabilizer), 10 (apps gallery, motion presets, Magic Prompt), 11 (read-only assistant), 12 (assemble + export), 13 (conform, proxies), 14 (dialogue/VO core), 15 (captions), 17 (shot list, budget), 20 (first-run), 21 (snapshots, trash), 22 (queue), 24 (wallet, auto-refund), 25 (privacy core, consent, provenance), 26 (status, backups), 29 (instrumentation).
**Gate:** solo user ships a 60 s 8-shot short, same character/outfit throughout, one session, ≤20% waste; Quick Mode SUS ≥80.

**Phase 2 — months 8–15 · "The Director Layer" **
Full Floor Plan/Light + 180°/eyeline enforcement; canvas + pipeline templates; skill system + linting + script skills; analysis + video-to-prompt + continuity audit; Module 9 (Recast synthetic-only, talking avatar, motion transfer, outfit swap, product placement); full edit/color/audio/captions/resizing + NLE handoff; 5+ models with auto-recommendation; publishing (19); review links (18); style transfer + dual-reference (8.6); URL-to-ad + draw-to-video; assistant tool-use; mobile companion (27.1–27.3); localization wave 1.

**Phase 3 — months 15–22 · "Studio scale"**
Realtime collaboration, approvals, brand kits; marketplace + API/SDK + MCP; dubbing; enterprise (SSO/SCIM/audit/residency/private endpoints); VFX-on-real-footage GA; long-form 30 min; HDR; off-peak pricing; gallery.

## 12. Monetization & GTM (condensed)
Tiers: Free (watermarked drafts, tutorial credits) / Creator $19–29 / Pro $59–99 (all models, 4K, 3 seats, analysis) / Studio (custom). Credits: model-tiered, heavy draft discount, **rollover + auto-refund marketed against competitor credit-trust complaints**. GTM: beachhead solo AI filmmakers + students; product-led with end-card viral loop; weekly shot-deconstruction content made with our own analysis engine; 25-creator flagship program seeding gallery/templates; film-school Learn-mode licensing; closed beta → open beta (Phase-1 scope) → GA headlined by the Director Layer.

## 13. Success Metrics
Activation: 40% of new users generate a consistent 3+ shot sequence in session 1 · Craft adoption: 60% of shots via Director Layer by Phase 2 · Waste ratio <25% · Completion (exported/started) 30% · 3-month retention >45%, NRR >110% · Quick Mode SUS ≥80.

## 14. Top Risks
Model dependency → adapter layer, ≥3 interchangeable models per capability, re-target drills · Consistency ceiling → three-layer engine + honest scoring · Scope sprawl across 29 modules → phase gates; modules 18, 19, 27, 28 barred from Phase 1 · Credit economics → draft-default + transparency + refunds · Regulatory (EU AI Act, likeness) → Module 25 from day one; face swap removed entirely · Assistant misuse/injection → typed confirmed actions, cost-gated spending · Incumbent bundling → win on craft depth, model neutrality, continuity, trust.

## 15. Decision Log
| Date | Decision |
|---|---|
| Jul 2026 | Face swap, video face swap, expression transfer **removed**; Recast restricted to synthetic Entities; no real-face mapping in product. |
| Jul 2026 | Quick Create Layer promoted to Phase-1 peer of the Director Layer. |
| Jul 2026 | Phase 1 restated at 8 months / 20 heads. |
| Jul 2026 | Proprietary draft model deferred pending waste-ratio data. |
| Open | Full NLE depth vs handoff-first beyond Phase 2 (currently handoff-first). |
