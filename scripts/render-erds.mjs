#!/usr/bin/env node
/**
 * Render every PlantUML source in docs/data-schemas/src/ to SVG via Kroki's
 * public renderer, writing the result to docs/data-schemas/img/.
 *
 * Usage: node scripts/render-erds.mjs [name]
 *   - no arg → render all
 *   - one arg → render just that file (e.g. "overview")
 *
 * Kroki accepts the source as a plain-text POST body; no encoding gymnastics.
 */

import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { join, basename, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");
const srcDir = join(repoRoot, "docs/data-schemas/src");
const imgDir = join(repoRoot, "docs/data-schemas/img");
const KROKI = "https://kroki.io/plantuml/svg";

async function renderOne(name, source) {
  const res = await fetch(KROKI, {
    method: "POST",
    headers: { "Content-Type": "text/plain", Accept: "image/svg+xml" },
    body: source,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "(no body)");
    throw new Error(`Kroki ${res.status} for ${name}: ${detail.slice(0, 400)}`);
  }
  const svg = await res.text();
  const out = join(imgDir, `${name}.svg`);
  await writeFile(out, svg, "utf8");
  return out;
}

async function main() {
  await mkdir(imgDir, { recursive: true });
  const only = process.argv[2];
  const entries = await readdir(srcDir);
  const targets = entries
    .filter((e) => extname(e) === ".puml")
    .map((e) => basename(e, ".puml"))
    .filter((n) => !only || n === only);

  if (targets.length === 0) {
    console.error(`No .puml sources found in ${srcDir}${only ? ` matching "${only}"` : ""}`);
    process.exit(1);
  }

  let ok = 0;
  let failed = 0;
  for (const name of targets) {
    const source = await readFile(join(srcDir, `${name}.puml`), "utf8");
    process.stdout.write(`  ${name.padEnd(28)} `);
    try {
      const out = await renderOne(name, source);
      console.log(`→ ${out.replace(repoRoot + "/", "")}`);
      ok += 1;
    } catch (err) {
      console.log(`FAILED`);
      console.error(`    ${err.message}`);
      failed += 1;
    }
  }
  console.log(`\nDone — ${ok} rendered, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
