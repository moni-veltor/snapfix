import type { VendorState, LifecycleAlert } from "@/lib/vendor-state";

/**
 * Per-vendor next-action suggestions.
 *
 * The chips/state we already compute tell the operator *what's wrong*.
 * This layer turns each wrong-thing into a concrete *do-this-next* with
 * a deep link to the right surface — the detail page can then surface
 * the top 1–3 unblockers so an admin doesn't have to derive the next
 * step themselves.
 *
 * Priority ordering: alerts that have a hard time pressure (expired,
 * past notice) outrank soft ones (missing, incomplete). When the vendor
 * has no live alerts we fall back to "good housekeeping" suggestions
 * (link an IBS, mark MTP, document exit plan) — softer tone.
 */

export type SuggestionPriority = "high" | "medium" | "low";

export type Suggestion = {
  priority: SuggestionPriority;
  /** Imperative action statement, e.g. "Record a fresh assurance review". */
  action: string;
  /** Optional one-line why-now context shown under the action. */
  rationale?: string;
  /** Deep link to the relevant tab on the vendor detail page. */
  href: string;
  /** Short label for the inline link. */
  cta: string;
};

export type VendorForSuggestions = {
  id: string;
  isMaterialThirdParty?: boolean;
  ibsLinkCount?: number;
  exitPlanReviewedAt?: Date | null;
};

const PRIORITY_BY_ALERT: Record<LifecycleAlert, SuggestionPriority> = {
  CONTRACT_EXPIRED: "high",
  ASSURANCE_EXPIRED: "high",
  CONTRACT_PAST_NOTICE: "high",
  MTP_INCOMPLETE: "medium",
  ASSESSMENT_OVERDUE: "medium",
  ASSURANCE_MISSING: "medium",
};

export function suggestNextActions(
  vendor: VendorForSuggestions,
  state: VendorState,
  /** Cap so the panel doesn't drown the page. */
  max: number = 3,
): Suggestion[] {
  const out: Suggestion[] = [];

  for (const alert of state.alerts) {
    const priority = PRIORITY_BY_ALERT[alert.code];
    switch (alert.code) {
      case "ASSURANCE_EXPIRED":
        out.push({
          priority,
          action: "Record a fresh assurance review",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=basics`,
          cta: "Open Basics",
        });
        break;
      case "ASSURANCE_MISSING":
        out.push({
          priority,
          action: "Pick an assurance type for this vendor",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=basics`,
          cta: "Open Basics",
        });
        break;
      case "CONTRACT_EXPIRED":
        out.push({
          priority,
          action: "Update the contract end-date or mark the vendor exited",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=basics`,
          cta: "Open Basics",
        });
        break;
      case "CONTRACT_PAST_NOTICE":
        out.push({
          priority,
          action: "Decide: renew or trigger the exit plan",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=basics`,
          cta: "Open Basics",
        });
        break;
      case "MTP_INCOMPLETE":
        out.push({
          priority,
          action: "Complete the missing Annex 3 fields",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=mtp`,
          cta: "Open MTP register",
        });
        break;
      case "ASSESSMENT_OVERDUE":
        out.push({
          priority,
          action: "Record the overdue MTP assessments",
          rationale: alert.detail,
          href: `/vendors/${vendor.id}?tab=assessments`,
          cta: "Open Assessments",
        });
        break;
    }
  }

  // Good-housekeeping suggestions only if there's still room — alert-driven
  // items always win for visibility.
  if (out.length < max) {
    if (vendor.isMaterialThirdParty === false) {
      out.push({
        priority: "low",
        action: "Mark as Material Third Party if material",
        rationale:
          "MTPs feed the Annex 3 register + notification flow. Skip if this vendor doesn't meet your materiality test.",
        href: `/vendors/${vendor.id}?tab=mtp`,
        cta: "Open MTP register",
      });
    }
    if ((vendor.ibsLinkCount ?? 0) === 0) {
      out.push({
        priority: "low",
        action: "Link the vendor to the IBSs it supports",
        rationale:
          "IBS links are what surface this vendor when an IBS owner is reviewing dependencies.",
        href: `/vendors/${vendor.id}?tab=basics`,
        cta: "Open Basics",
      });
    }
    if (!vendor.exitPlanReviewedAt) {
      out.push({
        priority: "low",
        action: "Document the exit plan",
        rationale: "Even a one-paragraph plan beats none — required for any DORA-critical vendor.",
        href: `/vendors/${vendor.id}?tab=basics`,
        cta: "Open Basics",
      });
    }
  }

  const rank: Record<SuggestionPriority, number> = { high: 0, medium: 1, low: 2 };
  out.sort((a, b) => rank[a.priority] - rank[b.priority]);
  return out.slice(0, max);
}
