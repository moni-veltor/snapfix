# Database (Prisma + Neon)

Prisma 7 with Neon serverless Postgres via the driver adapter.

## Why this setup

Vercel's serverless model and a traditional pg connection pool fight each other — every cold-start invocation tries to open its own connection. Neon's HTTP-based driver-adapter sidesteps that: every Prisma query goes over HTTP to Neon's pooler, which handles the connection pooling on the database side.

## Connection strings

Two strings, two purposes:

| Env var | Purpose |
|---|---|
| `DATABASE_URL` | **Pooled** Neon URL. Used by the runtime (the deployed app). Connections multiplex through Neon's pooler. |
| `DIRECT_URL` | **Unpooled** Neon URL. Used by `prisma db push`, `prisma migrate`, `prisma studio` — anything that needs full DDL capabilities. |

Get both from the Neon dashboard. Mixing them up causes intermittent failures.

## No migrations directory

This repo deliberately has **no `prisma/migrations/`** directory. Schema changes are pushed directly:

```bash
npm run db:push
```

This is `prisma db push` under the hood — it diffs the schema file against the live database and applies the diff.

### Why

* Small team, fast iteration. Migration files add ceremony.
* Neon makes branch-based DB testing trivial — production data isn't at risk during dev iteration.
* Prisma's generated migration files don't always round-trip cleanly across Postgres versions.

### When this stops working

Once we have:

* More than one shipping engineer
* A regulatory commitment to schema-change audit trails
* Customer-tenant data we cannot afford to lose during a migration

…we'll switch to `prisma migrate dev` + `prisma migrate deploy`, generate the SQL backfill files from the current schema, and check them in.

For now: `db:push` and a Neon snapshot before any risky change.

## Common operations

```bash
# Pull schema from db (rarely needed; the schema is the source of truth)
prisma db pull

# Push schema to db
npm run db:push

# Open Prisma Studio against direct-url
npm run db:studio

# Seed
npm run db:seed
```

## Prisma client location

The generated client is at `@/generated/prisma`. This path is **gitignored** — the client is built at install time via the `postinstall` script.

If your editor's TypeScript server is reporting "module not found" on `@/generated/prisma`, run `npm install` (or `prisma generate`) to regenerate it.

## The Prisma singleton

`src/lib/prisma.ts` exports a singleton `prisma` instance configured with the Neon driver adapter:

```ts
import { PrismaClient } from "@/generated/prisma";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
export const prisma = new PrismaClient({ adapter });
```

It's `server-only` — importing it from a client component is a build error.

## Schema growth and naming

The schema is ~50 models. Conventions:

* PascalCase model names: `OrganizationIBS`, not `organization_ibs`
* `id String @id @default(cuid())` — cuid not uuid for size
* `createdAt DateTime @default(now())`, `updatedAt DateTime @updatedAt` on most rows
* `orgId String` on every org-scoped row + `@@index([orgId])` (Prisma auto-creates it for the FK, but indexing the column directly helps composite queries)
* `@@unique([orgId, code])` for human-readable codes that must be unique-per-org

## Snapshot before risky changes

Neon's branching makes this cheap:

1. Neon dashboard → Branches → Create branch from main
2. Test the migration on the branch
3. If it goes wrong, drop the branch
4. If it goes right, run `db:push` against the main branch

## See also

* [Deploying to Vercel](deploying.md) — schema changes need to land before the app deploys
