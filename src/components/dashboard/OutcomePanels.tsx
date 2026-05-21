import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  Boxes,
  CalendarClock,
  CheckCircle2,
  Flame,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

/**
 * Three outcome-oriented panels that replace the flat 8-tile widget grid.
 *
 * Each panel answers a single question — what risk you carry, who is
 * driving it, what to click next — using:
 *   - one sentence-level headline pinned to the top offender(s)
 *   - up to 3 named "contributing factors" so the user knows where to look
 *   - 3-4 sub-metrics displayed as chips (the old widget numbers, now
 *     subordinated to the headline)
 *   - one deep-link CTA
 */

export type PanelOffender = {
  /** Display label — IBS code+name, vendor name, action title, etc. */
  label: string;
  /** Optional sub-label rendered in muted text (e.g. "CRITICAL", "Due 3d ago"). */
  sub?: string;
  /** Optional deep-link target for the offender. */
  href?: string;
};

export type PanelMetric = {
  label: string;
  /** Already-formatted value (e.g. "62", "47%", "3 of 12"). */
  value: string;
  /** Optional tone for the value chip. */
  tone?: "ok" | "warn" | "critical" | "neutral";
};

type Tone = "ok" | "warn" | "critical" | "info";

const TONE: Record<Tone, { ring: string; bar: string; chip: string; soft: string }> = {
  ok: {
    ring: "border-emerald-300 dark:border-emerald-700/60",
    bar: "from-emerald-500 to-emerald-400",
    chip: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    soft: "bg-emerald-50/60 dark:bg-emerald-950/20",
  },
  warn: {
    ring: "border-amber-300 dark:border-amber-700/60",
    bar: "from-amber-500 to-amber-400",
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    soft: "bg-amber-50/60 dark:bg-amber-950/20",
  },
  critical: {
    ring: "border-rose-300 dark:border-rose-700/60",
    bar: "from-rose-500 to-rose-400",
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    soft: "bg-rose-50/60 dark:bg-rose-950/20",
  },
  info: {
    ring: "border-indigo-300 dark:border-indigo-700/60",
    bar: "from-indigo-500 to-indigo-400",
    chip: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
    soft: "bg-indigo-50/60 dark:bg-indigo-950/20",
  },
};

const METRIC_TONE: Record<"ok" | "warn" | "critical" | "neutral", string> = {
  ok: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  warn: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  critical: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  neutral: "bg-surface-2 text-muted",
};

function Panel({
  icon: Icon,
  title,
  tone,
  headline,
  headlineSub,
  offenders,
  metrics,
  ctaHref,
  ctaLabel,
  emptyText,
}: {
  icon: LucideIcon;
  title: string;
  tone: Tone;
  headline: string;
  headlineSub?: string;
  offenders: PanelOffender[];
  metrics: PanelMetric[];
  ctaHref: string;
  ctaLabel: string;
  emptyText?: string;
}) {
  const t = TONE[tone];
  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-surface-1 transition-all hover:shadow-[var(--shadow-card-md)] ${t.ring}`}
    >
      <div className={`h-1 bg-gradient-to-r ${t.bar}`} />
      <div className="flex flex-1 flex-col gap-4 p-5">
        <header className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-soft">
            <Icon size={11} className="text-soft" />
            {title}
          </div>
        </header>

        <div>
          <p className="text-lg font-semibold leading-snug text-ink">{headline}</p>
          {headlineSub && (
            <p className="mt-1 text-[12px] text-muted">{headlineSub}</p>
          )}
        </div>

        {offenders.length > 0 ? (
          <ul className={`space-y-1 rounded-md p-2 ${t.soft}`}>
            {offenders.slice(0, 3).map((o, i) => (
              <li key={`${o.label}-${i}`} className="flex items-center gap-2 text-[12px]">
                <span className={`flex h-4 w-4 flex-none items-center justify-center rounded-full ${t.chip}`}>
                  <span className="block h-1.5 w-1.5 rounded-full bg-current" />
                </span>
                {o.href ? (
                  <Link
                    href={o.href}
                    className="min-w-0 flex-1 truncate text-ink underline-offset-2 hover:underline"
                  >
                    {o.label}
                  </Link>
                ) : (
                  <span className="min-w-0 flex-1 truncate text-ink">{o.label}</span>
                )}
                {o.sub && (
                  <span className="flex-none text-[10px] uppercase tracking-wider text-soft">
                    {o.sub}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-center text-[11px] text-soft">
            {emptyText ?? "Nothing flagged."}
          </div>
        )}

        <div className="flex flex-wrap gap-1.5">
          {metrics.map((m) => (
            <span
              key={m.label}
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] ${
                METRIC_TONE[m.tone ?? "neutral"]
              }`}
            >
              <span className="font-semibold">{m.value}</span>
              <span className="opacity-80">{m.label}</span>
            </span>
          ))}
        </div>

        <footer className="mt-auto flex items-center justify-end border-t border-line pt-3 text-[11px]">
          <Link
            href={ctaHref}
            className="inline-flex items-center gap-1 font-medium text-indigo-600 hover:underline dark:text-indigo-300"
          >
            {ctaLabel}
            <ArrowRight size={11} />
          </Link>
        </footer>
      </div>
    </article>
  );
}

// ─── 1. Resilience risk ──────────────────────────────────────────────────

export type ResilienceRiskPanelProps = {
  untestedCriticalIBS: PanelOffender[];
  /** Total IBSs in register. */
  ibsTotal: number;
  /** IBSs ever stress-tested. */
  ibsTested: number;
  /** Composite pulse score (0-100) + letter grade. */
  pulse: number;
  pulseGrade: string;
  /** Tech-recovery posture (0-100). */
  techPosture: number;
  /** Harm types exercised in the year. */
  harmTypesCovered: number;
};

export function ResilienceRiskPanel({
  untestedCriticalIBS,
  ibsTotal,
  ibsTested,
  pulse,
  pulseGrade,
  techPosture,
  harmTypesCovered,
}: ResilienceRiskPanelProps) {
  const coveragePct = ibsTotal === 0 ? 0 : Math.round((ibsTested / ibsTotal) * 100);
  const untestedCount = untestedCriticalIBS.length;

  const tone: Tone =
    untestedCount >= 3 || pulse < 50 || techPosture < 50
      ? "critical"
      : untestedCount > 0 || coveragePct < 80 || pulse < 70
        ? "warn"
        : "ok";

  const headline =
    untestedCount > 0
      ? `${untestedCount} critical IBS${untestedCount === 1 ? "" : "s"} not stress-tested yet`
      : ibsTotal === 0
        ? "No IBSs registered yet"
        : "Every critical IBS has been tested";

  return (
    <Panel
      icon={ShieldCheck}
      title="Resilience risk"
      tone={tone}
      headline={headline}
      headlineSub={
        ibsTotal > 0
          ? `${coveragePct}% of ${ibsTotal} services stress-tested · ${harmTypesCovered}/6 harm types exercised this year`
          : "Add your first IBS to start measuring coverage."
      }
      offenders={untestedCriticalIBS}
      emptyText="All critical IBSs are in the exercise rotation."
      metrics={[
        {
          label: "coverage",
          value: `${coveragePct}%`,
          tone: coveragePct >= 80 ? "ok" : coveragePct >= 50 ? "warn" : "critical",
        },
        {
          label: `pulse · ${pulseGrade}`,
          value: String(pulse),
          tone: pulse >= 70 ? "ok" : pulse >= 50 ? "warn" : "critical",
        },
        {
          label: "DR posture",
          value: String(techPosture),
          tone: techPosture >= 70 ? "ok" : techPosture >= 50 ? "warn" : "critical",
        },
      ]}
      ctaHref="/ibs"
      ctaLabel="Open IBS register"
    />
  );
}

// ─── 2. Third-party risk ─────────────────────────────────────────────────

export type ThirdPartyRiskPanelProps = {
  weakExitVendors: PanelOffender[];
  totalVendors: number;
  topHyperscaler: { hyperscaler: string; count: number } | null;
  assuranceExpiringSoon: number;
  exitReadiness: number;
  mtpTotal: number;
  mtpReady: number;
};

export function ThirdPartyRiskPanel({
  weakExitVendors,
  totalVendors,
  topHyperscaler,
  assuranceExpiringSoon,
  exitReadiness,
  mtpTotal,
  mtpReady,
}: ThirdPartyRiskPanelProps) {
  const concentrationPct =
    totalVendors === 0 || !topHyperscaler
      ? 0
      : Math.round((topHyperscaler.count / totalVendors) * 100);
  const weakCount = weakExitVendors.length;
  const mtpGap = Math.max(0, mtpTotal - mtpReady);

  const tone: Tone =
    weakCount >= 3 || concentrationPct >= 50
      ? "critical"
      : weakCount > 0 || concentrationPct >= 30 || mtpGap > 0
        ? "warn"
        : "ok";

  const headline = (() => {
    if (weakCount > 0) {
      return `${weakCount} critical vendor${weakCount === 1 ? "" : "s"} without a credible exit plan`;
    }
    if (topHyperscaler && concentrationPct >= 30) {
      return `${concentrationPct}% of estate concentrated on ${topHyperscaler.hyperscaler}`;
    }
    if (totalVendors === 0) {
      return "No vendors registered yet";
    }
    return "Third-party posture is healthy";
  })();

  return (
    <Panel
      icon={Boxes}
      title="Third-party risk"
      tone={tone}
      headline={headline}
      headlineSub={
        totalVendors > 0
          ? `${totalVendors} vendors · ${mtpTotal} flagged Material Third Party${mtpTotal === 1 ? "" : "s"}`
          : "Add vendors to start tracking concentration + exit risk."
      }
      offenders={weakExitVendors}
      emptyText="All critical vendors have a reviewed exit plan."
      metrics={[
        {
          label: `${topHyperscaler?.hyperscaler ?? "concentration"}`,
          value: `${concentrationPct}%`,
          tone: concentrationPct >= 50 ? "critical" : concentrationPct >= 30 ? "warn" : "ok",
        },
        {
          label: "exit readiness",
          value: String(exitReadiness),
          tone: exitReadiness >= 70 ? "ok" : exitReadiness >= 50 ? "warn" : "critical",
        },
        ...(assuranceExpiringSoon > 0
          ? ([
              {
                label: "assurance expiring",
                value: String(assuranceExpiringSoon),
                tone: "warn",
              },
            ] satisfies PanelMetric[])
          : []),
        ...(mtpTotal > 0
          ? ([
              {
                label: "MTP register-ready",
                value: `${mtpReady}/${mtpTotal}`,
                tone: mtpGap === 0 ? "ok" : "warn",
              },
            ] satisfies PanelMetric[])
          : []),
      ] satisfies PanelMetric[]}
      ctaHref="/vendors"
      ctaLabel="Open vendor register"
    />
  );
}

// ─── 3. Compliance clock ─────────────────────────────────────────────────

export type ComplianceClockPanelProps = {
  /** Items past their due date — overdue actions, PIRs and IBS reviews mixed. */
  overdueItems: PanelOffender[];
  overdueActions: number;
  overduePIRs: number;
  openRegulatorNotifications: number;
  ibsReviewDueSoon: number;
};

export function ComplianceClockPanel({
  overdueItems,
  overdueActions,
  overduePIRs,
  openRegulatorNotifications,
  ibsReviewDueSoon,
}: ComplianceClockPanelProps) {
  const totalLate = overdueActions + overduePIRs + openRegulatorNotifications;

  const tone: Tone =
    overduePIRs > 0 || openRegulatorNotifications > 0 || overdueActions >= 5
      ? "critical"
      : totalLate > 0 || ibsReviewDueSoon > 0
        ? "warn"
        : "ok";

  const headline = (() => {
    if (overduePIRs > 0) {
      return `${overduePIRs} post-incident report${overduePIRs === 1 ? "" : "s"} overdue with the regulator`;
    }
    if (openRegulatorNotifications > 0) {
      return `${openRegulatorNotifications} regulator notification${openRegulatorNotifications === 1 ? "" : "s"} still open`;
    }
    if (overdueActions > 0) {
      return `${overdueActions} action item${overdueActions === 1 ? "" : "s"} past their due date`;
    }
    if (ibsReviewDueSoon > 0) {
      return `${ibsReviewDueSoon} IBS review${ibsReviewDueSoon === 1 ? "" : "s"} due in the next 30 days`;
    }
    return "All time-bound obligations are on track";
  })();

  return (
    <Panel
      icon={CalendarClock}
      title="Compliance clock"
      tone={tone}
      headline={headline}
      headlineSub={
        totalLate === 0 && ibsReviewDueSoon === 0
          ? "Nothing demands you right now."
          : "Most-overdue items first — clear them or push them back."
      }
      offenders={overdueItems}
      emptyText="No overdue items."
      metrics={[
        {
          label: "overdue actions",
          value: String(overdueActions),
          tone: overdueActions === 0 ? "ok" : overdueActions >= 5 ? "critical" : "warn",
        },
        {
          label: "overdue PIRs",
          value: String(overduePIRs),
          tone: overduePIRs === 0 ? "ok" : "critical",
        },
        {
          label: "regulator open",
          value: String(openRegulatorNotifications),
          tone: openRegulatorNotifications === 0 ? "ok" : "warn",
        },
        {
          label: "IBS reviews (30d)",
          value: String(ibsReviewDueSoon),
          tone: ibsReviewDueSoon === 0 ? "ok" : "warn",
        },
      ]}
      ctaHref="/audit"
      ctaLabel="Open compliance log"
    />
  );
}

// Re-export icons used by the panel so the dashboard page can keep
// importing them from one place if it wants to.
export const ICON = {
  ShieldCheck,
  Boxes,
  CalendarClock,
  Flame,
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
};
