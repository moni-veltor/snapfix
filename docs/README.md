# SnapFix docs

Documentation for SnapFix — the operational-resilience exercise platform run by Veltor.

These docs are read by two audiences:

* **Operators** — heads of operational resilience, BCP managers, IMT chairs, second-line risk owners. The [User guide](user-guide/getting-started.md) is for you. It explains how to use SnapFix end to end without needing to know how it's built.
* **Engineers / designers** — anyone building on the codebase. Start at [Architecture → Stack overview](architecture/overview.md) and [Domain model → Overview](domain-model/overview.md).

## What SnapFix is

A platform for designing, running and reviewing operational-resilience exercises — and the supporting registers (IBSs, vendors, runbooks, tech systems) that those exercises stress-test.

A facilitator authors a scenario (MSEL events, injects, IBSs with impact tolerances) and runs it live against a D-Day clock with participants who capture decisions, sitreps, comms drafts, and runbook executions. The platform produces a debrief, an After-Action Report, and a regulator-ready audit trail.

It is **not** a Jira-style ticket tracker. The unit of work is an *exercise*, not a *task*.

## Where to start

| If you're… | Start here |
|---|---|
| A new admin onboarding your org | [Getting started as an admin](user-guide/getting-started.md) |
| An admin setting up your vendor register | [The vendor register](user-guide/vendors.md) |
| A facilitator about to run an exercise | [Designing exercises](user-guide/exercises-design.md) → [During the run](user-guide/exercises-live.md) |
| A participant in an upcoming exercise | [During the run — live workspace](user-guide/exercises-live.md) |
| A compliance owner pulling evidence | [Audit log & compliance](user-guide/audit-and-compliance.md) |
| New to the codebase | [Local setup](getting-started/local-setup.md) → [Stack overview](architecture/overview.md) |
| Touching the data model | [Domain model overview](domain-model/overview.md) |
| Touching auth | [Auth & permissions](architecture/auth-and-permissions.md) |
| Adding a feature with forms | [Forms, actions & toasts](conventions/forms-and-actions.md) |
| Designing or restyling | [Design system overview](design-system/overview.md) |

## House rules (engineering)

* **This is not the Next.js you might know.** The repo runs Next.js 16 + React 19 + Turbopack. Conventions and APIs may differ from older training data. When in doubt, read `node_modules/next/dist/docs/` before writing new code. The repo's `AGENTS.md` makes this explicit.
* **Server actions over API routes.** New write paths go through `src/app/actions/*.ts`. Client components call them via `<form action={...}>`, the `ToastForm` wrapper, or `useTransition`.
* **Semantic tokens, not raw colours.** Use `text-ink`, `text-muted`, `bg-surface-1`, `border-line` etc. — never `text-slate-700`. Every coloured pill must ship a `dark:` companion. See [Semantic tokens](conventions/semantic-tokens.md).
* **No DB migration files.** Prisma 7 here uses `prisma db push` against Neon. There is no `prisma/migrations/` directory. Schema changes must be additive + nullable for safe push. See [Database](operations/database.md).
* **Audit anything that mutates org-scoped state.** Use the `audit()` helper; admins see the trail at `/audit`. See [Audit trail](conventions/audit-trail.md).
* **Status badges use icons + text.** Use the shared `StatusBadge` component so colourblind users can parse status without colour.

## Stack at a glance

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + Turbopack |
| Language | TypeScript |
| Styling | Tailwind v4 with `@theme inline` + CSS-variable tokens |
| Database | Neon serverless Postgres + Prisma 7 (driver adapter) |
| Auth | NextAuth v4 — credentials provider, JWT sessions |
| File storage | Vercel Blob (artefacts, register XLSX exports) |
| Email | Resend |
| Toasts | Sonner |
| Hosting | Vercel (region-pinned in `vercel.json`) |
