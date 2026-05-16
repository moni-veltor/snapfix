# Stack overview

A high-level map of what runs where.

## Runtime topology

```
┌───────────────────────────────────────────────────────────┐
│  Browser                                                   │
│  - Next.js 16 client components (React 19)                 │
│  - Tailwind v4 styles                                      │
│  - Sonner toasts, cmdk command palette, lucide icons       │
└───────────────────────┬───────────────────────────────────┘
                        │  fetch / server-action invoke
┌───────────────────────▼───────────────────────────────────┐
│  Vercel (lhr1)                                             │
│  - Next.js 16 App Router (RSC + server actions)            │
│  - Edge / Node routes as needed                            │
│  - Vercel Blob (artefact storage)                          │
└───────────────────────┬───────────────────────────────────┘
                        │  driver-adapter (HTTP)
┌───────────────────────▼───────────────────────────────────┐
│  Neon serverless Postgres                                  │
│  - Single primary, region-pinned to lhr1                   │
│  - Prisma 7 client + @prisma/adapter-neon                  │
└───────────────────────────────────────────────────────────┘
```

The `vercel.json` pins the project to the `lhr1` region — keep Neon in the same region (`eu-west-2` equivalent) to avoid cross-region latency on every query.

## Why these choices

| Choice | Why |
|---|---|
| **Next.js 16 App Router** | Server components let us keep prisma + auth on the server with zero client JS for most read paths. Server actions remove the need for a parallel REST layer. |
| **Prisma 7 with Neon driver adapter** | Neon's HTTP driver works under Vercel's serverless limits where a normal pg pool would not. Prisma 7's `prisma-client` generator gives us a generated client that ships with the build. |
| **NextAuth v4 credentials + JWT** | One-step sign-in flow; JWT session avoids a DB hit per request. Org-scope and role are baked into the JWT. |
| **Tailwind v4 + CSS variables** | Per-org accent theming via inline `style` overrides on the `Organization` layout boundary; dark mode via `@custom-variant dark`. |
| **Sonner + Modal primitive** | Consistent toast/dialog UX without pulling in Radix or shadcn full kits. |

## Source-tree map

```
src/
  app/
    (app)/                # Authed app shell — sidebar, hero, all org-scoped pages
      dashboard/
      scenarios/          # List + library + detail + new
      ibs/                # Register + library + new + detail
      vendors/            # Register + library
      tech-recovery/      # System register + library
      exercises/          # Plan, run, debrief
      org/                # Members, roles, invitations
      settings/           # Profile, branding, presets, theme accent
      action-items/
      analytics/
      audit/
      ...
    actions/              # Server actions — auth, scenarios, ibs, vendors, tech, etc.
    api/auth/[...nextauth] # NextAuth route handler
    sign-in/, sign-up/    # Public auth pages

  components/
    ui/                   # Primitives — Modal, Button, PageHero, SubmitButton, ToastForm, …
    ibs/, vendors/, tech/ # Domain-scoped grids, forms, wizards
    scenarios/            # Scenario grid + library + playback
    live/                 # InjectArrivalNotifier, LivePoller
    fun/                  # Hoot mascot
    ...

  lib/
    prisma.ts             # Server-only Prisma singleton
    auth.ts               # NextAuth config + requireOrgUser / requireOrgRole
    audit.ts              # Audit-write helper
    library/              # Cross-sector scenario library + sectors taxonomy
    ibs-library.ts        # Curated IBS catalogue
    vendor-library.ts     # Curated vendor catalogue
    tech-system-library.ts # Curated tech-system catalogue
    toast-action.ts       # withToast() wrapper for server actions
    notifications.ts
    dora.ts, dday.ts, achievements.ts, ...
  generated/prisma/       # gitignored; built by `prisma generate`

prisma/
  schema.prisma           # 50 models
  seed.ts                 # Simulation 2 seed
  prisma.config.ts        # Prisma 7 datasource config
```

## What lives at the boundary

Two files are the practical "did I read the docs" check whenever you change behaviour:

* **`src/lib/auth.ts`** — every server action begins with `requireOrgUser()` or `requireOrgRole("OWNER", "ADMIN")`. If your action doesn't, you've forgotten to gate it.
* **`src/lib/audit.ts`** — the union type `AuditAction` is the registry of every audited event. Adding a new mutating action means adding a new audit action type.
