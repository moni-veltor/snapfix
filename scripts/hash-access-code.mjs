#!/usr/bin/env node
/**
 * Compute the sha256 hex hash of an access code, ready to paste into
 * src/lib/access-code.ts (ACCESS_CODE_HASH).
 *
 * Usage:
 *   node scripts/hash-access-code.mjs "the-code-from-your-notebook"
 *
 * Two args = error (helps catch accidental shell expansion). Quote the
 * code if it has spaces or shell-special characters.
 */

import { createHash } from "node:crypto";

const argv = process.argv.slice(2);

if (argv.length === 0) {
  console.error("");
  console.error("  Usage: node scripts/hash-access-code.mjs \"your-access-code\"");
  console.error("");
  console.error("  Quote the code if it has spaces or shell-special characters.");
  console.error("");
  process.exit(1);
}

if (argv.length > 1) {
  console.error("");
  console.error("  Got more than one argument — did you forget to quote the code?");
  console.error("  Example: node scripts/hash-access-code.mjs \"correct horse battery staple\"");
  console.error("");
  process.exit(1);
}

const code = argv[0];
if (code.length < 8) {
  console.warn("  Warning: this code is shorter than 8 characters. Consider something stronger.");
  console.warn("");
}

const hash = createHash("sha256").update(code).digest("hex");

console.log("");
console.log("  sha256 of your code:");
console.log("");
console.log("  " + hash);
console.log("");
console.log("  Paste this into src/lib/access-code.ts as:");
console.log("");
console.log("    export const ACCESS_CODE_HASH = \"" + hash + "\";");
console.log("");
console.log("  Then: git add src/lib/access-code.ts && git commit && git push.");
console.log("  Vercel auto-deploys; every existing access cookie is invalidated.");
console.log("");
