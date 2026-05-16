# Local setup

How to get the SnapFix dev loop running on your machine.

## Prerequisites

* Node 20+ (the repo targets the same version Vercel currently runs)
* A Neon account with at least one project
* A Vercel account (for Blob token + envs in production, not strictly required for local)

## 1. Provision a database

In the Neon dashboard, create a project and grab two connection strings:

* the **pooled** connection string → goes into `DATABASE_URL`
* the **direct (unpooled)** connection string → goes into `DIRECT_URL`

Prisma 7 here uses the Neon driver adapter; pooled is for the runtime, direct is for `prisma db push` and `prisma studio`.

## 2. Environment

Copy `.env.example` to `.env` and fill it in:

```bash
DATABASE_URL=postgres://...@...pooler.neon.tech/...?sslmode=require
DIRECT_URL=postgres://...@....neon.tech/...?sslmode=require
NEXTAUTH_SECRET=$(openssl rand -base64 32)
NEXTAUTH_URL=http://localhost:3000
BLOB_READ_WRITE_TOKEN=...   # only required if you'll test artefact uploads
RESEND_API_KEY=...          # only required if you'll test email
```

## 3. Install, push schema, seed

```bash
npm install        # also runs prisma generate via postinstall
npm run db:push    # pushes prisma/schema.prisma to your Neon database
npm run db:seed    # seeds Simulation 2 (Afin Bank cyber/3rd-party scenario)
```

Heads-up: there is **no `prisma/migrations/` directory** in this repo. Schema changes are pushed directly with `db:push`. See [Database](../operations/database.md) for why.

## 4. Run the dev server

```bash
npm run dev
```

The dev server uses Turbopack by default. App is at [http://localhost:3000](http://localhost:3000).

## 5. Sign in

After seeding, two accounts exist — see [Seeded accounts](seeded-accounts.md).

## Useful commands

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack). |
| `npm run build` | Production build. Runs `prisma generate` first. |
| `npm run lint` | ESLint with the Next.js + project config. |
| `npm run db:push` | Push schema to Neon — no migration files. |
| `npm run db:seed` | Run `prisma/seed.ts` against the current `DATABASE_URL`. |
| `npm run db:studio` | Open Prisma Studio (requires `DIRECT_URL`). |

## Common gotchas

* **"PrismaClient is unable to be run in the browser"** — you imported `prisma` from a server-only path into a client component. The Prisma client lives in `src/lib/prisma.ts` and must only be used from server components or server actions.
* **Auth redirect loops** — usually `NEXTAUTH_URL` doesn't match the host you're hitting. Match it exactly (no trailing slash).
* **Driver-adapter / pool errors** — check `DATABASE_URL` is the *pooled* string and `DIRECT_URL` is the *unpooled* one. Mixing them up causes intermittent connection failures.
