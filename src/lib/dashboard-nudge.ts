import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * The dashboard nudge — one concrete "do this next" prompt above the recap.
 * Picks the single most urgent signal from a small priority ladder so the
 * user always sees the one thing they should actually act on.
 */

export type NudgeTone = "critical" | "warn" | "info";

export type DashboardNudge = {
  /** Stable id; combined with today's date key in localStorage to dedup dismissals. */
  id: string;
  tone: NudgeTone;
  /** Short imperative sentence: subject + count + verb. */
  text: string;
  ctaLabel: string;
  ctaHref: string;
};

const DAY_MS = 86_400_000;

export async function pickNudge(orgId: string): Promise<DashboardNudge | null> {
  const now = new Date();
  const ago90 = new Date(now.getTime() - 90 * DAY_MS);

  const [
    overdueActions,
    untestedIBS,
    weakExitPlans,
    systemsNoRTO,
    exercisesLast90,
    untriagedNotifications,
  ] = await Promise.all([
    prisma.exerciseActionItem.count({
      where: {
        orgId,
        status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] },
        dueAt: { lt: now },
      },
    }),
    prisma.organizationIBS.count({
      where: { orgId, exerciseLinks: { none: {} }, status: "APPROVED" },
    }),
    prisma.vendor.count({
      where: {
        orgId,
        AND: [
          { OR: [{ isDoraCritical: true }, { tier: "TIER_1" }] },
          { OR: [{ exitPlanReviewedAt: null }, { exitPlanNotes: null }] },
        ],
      },
    }).catch(() => 0),
    prisma.techSystem.count({
      where: { orgId, rtoMin: null, tier: { in: ["CRITICAL", "ESSENTIAL"] } },
    }),
    prisma.exercise.count({
      where: { orgId, startedAt: { gte: ago90 } },
    }),
    prisma.regulatorNotification.count({
      where: {
        incident: { exercise: { orgId } },
        status: { in: ["PENDING", "IN_DRAFT", "AWAITING_APPROVAL"] },
      },
    }).catch(() => 0),
  ]);

  // Priority ladder — first match wins.
  if (overdueActions > 0) {
    return {
      id: "overdue-actions",
      tone: "critical",
      text: `${overdueActions} action item${overdueActions === 1 ? "" : "s"} overdue — chase the owners.`,
      ctaLabel: "Open overdue list",
      ctaHref: "/action-items?status=overdue",
    };
  }

  if (untriagedNotifications > 0) {
    return {
      id: "regulator-notifications",
      tone: "critical",
      text: `${untriagedNotifications} regulator notification${untriagedNotifications === 1 ? "" : "s"} sitting open.`,
      ctaLabel: "Review notifications",
      ctaHref: "/vendors/notifications",
    };
  }

  if (weakExitPlans >= 3) {
    return {
      id: "weak-exit-plans",
      tone: "warn",
      text: `${weakExitPlans} critical vendor${weakExitPlans === 1 ? "" : "s"} without a reviewed exit plan.`,
      ctaLabel: "Open vendor register",
      ctaHref: "/vendors/register",
    };
  }

  if (untestedIBS > 0) {
    return {
      id: "untested-ibs",
      tone: "warn",
      text: `${untestedIBS} approved IBS${untestedIBS === 1 ? "" : "s"} never stress-tested.`,
      ctaLabel: "Plan an exercise",
      ctaHref: "/exercises/new",
    };
  }

  if (systemsNoRTO > 0) {
    return {
      id: "no-rto",
      tone: "warn",
      text: `${systemsNoRTO} critical system${systemsNoRTO === 1 ? "" : "s"} without an RTO declared.`,
      ctaLabel: "Open tech recovery",
      ctaHref: "/tech-recovery",
    };
  }

  if (exercisesLast90 === 0) {
    return {
      id: "quiet-tempo",
      tone: "info",
      text: "No exercises run in the last 90 days — schedule the next one.",
      ctaLabel: "Plan an exercise",
      ctaHref: "/exercises/new",
    };
  }

  return null;
}
