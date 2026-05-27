# Site-wide access gate

A single shared passcode that sits in front of the entire app. Everyone — visitors, signed-in users, the marketing site, the resources hub, the in-app routes — has to enter it once before reaching anything else. After that, the existing email-password sign-in (NextAuth) takes over for per-user access control.

Two layers, distinct purposes:

| Layer | What it is | Lives in | When you'd use it |
|---|---|---|---|
| **Access gate** (this page) | A shared code for the whole site | `src/middleware.ts` + `src/app/access/` | While SnapFix is in private beta with named design partners |
| **NextAuth sign-in** | Per-user email-password authentication | `src/lib/auth.ts` + `src/app/(marketing)/sign-in/` | Always — once past the gate, this is how a specific user identifies themselves |

## How it works

1. A user hits any URL on the site.
2. `src/middleware.ts` runs at the edge. If the `ACCESS_CODE` env var is set and the request doesn't carry a valid `snapfix_access` cookie, the user is redirected to `/access?from=<original-path>`.
3. The `/access` page shows a single password field. The user enters the code.
4. The server action in `src/app/actions/access.ts` hashes the submission, compares it to `sha256(ACCESS_CODE)` in constant time, and on success sets an `HttpOnly` `Secure` `SameSite=Lax` cookie carrying that hash. The cookie is good for **30 days**.
5. The action redirects to `?from=` (or `/` if absent), and middleware lets the request through.
6. From here, the user lands on the marketing site or `/sign-in` and proceeds as normal.

### What gets through without a code

Three routes skip the gate even when `ACCESS_CODE` is set:

* `/access` (the gate page itself, obviously)
* `/api/auth/*` (NextAuth callbacks — needed for OAuth providers that round-trip)
* `/api/health` and friends (so external uptime checks can poll)
* `/robots.txt`, `/sitemap.xml` (so crawlers don't see a passcode page when they shouldn't see anything at all)

Static assets and Next.js internals are excluded by the middleware matcher.

### What the cookie carries

The cookie value is `sha256(ACCESS_CODE)` in hex — **never** the plaintext code. Middleware re-hashes the env var per request and compares. **Rotating `ACCESS_CODE` automatically invalidates every existing cookie** because the hash changes.

## Setup

### Vercel (production / preview)

1. Generate a strong code:
   ```bash
   openssl rand -hex 16
   # e.g. 7c2e3f8a91d4b56e0a8c1f9b2e3d4a5b
   ```
2. In the Vercel project settings → Environment Variables, add:
   * **Name:** `ACCESS_CODE`
   * **Value:** the generated string
   * **Environments:** Production + Preview (skip Development if you'd rather work without the gate locally)
3. Redeploy. The gate is now live.

### Local development

Either:

* Leave `ACCESS_CODE` unset in `.env.local` — the gate is disabled, every request flows through. Recommended for day-to-day dev.
* Or set `ACCESS_CODE=anything` if you want to test the gate flow itself.

### Rotating the code

Update `ACCESS_CODE` in Vercel → redeploy. Every existing cookie becomes invalid; everyone re-enters with the new code on their next request. No cookie-clearing or session-storage flush needed.

### Disabling the gate (e.g. on GA)

Two options:

* **Temporary:** unset `ACCESS_CODE` in Vercel → redeploy. The gate is bypassed but the page + middleware stay in the repo.
* **Permanent:** delete `src/middleware.ts`, delete `src/app/access/`, delete `src/app/actions/access.ts`, drop the env var. One commit.

## Sharing the code

The whole point is that the code stops being secret as soon as it's shared in the wrong channel. Use:

* Signal / WhatsApp / iMessage (end-to-end encrypted)
* 1Password / Bitwarden shared item
* An encrypted email (PGP / S/MIME)

Not Slack (workspace admins can read), not regular email (subject to inbox compromise), not Notion/Confluence (broad org visibility).

## Threat model — what this protects against

| Threat | Protected? | Notes |
|---|---|---|
| Casual web traffic finding the URL | ✅ | The gate is the first thing anyone sees |
| Search engines indexing the app | ✅ | `/access` carries `robots: noindex, nofollow`; nothing past the gate is reachable for crawlers |
| Brute-forcing the code | Partially | 500 ms artificial delay per attempt + constant-time compare. For a strong 16-byte hex code this is effectively infeasible; for a 4-digit code it isn't. Use a strong code. |
| Stolen cookie replay | Partially | Cookie is `HttpOnly` + `Secure` + `SameSite=Lax` so XSS / CSRF paths are closed. A stolen cookie still works for 30 days — rotate the code if you suspect leakage. |
| Insider / shared-code leak | ❌ | One person knowing the code = many people knowing the code. Rotate aggressively, especially after offboarding. |
| Per-user accountability | ❌ | The gate is a single shared secret. Per-user audit lives in `AuditLogEntry` once the user signs in with NextAuth. |

For a pre-launch private beta, this protects against what matters. For GA, replace with proper per-user identity (already in place via NextAuth) plus invite-only sign-up.

## Files

| File | Purpose |
|---|---|
| `src/middleware.ts` | Edge middleware — runs on every request, checks the cookie, redirects to `/access` if absent or wrong |
| `src/app/access/page.tsx` | The gate page itself — minimal layout, single field, "request a code" mailto link |
| `src/app/access/AccessForm.tsx` | The client form — `useActionState`, autofocus, password input with `autocomplete="one-time-code"` |
| `src/app/actions/access.ts` | Server action — constant-time compare via Node's `timingSafeEqual`, sets the cookie, redirects to `?from=` |
| `.env.example` | Documents the `ACCESS_CODE` variable |

## See also

* [Deploying](deploying.md) — Vercel project setup
* [Auth & permissions](../architecture/auth-and-permissions.md) — the per-user layer that takes over once the gate is passed
