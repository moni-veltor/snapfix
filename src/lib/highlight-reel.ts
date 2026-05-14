import "server-only";
import { prisma } from "@/lib/prisma";

export type Highlight = {
  id: string;
  at: Date;
  /** Headline — the moment in a sentence. */
  text: string;
  /** Why this moment matters — coaching context. */
  detail?: string;
  tone: "ok" | "warn" | "critical" | "info";
  /** Optional D-Day time (HH:MM) at which it happened. */
  dDayTime?: string;
};

/**
 * Generate the "key moments" of an exercise — used for the post-exercise
 * highlight reel on the debrief page. Curates from incident lifecycle,
 * decisions, sitreps, comms cascade, regulator clocks. Returns chronological.
 */
export async function buildHighlightReel(exerciseId: string): Promise<Highlight[]> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      incidents: {
        include: {
          decisions: { orderBy: { createdAt: "asc" } },
          sitreps: { orderBy: { createdAt: "asc" } },
          imtMeetings: { orderBy: { createdAt: "asc" } },
          regulatorNotifications: true,
          bcpActivations: true,
        },
      },
      eventReleases: { orderBy: { releasedAt: "asc" }, take: 1 },
      injectReleases: { orderBy: { releasedAt: "asc" }, take: 1 },
      comms: { where: { status: "SENT" }, orderBy: { sentAt: "asc" } },
    },
  });
  if (!exercise) return [];

  const out: Highlight[] = [];

  // Earliest signal
  const firstSignal =
    [exercise.eventReleases[0]?.releasedAt, exercise.injectReleases[0]?.releasedAt]
      .filter(Boolean)
      .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] ?? null;
  if (firstSignal) {
    out.push({
      id: "first-signal",
      at: firstSignal as Date,
      text: "First signal hit the inbox",
      detail: "The moment the addressed participants first knew something was wrong.",
      tone: "info",
    });
  }

  for (const inc of exercise.incidents) {
    if (inc.invokedAt) {
      const min = firstSignal
        ? Math.round((inc.invokedAt.getTime() - (firstSignal as Date).getTime()) / 60000)
        : null;
      out.push({
        id: `inc-${inc.id}-invoke`,
        at: inc.invokedAt,
        text: `🚨 IMT invoked — ${inc.shortCode}`,
        detail:
          min !== null
            ? `${min}m after the first signal. ${inc.invocationRationale ?? ""}`.trim()
            : (inc.invocationRationale ?? undefined),
        tone: "critical",
      });
    }
    if (inc.severityAssessedAt && inc.severity) {
      const min = inc.invokedAt
        ? Math.round((inc.severityAssessedAt.getTime() - inc.invokedAt.getTime()) / 60000)
        : null;
      out.push({
        id: `inc-${inc.id}-sev`,
        at: inc.severityAssessedAt,
        text: `Severity classified as ${inc.severity}`,
        detail:
          min !== null
            ? `${min}m after invocation${inc.cyberDefaultHigh ? " · Cyber default rule applied" : inc.consumerDutyTrigger ? " · Consumer Duty trigger" : ""}`
            : undefined,
        tone: inc.severity === "HIGH" ? "critical" : inc.severity === "MEDIUM" ? "warn" : "info",
      });
    }
    for (const bcp of inc.bcpActivations) {
      out.push({
        id: `bcp-${bcp.id}`,
        at: bcp.activatedAt,
        text: "Business Continuity activated",
        detail: "Joint CEO + CRO decision per BCP §6.4.2.2.",
        tone: "warn",
      });
    }
    for (const n of inc.regulatorNotifications) {
      if (n.sentAt) {
        out.push({
          id: `reg-${n.id}`,
          at: n.sentAt,
          text: `${n.regulator} notification sent`,
          detail: n.trigger,
          tone: "ok",
        });
      } else if (n.dueAt.getTime() < Date.now() && n.status !== "WAIVED") {
        out.push({
          id: `reg-breach-${n.id}`,
          at: n.dueAt,
          text: `${n.regulator} notification clock breached`,
          detail: n.trigger,
          tone: "critical",
        });
      }
    }
    // First sitrep — useful signal of team rhythm
    const firstSitrep = inc.sitreps[0];
    if (firstSitrep) {
      out.push({
        id: `sitrep-first-${inc.id}`,
        at: firstSitrep.createdAt,
        text: `First sitrep filed — ${firstSitrep.businessUnit} ${firstSitrep.status}`,
        detail: firstSitrep.summary.slice(0, 120),
        tone: firstSitrep.status === "RED" ? "critical" : firstSitrep.status === "AMBER" ? "warn" : "ok",
      });
    }
    // First IMT meeting
    const firstMeeting = inc.imtMeetings[0];
    if (firstMeeting) {
      out.push({
        id: `meeting-first-${inc.id}`,
        at: firstMeeting.createdAt,
        text: `First IMT meeting recorded`,
        detail: firstMeeting.nextMeetingDDay
          ? `Next meeting scheduled for D-Day ${firstMeeting.nextMeetingDDay}.`
          : undefined,
        tone: "info",
      });
    }
    if (inc.closedAt) {
      const min = inc.invokedAt
        ? Math.round((inc.closedAt.getTime() - inc.invokedAt.getTime()) / 60000)
        : null;
      out.push({
        id: `inc-${inc.id}-close`,
        at: inc.closedAt,
        text: `🏁 Incident closed — ${inc.shortCode}`,
        detail: min !== null ? `Total open-to-close: ${min}m. Five closure criteria satisfied.` : undefined,
        tone: "ok",
      });
    }
  }

  // First sent comms — moment the public learned
  const firstCustomerComms = exercise.comms.find(
    (c) => c.stakeholder === "CUSTOMERS" && c.sentAt,
  );
  if (firstCustomerComms?.sentAt) {
    out.push({
      id: `comms-${firstCustomerComms.id}`,
      at: firstCustomerComms.sentAt,
      text: "First customer communication sent",
      detail: firstCustomerComms.subject,
      tone: "info",
    });
  }

  // Sort chronologically
  out.sort((a, b) => a.at.getTime() - b.at.getTime());
  return out;
}
