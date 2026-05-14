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
