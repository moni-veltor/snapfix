import "server-only";
import { createHash } from "node:crypto";
import { prisma } from "@/lib/prisma";

const ZERO_HASH = "0".repeat(64);

/**
 * Append an entry to the per-exercise audit hash chain. Each entry's hash
 * is SHA-256(prevHash || canonicalPayload || ISO timestamp). Any retroactive
 * tampering with a payload, or any inserted/deleted entry, breaks the chain.
 *
 * Only used when the exercise is in regulator-evidence mode — normal-mode
 * exercises log to AuditLogEntry which is sufficient for non-evidence use.
 */
export async function appendAuditEntry(
  exerciseId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  const ex = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    select: { regulatorMode: true },
  });
  if (!ex || !ex.regulatorMode) return;

  const last = await prisma.exerciseAuditHashEntry.findFirst({
    where: { exerciseId },
    orderBy: { sequence: "desc" },
    select: { sequence: true, hash: true },
  });
  const sequence = (last?.sequence ?? -1) + 1;
  const prevHash = last?.hash ?? ZERO_HASH;
  const occurredAt = new Date();
  const canonical = canonicalize(payload);
  const hash = createHash("sha256")
    .update(prevHash)
    .update("|")
    .update(canonical)
    .update("|")
    .update(occurredAt.toISOString())
    .digest("hex");

  await prisma.exerciseAuditHashEntry.create({
    data: {
      exerciseId,
      sequence,
      hash,
      prevHash,
      payload: payload as unknown as object,
      occurredAt,
    },
  });
}

/**
 * Walk the chain and recompute hashes; report any mismatch. Used by the
 * evidence pack route to surface tamper-evidence to the regulator.
 */
export async function verifyAuditChain(exerciseId: string): Promise<{
  ok: boolean;
  brokenAtSequence: number | null;
  totalEntries: number;
}> {
  const entries = await prisma.exerciseAuditHashEntry.findMany({
    where: { exerciseId },
    orderBy: { sequence: "asc" },
  });
  let prevHash = ZERO_HASH;
  for (const e of entries) {
    if (e.prevHash !== prevHash) {
      return { ok: false, brokenAtSequence: e.sequence, totalEntries: entries.length };
    }
    const canonical = canonicalize(e.payload as Record<string, unknown>);
    const expected = createHash("sha256")
      .update(prevHash)
      .update("|")
      .update(canonical)
      .update("|")
      .update(e.occurredAt.toISOString())
      .digest("hex");
    if (expected !== e.hash) {
      return { ok: false, brokenAtSequence: e.sequence, totalEntries: entries.length };
    }
    prevHash = e.hash;
  }
  return { ok: true, brokenAtSequence: null, totalEntries: entries.length };
}

/** Stable JSON serialization — sort keys recursively. */
function canonicalize(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(",")}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  const parts = keys.map(
    (k) => `${JSON.stringify(k)}:${canonicalize((value as Record<string, unknown>)[k])}`,
  );
  return `{${parts.join(",")}}`;
}
