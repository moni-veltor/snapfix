# SnapFix engineering docs

Internal documentation for SnapFix — the CMORG-aligned operational-resilience exercise platform run by Veltor.

These docs are written for engineers, designers, and operators on the team. For customer-facing product help, see the in-product Help drawer (the `?` button in the app sidebar).

## What SnapFix is

A tabletop / functional exercise simulator for operational-resilience programmes. A facilitator authors a scenario (MSEL events, injects, IBSs with impact tolerances) and runs it live against a D-Day clock with participants who capture decisions, responses, and communications drafts. After the run, the platform produces a debrief and an After-Action Report.

It is **not** a Jira-style ticket tracker. The unit of work is an *exercise*, not a *task*.

## Where to start

* New to the codebase? Start at **Getting started → [Local setup](getting-started/local-setup.md)**.
* Want to understand the data model? Go to **Domain model → [Overview](domain-model/overview.md)**.
* Touching auth or permissions? Read **Architecture → [Auth & permissions](architecture/auth-and-permissions.md)** first.
* Adding a feature that takes form data? See **Conventions → [Forms, actions & toasts](conventions/forms-and-actions.md)** — there are project-specific primitives you should use.
* Touching the curated catalogues (scenarios, IBSs, vendors, tech systems)? See **Curated libraries → [Overview](libraries/overview.md)**.
* Designing or restyling? See **Design system → [Overview](design-system/overview.md)** — palette, tokens, primitives and patterns.

## House rules

* **This is not the Next.js you might know.** The repo runs Next.js 16 + React 19 + Turbopack. Conventions and APIs may differ from older training data. When in doubt, read `node_modules/next/dist/docs/` before writing new code. The repo's `AGENTS.md` makes this explicit.
* **Server actions over API routes.** New write paths go through `src/app/actions/*.ts`. Client components call them via `<form action={...}>` or the toast wrapper.
* **Semantic tokens, not raw colours.** Use `text-ink`, `text-muted`, `bg-surface-1`, `border-line` etc. — never `text-slate-700`. See [Semantic tokens](conventions/semantic-tokens.md).
* **No DB migration files.** Prisma 7 here uses `prisma db push` against Neon. There is no `prisma/migrations/` directory. See [Database](operations/database.md).
* **Audit anything that mutates org-scoped state.** Use the `audit()` helper. See [Audit trail](conventions/audit-trail.md).

## Stack at a glance

| Layer | Choice |
|---|---|
| Framework | Next.js 16 (App Router) + React 19 + Turbopack |
| Language | TypeScript |
| Styling | Tailwind v4 with `@theme inline` + CSS-variable tokens |
| Database | Neon serverless Postgres + Prisma 7 (driver adapter) |
| Auth | NextAuth v4 — credentials provider, JWT sessions |
| File storage | Vercel Blob (artefacts) |
| Email | Resend |
| Toasts | Sonner |
| Hosting | Vercel (region-pinned in `vercel.json`) |
