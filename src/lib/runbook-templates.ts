import "server-only";

/**
 * Minimal handlebars-style placeholder renderer for runbook step content
 * (comms templates today; later commits may add more). Deliberately tiny —
 * no conditionals, no helpers, no nested context. Unknown tokens are left
 * intact so the operator notices "we don't know this value yet".
 *
 * Supported tokens (all string-coerced):
 *   {{incident.title}}      {{incident.shortCode}}
 *   {{incident.severity}}   {{incident.invokedAt}}
 *   {{org.name}}            {{ownerRoleTitle}}
 *   {{nextSitrepDDay}}      {{dDayHHMM}}
 *   {{vendorName}}          {{affectedServices}}
 */

export type RunbookTemplateContext = {
  incident: {
    title: string;
    shortCode: string;
    severity: string | null;
    invokedAt: Date | null;
  };
  org: { name: string };
  ownerRoleTitle: string | null;
  nextSitrepDDay: string | null;
  dDayHHMM: string;
  /** Optional free-form values supplied by the caller. */
  extras?: Record<string, string | null | undefined>;
};

const TOKEN_RE = /\{\{\s*([a-zA-Z][a-zA-Z0-9_.]*)\s*\}\}/g;

export function renderRunbookTemplate(template: string, ctx: RunbookTemplateContext): string {
  return template.replace(TOKEN_RE, (match, token: string) => {
    const value = resolveToken(token, ctx);
    return value === undefined ? match : value;
  });
}

function resolveToken(token: string, ctx: RunbookTemplateContext): string | undefined {
  switch (token) {
    case "incident.title":
      return ctx.incident.title;
    case "incident.shortCode":
      return ctx.incident.shortCode;
    case "incident.severity":
      return ctx.incident.severity ?? "—";
    case "incident.invokedAt":
      return ctx.incident.invokedAt ? ctx.incident.invokedAt.toISOString() : "—";
    case "org.name":
      return ctx.org.name;
    case "ownerRoleTitle":
      return ctx.ownerRoleTitle ?? "the accountable role";
    case "nextSitrepDDay":
      return ctx.nextSitrepDDay ?? "next IMT cadence";
    case "dDayHHMM":
      return ctx.dDayHHMM;
    default: {
      const extra = ctx.extras?.[token];
      if (extra != null && extra !== "") return String(extra);
      return undefined;
    }
  }
}

/**
 * Map the step's stakeholder string (used in the template authoring UI)
 * to the canonical CommsStakeholder enum that lives on CommunicationDraft.
 * Falls back to OTHER when the value can't be matched — keeps drafts
 * creatable even when the template author wrote a non-standard label.
 */
export function mapStakeholder(input: string | null | undefined):
  | "EMPLOYEES"
  | "CUSTOMERS"
  | "REGULATORS"
  | "SHAREHOLDERS"
  | "MEDIA"
  | "THIRD_PARTY_VENDORS"
  | "INTERMEDIARIES"
  | "ICO"
  | "INSURERS"
  | "OTHER" {
  if (!input) return "OTHER";
  const upper = input.toUpperCase();
  switch (upper) {
    case "EMPLOYEES":
    case "CUSTOMERS":
    case "REGULATORS":
    case "SHAREHOLDERS":
    case "MEDIA":
    case "THIRD_PARTY_VENDORS":
    case "INTERMEDIARIES":
    case "ICO":
    case "INSURERS":
      return upper;
    case "STAFF":
    case "INTERNAL":
      return "EMPLOYEES";
    case "CUSTOMER":
      return "CUSTOMERS";
    case "VENDORS":
    case "THIRD PARTIES":
      return "THIRD_PARTY_VENDORS";
    case "BOARD":
      return "SHAREHOLDERS";
    default:
      return "OTHER";
  }
}

/**
 * Best-effort audience mapping for the legacy CommsAudience enum that
 * CommunicationDraft also carries. We default to INTERNAL when the
 * stakeholder is employees, CUSTOMER for customers, REGULATOR for any
 * regulator stakeholder, MEDIA for media, SENIOR_MGMT for shareholders/board.
 */
export function mapAudienceFromStakeholder(
  stakeholder: ReturnType<typeof mapStakeholder>,
): "CUSTOMER" | "REGULATOR" | "INTERNAL" | "SENIOR_MGMT" | "MEDIA" {
  switch (stakeholder) {
    case "CUSTOMERS":
      return "CUSTOMER";
    case "REGULATORS":
    case "ICO":
      return "REGULATOR";
    case "MEDIA":
      return "MEDIA";
    case "SHAREHOLDERS":
      return "SENIOR_MGMT";
    case "EMPLOYEES":
      return "INTERNAL";
    default:
      return "INTERNAL";
  }
}

/** Map the step's APPROVER_ROLES list per DecisionType to a sensible default. */
export const RUNBOOK_DECISION_APPROVER_ROLES: Record<string, string[]> = {
  INVOKE_IMT: ["CEO"],
  STAND_DOWN_IMT: ["CEO"],
  CLASSIFY_SEVERITY: ["CRO"],
  ACTIVATE_BCP: ["CEO", "CRO"],
  DEACTIVATE_BCP: ["CEO", "CRO"],
  NOTIFY_FCA: ["CEO"],
  NOTIFY_PRA: ["CEO"],
  NOTIFY_ICO: ["CRO"],
  CONVENE_ACTION_COMMITTEE: ["CEO"],
  APPROVE_CRISIS_COMMS: ["CEO"],
  APPROVE_REGULATOR_COMMS: ["CEO"],
  CFO_EMERGENCY_SPEND: ["CFO"],
  DRAW_CONTINGENT_LIQUIDITY: ["CEO"],
  DO_NOT_PAY_RANSOM: ["Board", "Legal"],
  INSURANCE_INVOCATION: ["CRO"],
  RECOVERY_OPTION_CHOSEN: ["CEO"],
  OTHER: [],
};
