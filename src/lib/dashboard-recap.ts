import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * "Since you were last here" dashboard recap.
 *
 * Computes the deltas between the user's previous `lastDashboardVisitAt`
 * stamp and now. The dashboard page leads with these items so the admin
 * sees what changed since their last visit — not just the static state.
 *
 * Cooldown rule: the dashboard bumps `lastDashboardVisitAt` only when
 * the existing stamp is ≥ 4h old (or null). A quick refresh keeps the
 * recap meaningful instead of resetting to "nothing changed".
 */

const STALE_AFTER_MS = 4 * 60 * 60 * 1000;

export type RecapTone = "ok" | "info" | "warn" | "critical";

export type RecapItem = {
  /** Stable key for React render. */
  id: string;
  /** Icon key — resolved by the renderer (lucide-react). */
  icon:
    | "ibs"
    | "exercise"
    | "regulator"
    | "sitrep"
    | "decision"
    | "trophy"
    | "dr"
    | "runbook"
    | "action"
    | "vendor"
    | "sparkles";
  /** One-liner shown in the recap card. */
  text: string;
  /** Deep link the row navigates to. */
  href: string;
  tone: RecapTone;
};

export type DashboardRecap = {
  /** The cut-point used. Null when this is the user's first visit. */
  since: Date | null;
  /** Days between `since` and now (rounded). */
  daysSince: number | null;
  /** Ordered, most-noteworthy first. Capped at ~8. */
  items: RecapItem[];
  /** Human label for the cut point — "Tuesday", "last week", "your first visit". */
  sinceLabel: string;
  /** True if there's nothing meaningful in this window. */
  isQuiet: boolean;
};

/**
 * Build the recap. `since` is the user's previous visit timestamp (may be null).
 */
export async function buildDashboardRecap({
  orgId,
  since,
}: {
  orgId: string;
  since: Date | null;
}): Promise<DashboardRecap> {
  const now = new Date();

  // First-time visit — no delta to compute.
  if (!since) {
    return {
      since: null,
      daysSince: null,
      items: [],
      sinceLabel: "your first visit",
      isQuiet: true,
    };
  }

  const daysSince = Math.max(1, Math.round((now.getTime() - since.getTime()) / 86_400_000));

  const [
    ibsAdded,
    exercisesCompleted,
    notificationsSent,
    notificationsBreached,
    sitrepsFiled,
    decisionsLogged,
    achievementsUnlocked,
    drTestsRun,
    runbooksCompleted,
    actionsClosed,
    vendorsAdded,
    bcpActivations,
  ] = await Promise.all([
    prisma.organizationIBS.count({ where: { orgId, createdAt: { gte: since } } }),
    prisma.exercise.count({
      where: { orgId, status: "COMPLETED", completedAt: { gte: since } },
    }),
    prisma.regulatorNotification.count({
      where: { incident: { exercise: { orgId } }, sentAt: { gte: since } },
    }),
    prisma.regulatorNotification.count({
      where: {
        incident: { exercise: { orgId } },
        status: "BREACHED",
        updatedAt: { gte: since },
      },
    }),
    prisma.sitrep.count({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: since } },
    }),
    prisma.decisionRecord.count({
      where: { incident: { exercise: { orgId } }, createdAt: { gte: since } },
    }),
    prisma.achievementUnlock.count({
      where: { orgId, unlockedAt: { gte: since } },
    }),
    prisma.dRTest.count({ where: { system: { orgId }, testedAt: { gte: since } } }),
    prisma.runbookExecution.count({
      where: {
        incident: { exercise: { orgId } },
        status: "COMPLETE",
        completedAt: { gte: since },
      },
    }),
    prisma.exerciseActionItem.count({
      where: {
        orgId,
        OR: [{ status: "DONE" }, { status: "WONT_FIX" }],
        updatedAt: { gte: since },
      },
    }),
    prisma.vendor.count({ where: { orgId, createdAt: { gte: since } } }),
    prisma.bCPActivation.count({
      where: { incident: { exercise: { orgId } }, activatedAt: { gte: since } },
    }),
  ]);

  const items: RecapItem[] = [];

  if (notificationsBreached > 0) {
    items.push({
      id: "reg-breached",
      icon: "regulator",
      text: pluralize(notificationsBreached, "regulator clock", "regulator clocks") + " breached",
      href: "/analytics?audience=executive",
      tone: "critical",
    });
  }
  if (bcpActivations > 0) {
    items.push({
      id: "bcp",
      icon: "exercise",
      text: pluralize(bcpActivations, "BCP activation", "BCP activations"),
      href: "/exercises",
      tone: "warn",
    });
  }
  if (exercisesCompleted > 0) {
    items.push({
      id: "exercises",
      icon: "exercise",
      text: pluralize(exercisesCompleted, "exercise completed", "exercises completed"),
      href: "/exercises",
      tone: "ok",
    });
  }
  if (achievementsUnlocked > 0) {
    items.push({
      id: "achievements",
      icon: "trophy",
      text: pluralize(achievementsUnlocked, "achievement", "achievements") + " unlocked",
      href: "/achievements",
      tone: "ok",
    });
  }
  if (notificationsSent > 0) {
    items.push({
      id: "reg-sent",
      icon: "regulator",
      text: pluralize(notificationsSent, "regulator clock", "regulator clocks") + " SENT",
      href: "/analytics?audience=executive",
      tone: "ok",
    });
  }
  if (ibsAdded > 0) {
    items.push({
      id: "ibs",
      icon: "ibs",
      text: pluralize(ibsAdded, "IBS added", "IBSs added"),
      href: "/ibs",
      tone: "info",
    });
  }
  if (vendorsAdded > 0) {
    items.push({
      id: "vendors",
      icon: "vendor",
      text: pluralize(vendorsAdded, "vendor", "vendors") + " added",
      href: "/vendors",
      tone: "info",
    });
  }
  if (runbooksCompleted > 0) {
    items.push({
      id: "runbooks",
      icon: "runbook",
      text: pluralize(runbooksCompleted, "runbook", "runbooks") + " completed",
      href: "/runbooks",
      tone: "ok",
    });
  }
  if (drTestsRun > 0) {
    items.push({
      id: "dr",
      icon: "dr",
      text: pluralize(drTestsRun, "DR test", "DR tests") + " logged",
      href: "/tech-recovery",
      tone: "ok",
    });
  }
  if (sitrepsFiled > 0) {
    items.push({
      id: "sitreps",
      icon: "sitrep",
      text: pluralize(sitrepsFiled, "sitrep filed", "sitreps filed"),
      href: "/exercises",
      tone: "info",
    });
  }
  if (decisionsLogged > 0) {
    items.push({
      id: "decisions",
      icon: "decision",
      text: pluralize(decisionsLogged, "decision logged", "decisions logged"),
      href: "/exercises",
      tone: "info",
    });
  }
  if (actionsClosed > 0) {
    items.push({
      id: "actions",
      icon: "action",
      text: pluralize(actionsClosed, "action item closed", "action items closed"),
      href: "/action-items",
      tone: "ok",
    });
  }

  return {
    since,
    daysSince,
    items: items.slice(0, 8),
    sinceLabel: formatSinceLabel(since, now, daysSince),
    isQuiet: items.length === 0,
  };
}

/**
 * Bump the user's `lastDashboardVisitAt` to *now* — but only when the
 * existing value is null or ≥ 4h old. Returns the timestamp the recap
 * should use as its cut point (the *previous* value, not `now`), so a
 * mid-session refresh keeps surfacing the same delta.
 */
export async function consumeRecapCutPoint(userId: string): Promise<Date | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastDashboardVisitAt: true },
  });
  if (!user) return null;
  const now = new Date();
  const prior = user.lastDashboardVisitAt;
  const isStale =
    prior === null || now.getTime() - prior.getTime() >= STALE_AFTER_MS;
  if (isStale) {
    // Fire-and-forget; the read above already returned the prior value.
    await prisma.user.update({
      where: { id: userId },
      data: { lastDashboardVisitAt: now },
    });
  }
  return prior;
}

function pluralize(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

function formatSinceLabel(since: Date, now: Date, days: number): string {
  if (days === 1) return "yesterday";
  if (days === 0) return "earlier today";
  if (days < 7) {
    // Day of the week.
    return since.toLocaleDateString("en-GB", { weekday: "long" });
  }
  if (days < 14) return "last week";
  if (days < 30) return `${Math.round(days / 7)} weeks ago`;
  if (days < 365) {
    return since.toLocaleDateString("en-GB", { month: "long", day: "numeric" });
  }
  return since.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}
