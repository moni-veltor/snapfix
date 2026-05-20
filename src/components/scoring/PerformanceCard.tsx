import type { IncidentScore, CoachingLevel } from "@/lib/scoring";
import Pill from "@/components/ui/Pill";
import CountUp from "@/components/ui/CountUp";

type Props = {
  score: IncidentScore;
};

const LEVEL_TONE: Record<CoachingLevel, "ok" | "warn" | "critical" | "neutral"> = {
  good: "ok",
  ok: "neutral",
  warn: "warn",
  critical: "critical",
};

const LEVEL_BADGE: Record<CoachingLevel, string> = {
  good: "Good",
  ok: "OK",
  warn: "Watch",
  critical: "Critical",
};

export default function PerformanceCard({ score }: Props) {
  const ringColor =
    score.overall >= 80 ? "ring-emerald-400" : score.overall >= 60 ? "ring-amber-400" : "ring-rose-400";
  const numberColor =
    score.overall >= 80
      ? "text-emerald-600 dark:text-emerald-300"
      : score.overall >= 60
        ? "text-amber-600 dark:text-amber-300"
        : "text-rose-600 dark:text-rose-300";

  return (
    <div className="rounded-lg border border-line bg-surface-1 p-6 shadow-[var(--shadow-card)]">
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            Performance
          </p>
          <h2 className="mt-1 font-display text-base font-semibold text-ink">
            Incident <span className="font-mono">{score.shortCode}</span>
          </h2>
          <p className="mt-1 text-xs text-muted">
            Scored against operational-resilience best practice and the regulator clocks for your jurisdiction.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div
            className={`relative flex h-24 w-24 items-center justify-center rounded-full ring-4 ${ringColor} ring-offset-2 ring-offset-surface-1 dark:ring-offset-surface-1`}
          >
            <div className="absolute inset-1 rounded-full bg-gradient-brand-soft" />
            <span className={`relative font-display text-4xl font-bold tabular-nums tracking-tight ${numberColor}`}>
              <CountUp value={score.overall} />
            </span>
          </div>
          <div className="text-xs">
            <div className="text-muted">out of 100</div>
            <div className="mt-1 max-w-[160px] text-soft">
              Average of the best-practice metrics that fired for this
              incident — runbook completion only counts when a runbook was
              activated.
            </div>
          </div>
        </div>
      </div>

      <dl className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <Metric
          label="Time to invoke"
          value={
            score.metrics.invocationLatencyMin === null
              ? "—"
              : `${score.metrics.invocationLatencyMin} min`
          }
          subtle="from first signal"
          rubric="Minutes between the first inbound inject and the moment the incident was invoked. Best practice expects invocation within 15 min of a credible signal — every additional 15 min is one score band."
        />
        <Metric
          label="Time to severity"
          value={
            score.metrics.severityLatencyMin === null
              ? "—"
              : `${score.metrics.severityLatencyMin} min`
          }
          subtle="post-invocation"
          rubric="Minutes between incident invocation and the CRO classifying severity. The clock for regulator notifications (FCA / PRA 4h on High) only starts ticking when severity is set — slow classification compresses the notification window."
        />
        <Metric
          label="Decisions logged"
          value={String(score.metrics.decisionsLogged)}
          subtle="structured records"
          rubric="Count of structured DecisionRecord entries (with rationale + approver). Decisions in chat or only in free-text log don't count. Target: 1+ per significant turn of the incident."
        />
        <Metric
          label="Sitreps filed"
          value={String(score.metrics.sitrepsLogged)}
          subtle="per business unit"
          rubric="An opening sitrep from each affected business unit is expected within 15 min of invocation, with regular updates thereafter on the cadence each sitrep promised. Counts every sitrep filed against the incident."
        />
        <Metric
          label="IMT meetings"
          value={String(score.metrics.imtMeetingsLogged)}
          subtle="standing agenda"
          rubric="IMT meetings recorded with the standing agenda (situation/decisions/actions/risks/next-meeting). Best practice expects regular cadence — 60-90 min in early phase, longer once stable."
        />
        <Metric
          label="Regulator breaches"
          value={String(score.metrics.regulatorBreaches)}
          subtle="clocks past due"
          tone={score.metrics.regulatorBreaches > 0 ? "critical" : "neutral"}
          rubric="Count of regulator notification clocks that ran past due without a notification being filed (FCA / PRA 4h, ICO 72h). Any breach is a critical finding — it goes to the Board and the regulator."
        />
        <Metric
          label="Read coverage"
          value={`${score.metrics.readCoveragePct}%`}
          subtle="addressed messages read"
          rubric="Percentage of injects addressed to participants that were actually opened (read receipt fired). Low coverage signals seats were unmobilised or participants were buried in chat instead of reading their inbox."
        />
        <Metric
          label="Mobilisation"
          value={`${score.metrics.mobilisationCoveragePct}%`}
          subtle="of the roster mobilised"
          rubric="Percentage of ExerciseParticipants whose mobilisationStatus is MOBILISED or DEPUTY_STEPPED_UP (not UNCALLED / UNREACHABLE). Sub-80% means the IMT was thin on the bench — vulnerable to single-points-of-failure."
        />
        <Metric
          label="Cascade violations"
          value={String(score.metrics.cascadeViolations)}
          subtle="rejected comms"
          tone={score.metrics.cascadeViolations > 0 ? "warn" : "neutral"}
          rubric="Customer / regulator drafts rejected by the approver (typically because the cascade order was violated — sending external before internal, or skipping CRO/legal sign-off). Indicates comms discipline gaps."
        />
        {score.metrics.runbookCompletionPct !== null && (
          <Metric
            label="Runbook completion"
            value={`${score.metrics.runbookCompletionPct}%`}
            subtle={`${score.metrics.runbookStepsTerminal}/${score.metrics.runbookStepsTotal} steps terminal`}
            tone={
              score.metrics.runbookCompletionPct >= 80
                ? "neutral"
                : score.metrics.runbookCompletionPct >= 60
                  ? "warn"
                  : "critical"
            }
            rubric="Share of runbook steps in COMPLETE or SKIPPED state across every runbook activated against this incident. Steps left PENDING or BLOCKED at closure mean the runbook isn't fit for this scenario or the IMT moved off-script — both are findings."
          />
        )}
        {score.metrics.runbookPacingPct !== null && (
          <Metric
            label="Runbook pacing"
            value={`${score.metrics.runbookPacingPct}%`}
            subtle="actual vs estimated"
            tone={
              score.metrics.runbookPacingPct >= 80
                ? "neutral"
                : score.metrics.runbookPacingPct >= 60
                  ? "warn"
                  : "critical"
            }
            rubric="Compares each completed step's actual wall-clock time to the estimated time the runbook author set. 100% = every step on or ahead of estimate. Low values flag either stale estimates (update the runbook) or rehearsal gaps."
          />
        )}
      </dl>

      {score.coaching.length > 0 && (
        <div className="mt-6">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted">
            Coaching
          </h3>
          <ul className="mt-3 space-y-2">
            {score.coaching.map((c) => (
              <li
                key={c.id}
                className={`rounded-md border p-3 text-sm ${TONE_CLS[c.level]}`}
              >
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-medium text-ink">{c.finding}</span>
                  <div className="flex items-center gap-2">
                    <Pill variant={LEVEL_TONE[c.level]} size="sm" tone="solid">
                      {LEVEL_BADGE[c.level]}
                    </Pill>
                    <Pill variant="neutral" size="sm" tone="soft">
                      {c.clause}
                    </Pill>
                  </div>
                </div>
                {c.recommendation && (
                  <p className="mt-1 text-xs text-muted">{c.recommendation}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function Metric({
  label,
  value,
  subtle,
  tone = "neutral",
  rubric,
}: {
  label: string;
  value: string;
  subtle?: string;
  tone?: "neutral" | "warn" | "critical";
  rubric?: string;
}) {
  const valueColor =
    tone === "critical"
      ? "text-rose-600 dark:text-rose-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-ink";
  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <dt className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</dt>
      <dd className={`mt-1 text-lg font-semibold ${valueColor}`}>{value}</dd>
      {subtle && <span className="text-[10px] text-soft">{subtle}</span>}
      {rubric && (
        <details className="mt-2 text-[10px] text-soft">
          <summary className="cursor-pointer text-indigo-700 hover:underline dark:text-indigo-300">
            How&apos;s this scored?
          </summary>
          <p className="mt-1 leading-relaxed text-muted">{rubric}</p>
        </details>
      )}
    </div>
  );
}

const TONE_CLS: Record<CoachingLevel, string> = {
  good: "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/40",
  ok: "border-line bg-surface-0",
  warn: "border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/40",
  critical: "border-rose-300 bg-rose-50 dark:border-rose-700 dark:bg-rose-950/40",
};
