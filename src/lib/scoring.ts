import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Performance scoring derived from the data captured during an exercise.
 *
 * The framing: this is a *simulator* — the score isn't a punishment, it's
 * feedback. Each metric maps to a specific Afin policy clause (IMP §6.2.2,
 * §6.3.0, §6.3.1.2, §6.4.1) so coaching is concrete, not vibes.
 *
 * Scoring is per-incident and aggregates at the exercise level.
 */

export type CoachingLevel = "good" | "ok" | "warn" | "critical";

export type CoachingItem = {
  id: string;
  level: CoachingLevel;
  /** What happened (or didn't), measured. */
  finding: string;
  /** Policy citation. */
  clause: string;
  /** What the team should do differently next time. */
  recommendation?: string;
};

export type IncidentScore = {
  incidentId: string;
  shortCode: string;
  invokedAt: Date | null;
  closedAt: Date | null;
  /** 0–100. Average of the underlying scored metrics. */
  overall: number;
  metrics: {
    invocationLatencyMin: number | null;
    severityLatencyMin: number | null;
    regulatorBreaches: number;
    cascadeViolations: number;
    decisionsLogged: number;
    sitrepsLogged: number;
    imtMeetingsLogged: number;
    readCoveragePct: number;
    mobilisationCoveragePct: number;
  };
  coaching: CoachingItem[];
};

/**
 * The "first signal" is the earliest released event/inject. The "stand-up
 * latency" is the gap between first signal and IMT invocation. Per IMP
 * §6.2.2, "it is better to stand it up and back down than to fail to stand
 * it up" — so we reward fast invocation.
 */
const INVOCATION_THRESHOLDS = { good: 5, ok: 15, warn: 30 };

/**
 * After invocation, the IMT should classify severity quickly so the
 * regulator clocks know whether to start.
 */
const SEVERITY_THRESHOLDS = { good: 10, ok: 20, warn: 45 };

export async function scoreIncident(incidentId: string): Promise<IncidentScore | null> {
  const incident = await prisma.incident.findUnique({
    where: { id: incidentId },
    include: {
      exercise: {
        include: {
          eventReleases: { orderBy: { releasedAt: "asc" }, take: 1 },
          injectReleases: { orderBy: { releasedAt: "asc" }, take: 1 },
          participants: { select: { id: true, mobilisationStatus: true, exerciseRole: true } },
        },
      },
      decisions: true,
      sitreps: true,
      imtMeetings: true,
      regulatorNotifications: true,
      comms: true,
    },
  });
  if (!incident) return null;

  const firstReleaseAt =
    [
      incident.exercise.eventReleases[0]?.releasedAt,
      incident.exercise.injectReleases[0]?.releasedAt,
    ]
      .filter(Boolean)
      .sort((a, b) => (a as Date).getTime() - (b as Date).getTime())[0] ?? null;

  // — Invocation latency (signal → invokedAt)
  const invocationLatencyMin =
    firstReleaseAt && incident.invokedAt
      ? Math.max(0, Math.round((incident.invokedAt.getTime() - (firstReleaseAt as Date).getTime()) / 60000))
      : null;

  // — Severity latency (invokedAt → severityAssessedAt)
  const severityLatencyMin =
    incident.invokedAt && incident.severityAssessedAt
      ? Math.max(0, Math.round((incident.severityAssessedAt.getTime() - incident.invokedAt.getTime()) / 60000))
      : null;

  // — Regulator clock breaches (dueAt passed, not SENT or WAIVED)
  const now = new Date();
  const regulatorBreaches = incident.regulatorNotifications.filter(
    (n) => n.dueAt < now && n.status !== "SENT" && n.status !== "WAIVED",
  ).length;

  // — Cascade violations: we don't store violations, but rejected comms are a
  //   reasonable proxy — drafts that hit REJECTED have something material wrong.
  const cascadeViolations = incident.comms.filter((c) => c.status === "REJECTED").length;

  // — Read coverage across released addressed messages
  const readCoverage = await computeReadCoverage(incident.exerciseId);

  // — Mobilisation coverage: % of participants now MOBILISED or DEPUTY_STEPPED_UP
  const eligible = incident.exercise.participants.filter((p) => p.exerciseRole !== "OBSERVER");
  const mobilised = eligible.filter(
    (p) => p.mobilisationStatus === "MOBILISED" || p.mobilisationStatus === "DEPUTY_STEPPED_UP",
  ).length;
  const mobilisationCoveragePct = eligible.length === 0 ? 100 : Math.round((mobilised / eligible.length) * 100);

  const metrics: IncidentScore["metrics"] = {
    invocationLatencyMin,
    severityLatencyMin,
    regulatorBreaches,
    cascadeViolations,
    decisionsLogged: incident.decisions.length,
    sitrepsLogged: incident.sitreps.length,
    imtMeetingsLogged: incident.imtMeetings.length,
    readCoveragePct: readCoverage,
    mobilisationCoveragePct,
  };

  // ── Coaching ───────────────────────────────────────────────────────────
  const coaching: CoachingItem[] = [];

  if (invocationLatencyMin === null) {
    coaching.push({
      id: "invocation-missing",
      level: "critical",
      finding: "Incident not yet invoked.",
      clause: "Afin IMP §6.2.2",
      recommendation:
        "If a signal addressed to a senior role is in the inbox, the IMT should be stood up. 'Better to stand it up and back down than to fail to stand it up.'",
    });
  } else {
    const level: CoachingLevel =
      invocationLatencyMin <= INVOCATION_THRESHOLDS.good
        ? "good"
        : invocationLatencyMin <= INVOCATION_THRESHOLDS.ok
          ? "ok"
          : invocationLatencyMin <= INVOCATION_THRESHOLDS.warn
            ? "warn"
            : "critical";
    coaching.push({
      id: "invocation-latency",
      level,
      finding: `IMT invoked ${invocationLatencyMin} minute${invocationLatencyMin === 1 ? "" : "s"} after first signal.`,
      clause: "Afin IMP §6.2.2",
      recommendation:
        level === "good"
          ? "Fast call — the regulator timeline will read cleanly."
          : `Target ≤ ${INVOCATION_THRESHOLDS.good} minutes. Earlier invocation gives the IMT room to back down if needed; late invocation costs you regulator trust.`,
    });
  }

  if (severityLatencyMin !== null) {
    const level: CoachingLevel =
      severityLatencyMin <= SEVERITY_THRESHOLDS.good
        ? "good"
        : severityLatencyMin <= SEVERITY_THRESHOLDS.ok
          ? "ok"
          : severityLatencyMin <= SEVERITY_THRESHOLDS.warn
            ? "warn"
            : "critical";
    coaching.push({
      id: "severity-latency",
      level,
      finding: `Severity classified ${severityLatencyMin} minute${severityLatencyMin === 1 ? "" : "s"} after invocation.`,
      clause: "Afin IMP §6.2.1",
      recommendation:
        level === "good"
          ? "Quick classification — regulator clocks started cleanly."
          : `Target ≤ ${SEVERITY_THRESHOLDS.good} min. Severity gates the regulator notification clock and the IMT cadence — don't leave it open.`,
    });
  } else if (incident.invokedAt) {
    coaching.push({
      id: "severity-missing",
      level: "warn",
      finding: "Severity not classified.",
      clause: "Afin IMP §6.2.1",
      recommendation:
        "Run the five-dimension matrix. Without a severity call the regulator clocks haven't started and the IMT can't size its response.",
    });
  }

  if (regulatorBreaches > 0) {
    coaching.push({
      id: "regulator-breach",
      level: "critical",
      finding: `${regulatorBreaches} regulator notification clock${regulatorBreaches === 1 ? "" : "s"} breached.`,
      clause: "Afin IMP §6.3.1.2",
      recommendation:
        "FCA + PRA notifications must go within 4 hours of IMT invocation for High severity. ICO is 72 hours from awareness. If you can't send, file a documented waiver.",
    });
  }

  if (incident.severity === "HIGH" && incident.decisions.length < 3) {
    coaching.push({
      id: "decisions-thin",
      level: "warn",
      finding: `Only ${incident.decisions.length} formal decision${incident.decisions.length === 1 ? "" : "s"} logged on a High-severity incident.`,
      clause: "Afin IMP §6.4.1",
      recommendation:
        "A High-severity incident typically generates 5–10 structured decisions (invoke, classify, activate BCP, notify FCA, approve comms, etc.). Capture them as Decisions, not Notes — the regulator wants authority + rationale.",
    });
  }

  if (incident.invokedAt && incident.sitreps.length === 0) {
    coaching.push({
      id: "sitreps-missing",
      level: "warn",
      finding: "No sitreps filed.",
      clause: "Afin BCP §6.4.3.1",
      recommendation:
        "IMT requires an initial sitrep from each business unit on invocation. File a GREEN / AMBER / RED with summary + issues + asks.",
    });
  }

  if (incident.invokedAt && incident.imtMeetings.length === 0) {
    coaching.push({
      id: "imt-meeting-missing",
      level: "warn",
      finding: "No IMT meeting recorded.",
      clause: "Afin IMP §6.2.5",
      recommendation:
        "Standing agenda: situation, decisions, actions, next-meeting time. Even a 5-minute meeting recorded as a meeting is more defensible than no record.",
    });
  }

  if (cascadeViolations > 0) {
    coaching.push({
      id: "cascade-violation",
      level: "warn",
      finding: `${cascadeViolations} communication draft${cascadeViolations === 1 ? "" : "s"} rejected.`,
      clause: "Afin IMP §6.3.0",
      recommendation:
        "Cascade ordering rule: Employees BEFORE customers / third parties. Most rejections happen because the cascade was attempted out of order.",
    });
  }

  if (mobilisationCoveragePct < 60 && incident.invokedAt) {
    coaching.push({
      id: "mobilisation-thin",
      level: "warn",
      finding: `Only ${mobilisationCoveragePct}% of the roster has mobilised.`,
      clause: "Afin IMP §6.2.3",
      recommendation:
        "On invocation, every IMT seat should mobilise (or mark unreachable so the deputy steps up). Low mobilisation often signals an unrehearsed call tree.",
    });
  }

  if (readCoverage < 70 && incident.invokedAt) {
    coaching.push({
      id: "read-coverage-thin",
      level: "warn",
      finding: `${readCoverage}% of addressed messages have been read.`,
      clause: "Afin IMP §6.4.1",
      recommendation:
        "If addressed participants aren't reading, they can't act. Check whether email notifications are firing or whether participants are using the live workspace.",
    });
  }

  // ── Overall score ─────────────────────────────────────────────────────
  const scores: number[] = [];
  scores.push(scoreFromCoaching(coaching, "invocation-latency", "invocation-missing"));
  scores.push(scoreFromCoaching(coaching, "severity-latency", "severity-missing"));
  scores.push(scoreFromCoaching(coaching, "regulator-breach"));
  scores.push(scoreFromCoaching(coaching, "decisions-thin"));
  scores.push(scoreFromCoaching(coaching, "sitreps-missing"));
  scores.push(scoreFromCoaching(coaching, "imt-meeting-missing"));
  scores.push(scoreFromCoaching(coaching, "cascade-violation"));
  scores.push(scoreFromCoaching(coaching, "mobilisation-thin"));
  scores.push(scoreFromCoaching(coaching, "read-coverage-thin"));

  const overall = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);

  return {
    incidentId,
    shortCode: incident.shortCode,
    invokedAt: incident.invokedAt,
    closedAt: incident.closedAt,
    overall,
    metrics,
    coaching: coaching.sort((a, b) => LEVEL_ORDER[b.level] - LEVEL_ORDER[a.level]),
  };
}

const LEVEL_ORDER: Record<CoachingLevel, number> = { critical: 3, warn: 2, ok: 1, good: 0 };

/** Convert a coaching level into a 0-100 contribution. Absent finding = 100 (no penalty). */
function scoreFromCoaching(items: CoachingItem[], ...ids: string[]): number {
  const found = items.find((i) => ids.includes(i.id));
  if (!found) return 100;
  switch (found.level) {
    case "good":
      return 100;
    case "ok":
      return 75;
    case "warn":
      return 50;
    case "critical":
      return 20;
  }
}

async function computeReadCoverage(exerciseId: string): Promise<number> {
  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      participants: true,
      scenario: { include: { events: true, injects: true } },
      eventReleases: true,
      injectReleases: true,
    },
  });
  if (!exercise) return 0;

  const releasedEventIds = new Set(exercise.eventReleases.map((r) => r.eventId));
  const releasedInjectIds = new Set(exercise.injectReleases.map((r) => r.injectId));

  type Item = { id: string; kind: "EVENT" | "INJECT"; toRoleTitles: string[]; ccRoleTitles: string[] };
  const items: Item[] = [
    ...exercise.scenario.events.filter((e) => releasedEventIds.has(e.id)).map((e) => ({
      id: e.id,
      kind: "EVENT" as const,
      toRoleTitles: e.toRoleTitles,
      ccRoleTitles: e.ccRoleTitles,
    })),
    ...exercise.scenario.injects.filter((j) => releasedInjectIds.has(j.id)).map((j) => ({
      id: j.id,
      kind: "INJECT" as const,
      toRoleTitles: j.toRoleTitles,
      ccRoleTitles: j.ccRoleTitles,
    })),
  ];

  let addressed = 0;
  for (const it of items) {
    const toLower = new Set(it.toRoleTitles.map((r) => r.toLowerCase()));
    const ccLower = new Set(it.ccRoleTitles.map((r) => r.toLowerCase()));
    for (const p of exercise.participants) {
      const r = p.roleTitle.toLowerCase();
      if (toLower.has(r) || ccLower.has(r)) addressed += 1;
    }
  }
  if (addressed === 0) return 100;

  const [eventReceipts, injectReceipts] = await Promise.all([
    prisma.eventReceipt.findMany({
      where: { event: { scenarioId: exercise.scenarioId }, participant: { exerciseId } },
      select: { eventId: true, participantId: true },
    }),
    prisma.injectReceipt.findMany({
      where: { inject: { scenarioId: exercise.scenarioId }, participant: { exerciseId } },
      select: { injectId: true, participantId: true },
    }),
  ]);
  const read = eventReceipts.length + injectReceipts.length;
  return Math.min(100, Math.round((read / addressed) * 100));
}
