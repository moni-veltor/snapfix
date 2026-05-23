import { assuranceStatus, contractStatus, type VendorLite } from "@/lib/dora";

/**
 * Conservative vendor-state model.
 *
 * Per the user's calibration vote we light up alerts only when something
 * is *already* overdue or past a point-of-no-return — not at early
 * "expiring soon" warnings. Each vendor gets zero or more alerts and a
 * single attentionLevel roll-up; the grid uses attentionLevel for the
 * "Action required" filter chip and renders one chip per alert on the
 * card.
 *
 * Commit E will extend this with ASSESSMENT_OVERDUE once the page
 * loader also pulls assessment dates.
 */

export type LifecycleAlert =
  | "ASSURANCE_EXPIRED"
  | "ASSURANCE_MISSING"
  | "CONTRACT_PAST_NOTICE"
  | "CONTRACT_EXPIRED"
  | "MTP_INCOMPLETE";

export type AlertChip = {
  code: LifecycleAlert;
  label: string;
  /** Tooltip / longer hint for screen-readers. */
  detail: string;
};

export type VendorState = {
  alerts: AlertChip[];
  attentionLevel: "OK" | "ACTION_REQUIRED";
};

export type VendorForState = VendorLite & {
  isMaterialThirdParty?: boolean;
  /** When true, this vendor's MTP register fields are incomplete. */
  mtpIncomplete?: boolean;
};

export function deriveVendorState(
  v: VendorForState,
  now: Date = new Date(),
): VendorState {
  const alerts: AlertChip[] = [];

  // Assurance — flag missing + flag expired separately so the chip text
  // tells the operator which fix is needed.
  const assurance = assuranceStatus(v, now);
  if (assurance === "expired") {
    alerts.push({
      code: "ASSURANCE_EXPIRED",
      label: "Assurance expired",
      detail: "Schedule a fresh assurance review.",
    });
  } else if (assurance === "missing") {
    alerts.push({
      code: "ASSURANCE_MISSING",
      label: "Assurance missing",
      detail: "No assurance type recorded for this vendor.",
    });
  }

  // Contract — past the notice deadline is irreversible (can't give notice
  // anymore without a renewal penalty), expired is worse.
  const contract = contractStatus(v, now);
  if (contract.status === "expired") {
    alerts.push({
      code: "CONTRACT_EXPIRED",
      label: `Contract expired ${Math.abs(contract.daysToEnd ?? 0)}d ago`,
      detail: "Contract end-date has passed; verify renewal or wind-down.",
    });
  } else if (contract.status === "renewing") {
    alerts.push({
      code: "CONTRACT_PAST_NOTICE",
      label: `Inside notice window · ${contract.daysToEnd}d`,
      detail:
        "Past the notice deadline — switching providers now requires a renewal cycle.",
    });
  }

  if (v.isMaterialThirdParty && v.mtpIncomplete) {
    alerts.push({
      code: "MTP_INCOMPLETE",
      label: "MTP register incomplete",
      detail: "Mandatory Annex 3 fields missing — won't submit cleanly.",
    });
  }

  return {
    alerts,
    attentionLevel: alerts.length > 0 ? "ACTION_REQUIRED" : "OK",
  };
}
