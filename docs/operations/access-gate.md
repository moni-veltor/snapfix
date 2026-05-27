# Site-wide access gate

A single shared passcode that sits in front of the whole app. Marketing, sign-in, in-app — everything. Once entered, the existing email-password sign-in (NextAuth) takes over for per-user access control.

The plain code lives in **your physical notebook**. The source carries only its `sha256` hex. Nothing about the gate touches Vercel env vars.

## How it works

1. A user hits any URL on the site.
2. `src/middleware.ts` runs at the edge. If `ACCESS_CODE_HASH` (in `src/lib/access-code.ts`) is non-empty and the request lacks a valid `snapfix_access` cookie, the user is redirected to `/access?from=<original-path>`.
3. The `/access` page shows a single password field. The user enters the code.
4. The server action in `src/app/actions/access.ts` hashes the submission with sha256 and constant-time-compares to `ACCESS_CODE_HASH`. On match, it sets an `HttpOnly` `Secure` `SameSite=Lax` cookie carrying the hash, valid for **30 days**.
5. The action redirects to `?from=` (or `/`), and middleware lets the request through.
6. The user lands on the marketing site or `/sign-in` and proceeds as normal.

### What gets through without a code

Five route patterns bypass the gate even when set:

* `/access` (the gate page itself)
* `/api/auth/*` (NextAuth callbacks — needed for OAuth round-trips)
* `/api/health` (so external uptime probes work)
* `/robots.txt`, `/sitemap.xml`

Static assets and Next.js internals are excluded by the middleware matcher.

### What the cookie carries

The cookie value is the same sha256 hex that's in `src/lib/access-code.ts` — **never** the plaintext code. Changing the hash in source auto-invalidates every existing cookie.

## Setting / rotating the code

1. **Write the new code in your notebook.** Keep it strong (≥ 12 characters, ideally a passphrase). The notebook is the *only* place the plaintext exists.
2. **Compute the hash** locally:
   ```bash
   node scripts/hash-access-code.mjs "the-code-from-your-notebook"
   ```
   The script prints a 64-char hex string.
3. **Paste it into [`src/lib/access-code.ts`](../../src/lib/access-code.ts):**
   ```ts
   export const ACCESS_CODE_HASH = "<64-char hex from step 2>";
   ```
4. **Commit + push:**
   ```bash
   git add src/lib/access-code.ts
   git commit -m "chore(access): rotate site-wide access code"
   git push
   ```
5. Vercel auto-deploys. Every existing access cookie becomes invalid on the next request — everyone re-enters with the new code.

### Disabling the gate

Set the hash back to `""`:

```ts
export const ACCESS_CODE_HASH = "";
```

Commit + push. The gate is bypassed and every request flows straight through to the existing routes. Re-enable by pasting a fresh hash.

### Removing the gate entirely (e.g. on GA)

Delete these files:

```
src/middleware.ts
src/lib/access-code.ts
src/app/access/
src/app/actions/access.ts
scripts/hash-access-code.mjs
```

Plus this doc. One commit.

## Sharing the code

The whole point is that the code stops being secret as soon as it's shared in the wrong channel. Use:

* Signal / WhatsApp / iMessage (end-to-end encrypted)
* 1Password / Bitwarden shared item
* An encrypted email (PGP / S/MIME)
* In-person verbal hand-off

Not Slack (workspace admins can read), not regular email, not Notion/Confluence.

## Threat model — what this protects against

| Threat | Protected? | Notes |
|---|---|---|
| Casual web traffic finding the URL | ✅ | The gate is the first thing anyone sees |
| Search engines indexing the app | ✅ | `/access` carries `robots: noindex, nofollow`; nothing past the gate is reachable for crawlers |
| Brute-forcing the code | Partially | 500 ms artificial delay per attempt + constant-time compare. For a strong passphrase this is effectively infeasible; for a 4-digit code it isn't. Use a strong code. |
| Stolen cookie replay | Partially | Cookie is `HttpOnly` + `Secure` + `SameSite=Lax` so XSS / CSRF paths are closed. A stolen cookie still works for 30 days — rotate the code if you suspect leakage. |
| Repo source exposure | ✅ | Only the hash lives in source. An attacker with the repo would still need to brute-force a strong passphrase out of its sha256. |
| Insider / shared-code leak | ❌ | One person knowing the code = many people knowing the code. Rotate aggressively, especially after offboarding. |
| Per-user accountability | ❌ | The gate is a single shared secret. Per-user audit lives in `AuditLogEntry` once the user signs in with NextAuth. |

For a pre-launch private beta, this protects against what matters. For GA, replace with proper per-user identity (already in place via NextAuth) plus invite-only sign-up.

## Files

| File | Purpose |
|---|---|
| `src/lib/access-code.ts` | The single `ACCESS_CODE_HASH` constant. The whole rotation surface — change one line, commit, push. |
| `src/middleware.ts` | Edge middleware. Runs on every request; redirects to `/access` if the cookie doesn't match the hash. |
| `src/app/access/page.tsx` | The gate page — minimal layout, single field, mailto fallback. |
| `src/app/access/AccessForm.tsx` | The client form (`useActionState`, autofocus, `autocomplete="one-time-code"`). |
| `src/app/actions/access.ts` | Server action — constant-time compare via Node's `timingSafeEqual`, sets the cookie, redirects. |
| `scripts/hash-access-code.mjs` | Helper — turns a notebook code into the hash you paste into `access-code.ts`. |

## See also

* [Deploying](deploying.md) — Vercel project setup
* [Auth & permissions](../architecture/auth-and-permissions.md) — the per-user layer that takes over once the gate is passed
