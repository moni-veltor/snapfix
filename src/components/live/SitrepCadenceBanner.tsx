"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { AlertOctagon, AlertTriangle, Clock, MessageSquareWarning } from "lucide-react";
import SitrepDrawer from "./SitrepDrawer";

type Sitrep = {
  id: string;
  businessUnit: string;
  status: "GREEN" | "AMBER" | "RED";
  nextUpdateDDayTime: string | null;
  dDayTime: string;
  createdAt: Date;
};

type Props = {
  sitreps: Sitrep[];
  /** Current D-Day clock as "HH:MM". */
  dDayHHMM: string;
  /** Wall-clock minutes since the most-recent sitrep was filed. */
  minutesSinceLastSitrep: number | null;
  /** Has an incident been invoked? Hide the banner entirely if not. */
  incidentActive: boolean;
  /** Exercise + incident ids passed to the sitrep drawer button. Null
   *  when there's no incident; banner is hidden then anyway. */
  exerciseId: string;
  incidentId: string | null;
};

type Tier = "QUIET" | "INFO" | "DUE" | "ESCALATED" | "CRITICAL";

/**
 * Surfaces sitrep-cadence breaches with conservative escalation tiers.
 * Doctrine expects an initial sitrep from each affected business unit
 * within 15 minutes of invocation, then updates on the cadence each
 * sitrep declared. We light up only when something is actually overdue
 * and step the visual + audible severity as the gap grows:
 *
 *   - QUIET     — nothing overdue (banner hidden)
 *   - INFO      — no sitreps filed yet (amber soft banner)
 *   - DUE       — overdue by < 30 min (amber, file-now CTA)
 *   - ESCALATED — overdue by 30–60 min (rose, facilitator nudge toast)
 *   - CRITICAL  — overdue by > 60 min (rose ring, repeating nudge)
 *
 * Tier transitions fire a sonner toast once per crossing so the
 * facilitator gets pulled back in even if their eyes are on the
 * runbook tab.
 */
export default function SitrepCadenceBanner({
  sitreps,
  dDayHHMM,
  minutesSinceLastSitrep,
  incidentActive,
  exerciseId,
  incidentId,
}: Props) {
  const dDayMins = ddayToMinutes(dDayHHMM);

  const latestPerBU = new Map<string, Sitrep>();
  for (const s of sitreps) {
    const prior = latestPerBU.get(s.businessUnit);
    if (!prior || s.createdAt > prior.createdAt) latestPerBU.set(s.businessUnit, s);
  }
  const overdue = [...latestPerBU.values()]
    .filter((s) => {
      if (!s.nextUpdateDDayTime) return false;
      const promised = ddayToMinutes(s.nextUpdateDDayTime);
      return promised !== null && dDayMins !== null && promised < dDayMins;
    })
    .map((s) => {
      const promised = ddayToMinutes(s.nextUpdateDDayTime!)!;
      const dueAgo = dDayMins! - promised;
      return { ...s, dueAgo };
    })
    .sort((a, b) => b.dueAgo - a.dueAgo);

  const worstOverdueMin = overdue.length > 0 ? overdue[0].dueAgo : 0;
  const sinceLast = minutesSinceLastSitrep ?? 0;
  const worstGap = Math.max(worstOverdueMin, sinceLast > 60 ? sinceLast : 0);

  const tier: Tier =
    !incidentActive || !incidentId
      ? "QUIET"
      : sitreps.length === 0
        ? "INFO"
        : worstGap > 60
          ? "CRITICAL"
          : worstGap > 30
            ? "ESCALATED"
            : overdue.length > 0 || sinceLast > 60
              ? "DUE"
              : "QUIET";

  // Toast on tier-crossing — once per upgrade, not per render.
  const lastTierRef = useRef<Tier | null>(null);
  useEffect(() => {
    const prev = lastTierRef.current;
    lastTierRef.current = tier;
    if (prev === null || prev === tier) return;
    if (TIER_RANK[tier] <= TIER_RANK[prev]) return; // de-escalations stay quiet
    if (tier === "ESCALATED") {
      toast.warning("Sitrep cadence escalated", {
        description:
          "A business unit is more than 30 min overdue. Facilitator should chase or stand down.",
      });
    } else if (tier === "CRITICAL") {
      toast.error("Sitrep cadence critical", {
        description: `${worstGap} min since the last expected sitrep — IMT is flying blind.`,
      });
    }
  }, [tier, worstGap]);

  if (tier === "QUIET" || !incidentId) return null;

  if (tier === "INFO") {
    return (
      <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 p-3 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
        <MessageSquareWarning size={14} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" />
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            No sitreps filed yet
          </p>
          <p className="mt-0.5 text-amber-800 dark:text-amber-200">
            Each affected business unit should file an initial sitrep within 15 min of
            incident invocation.
          </p>
        </div>
        <SitrepDrawer exerciseId={exerciseId} incidentId={incidentId} dDayHHMM={dDayHHMM} />
      </div>
    );
  }

  const overdueBU = overdue[0]?.businessUnit;
  const tone = TIER_TONE[tier];
  const Icon = tier === "CRITICAL" ? AlertOctagon : AlertTriangle;
  const heading =
    tier === "CRITICAL"
      ? "Sitrep cadence critical · IMT is flying blind"
      : tier === "ESCALATED"
        ? "Sitrep cadence escalated · facilitator action needed"
        : "Sitrep cadence is slipping";

  return (
    <div className={`space-y-1 rounded-md border p-3 text-xs ${tone.wrap}`}>
      <div className="flex items-center justify-between gap-2">
        <p className={`flex items-center gap-1.5 font-semibold ${tone.heading}`}>
          <Icon size={13} />
          {heading}
          <span className="rounded-full bg-rose-200 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-900 dark:bg-rose-900/60 dark:text-rose-100">
            {worstGap} min late
          </span>
        </p>
        <SitrepDrawer
          exerciseId={exerciseId}
          incidentId={incidentId}
          dDayHHMM={dDayHHMM}
          defaultBusinessUnit={overdueBU}
        />
      </div>
      {overdue.length > 0 && (
        <ul className={`space-y-0.5 pl-5 ${tone.body}`}>
          {overdue.map((s) => (
            <li key={s.id} className="flex items-baseline gap-1.5">
              <span className="font-semibold">{s.businessUnit}</span>
              <span className={tone.detail}>
                — promised an update at D-Day {s.nextUpdateDDayTime},{" "}
                <span className="font-medium">{s.dueAgo} min overdue</span>
              </span>
            </li>
          ))}
        </ul>
      )}
      {sinceLast > 60 && overdue.length === 0 && (
        <p className={`flex items-center gap-1.5 pl-5 ${tone.body}`}>
          <Clock size={11} />
          Last sitrep was {minutesSinceLastSitrep} min ago. IMT cadence is every 30–60 min
          for an active incident.
        </p>
      )}
    </div>
  );
}

const TIER_RANK: Record<Tier, number> = {
  QUIET: 0,
  INFO: 1,
  DUE: 2,
  ESCALATED: 3,
  CRITICAL: 4,
};

const TIER_TONE: Record<
  "DUE" | "ESCALATED" | "CRITICAL",
  { wrap: string; heading: string; body: string; detail: string }
> = {
  DUE: {
    wrap: "border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30",
    heading: "text-amber-900 dark:text-amber-100",
    body: "text-amber-800 dark:text-amber-200",
    detail: "text-amber-700/80 dark:text-amber-300/80",
  },
  ESCALATED: {
    wrap: "border-rose-300 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30",
    heading: "text-rose-900 dark:text-rose-100",
    body: "text-rose-800 dark:text-rose-200",
    detail: "text-rose-700/80 dark:text-rose-300/80",
  },
  CRITICAL: {
    wrap: "border-rose-400 bg-rose-50 ring-2 ring-rose-400/40 dark:border-rose-700 dark:bg-rose-950/40 dark:ring-rose-500/40",
    heading: "text-rose-900 dark:text-rose-100",
    body: "text-rose-800 dark:text-rose-200",
    detail: "text-rose-700/80 dark:text-rose-300/80",
  },
};

function ddayToMinutes(hhmm: string): number | null {
  const m = hhmm.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}
