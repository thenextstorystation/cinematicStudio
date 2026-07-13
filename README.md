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
  idempotent Stripe top-ups
- ✅ Swappable storage (Cloudinary / Synology) with signed-URL support
- ✅ Model adapter interface + registry (Higgsfield adapter skeleton)
- ✅ Studio shell: projects dashboard + five-view project navigation with a live
  Script view reading real graph data

## Roadmap (per PRD §11)

**Phase 1** continues with: the prompt compiler (§6.2), Director Layer Frame
view (§7.2), the generation orchestrator wiring `dispatch/poll` on adapters,
the continuity engine (§6.5), Quick Create apps (§10), and the edit/export path
(§12). Phases 2–3 add the full Director Layer, analysis, Module 9, publishing,
collaboration, and the marketplace.
