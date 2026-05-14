import "server-only";
import { prisma } from "@/lib/prisma";

export type NudgeSeverity = "critical" | "warn" | "info";

export type Nudge = {
  id: string;
  severity: NudgeSeverity;
  /** Headline — 1 short line. */
  text: string;
  /** Optional sub-line giving the why or policy citation. */
  detail?: string;
  /** Where to go to act on this nudge. */
  href?: string;
  /** Optional CTA label override. */
  cta?: string;
};

/**
 * Compute next-best-action nudges for a user on the live workspace.
 * The platform behaves like a third operator: surfaces what the team
 * should be doing next, not waiting to be asked.
 */
export async function computeNudges(input: {
  exerciseId: string;
  userId: string;
  /** D-Day HH:MM at the moment of computation. */
  clockHHMM: string;
  /** The user's currently-held seat abbreviation, if any. */
  mySeatAbbreviation: string | null;
}): Promise<Nudge[]> {
  const { exerciseId, userId, mySeatAbbreviation } = input;

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      scenario: {
        include: {
          events: { orderBy: { eventNo: "asc" } },
          injects: { orderBy: { injectNo: "asc" } },
        },
      },
      eventReleases: true,
      injectReleases: true,
      incidents: {
        orderBy: { invokedAt: "desc" },
        take: 1,
        include: {
          sitreps: true,
          imtMeetings: { orderBy: { createdAt: "desc" }, take: 1 },
          regulatorNotifications: true,
          decisions: true,
        },
      },
      seats: { include: { role: { select: { abbreviation: true } } } },
    },
  });
  if (!exercise) return [];

  const out: Nudge[] = [];
  const now = new Date();
  const incident = exercise.incidents[0] ?? null;
  const inProgress = exercise.status === "IN_PROGRESS";

  // ─── Inbox: messages addressed to my seat that are unread ─────────────────
  if (mySeatAbbreviation) {
    const releasedEventIds = new Set(exercise.eventReleases.map((r) => r.eventId));
    const releasedInjectIds = new Set(exercise.injectReleases.map((r) => r.injectId));
    const mySeatLower = mySeatAbbreviation.toLowerCase();
    const addressedReleased = [
      ...exercise.scenario.events.filter((e) => {
        if (!releasedEventIds.has(e.id)) return false;
        return [...e.toRoleTitles, ...e.ccRoleTitles].some(
          (r) => r.toLowerCase() === mySeatLower,
        );
      }).map((e) => ({ kind: "EVENT" as const, id: e.id })),
      ...exercise.scenario.injects.filter((j) => {
        if (!releasedInjectIds.has(j.id)) return false;
        return [...j.toRoleTitles, ...j.ccRoleTitles].some(
          (r) => r.toLowerCase() === mySeatLower,
        );
      }).map((j) => ({ kind: "INJECT" as const, id: j.id })),
    ];
    if (addressedReleased.length > 0) {
      const participant = await prisma.exerciseParticipant.findFirst({
        where: { exerciseId, userId },
        select: { id: true },
      });
      if (participant) {
        const [eventReceipts, injectReceipts] = await Promise.all([
          prisma.eventReceipt.findMany({
            where: { participantId: participant.id, eventId: { in: addressedReleased.filter((a) => a.kind === "EVENT").map((a) => a.id) } },
            select: { eventId: true },
          }),
          prisma.injectReceipt.findMany({
            where: { participantId: participant.id, injectId: { in: addressedReleased.filter((a) => a.kind === "INJECT").map((a) => a.id) } },
            select: { injectId: true },
          }),
        ]);
        const readE = new Set(eventReceipts.map((r) => r.eventId));
        const readI = new Set(injectReceipts.map((r) => r.injectId));
        const unread = addressedReleased.filter((a) =>
          a.kind === "EVENT" ? !readE.has(a.id) : !readI.has(a.id),
        );
        if (unread.length > 0) {
          out.push({
            id: "unread-inbox",
            severity: "warn",
            text: `${unread.length} unread message${unread.length === 1 ? "" : "s"} for the ${mySeatAbbreviation} seat`,
            detail: "Addressed to you — your team needs you to read and respond",
            cta: "Open inbox",
          });
        }
      }
    }
  } else if (inProgress) {
    out.push({
      id: "no-seat",
      severity: "info",
      text: "Pick a seat to join the exercise",
      detail: "You haven't claimed a role yet — pick one to start receiving addressed messages",
    });
  }

  // ─── Incident lifecycle nudges ────────────────────────────────────────────
  if (!incident && inProgress && exercise.eventReleases.length + exercise.injectReleases.length > 0) {
    out.push({
      id: "imt-not-invoked",
      severity: "critical",
      text: "🚨 Stand up the IMT?",
      detail: "Events have been released but no incident has been invoked. Per IMP §6.2.2, better to stand it up and back down than to fail to.",
    });
  }

  if (incident && incident.invokedAt && !incident.severityAssessedAt) {
    out.push({
      id: "severity-pending",
      severity: "warn",
      text: "Classify severity",
      detail: "The IMT is invoked but severity hasn't been set. Until it is, regulator clocks don't start.",
    });
  }

  if (incident && incident.invokedAt && incident.sitreps.length === 0) {
    out.push({
      id: "no-sitreps",
      severity: "warn",
      text: "File the first sitrep",
      detail: "Afin BCP §6.4.3.1 — IMT requires an initial sitrep from each business unit on invocation.",
    });
  }

  if (incident && incident.invokedAt && incident.imtMeetings.length === 0) {
    const minutesSinceInvocation = Math.round(
      (now.getTime() - incident.invokedAt.getTime()) / 60000,
    );
    if (minutesSinceInvocation > 10) {
      out.push({
        id: "first-meeting",
        severity: "warn",
        text: "Record the first IMT meeting",
        detail: `It's been ${minutesSinceInvocation}m since invocation. Standing agenda: situation / decisions / actions / next meeting.`,
      });
    }
  }

  // — Next IMT meeting overdue
  if (incident && incident.imtMeetings.length > 0) {
    const last = incident.imtMeetings[0];
    if (last.nextMeetingDDay) {
      // Compare last.nextMeetingDDay with current D-Day clock
      const [nh, nm] = last.nextMeetingDDay.split(":").map(Number);
      const [ch, cm] = input.clockHHMM.split(":").map(Number);
      if (nh * 60 + nm < ch * 60 + cm) {
        out.push({
          id: "imt-meeting-overdue",
          severity: "warn",
          text: `IMT meeting overdue — was due at D-Day ${last.nextMeetingDDay}`,
          detail: "Standing agenda missed. Convene now or document why the cadence slipped.",
        });
      }
    }
  }

  // — Regulator clock approaching breach
  if (incident) {
    for (const n of incident.regulatorNotifications) {
      if (n.status === "SENT" || n.status === "WAIVED") continue;
      const remainingMin = Math.round((n.dueAt.getTime() - now.getTime()) / 60000);
      if (remainingMin < 0) {
        out.push({
          id: `reg-breach-${n.id}`,
          severity: "critical",
          text: `${n.regulator} notification breached by ${Math.abs(remainingMin)}m`,
          detail: `${n.trigger} · owner ${n.ownerRoleTitle ?? "—"} · approver ${n.approverRoleTitle ?? "—"}`,
        });
      } else if (remainingMin < 30) {
        out.push({
          id: `reg-soon-${n.id}`,
          severity: "warn",
          text: `${n.regulator} notification due in ${remainingMin}m`,
          detail: n.trigger,
        });
      }
    }
  }

  // ─── Empty IMT seats while incident invoked ───────────────────────────────
  if (incident && incident.invokedAt) {
    const emptyExecSeats = exercise.seats.filter(
      (s) => s.status === "EMPTY" && ["CEO", "CRO", "CTO", "CCO"].includes(s.role.abbreviation),
    );
    if (emptyExecSeats.length > 0) {
      out.push({
        id: "empty-exec-seats",
        severity: "warn",
        text: `${emptyExecSeats.length} executive seat${emptyExecSeats.length === 1 ? "" : "s"} unfilled`,
        detail: `Empty: ${emptyExecSeats.map((s) => s.role.abbreviation).join(", ")}. Deputies should step up.`,
      });
    }
  }

  return out.sort(
    (a, b) => SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity],
  );
}

const SEVERITY_ORDER: Record<NudgeSeverity, number> = { critical: 3, warn: 2, info: 1 };
