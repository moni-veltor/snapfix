# Monitoring

What's instrumented today and what's still on the to-do list.

## What's instrumented

| Surface | Mechanism |
|---|---|
| **App errors** | Vercel's built-in logs (Deployments → Logs tab) |
| **Build failures** | Vercel build logs + GitHub PR check status |
| **DB performance** | Neon's metrics dashboard (query latency, pooler utilisation) |
| **Auth events** | Audited via `audit()` for membership and invitation changes |
| **Mutating actions** | Audited via `audit()` for every register write |

## What's NOT instrumented (yet)

* No external APM (Datadog, Sentry, etc.) — by design for v1
* No frontend error tracking
* No structured logging — we use `console.error()` for caught failures
* No alerting on Vercel-side errors or Neon connection saturation

## The audit log as monitoring

For org-scoped activity, `/audit` is the practical incident-response surface. Every IBS / Vendor / TechSystem / Scenario / Exercise mutation lands there with actor, target and summary.

Use it to answer questions like:

* "When was vendor X added?"
* "Who approved IBS_05?"
* "Which exercises has org Y run this month?"

## Watching for problems

In production:

1. **Vercel dashboard → Deployments → Logs** for runtime errors
2. **Neon dashboard** for DB latency / connection issues
3. **Audit log** for unexpected admin activity

In development:

1. **Browser console** for client-side errors
2. **`npm run dev` terminal** for server-action errors (the redirect signals are noisy — ignore `NEXT_REDIRECT` lines)

## On-call

There is no formal on-call rotation yet. The product is pre-customer (internal Veltor team + early pilots). When customer pilots start:

* Set up Vercel error alerts to a Slack channel
* Add Sentry to the frontend
* Add structured logging (probably Pino) to the server actions
* Document a runbook here — page on-call, check Vercel logs, check Neon, check audit log

## Performance

Typical page-load times (warm cache):

* Dashboard: ~200ms
* IBS list / library: ~150–300ms
* Scenarios library: ~100ms (all in-memory TS, no DB call)
* Exercise live view: poll every 10s, paused when hidden

If you see a page sub-second slow, look at the Prisma query count first — N+1 patterns are the usual culprit. Most queries use `include` or `select` carefully but it's easy to regress.

## Future state

* External APM (Sentry frontend, Datadog backend)
* Structured logs to a log aggregator
* Real-user-monitoring (RUM) on key flows (sign-in, exercise start, IBS approval)
* Customer-facing status page
