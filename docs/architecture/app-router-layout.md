# App Router layout

How routes, layouts and grouping work in this repo.

## Route groups

Two top-level route groups under `src/app/`:

* **`(app)/`** — the authed application shell. Sidebar, hero, every org-scoped page lives here. The group's `layout.tsx` calls `auth()`, fetches the org, builds the sidebar, and provides the `ZoneFrame` chrome around `{children}`.
* **`sign-in/`, `sign-up/`** — public auth pages. No shell.
* **`api/auth/[...nextauth]/`** — NextAuth route handler. Standard v4 setup.

Anything inside `(app)/` can assume `await auth()` returns a session with an `orgId`. If you don't see that assumption holding, the page is probably outside the group.

## The `(app)` layout

`src/app/(app)/layout.tsx` is responsible for:

1. `await auth()` — fetch the NextAuth session
2. Load the organisation (`name`, `logoBlobUrl`, `accentHex`) and derive `canManageOrg`
3. Load the notifications feed (`loadNotifications`)
4. Apply the per-org accent theme by injecting CSS variables onto the root `<div>`'s inline `style`
5. Render `<AppSidebar />`, `<ZoneFrame>`, `<main>`, footer, and `<CommandPalette />`

This is the only place where the organisation context is hydrated. Pages inside the group should re-fetch their org data when needed; they should not assume the layout has injected it.

## Pages and server actions

Pages are React Server Components by default — they `await` data in the function body, render JSX. They never call API routes.

Mutations go through **server actions** under `src/app/actions/*.ts`. A page that needs to expose a mutation imports the action and binds it via `<form action={mutationAction}>`. From client components, the same action can be wrapped in `withToast()` for success/error toasts.

There is no parallel REST API. The only `api/` route is NextAuth's required handler.

## Suspense and loading

Most pages render synchronously with awaited Prisma calls. Loading states use the `<Skeleton>` primitive at the section level, not full-page spinners. Streaming with `loading.tsx` is used sparingly — preferred when the slow part is a single heavy section, not the whole page.

## Conventions for new pages

* Server component by default. Add `"use client"` only when you need state, refs or interactivity.
* If you need a piece of interactive UI inside an otherwise server-rendered page, extract just that piece into its own client component and import it.
* Keep `requireOrgUser()` / `requireOrgRole()` at the top of the page body. It guards both rendering and any subsequent Prisma calls.
* Default layout: a `PageHero` strip at the top + sections below. The hero exposes an `actions` slot for top-right CTAs (consistent across IBS, vendors, tech-recovery, scenarios).

## URL shape

* `/dashboard` — authed home
* `/scenarios`, `/scenarios/library`, `/scenarios/new`, `/scenarios/[id]`
* `/ibs`, `/ibs/library`, `/ibs/new`, `/ibs/[id]`
* `/vendors`, `/vendors/library`
* `/tech-recovery`, `/tech-recovery/library`
* `/exercises`, `/exercises/[id]`, `/exercises/[id]/run`, `/exercises/[id]/debrief`
* `/org`, `/org/roles`, `/settings`, `/settings/presets`
* `/templates` — legacy CMORG template library (DB-seeded, distinct from the TS-backed scenario library)
* `/audit` — admin audit log viewer

`/templates` and `/scenarios/library` deliberately co-exist. The first is DB-backed (fewer, deeper-fledged scenarios with full events + injects ready to clone). The second is TS-backed (broader sector coverage, lighter shells). See [Scenario library](../libraries/scenarios.md).
