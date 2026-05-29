import type { ResilienceSnapshot } from "@/lib/resilience-attestation";

/**
 * Computed attestation readiness — the optimised alternative to a static
 * self-graded checklist.
 *
 * A traditional resilience self-assessment is a Word document where each
 * capability area carries a hand-ticked "Yes". A supervisor learns nothing
 * from a firm grading its own homework. This engine instead *computes* a
 * RAG status per area straight from the frozen snapshot — the status is
 * earned from evidence (real register counts, real test history), never
 * asserted. Every area surfaces the actual figures and exactly what's
 * still missing.
 *
 * Pure + snapshot-only (plus the sign-off booleans the caller already
 * holds). No DB calls, no secrets — fully unit-testable.
 *
 * Capability areas are named in plain operational-resilience language;
 * no regulator clause numbers appear here or in any rendered output.
 */

export type AreaStatus = "READY" | "PARTIAL" | "GAP";

export type AreaScore = {
  key: string;
  label: string;
  status: AreaStatus;
  /** One-line headline figure, e.g. "4 of 5 IBS tested in the last 12 months". */
  evidence: string;
  /** Specific, actionable items still open. Empty when READY. */
  gaps: string[];
};

export type SignOffState = {
  firstLineSigned: boolean;
  secondLineSigned: boolean;
  executiveSigned: boolean;
  boardApproved: boolean;
};

export type AttestationReadiness = {
  areas: AreaScore[];
  overall: AreaStatus;
  readyCount: number;
  totalAreas: number;
};

const MAX_GAP_EXAMPLES = 4;

export function evaluateAttestationReadiness(
  snapshot: ResilienceSnapshot,
  signOff: SignOffState,
): AttestationReadiness {
  const approved = snapshot.ibsRegister.filter((i) => i.status === "APPROVED");
  const testedIds = new Set(
    snapshot.exerciseHistoryLast12Months.flatMap((e) => e.ibsIds),
  );

  const areas: AreaScore[] = [
    governance(snapshot),
    importantBusinessServices(snapshot),
    impactTolerances(approved),
    resourceMapping(approved),
    scenarioTesting(approved, testedIds, snapshot.exerciseHistoryLast12Months.length),
    thirdParty(snapshot),
    lessonsLearned(snapshot),
    signOffArea(signOff),
  ];

  const overall: AreaStatus = areas.some((a) => a.status === "GAP")
    ? "GAP"
    : areas.some((a) => a.status === "PARTIAL")
      ? "PARTIAL"
      : "READY";

  return {
    areas,
    overall,
    readyCount: areas.filter((a) => a.status === "READY").length,
    totalAreas: areas.length,
  };
}

// ─── Area scorers ────────────────────────────────────────────────────────────

function governance(s: ResilienceSnapshot): AreaScore {
  const hasSMF = !!s.smfAccountableUserId;
  const hasBoard = !!s.boardCommittee && s.boardCommittee.trim().length > 0;
  const gaps: string[] = [];
  if (!hasSMF) gaps.push("Name the SMF accountable for operational resilience");
  if (!hasBoard) gaps.push("Set the board committee that ratifies the assessment");

  const status: AreaStatus = hasSMF && hasBoard ? "READY" : hasSMF || hasBoard ? "PARTIAL" : "GAP";
  const evidence = hasSMF
    ? hasBoard
      ? "SMF accountable named; board committee set"
      : "SMF named; board committee not set"
    : "No SMF accountable named yet";
  return { key: "governance", label: "Governance & accountability", status, evidence, gaps };
}

function importantBusinessServices(s: ResilienceSnapshot): AreaScore {
  const total = s.ibsRegister.length;
  const approved = s.ibsRegister.filter((i) => i.status === "APPROVED");
  const draft = s.ibsRegister.filter((i) => i.status !== "APPROVED");

  if (total === 0) {
    return {
      key: "ibs",
      label: "Important Business Services",
      status: "GAP",
      evidence: "No IBS in the register",
      gaps: ["Identify and approve at least one Important Business Service"],
    };
  }
  if (approved.length === 0) {
    return {
      key: "ibs",
      label: "Important Business Services",
      status: "GAP",
      evidence: `${total} IBS captured, none approved`,
      gaps: [`Approve the register — ${total} IBS still in draft`],
    };
  }
  const status: AreaStatus = draft.length === 0 ? "READY" : "PARTIAL";
  return {
    key: "ibs",
    label: "Important Business Services",
    status,
    evidence:
      draft.length === 0
        ? `${approved.length} IBS approved`
        : `${approved.length} approved, ${draft.length} still draft`,
    gaps: draft.length === 0 ? [] : [`Approve or retire: ${codeList(draft)}`],
  };
}

function impactTolerances(approved: ResilienceSnapshot["ibsRegister"]): AreaScore {
  if (approved.length === 0) {
    return blankArea("tolerances", "Impact tolerances", "No approved IBS to set tolerances against");
  }
  const missingRationale = approved.filter(
    (i) => !i.toleranceRationale || i.toleranceRationale.trim().length === 0,
  );
  const status: AreaStatus = missingRationale.length === 0 ? "READY" : "PARTIAL";
  return {
    key: "tolerances",
    label: "Impact tolerances",
    status,
    evidence: `${approved.length - missingRationale.length} of ${approved.length} IBS hold a documented tolerance + rationale`,
    gaps:
      missingRationale.length === 0
        ? []
        : [`Tolerance set but no rationale: ${codeList(missingRationale)}`],
  };
}

function resourceMapping(approved: ResilienceSnapshot["ibsRegister"]): AreaScore {
  if (approved.length === 0) {
    return blankArea("mapping", "Resource mapping & dependencies", "No approved IBS to map");
  }
  const unmapped = approved.filter((i) => i.resources.length === 0);
  const mapped = approved.length - unmapped.length;
  const status: AreaStatus =
    unmapped.length === 0 ? "READY" : mapped === 0 ? "GAP" : "PARTIAL";
  return {
    key: "mapping",
    label: "Resource mapping & dependencies",
    status,
    evidence: `${mapped} of ${approved.length} IBS have a resource map`,
    gaps: unmapped.length === 0 ? [] : [`No dependency map: ${codeList(unmapped)}`],
  };
}

function scenarioTesting(
  approved: ResilienceSnapshot["ibsRegister"],
  testedIds: Set<string>,
  exerciseCount: number,
): AreaScore {
  if (approved.length === 0) {
    return blankArea("testing", "Scenario testing", "No approved IBS to test");
  }
  const untested = approved.filter((i) => !testedIds.has(i.id));
  const tested = approved.length - untested.length;
  const status: AreaStatus = untested.length === 0 ? "READY" : tested === 0 ? "GAP" : "PARTIAL";
  return {
    key: "testing",
    label: "Scenario testing",
    status,
    evidence:
      tested === 0
        ? `No IBS tested in the last 12 months (${exerciseCount} exercise${exerciseCount === 1 ? "" : "s"} on record)`
        : `${tested} of ${approved.length} IBS tested in the last 12 months`,
    gaps: untested.length === 0 ? [] : [`Not tested in 12 months: ${codeList(untested)}`],
  };
}

function thirdParty(s: ResilienceSnapshot): AreaScore {
  const vendors = s.vendorCriticality;
  if (vendors.length === 0) {
    return {
      key: "thirdparty",
      label: "Third-party management",
      status: "GAP",
      evidence: "No vendors in the register",
      gaps: ["Add the critical third parties that support your IBS"],
    };
  }
  const critical = vendors.filter((v) => v.isMaterialThirdParty || v.isDoraCritical);
  const criticalUnlinked = critical.filter((v) => v.ibsIds.length === 0);
  const status: AreaStatus =
    critical.length === 0
      ? "PARTIAL" // vendors exist but none flagged critical — likely under-classified
      : criticalUnlinked.length === 0
        ? "READY"
        : "PARTIAL";
  const evidence =
    critical.length === 0
      ? `${vendors.length} vendors mapped, none flagged material/critical`
      : `${vendors.length} vendors, ${critical.length} material/critical, all linked to IBS`;
  const gaps: string[] = [];
  if (critical.length === 0) {
    gaps.push("Review vendor tiers — no vendor is flagged material or DORA-critical");
  } else if (criticalUnlinked.length > 0) {
    gaps.push(`Critical vendor not linked to any IBS: ${nameList(criticalUnlinked)}`);
  }
  return {
    key: "thirdparty",
    label: "Third-party management",
    status,
    evidence:
      criticalUnlinked.length > 0
        ? `${vendors.length} vendors, ${critical.length} material/critical, ${criticalUnlinked.length} unlinked`
        : evidence,
    gaps,
  };
}

function lessonsLearned(s: ResilienceSnapshot): AreaScore {
  const open = s.openActionItems;
  const now = Date.now();
  const overdue = open.filter((ai) => ai.dueAt && new Date(ai.dueAt).getTime() < now);
  const status: AreaStatus = overdue.length === 0 ? "READY" : overdue.length > 3 ? "GAP" : "PARTIAL";
  return {
    key: "remediation",
    label: "Lessons learned & remediation",
    status,
    evidence:
      open.length === 0
        ? "No open action items"
        : `${open.length} open action item${open.length === 1 ? "" : "s"}, ${overdue.length} overdue`,
    gaps:
      overdue.length === 0
        ? []
        : [`Overdue remediation: ${titleList(overdue)}`],
  };
}

function signOffArea(signOff: SignOffState): AreaScore {
  const linesSigned =
    (signOff.firstLineSigned ? 1 : 0) +
    (signOff.secondLineSigned ? 1 : 0) +
    (signOff.executiveSigned ? 1 : 0);
  const status: AreaStatus =
    linesSigned === 3 ? "READY" : linesSigned === 0 ? "GAP" : "PARTIAL";
  const gaps: string[] = [];
  if (!signOff.firstLineSigned) gaps.push("Awaiting first-line (business owner) signature");
  if (!signOff.secondLineSigned) gaps.push("Awaiting second-line (risk & compliance) signature");
  if (!signOff.executiveSigned) gaps.push("Awaiting executive (SMF accountable) signature");
  if (linesSigned === 3 && !signOff.boardApproved) gaps.push("Board ratification not yet recorded");
  return {
    key: "signoff",
    label: "Sign-off & evidence",
    status,
    evidence: `${linesSigned} of 3 lines signed${signOff.boardApproved ? " · board ratified" : ""}`,
    gaps,
  };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function blankArea(key: string, label: string, evidence: string): AreaScore {
  return { key, label, status: "GAP", evidence, gaps: ["Approve at least one IBS first"] };
}

function codeList(rows: { code: string }[]): string {
  const codes = rows.map((r) => r.code);
  return truncateList(codes);
}

function nameList(rows: { name: string }[]): string {
  return truncateList(rows.map((r) => r.name));
}

function titleList(rows: { title: string }[]): string {
  return truncateList(rows.map((r) => r.title));
}

function truncateList(items: string[]): string {
  if (items.length <= MAX_GAP_EXAMPLES) return items.join(", ");
  return `${items.slice(0, MAX_GAP_EXAMPLES).join(", ")} +${items.length - MAX_GAP_EXAMPLES} more`;
}
