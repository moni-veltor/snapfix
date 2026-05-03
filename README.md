# Operational Resilience Exercise Simulator

A CMORG-aligned, scenario-driven exercise platform. A facilitator authors an
event-based scenario (Master Scenario Events List + injects + Important Business
Services with impact tolerances), then runs it live against a D-Day clock with
multiple participants who capture decisions, responses, and communication
drafts. After the run, debrief answers and an After-Action Report are produced.

This is **not** a Jira-style ticketing tool. It is a tabletop / functional
exercise simulator for operational-resilience programmes.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- Prisma 7 + Neon serverless Postgres (driver adapter)
- NextAuth v4 (credentials, JWT sessions, role-based: `FACILITATOR` / `PARTICIPANT` / `ADMIN`)
- Vercel Blob (artefact uploads)
- Vercel-ready (region-pinned in `vercel.json`)

## Getting started

1. Provision a Neon project. From the Neon dashboard, copy:
   - the **pooled** connection string → `DATABASE_URL`
   - the **direct (unpooled)** connection string → `DIRECT_URL`
2. Copy `.env.example` to `.env` and fill in:
   ```
   DATABASE_URL=...
   DIRECT_URL=...
   NEXTAUTH_SECRET=$(openssl rand -base64 32)
   NEXTAUTH_URL=http://localhost:3000
   BLOB_READ_WRITE_TOKEN=...   # only required for artefact uploads
   ```
3. Install, push the schema, and seed:
   ```bash
   npm install
   npm run db:push
   npm run db:seed
   ```
4. Start the dev server:
   ```bash
   npm run dev
   ```
5. Sign in (seeded users):
   - Facilitator: `facilitator@example.com` / `password123`
   - Participant: `participant@example.com` / `password123`

## Concepts

- **Scenario** — title, background, agenda, D-Day date, duration. Owns the
  Important Business Services, MSEL events, injects, and question banks.
- **Important Business Service (IBS)** — a service whose disruption could harm
  customers / firm safety. Each has an *impact tolerance* (max minutes of
  disruption) and a criticality.
- **Master Scenario Events List (MSEL)** — the planned timeline. Each event has
  a D-Day time (HH:MM), description, expected actions, objectives, and may be
  scheduled (auto-released when D-Day reaches its time) or facilitator-triggered.
- **Inject** — a supplementary stimulus released within an event window: an
  alert, an email, a system message, a social-media noise burst.
- **Exercise Run** — a live execution of a scenario. The facilitator starts the
  run, anchoring the D-Day clock to wall-clock time (with optional speed
  multiplier — useful for compressing a 9-hour scenario into a 90-minute
  exercise). Participants see released events/injects in real time.
- **Incident log / Responses / Comms drafts** — append-only artefacts produced
  by participants during the run.
- **Debrief / AAR** — post-exercise question answers and the facilitator's
  After-Action Report.

## Project layout

```
src/
  app/                       # App Router
    actions/                 # Server actions (auth, scenarios, runs)
    api/auth/[...nextauth]/  # NextAuth handler
    scenarios/               # Scenario library + design pages
    runs/                    # Run mode (facilitator + participant + debrief)
    sign-in/, sign-up/       # Credential auth
  components/                # Shared UI (DDayClockTicker, IncidentLogPanel, …)
  lib/                       # prisma client, auth helpers, dday math, run queries
  generated/prisma/          # Prisma 7 generated client (gitignored)
prisma/
  schema.prisma              # Data model
  seed.ts                    # Simulation 2 seed (Afin Bank cyber/3rd-party scenario)
prisma.config.ts             # Prisma 7 config (datasource for migrations)
vercel.json                  # Region pin (lhr1 — match your Neon region)
```

## Deferred for v2

- CMORG PDF library importer (today the CMORG library is referenced manually)
- WebSocket-based real-time multi-participant sync (today: 5s polling)
- AAR PDF/DOCX export
- File artefact uploads via Vercel Blob (schema and storage wired; UI deferred)
- Fine-grained role / per-team participant permissions
