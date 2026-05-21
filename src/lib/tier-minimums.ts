import "server-only";
import { prisma } from "@/lib/prisma";
import type { FirmTier } from "@/generated/prisma/enums";

/**
 * Per-tier minimum-readiness checks for the Organisation tab.
 *
 * A G-SIB and a 50-person EMI face wildly different regulatory minimums
 * for "who's in the IMT, who deputises whom, who is named for the 24/7
 * escalation". This module captures those minimums and evaluates them
 * against the live org state so the /org page can show ✅ / ❌ / partial
 * at a glance with one-click deep-links to fix each gap.
 *
 * Sources mirrored (in spirit, not by citation):
 *   - PRA SS2/21 + SUP 16.13 — SMF accountability for operational
 *     resilience (Tier 1 + 2).
 *   - FCA SMCR mappings — Senior Manager regime nominees.
 *   - DORA art 5 — governance accountability for ICT-third-party risk.
 *
 * The list is curated, not exhaustive. Each item is named in plain
 * English; the regulator references stay out of the UI per the
 * project's "no doctrine citations" rule.
 */

export type MinimumStatus = "met" | "partial" | "unmet";

export type TierMinimum = {
  id: string;
  label: string;
  hint: string;
  status: MinimumStatus;
  /** Deep-link the chip uses to take the user to the fix surface. */
  fixHref: string;
  fixLabel: string;
};

export type TierMinimumsResult = {
  tier: FirmTier | null;
  tierLabel: string;
  tierPitch: string;
  items: TierMinimum[];
  metCount: number;
  totalCount: number;
};

export const TIER_LABEL: Record<FirmTier | "UNSET", string> = {
  TIER_1: "Tier 1 — Global universal / G-SIB",
  TIER_2: "Tier 2 — Digital challenger",
  TIER_3: "Tier 3 — New bank, neobank, EMI, fintech",
  UNSET: "Tier not set",
};

const TIER_PITCH: Record<FirmTier | "UNSET", string> = {
  TIER_1:
    "Broad IBS surface · deep SMF / SMCR accountability · 24/7 incident-bridge expectation.",
  TIER_2:
    "Material services in a small footprint · named SMF holder + deputy chain · clear ops-res owner.",
  TIER_3:
    "Lean operating model · one senior person responsible + one 24/7 escalation point is the baseline.",
  UNSET: "Set your firm tier in Settings to see the right minimums for your shape.",
};

/**
 * Compute the tier-minimums checklist for a given org. Returns ordered
 * items + a met / total roll-up so the page can show a coverage % chip.
 */
export async function evaluateTierMinimums(orgId: string): Promise<TierMinimumsResult> {
  const [org, roles, members, ibsTotal] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { tier: true },
    }),
    prisma.organizationRole.findMany({
      where: { orgId },
      select: {
        id: true,
        abbreviation: true,
        title: true,
        isSMF: true,
        isExecutive: true,
        deputyOfRoleId: true,
        defaultHolderId: true,
      },
    }),
    prisma.user.findMany({
      where: { orgId },
      select: {
        id: true,
        orgRole: true,
        jobTitle: true,
        outOfHoursPhone: true,
        phone: true,
      },
    }),
    prisma.organizationIBS.count({ where: { orgId } }),
  ]);

  const tier: FirmTier | null = org?.tier ?? null;
  const tierKey: FirmTier | "UNSET" = tier ?? "UNSET";

  // Derived signals shared across tiers.
  const smfRoles = roles.filter((r) => r.isSMF);
  const execRoles = roles.filter((r) => r.isExecutive);
  const smfWithHolder = smfRoles.filter((r) => r.defaultHolderId);
  const ownersAdmins = members.filter(
    (m) => m.orgRole === "OWNER" || m.orgRole === "ADMIN",
  );
  const withOOH = members.filter((m) => !!m.outOfHoursPhone);
  const withJobTitle = members.filter((m) => !!m.jobTitle);
  // Longest deputy chain length — DFS up from each role following deputyOf.
  const byId = new Map(roles.map((r) => [r.id, r]));
  function chainLength(id: string, seen = new Set<string>()): number {
    if (seen.has(id)) return 0;
    seen.add(id);
    const r = byId.get(id);
    if (!r?.deputyOfRoleId) return 0;
    return 1 + chainLength(r.deputyOfRoleId, seen);
  }
  const longestChain = roles.reduce((m, r) => Math.max(m, chainLength(r.id)), 0);

  const items: TierMinimum[] = [];

  // ── Baseline (applies to every tier including UNSET) ─────────────────
  items.push({
    id: "senior-responsible-person",
    label: "Senior person responsible identified",
    hint: "At least one OWNER or ADMIN account in the org.",
    status: ownersAdmins.length >= 1 ? "met" : "unmet",
    fixHref: "/org",
    fixLabel: "Open members",
  });

  items.push({
    id: "ooh-escalation",
    label: "24/7 escalation contact reachable",
    hint: "At least one member with an out-of-hours phone on file.",
    status: withOOH.length >= 1 ? "met" : "unmet",
    fixHref: "/org",
    fixLabel: "Add OOH phone",
  });

  // ── Tier-specific additions ──────────────────────────────────────────
  if (tier === "TIER_1" || tier === "TIER_2") {
    items.push({
      id: "ops-res-accountable",
      label: "Operational resilience accountable individual",
      hint: "A named SMF role responsible for the resilience programme.",
      status:
        smfWithHolder.some((r) =>
          /resilience|operations|chief operating|cro|chief risk/i.test(
            `${r.title} ${r.abbreviation}`,
          ),
        )
          ? "met"
          : smfRoles.length > 0
            ? "partial"
            : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Edit roles",
    });

    items.push({
      id: "smf-named-holder",
      label: "Every SMF seat has a named holder",
      hint: "SMF-flagged roles in the catalogue must point at a real person.",
      status:
        smfRoles.length === 0
          ? "unmet"
          : smfWithHolder.length === smfRoles.length
            ? "met"
            : "partial",
      fixHref: "/org/roles",
      fixLabel: "Assign holders",
    });

    items.push({
      id: "deputy-chain",
      label: "Deputy chain at least 2 deep for SMF seats",
      hint: "Single-point-of-failure on SMF accountability is a known regulator pain point.",
      status:
        longestChain >= 2 ? "met" : longestChain >= 1 ? "partial" : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Set deputies",
    });
  }

  if (tier === "TIER_1") {
    items.push({
      id: "group-ciso",
      label: "Group CISO / security accountable seat",
      hint: "A dedicated security executive in the IMT roster.",
      status: roles.some((r) =>
        /ciso|security/i.test(`${r.title} ${r.abbreviation}`),
      )
        ? "met"
        : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Add seat",
    });

    items.push({
      id: "executive-imt-bench",
      label: "≥ 4 executive seats in the IMT catalogue",
      hint: "G-SIB-scale firms need depth on the exec bench during a 24/7 incident.",
      status:
        execRoles.length >= 4 ? "met" : execRoles.length >= 2 ? "partial" : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Add seats",
    });

    items.push({
      id: "ibs-register-coverage",
      label: "≥ 6 Important Business Services in the register",
      hint: "Tier-1 surface area is broad — payments, cards, branch, trading, custody, etc.",
      status: ibsTotal >= 6 ? "met" : ibsTotal >= 3 ? "partial" : "unmet",
      fixHref: "/ibs",
      fixLabel: "Open IBS register",
    });
  }

  if (tier === "TIER_2") {
    items.push({
      id: "security-lead",
      label: "Security / CISO-equivalent seat",
      hint: "Even at challenger scale, a named security accountable is expected.",
      status: roles.some((r) =>
        /ciso|security|infosec/i.test(`${r.title} ${r.abbreviation}`),
      )
        ? "met"
        : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Add seat",
    });

    items.push({
      id: "ibs-register-coverage-t2",
      label: "≥ 3 Important Business Services in the register",
      hint: "Identify the customer-impacting services that anchor your supervision.",
      status: ibsTotal >= 3 ? "met" : ibsTotal >= 1 ? "partial" : "unmet",
      fixHref: "/ibs",
      fixLabel: "Open IBS register",
    });
  }

  if (tier === "TIER_3") {
    items.push({
      id: "deputy-for-top-exec",
      label: "Deputy named for top executive",
      hint: "Even at EMI / neobank scale, the CEO / single senior person needs cover.",
      status: longestChain >= 1 ? "met" : "unmet",
      fixHref: "/org/roles",
      fixLabel: "Set deputy",
    });

    items.push({
      id: "ibs-register-coverage-t3",
      label: "≥ 1 Important Business Service in the register",
      hint: "Start with the headline customer service — onboarding, deposits, payments.",
      status: ibsTotal >= 1 ? "met" : "unmet",
      fixHref: "/ibs",
      fixLabel: "Add an IBS",
    });

    items.push({
      id: "contact-details-completeness",
      label: "Every member has a job title on file",
      hint: "A small team makes name + role enough — but the role title must be set.",
      status:
        members.length === 0
          ? "unmet"
          : withJobTitle.length === members.length
            ? "met"
            : withJobTitle.length / members.length >= 0.5
              ? "partial"
              : "unmet",
      fixHref: "/org",
      fixLabel: "Open members",
    });
  }

  // ── Tier-unset prompt ────────────────────────────────────────────────
  if (!tier) {
    items.push({
      id: "set-tier",
      label: "Pick a firm tier to unlock tier-specific minimums",
      hint: "TIER_1 / TIER_2 / TIER_3 changes which seats, deputies and IBS coverage are expected.",
      status: "unmet",
      fixHref: "/settings",
      fixLabel: "Open settings",
    });
  }

  const metCount = items.filter((i) => i.status === "met").length;
  return {
    tier,
    tierLabel: TIER_LABEL[tierKey],
    tierPitch: TIER_PITCH[tierKey],
    items,
    metCount,
    totalCount: items.length,
  };
}
