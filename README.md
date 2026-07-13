# Cinematic Studio

All-in-one AI filmmaking workspace — *one click to start, full craft to finish.*
This repository is the implementation of the [Master PRD v2.0](./docs/PRD.md).
This is the **Phase 1 foundation**: project scaffolding, auth, database, billing,
storage, and the Studio shell.

## Tech stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 15** (App Router) + React 19 + TypeScript | Server Components + Server Actions |
| Styling | **Tailwind CSS v4** | Dark, cinema-toned theme |
| Database | **Neon** (serverless Postgres) + **Drizzle ORM** | Typed project-graph schema (PRD §6.1) |
| Auth | **Clerk** | Middleware-protected app; JIT user provisioning |
| Billing | **Stripe** | Ledger-first credit wallet (PRD §6.7, §24) |
| Storage | **Cloudinary** or self-hosted **Synology** | One `StorageProvider` interface, swap via env |
| Generation | Model **adapter** interface (PRD §6.4) | Higgsfield adapter skeleton wired |

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in Neon, Clerk, Stripe, storage keys
npm run db:migrate           # apply the schema to your Neon database
npm run dev                  # http://localhost:3000
```

### Required services

1. **Neon** — create a project, copy the pooled connection string into `DATABASE_URL`.
2. **Clerk** — create an application, copy the publishable/secret keys. Add a
   webhook to `/api/webhooks/clerk` (events: `user.updated`, `user.deleted`).
3. **Stripe** — copy the secret key; add a webhook to `/api/webhooks/stripe`
   (event: `checkout.session.completed`) and put the signing secret in
   `STRIPE_WEBHOOK_SECRET`.
4. **Storage** — set `STORAGE_PROVIDER` to `cloudinary` or `synology` and fill
   the matching block in `.env.local`.

## Project structure

```
src/
  app/
    page.tsx                     Landing page
    sign-in|sign-up/             Clerk auth pages
    dashboard/                   Authenticated app shell (credit balance, projects)
      projects/[projectId]/      Studio: Script · Board · Design · Canvas · Edit views
    api/webhooks/{clerk,stripe}/ Webhook handlers
  db/
    schema.ts                    Project-graph tables (PRD §6.1)
    index.ts                     Neon + Drizzle client
  lib/
    billing/                     Stripe client + ledger-first credit engine
    storage/                     Cloudinary + Synology providers behind one interface
    models/                      Model adapter contract + registry (PRD §6.4)
  server/
    auth.ts                      Clerk → local user resolution + signup grant
    projects.ts                  Project graph data access
    actions.ts                   Server actions
```

## What's implemented

- ✅ Auth (Clerk) with protected routes and JIT user provisioning + signup credits
- ✅ Neon/Drizzle schema for the full project graph (projects, scenes, entities,
  outfits, shots, prompt versions, immutable takes, media assets, credit ledger)
- ✅ Ledger-first credit wallet with grant / topup / spend / auto-refund and
  idempotent Stripe top-ups (atomic guarded updates — no interactive txns)
- ✅ Swappable storage (Cloudinary / Synology) with signed-URL support
- ✅ Model adapter interface + registry (Higgsfield skeleton + mock renderer)
- ✅ Studio shell: projects dashboard + five-view project navigation
- ✅ **Prompt compiler** (§6.2): ShotDesign + entities + style header → IR →
  per-model grammar (generic / Veo / Seedance / Kling) with linting
- ✅ **Director Layer Frame view** (§7.2): interactive shot designer with a live
  compiled-prompt panel and live cost badges
- ✅ **AI co-writer & auto-breakdown** (Module 1) via Claude structured outputs
- ✅ **Generation lifecycle** (§6.1/§6.7/§24.2): design → compile → spend credits
  → immutable Take → dispatch/poll adapter → render, with auto-refund on failure
  (driven by a mock adapter until a provider key is set)
- ✅ **Edit & handoff** (§12.5/§17.1): auto-assembled sequence from rendered
  takes, budget/runtime summary, shot-list table, and downloadable exports —
  FCPXML, OTIO, EDL (CMX3600), shot-list CSV, and full project JSON
- ✅ **Billing** (§24.1): credit-pack purchase via Stripe Checkout (inline
  pricing, JIT customer), success/cancel handling, and an in-app credit ledger;
  the webhook credits the wallet idempotently on payment
- ✅ **Continuity engine** (§6.5/§2.2): post-render identity consistency score on
  every take (pluggable scorer — heuristic default, swap in embedding/VLM), plus
  a project audit that flags shots below threshold (<70) with one-click re-roll
- ✅ **Director's Assistant** (§11.1): read-only project-aware chat grounded in a
  live digest of the whole graph (scenes, shots, budget, continuity);
  injection-hardened (§11.6) — project content is treated as data, not commands

## Roadmap (per PRD §11)

**Phase 1** continues with: the prompt compiler (§6.2), Director Layer Frame
view (§7.2), the generation orchestrator wiring `dispatch/poll` on adapters,
the continuity engine (§6.5), Quick Create apps (§10), and the edit/export path
(§12). Phases 2–3 add the full Director Layer, analysis, Module 9, publishing,
collaboration, and the marketplace.
