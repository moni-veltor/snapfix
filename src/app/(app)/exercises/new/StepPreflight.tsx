import Link from "next/link";
import {
  AlertOctagon,
  ArrowLeft,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronRight,
  Coins,
  Download,
  Layers,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
} from "lucide-react";
import { evaluateReadiness, type ReadinessCheck } from "@/lib/exercise-readiness";
import { estimateExerciseCost, formatMoney, type CostBreakdown } from "@/lib/exercise-cost";
import { generateBriefingEmail } from "@/lib/exercise-briefing";
import { previewDoraForScenario, doraApplies as doraAppliesFn, type Jurisdiction } from "@/lib/dora-thresholds";
import { computeDifficulty } from "@/lib/scenario-difficulty";
import { loadAggregatedInjects } from "@/lib/exercise-injects";
import { prisma } from "@/lib/prisma";
import {
  markBriefingSentAction,
  markBriefingSkippedAction,
  transitionDraftToReadyAction,
} from "@/app/actions/exercise-wizard";

type Props = {
  exerciseId: string;
};

export default async function StepPreflight({ exerciseId }: Props) {
  const [exercise, readiness, cost, injects] = await Promise.all([
    prisma.exercise.findUniqueOrThrow({
      where: { id: exerciseId },
      select: {
        id: true,
        title: true,
        description: true,
        exerciseType: true,
        plannedDate: true,
        durationMin: true,
        timeZone: true,
        location: true,
        jurisdiction: true,
        classification: true,
        classificationCaveat: true,
        regulatorMode: true,
        regulatorAudience: true,
        mode: true,
        speedMultiplier: true,
        objectives: true,
        briefingSentAt: true,
        briefingSkippedReason: true,
        facilitator: { select: { name: true, email: true } },
        coFacilitator: { select: { name: true, email: true } },
        scenario: {
          select: {
            id: true,
            title: true,
            difficultyCognitive: true,
            difficultyTimePressure: true,
            difficultyAmbiguity: true,
            difficultyStakeholders: true,
            coversTechnology: true,
            coversDataAvailability: true,
            coversDataIntegrity: true,
            coversThirdParty: true,
            durationMin: true,
          },
        },
        chainedScenarios: {
          orderBy: { sequence: "asc" },
          select: {
            sequence: true,
            offsetMin: true,
            label: true,
            scenario: { select: { id: true, title: true } },
          },
        },
        ibsLinks: { include: { ibs: { select: { name: true, criticality: true } } } },
        participants: {
          select: { user: { select: { name: true, email: true } }, roleTitle: true },
        },
      },
    }),
    evaluateReadiness(exerciseId),
    estimateExerciseCost(exerciseId),
    loadAggregatedInjects(exerciseId),
  ]);

  if (!readiness) return null;

  const difficulty = computeDifficulty(exercise.scenario);
  const doraEval = doraAppliesFn(exercise.jurisdiction as Jurisdiction)
    ? previewDoraForScenario({
        coversTechnology: exercise.scenario.coversTechnology,
        coversDataAvailability: exercise.scenario.coversDataAvailability,
        coversDataIntegrity: exercise.scenario.coversDataIntegrity,
        coversThirdParty: exercise.scenario.coversThirdParty,
        durationMin: exercise.scenario.durationMin,
      })
    : null;

  const visibleInjects = injects.filter((i) => !i.hidden);

  const briefing = generateBriefingEmail({
    title: exercise.title,
    description: exercise.description,
    exerciseType: exercise.exerciseType,
    plannedDate: exercise.plannedDate,
    durationMin: exercise.durationMin,
    timeZone: exercise.timeZone,
    location: exercise.location,
    jurisdiction: exercise.jurisdiction,
    classification: exercise.classification,
    classificationCaveat: exercise.classificationCaveat,
    regulatorMode: exercise.regulatorMode,
    regulatorAudience: exercise.regulatorAudience,
    facilitatorName: exercise.facilitator?.name ?? exercise.facilitator?.email ?? "Facilitator",
    coFacilitatorName:
      exercise.coFacilitator?.name ?? exercise.coFacilitator?.email ?? null,
    objectives: exercise.objectives,
    participantNames: exercise.participants.map((p) => p.user.name ?? p.user.email),
    ibsNames: exercise.ibsLinks.map((l) => l.ibs.name),
    scenarioTitles: [exercise.scenario.title, ...exercise.chainedScenarios.map((c) => c.scenario.title)],
  });

  const canGoLive = readiness.canGoReady;

  return (
    <div className="space-y-6">
      {/* ─── Pre-flight summary (Board-readable card) ──────────────────── */}
      <PreflightSummaryCard
        exercise={exercise}
        cost={cost}
        difficulty={difficulty}
        doraEval={doraEval}
        visibleInjectCount={visibleInjects.length}
      />

      {/* ─── Readiness gate ─────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
            Readiness gate {readiness.strict && (
              <span className="ml-1 rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                Strict (regulator mode)
              </span>
            )}
          </h2>
          <p className="text-[11px] text-soft">
            {readiness.checks.filter((c) => c.ok).length}/{readiness.checks.length} checks pass ·{" "}
            {readiness.checks.filter((c) => c.required && !c.ok).length} required failing
          </p>
        </header>
        <ul className="space-y-1.5">
          {readiness.checks.map((c) => (
            <ReadinessRow key={c.id} check={c} strict={readiness.strict} />
          ))}
        </ul>
      </section>

      {/* ─── Briefing email draft ──────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header>
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Mail size={14} className="text-indigo-600 dark:text-indigo-300" />
            Pre-exercise briefing email
          </h2>
          {exercise.briefingSentAt ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={11} />
              Marked sent {exercise.briefingSentAt.toISOString().slice(0, 10)}
            </p>
          ) : exercise.briefingSkippedReason ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] text-amber-700 dark:text-amber-300">
              <AlertOctagon size={11} />
              Skipped: {exercise.briefingSkippedReason}
            </p>
          ) : (
            <p className="mt-0.5 text-[11px] text-soft">
              Copy the draft below into your email client, then mark sent.
            </p>
          )}
        </header>

        <details className="rounded-md border border-line bg-surface-0">
          <summary className="cursor-pointer px-3 py-2 text-xs font-medium text-ink">
            Preview draft
          </summary>
          <div className="space-y-2 border-t border-line p-3">
            <p className="text-[11px] text-muted">
              <span className="font-semibold">Subject:</span>{" "}
              <span className="font-mono">{briefing.subject}</span>
            </p>
            <pre className="whitespace-pre-wrap rounded-md bg-surface-1 p-3 text-[11px] text-ink">
              {briefing.body}
            </pre>
          </div>
        </details>

        <div className="flex flex-wrap items-center gap-2">
          <form action={markBriefingSentAction}>
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <button className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500">
              <Check size={11} />
              Mark briefing sent
            </button>
          </form>
          <form action={markBriefingSkippedAction} className="flex items-center gap-1">
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input
              name="reason"
              required
              maxLength={200}
              placeholder="Reason for skipping…"
              className="rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-[11px]"
            />
            <button className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] text-ink hover:border-line-strong">
              Mark skipped
            </button>
          </form>
        </div>
      </section>

      {/* ─── Calendar invite ───────────────────────────────────────────── */}
      <section className="rounded-xl border border-line bg-surface-1 p-5">
        <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
          <CalendarPlus size={14} className="text-indigo-600 dark:text-indigo-300" />
          Calendar invite
        </h2>
        <p className="mt-1 text-[11px] text-soft">
          Download a .ics file with the exercise time, duration, organiser, and full roster
          as required-attendees. Drop it into Outlook / Google Calendar / Apple Mail.
        </p>
        <a
          href={`/api/exercises/${exerciseId}/ics`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-0 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong"
        >
          <Download size={13} />
          Download .ics
        </a>
      </section>

      {/* ─── Go-live block ─────────────────────────────────────────────── */}
      <section className="space-y-3 rounded-xl border border-line bg-surface-1 p-5">
        <header className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <Sparkles size={14} className="text-indigo-600 dark:text-indigo-300" />
            Mark as READY
          </h2>
          <p className="text-[11px] text-soft">
            Flips status to READY · captures cost snapshot · sends to /exercises/[id] for go-live
          </p>
        </header>
        <form action={transitionDraftToReadyAction}>
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <button
            disabled={!canGoLive}
            className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-emerald-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none disabled:hover:translate-y-0"
          >
            <CheckCircle2 size={14} />
            {canGoLive ? "Mark as READY" : "Fix failing checks above first"}
          </button>
        </form>
      </section>

      {/* ─── Footer ───────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <Link
          href={`/exercises/new?step=4&id=${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Back to Injects
        </Link>
        <Link
          href={`/exercises/${exerciseId}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
        >
          Open this exercise &rarr;
        </Link>
      </div>
    </div>
  );
}

function PreflightSummaryCard({
  exercise,
  cost,
  difficulty,
  doraEval,
  visibleInjectCount,
}: {
  exercise: {
    title: string;
    plannedDate: Date | null;
    durationMin: number | null;
    timeZone: string | null;
    speedMultiplier: number;
    exerciseType: string;
    mode: string;
    regulatorMode: boolean;
    regulatorAudience: string | null;
    classification: string;
    classificationCaveat: string | null;
    objectives: string[];
    ibsLinks: { ibs: { name: string } }[];
    chainedScenarios: { sequence: number }[];
    participants: { roleTitle: string }[];
  };
  cost: CostBreakdown | null;
  difficulty: ReturnType<typeof computeDifficulty>;
  doraEval: ReturnType<typeof previewDoraForScenario> | null;
  visibleInjectCount: number;
}) {
  const totalScenarios = exercise.chainedScenarios.length;
  const dateStr = exercise.plannedDate
    ? exercise.plannedDate.toLocaleString("en-GB", {
        weekday: "short",
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: exercise.timeZone ?? "Europe/London",
      })
    : "TBC";
  const personHours = exercise.durationMin
    ? ((exercise.participants.length * exercise.durationMin) / 60).toFixed(0)
    : "—";

  return (
    <section className="relative overflow-hidden rounded-xl border border-indigo-300 bg-gradient-to-br from-indigo-50 via-indigo-50 to-cyan-50 p-5 shadow-[var(--shadow-card-md)] dark:border-indigo-700 dark:from-indigo-950/40 dark:via-indigo-950/40 dark:to-cyan-950/30">
      <div
        aria-hidden
        className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-indigo-200/40 blur-3xl dark:bg-indigo-900/30"
      />
      <div className="relative">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          Pre-flight summary
        </p>
        <h2 className="mt-1 font-display text-2xl font-semibold text-ink">
          {exercise.title}
        </h2>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
          <Tag>{exercise.exerciseType}</Tag>
          <Tag>{exercise.mode}</Tag>
          <Tag>{exercise.classification}{exercise.classificationCaveat ? ` · ${exercise.classificationCaveat}` : ""}</Tag>
          {exercise.regulatorMode && (
            <Tag tone="violet">
              <ShieldCheck size={9} className="mr-0.5 inline" />
              REGULATOR EVIDENCE{exercise.regulatorAudience ? ` · ${exercise.regulatorAudience}` : ""}
            </Tag>
          )}
          {exercise.speedMultiplier > 1 && (
            <Tag tone="amber">×{exercise.speedMultiplier} speed</Tag>
          )}
        </div>

        <p className="mt-3 max-w-2xl text-sm text-ink">
          This {totalScenarios > 1 ? `${totalScenarios}-scenario chain` : "exercise"} will test{" "}
          <strong>{exercise.ibsLinks.length}</strong> IBS{exercise.ibsLinks.length === 1 ? "" : "s"}{" "}
          over <strong>{exercise.durationMin ? formatDuration(exercise.durationMin) : "TBC"}</strong>{" "}
          with <strong>{exercise.participants.length}</strong> participants and{" "}
          <strong>{visibleInjectCount}</strong> injects. Planned for <strong>{dateStr}</strong>.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-4">
          <Tile icon={Users} label="On roster" value={String(exercise.participants.length)} sub={`${personHours} person-hr`} />
          <Tile icon={Layers} label="Injects" value={String(visibleInjectCount)} sub={`${totalScenarios} scenario${totalScenarios === 1 ? "" : "s"}`} />
          <Tile icon={Target} label="Objectives" value={String(exercise.objectives.length)} sub="scored in debrief" />
          <Tile
            icon={Coins}
            label="Estimated cost"
            value={cost ? formatMoney(cost.totalMajor, cost.currency) : "—"}
            sub={cost ? "person-hours × loaded rate" : "set duration to estimate"}
          />
        </div>

        {difficulty.overall !== null && (
          <p className="mt-3 text-[11px] text-muted">
            <Sparkles size={11} className="mr-1 inline" />
            Difficulty: <strong>{difficulty.overall}/5 · {difficulty.label}</strong>
          </p>
        )}

        {doraEval && (
          <div
            className={`mt-3 rounded-md border p-3 text-[11px] ${
              doraEval.isMajor
                ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
                : "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
            }`}
          >
            <p className="font-semibold text-ink">DORA major-incident preview</p>
            <p className="mt-0.5 text-muted">{doraEval.summary}</p>
          </div>
        )}

        {exercise.speedMultiplier > 1 && (
          <p className="mt-3 inline-flex items-center gap-1 rounded-md bg-amber-100 px-2 py-1 text-[11px] text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            <Lock size={10} />
            ×{exercise.speedMultiplier} compresses the 4h FCA window to{" "}
            {Math.round((4 * 60) / exercise.speedMultiplier)} min — CRO sign-off advised.
          </p>
        )}
      </div>
    </section>
  );
}

function ReadinessRow({ check, strict }: { check: ReadinessCheck; strict: boolean }) {
  const required = strict || check.required;
  const tone = check.ok
    ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
    : required
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : "border-line bg-surface-0";
  return (
    <li className={`rounded-md border p-2 text-xs ${tone}`}>
      <div className="flex items-start gap-2">
        {check.ok ? (
          <CheckCircle2 size={13} className="mt-0.5 shrink-0 text-emerald-600" />
        ) : required ? (
          <X size={13} className="mt-0.5 shrink-0 text-rose-600" />
        ) : (
          <AlertOctagon size={13} className="mt-0.5 shrink-0 text-amber-600" />
        )}
        <div className="min-w-0 flex-1">
          <p className="font-medium text-ink">
            {check.label}
            {!check.required && !strict && (
              <span className="ml-2 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                Recommended
              </span>
            )}
          </p>
          <p className="mt-0.5 text-[11px] text-muted">{check.why}</p>
        </div>
        {!check.ok && check.fixHref && (
          <Link
            href={check.fixHref}
            className="inline-flex items-center gap-0.5 text-[11px] text-indigo-600 hover:underline dark:text-indigo-300"
          >
            Fix
            <ChevronRight size={11} />
          </Link>
        )}
      </div>
    </li>
  );
}

function Tag({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "amber" | "violet";
}) {
  const c =
    tone === "amber"
      ? "bg-amber-100 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200"
      : tone === "violet"
        ? "bg-violet-600 text-white"
        : "bg-white/70 text-indigo-900 dark:bg-black/30 dark:text-indigo-200";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${c}`}>
      {children}
    </span>
  );
}

function Tile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-md border border-white/40 bg-white/60 p-3 backdrop-blur dark:border-white/10 dark:bg-black/30">
      <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
        <Icon size={11} />
        {label}
      </div>
      <div className="mt-1 font-display text-2xl font-semibold text-ink">{value}</div>
      <div className="text-[10px] text-soft">{sub}</div>
    </div>
  );
}

function formatDuration(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
}
