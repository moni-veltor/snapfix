# Deploying to Vercel

SnapFix deploys to Vercel pinned to the `lhr1` region. The repo is `moni-veltor/snapfix` on GitHub.

## Setup (one-time)

Already done — recorded here for reference.

1. Vercel account: `monica.velasquez.torres@outlook.com`
2. Connect the GitHub repo to a Vercel project
3. Region: pinned to `lhr1` (London) via `vercel.json`
4. Build command: `npm run build` (runs `prisma generate && next build`)
5. Install command: `npm install` (runs `prisma generate` via `postinstall`)

## Environment variables

Set in the Vercel dashboard under Settings → Environment Variables. Scope `Production`, `Preview`, and `Development` independently.

| Variable | What | Sensitivity |
|---|---|---|
| `DATABASE_URL` | Neon **pooled** connection string | secret |
| `DIRECT_URL` | Neon **unpooled** connection string | secret |
| `NEXTAUTH_SECRET` | JWT signing secret (`openssl rand -base64 32`) | secret |
| `NEXTAUTH_URL` | Public URL of the deployment — `https://snapfix.veltor.dev` etc. | not secret |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob write token | secret |
| `RESEND_API_KEY` | Email-sending key | secret |

Production and preview share Neon db today. If you need a separate Neon project for previews, provision one and override `DATABASE_URL` + `DIRECT_URL` in the Preview env scope only.

## Branch flow

`main` → production. Every push to main triggers a Vercel deploy. Pull requests get preview deployments automatically.

Do **not** force-push to `main`. If you need to roll back, push a revert commit.

## Schema changes

Schema changes require running `npm run db:push` against the production Neon database **before** the deploy reaches it. Otherwise the app will start using Prisma client code that doesn't match the live schema.

Recommended sequence for a schema change:

1. Update `prisma/schema.prisma` locally
2. Run `prisma generate` (or just `npm run build` — it does it)
3. Push to a branch, open a PR — preview deploy will fail against current prod schema (expected)
4. Locally, with prod credentials in `.env`, run `prisma db push`
5. Merge to `main` — production deploy now matches schema

The repo has no `prisma/migrations/` directory and `prisma migrate dev` is not used. See [Database](database.md) for the rationale.

## Region considerations

* App in `lhr1`, Neon in matching `eu-west-2` — every Prisma call is a same-region HTTP roundtrip. ~5–20ms typical.
* If you put Neon in `us-east` or similar, every page render adds 100–200ms minimum. Don't.

## Common deploy failures

* **Prisma client out of sync.** The schema has changed but `prisma db push` wasn't run. The build succeeds (it just regenerates the client) but runtime queries fail at the boundary. Run db push.
* **`NEXTAUTH_URL` mismatch.** If the preview URL doesn't match `NEXTAUTH_URL`, sign-in callbacks return to the wrong host. Use the dynamic-url plugin or set NEXTAUTH_URL per env scope.
* **Build OOM on the postinstall.** Prisma generate is memory-heavy. Bump the Vercel build instance to a larger size if the build fails with OOM.

## Vercel dashboard tips

* Use the "Logs" tab on a deployment to see runtime errors. The build logs are separate.
* Triggering a redeploy without pushing code: Vercel dashboard → Deployments → ... → Redeploy.
* Roll back: the "Promote to Production" button on an older deployment.
