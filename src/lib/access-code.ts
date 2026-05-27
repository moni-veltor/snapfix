/**
 * Site-wide access gate — shared-secret hash.
 *
 * ─── How this works ─────────────────────────────────────────────────────
 *
 * The operator keeps the *plain* access code in a notebook. Only its
 * sha256 hex lives in the source (this file). Middleware and the
 * sign-in action compare against the hash; the plaintext never appears
 * anywhere digital.
 *
 * ─── Rotating the code ──────────────────────────────────────────────────
 *
 *   1. Write the new code in the notebook.
 *   2. Run:  node scripts/hash-access-code.mjs "the-new-code"
 *   3. Paste the printed hex into ACCESS_CODE_HASH below.
 *   4. Commit + push. Vercel auto-deploys. Every existing cookie is
 *      invalidated because its value no longer matches the new hash.
 *
 * ─── Disabling the gate ─────────────────────────────────────────────────
 *
 * Set ACCESS_CODE_HASH = "" (empty string). The gate is bypassed and
 * every request flows straight through to the existing routes. Useful
 * during local dev or right before GA.
 *
 * See docs/operations/access-gate.md for the full workflow.
 */
export const ACCESS_CODE_HASH =
  "2e4d1cfd134c29927f0ff23b9b158e842cbc4f7c5adec9b6308cf762e837d7f9";
