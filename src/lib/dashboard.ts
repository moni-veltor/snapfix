/**
 * Dashboard score + headline picker. Derives a composite "Resilience Pulse"
 * from coverage, hygiene, cadence and depth — and picks the single most
 * important thing to flag at the top of the page.
 */

export type PulseInput = {
  ibsTotal: number;
  ibsTested: number;
  actionItemsTotal: number;
  actionItemsOverdue: number;
  exercisesLast90Days: number;
  harmTypesCovered: number;
};

export type PulseScore = {
  total: number;
  coverage: number;
  hygiene: number;
  cadence: number;
  depth: number;
  grade: "A" | "B" | "C" | "D" | "F";
  tone: "ok" | "warn" | "critical";
};

export function computePulse(input: PulseInput): PulseScore {
  const coverage = input.ibsTotal === 0 ? 0 : Math.round((input.ibsTested / input.ibsTotal) * 100);
  const hygiene =
    input.actionItemsTotal === 0
      ? 100
      : Math.max(0, Math.round(100 - (input.actionItemsOverdue / input.actionItemsTotal) * 100));
  const cadence = Math.min(100, input.exercisesLast90Days * 25);
  const depth = Math.round((input.harmTypesCovered / 6) * 100);

  const total = Math.round((coverage + hygiene + cadence + depth) / 4);
  const grade: PulseScore["grade"] =
    total >= 85 ? "A" : total >= 70 ? "B" : total >= 55 ? "C" : total >= 40 ? "D" : "F";
  const tone: PulseScore["tone"] = total >= 70 ? "ok" : total >= 50 ? "warn" : "critical";

  return { total, coverage, hygiene, cadence, depth, grade, tone };
}

export type Headline = {
  tone: "live" | "critical" | "warn" | "info" | "ok";
  eyebrow: string;
  title: string;
  body: string;
  cta: { label: string; href: string };
};

export type HeadlineInput = {
  liveExercises: { id: string; title: string }[];
  overdueActionItems: number;
  ibsTotal: number;
  exercisesLast90Days: number;
  lastExerciseAt: Date | null;
  pendingInvites: number;
  rolesConfigured: number;
};

export function pickHeadline(input: HeadlineInput, now: Date = new Date()): Headline {
  if (input.liveExercises.length > 0) {
    const ex = input.liveExercises[0];
    return {
      tone: "live",
      eyebrow: "Live now",
      title: ex.title,
      body:
        input.liveExercises.length === 1
          ? "An exercise is running. Join the war room as facilitator."
          : `${input.liveExercises.length} exercises running simultaneously.`,
      cta: { label: "Open war room", href: `/exercises/${ex.id}/facilitator` },
    };
  }

  if (input.overdueActionItems >= 5) {
    return {
      tone: "critical",
      eyebrow: "Backlog warning",
      title: `${input.overdueActionItems} action items past due`,
      body:
        "Overdue items erode credibility with the regulator at the next thematic review. Clear the backlog before scheduling another exercise.",
      cta: { label: "Clear overdue", href: "/action-items?status=overdue" },
    };
  }

  if (input.ibsTotal === 0) {
    return {
      tone: "critical",
      eyebrow: "First steps",
      title: "No IBS register yet",
      body:
        "Important Business Services are the first thing a supervisor asks for. Capture yours to unlock coverage analytics and tolerance testing.",
      cta: { label: "Add an IBS", href: "/ibs/new" },
    };
  }

  if (input.rolesConfigured < 5) {
    return {
      tone: "warn",
      eyebrow: "Setup",
      title: "Role catalogue thin",
      body:
        "Your seat catalogue has fewer than 5 roles. Add the IMT seats your firm actually uses so participants can claim them in live exercises.",
      cta: { label: "Edit roles", href: "/org/roles" },
    };
  }

  if (input.exercisesLast90Days === 0) {
    const daysSince = input.lastExerciseAt
      ? Math.floor((now.getTime() - input.lastExerciseAt.getTime()) / 86_400_000)
      : null;
    return {
      tone: "warn",
      eyebrow: "Cadence",
      title:
        daysSince === null
          ? "No exercises on record"
          : `Last exercise ${daysSince} days ago`,
      body:
        "Operational resilience leans on frequent small drills, not yearly mega-tests. Plan a focused exercise this month to keep the muscle memory.",
      cta: { label: "Plan an exercise", href: "/exercises/new" },
    };
  }

  if (input.pendingInvites >= 5) {
    return {
      tone: "info",
      eyebrow: "Roster",
      title: `${input.pendingInvites} pending invitations`,
      body:
        "Several people have been invited but haven't joined yet. Chase them or revoke stale invites — empty seats kill exercise realism.",
      cta: { label: "Review roster", href: "/org" },
    };
  }

  return {
    tone: "ok",
    eyebrow: "All steady",
    title: "Programme is humming",
    body:
      "Coverage is sound, the backlog is clean, and cadence is on track. A good week to stress-test a third-party scenario — they're the regulator's current focus.",
    cta: { label: "Browse scenarios", href: "/scenarios" },
  };
}

// ─── Next-best-actions engine ─────────────────────────────────────────────

export type NextBestAction = {
  id: string;
  priority: "critical" | "warn" | "info";
  title: string;
  body: string;
  cta: { label: string; href: string };
  iconKey:
    | "shield"
    | "flame"
    | "calendar"
    | "server"
    | "users"
    | "boxes"
    | "alert"
    | "sparkles";
  /** Rough effort to dispatch this item in minutes. Used as a relative
   *  signal on the dashboard card — quick wins float to the eye even
   *  when their priority is lower. */
  effortMin: number;
  /** Short hint of who in the org typically does the work — e.g.
   *  "ADMIN", "Facilitator", "Process owner", "Tech lead". */
  ownerHint: string;
};

export type NextBestActionsInput = {
  ibsCount: number;
  untestedIBSCount: number;
  ibsReviewDueSoon: number; // count of IBS reviews due in <= 30 days
  overdueActionItems: number;
  rolesTotal: number;
  rolesWithoutDeputy: number;
  exercisesLast90Days: number;
  oldestSystemDRTestDays: number | null; // null = never tested or no systems
  systemsWithoutRTO: number;
  weakExitPlanCriticalVendors: number;
  hyperscalerConcentration: { name: string; count: number } | null;
  pendingInvites: number;
  liveExerciseCount: number;
};

/**
 * Compute the top 5 next-best-actions a CTO should act on, ranked by
 * priority × specificity. Each one is concrete and has a verb on the CTA.
 */
export function nextBestActions(input: NextBestActionsInput): NextBestAction[] {
  const all: NextBestAction[] = [];

  if (input.liveExerciseCount > 0) {
    all.push({
      id: "join-live",
      priority: "critical",
      title: `${input.liveExerciseCount} exercise${input.liveExerciseCount === 1 ? "" : "s"} live right now`,
      body: "Join the war room or check in on the facilitator.",
      cta: { label: "Open war room", href: "/exercises" },
      iconKey: "flame",
      effortMin: 5,
      ownerHint: "Live IMT",
    });
  }

  if (input.overdueActionItems >= 10) {
    all.push({
      id: "clear-backlog",
      priority: "critical",
      title: `${input.overdueActionItems} action items past due`,
      body: "A growing backlog erodes regulator confidence and slows the next exercise. Triage today.",
      cta: { label: "Clear backlog", href: "/action-items?status=overdue" },
      iconKey: "alert",
      effortMin: 60,
      ownerHint: "Action owners",
    });
  } else if (input.overdueActionItems >= 3) {
    all.push({
      id: "clear-backlog-soft",
      priority: "warn",
      title: `${input.overdueActionItems} action items past due`,
      body: "Worth clearing before your next debrief generates more.",
      cta: { label: "Triage", href: "/action-items?status=overdue" },
      iconKey: "alert",
      effortMin: 30,
      ownerHint: "Action owners",
    });
  }

  if (input.ibsCount === 0) {
    all.push({
      id: "no-ibs",
      priority: "critical",
      title: "Capture your IBS register",
      body: "Your IBSs are the spine of the programme — and the first thing a supervisor will ask for.",
      cta: { label: "Add your first IBS", href: "/ibs/new" },
      iconKey: "shield",
      effortMin: 30,
      ownerHint: "ADMIN",
    });
  } else if (input.untestedIBSCount > 0) {
    all.push({
      id: "untested-ibs",
      priority: "warn",
      title: `${input.untestedIBSCount} IBS${input.untestedIBSCount === 1 ? "" : "s"} never stress-tested`,
      body: "Pick a scenario that covers these and plan a focused drill.",
      cta: { label: "Plan exercise", href: "/exercises/new" },
      iconKey: "shield",
      effortMin: 60,
      ownerHint: "Facilitator",
    });
  }

  if (input.oldestSystemDRTestDays !== null && input.oldestSystemDRTestDays > 365) {
    all.push({
      id: "stale-dr-test",
      priority: "critical",
      title: `DR test ${input.oldestSystemDRTestDays} days stale`,
      body: "Your oldest system DR test is over a year old. Schedule a fresh test before the next audit.",
      cta: { label: "View tech recovery", href: "/tech-recovery" },
      iconKey: "server",
      effortMin: 240,
      ownerHint: "Tech lead",
    });
  } else if (input.systemsWithoutRTO > 0) {
    all.push({
      id: "systems-without-rto",
      priority: "warn",
      title: `${input.systemsWithoutRTO} system${input.systemsWithoutRTO === 1 ? "" : "s"} without RTO`,
      body: "Declare recovery objectives so the IMT has something concrete to track against.",
      cta: { label: "Set RTOs", href: "/tech-recovery" },
      iconKey: "server",
      effortMin: 60,
      ownerHint: "Tech lead",
    });
  }

  if (input.weakExitPlanCriticalVendors > 0) {
    all.push({
      id: "weak-exit-plans",
      priority: "warn",
      title: `${input.weakExitPlanCriticalVendors} critical vendor${input.weakExitPlanCriticalVendors === 1 ? "" : "s"} have weak exit plans`,
      body: "DORA requires tested exit plans for critical third parties — paper plans aren't enough.",
      cta: { label: "Review vendors", href: "/vendors" },
      iconKey: "boxes",
      effortMin: 120,
      ownerHint: "Vendor lead",
    });
  }

  if (input.hyperscalerConcentration && input.hyperscalerConcentration.count >= 3) {
    all.push({
      id: "hyperscaler-concentration",
      priority: "warn",
      title: `${input.hyperscalerConcentration.count} vendors on ${input.hyperscalerConcentration.name}`,
      body: "Test the hyperscaler-outage scenario before the regulator asks how you'd cope.",
      cta: { label: "Browse scenarios", href: "/templates" },
      iconKey: "boxes",
      effortMin: 30,
      ownerHint: "Facilitator",
    });
  }

  if (input.ibsReviewDueSoon > 0) {
    all.push({
      id: "ibs-reviews-due",
      priority: "info",
      title: `${input.ibsReviewDueSoon} IBS review${input.ibsReviewDueSoon === 1 ? "" : "s"} due this month`,
      body: "Refresh the register so the data backing your dashboards isn't stale.",
      cta: { label: "Open IBS register", href: "/ibs" },
      iconKey: "calendar",
      effortMin: 60,
      ownerHint: "Process owner",
    });
  }

  if (input.rolesTotal > 0 && input.rolesWithoutDeputy >= Math.ceil(input.rolesTotal * 0.5)) {
    all.push({
      id: "deputy-chain",
      priority: "info",
      title: "Deputy chain is thin",
      body: `Only ${input.rolesTotal - input.rolesWithoutDeputy} of ${input.rolesTotal} roles have a deputy. Single point of failure in absences.`,
      cta: { label: "Edit role catalogue", href: "/org/roles" },
      iconKey: "users",
      effortMin: 30,
      ownerHint: "ADMIN",
    });
  }

  if (input.exercisesLast90Days === 0) {
    all.push({
      id: "no-recent-exercise",
      priority: "warn",
      title: "No exercises in the last 90 days",
      body: "Cadence builds muscle memory. Run a short drill this month, even a tabletop.",
      cta: { label: "Plan an exercise", href: "/exercises/new" },
      iconKey: "calendar",
      effortMin: 30,
      ownerHint: "Facilitator",
    });
  }

  if (input.pendingInvites >= 5) {
    all.push({
      id: "stale-invites",
      priority: "info",
      title: `${input.pendingInvites} unaccepted invitations`,
      body: "Chase or revoke — empty seats kill exercise realism.",
      cta: { label: "Review roster", href: "/org" },
      iconKey: "users",
      effortMin: 15,
      ownerHint: "ADMIN",
    });
  }

  // Rank by priority then by initial order. Cap at 8 so the dashboard
  // has a meaningful "see all" expander after showing the top 3.
  const order = { critical: 0, warn: 1, info: 2 } as const;
  all.sort((a, b) => order[a.priority] - order[b.priority]);
  return all.slice(0, 8);
}
