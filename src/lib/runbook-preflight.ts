/**
 * Runbook pre-flight evaluator.
 *
 * Pure function over a runbook snapshot — returns the set of readiness
 * issues to surface in the UI. Same evaluator drives:
 *   • the readiness chip on /runbooks cards
 *   • the pre-flight panel on /runbooks/[id]
 *   • the activation gate on RunbookExecution (Commit D)
 *
 * Issues come in two severities: `blocker` items prevent activation in a
 * live exercise; `warning` items don't block but reduce confidence and
 * appear in the panel as fix-me items.
 */

import type { RunbookStatus } from "@/generated/prisma/enums";

/** Days since lastReviewedAt before a published runbook is flagged stale. */
export const RUNBOOK_REVIEW_WINDOW_DAYS = 180;

export type PreflightIssue = {
  /** Stable id so the UI can dedupe / link to the fix surface. */
  code:
    | "DRAFT_STATUS"
    | "NO_STEPS"
    | "STEPS_MISSING_OWNERS"
    | "OWNER_NOT_IN_ROLE_CATALOGUE"
    | "STEP_OWNERS_NOT_IN_CATALOGUE"
    | "NO_IBS_LINK"
    | "NO_TRIGGER"
    | "NO_OWNER_ROLE"
    | "NEVER_REVIEWED"
    | "STALE_REVIEW";
  severity: "blocker" | "warning";
  /** Single-line summary shown as the chip label / list item. */
  message: string;
  /** Optional context shown under the message (number of affected steps, age, …). */
  detail?: string;
  /** Optional in-app deep link to where the user fixes the issue. */
  fixHref?: string;
};

export type PreflightResult = {
  issues: PreflightIssue[];
  blockerCount: number;
  warningCount: number;
  /** Aggregate readiness label. Drives the chip colour. */
  readiness: "READY" | "NEEDS_REVIEW" | "BLOCKED";
};

export type PreflightInput = {
  id: string;
  status: RunbookStatus;
  ownerRoleTitle: string | null;
  lastReviewedAt: Date | null;
  steps: ReadonlyArray<{ ownerRoleTitle: string | null }>;
  ibsLinkCount: number;
  hasTrigger: boolean;
  /** Set of role titles in the org's catalogue, lower-cased + trimmed. */
  orgRoleCatalogue: ReadonlySet<string>;
  /** "Now" — injected so callers can pin to a snapshot if needed. */
  now?: Date;
};

function normaliseRole(s: string | null | undefined): string | null {
  const v = (s ?? "").trim().toLowerCase();
  return v === "" ? null : v;
}

export function evaluateRunbookPreflight(input: PreflightInput): PreflightResult {
  const issues: PreflightIssue[] = [];
  const now = (input.now ?? new Date()).getTime();

  // ── blockers ───────────────────────────────────────────────────────────
  if (input.status === "DRAFT") {
    issues.push({
      code: "DRAFT_STATUS",
      severity: "blocker",
      message: "Runbook is in DRAFT — publish to activate in an exercise",
      fixHref: `/runbooks/${input.id}`,
    });
  }
  if (input.steps.length === 0) {
    issues.push({
      code: "NO_STEPS",
      severity: "blocker",
      message: "No steps defined",
      fixHref: `/runbooks/${input.id}`,
    });
  }

  // ── warnings ───────────────────────────────────────────────────────────
  const stepsMissingOwner = input.steps.filter((s) => !normaliseRole(s.ownerRoleTitle)).length;
  if (stepsMissingOwner > 0) {
    issues.push({
      code: "STEPS_MISSING_OWNERS",
      severity: "warning",
      message: `${stepsMissingOwner} step${stepsMissingOwner === 1 ? "" : "s"} missing an owner role`,
      detail: "Steps with no owner won't route into a participant queue during an exercise.",
      fixHref: `/runbooks/${input.id}`,
    });
  }

  if (!normaliseRole(input.ownerRoleTitle)) {
    issues.push({
      code: "NO_OWNER_ROLE",
      severity: "warning",
      message: "No accountable owner role set",
      detail: "Pick the role that is accountable for the whole playbook.",
      fixHref: `/runbooks/${input.id}`,
    });
  } else {
    const owner = normaliseRole(input.ownerRoleTitle)!;
    if (!input.orgRoleCatalogue.has(owner)) {
      issues.push({
        code: "OWNER_NOT_IN_ROLE_CATALOGUE",
        severity: "warning",
        message: `Owner role "${input.ownerRoleTitle}" is not in your role catalogue`,
        detail: "Add it under /org/roles so seating reflects accountability.",
        fixHref: "/org/roles",
      });
    }
  }

  // Step-owner roles that don't exist in the catalogue (deduped, ignore blanks).
  const stepRoleSet = new Set<string>();
  for (const s of input.steps) {
    const r = normaliseRole(s.ownerRoleTitle);
    if (r) stepRoleSet.add(r);
  }
  const missingStepRoles: string[] = [];
  for (const r of stepRoleSet) {
    if (!input.orgRoleCatalogue.has(r)) missingStepRoles.push(r);
  }
  if (missingStepRoles.length > 0) {
    issues.push({
      code: "STEP_OWNERS_NOT_IN_CATALOGUE",
      severity: "warning",
      message: `${missingStepRoles.length} step owner role${missingStepRoles.length === 1 ? "" : "s"} not in your catalogue`,
      detail: missingStepRoles.slice(0, 5).join(", ") + (missingStepRoles.length > 5 ? "…" : ""),
      fixHref: "/org/roles",
    });
  }

  if (input.ibsLinkCount === 0) {
    issues.push({
      code: "NO_IBS_LINK",
      severity: "warning",
      message: "Not linked to any IBS",
      detail: "Linking the runbook lets the IBS owner find the playbook from the IBS detail page.",
      fixHref: `/runbooks/${input.id}`,
    });
  }

  if (!input.hasTrigger) {
    issues.push({
      code: "NO_TRIGGER",
      severity: "warning",
      message: "No auto-activation trigger",
      detail: "Manual activation only. Add a trigger so this runbook fires at the right severity.",
      fixHref: `/runbooks/${input.id}`,
    });
  }

  if (!input.lastReviewedAt) {
    issues.push({
      code: "NEVER_REVIEWED",
      severity: "warning",
      message: "Never reviewed",
      detail: "Mark this runbook reviewed once the content matches your current playbook.",
      fixHref: `/runbooks/${input.id}`,
    });
  } else {
    const ageDays = Math.floor((now - input.lastReviewedAt.getTime()) / 86_400_000);
    if (ageDays > RUNBOOK_REVIEW_WINDOW_DAYS) {
      issues.push({
        code: "STALE_REVIEW",
        severity: "warning",
        message: `Last reviewed ${ageDays} days ago (over ${RUNBOOK_REVIEW_WINDOW_DAYS}d window)`,
        detail: "Run through the steps with the owner and re-stamp the review.",
        fixHref: `/runbooks/${input.id}`,
      });
    }
  }

  const blockerCount = issues.filter((i) => i.severity === "blocker").length;
  const warningCount = issues.filter((i) => i.severity === "warning").length;
  const readiness: PreflightResult["readiness"] =
    blockerCount > 0 ? "BLOCKED" : warningCount > 0 ? "NEEDS_REVIEW" : "READY";

  return { issues, blockerCount, warningCount, readiness };
}

/**
 * Freshness summary shown as a chip on cards. Compact — doesn't reproduce
 * the full pre-flight, just the recency story.
 */
export type FreshnessChip = {
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
  /** Title attribute / tooltip for screen readers. */
  title: string;
};

export function runbookFreshness(
  lastReviewedAt: Date | null,
  now: Date = new Date(),
): FreshnessChip {
  if (!lastReviewedAt) {
    return {
      label: "Never reviewed",
      tone: "warn",
      title: "Mark this runbook reviewed once you've walked through it with the owner.",
    };
  }
  const ageDays = Math.floor((now.getTime() - lastReviewedAt.getTime()) / 86_400_000);
  if (ageDays > RUNBOOK_REVIEW_WINDOW_DAYS) {
    return {
      label: `Stale · ${ageDays}d`,
      tone: "bad",
      title: `Last reviewed ${ageDays} days ago — over the ${RUNBOOK_REVIEW_WINDOW_DAYS}d review window.`,
    };
  }
  if (ageDays > RUNBOOK_REVIEW_WINDOW_DAYS - 30) {
    return {
      label: `Review due · ${ageDays}d`,
      tone: "warn",
      title: `Last reviewed ${ageDays} days ago — approaching the ${RUNBOOK_REVIEW_WINDOW_DAYS}d window.`,
    };
  }
  return {
    label: ageDays === 0 ? "Reviewed today" : `Reviewed ${ageDays}d ago`,
    tone: "ok",
    title: `Last reviewed ${ageDays} days ago.`,
  };
}
