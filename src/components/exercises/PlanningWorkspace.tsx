"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  AlertOctagon,
  CalendarClock,
  CheckCircle2,
  Crown,
  Edit3,
  Globe,
  Layers,
  Mail,
  Save,
  Send,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserPlus,
  Users,
} from "lucide-react";
import { assignMemberAction, removeExerciseMemberAction } from "@/app/actions/exercises";
import {
  markBriefingSentAction,
  markBriefingSkippedAction,
  setCoFacilitatorAction,
  transitionDraftToReadyAction,
} from "@/app/actions/exercise-wizard";
import {
  setExerciseIbsLinksAction,
  setExerciseObjectivesAction,
  setExerciseScheduleAction,
  setRegulatorAudienceAction,
} from "@/app/actions/exercise-quick";

type OrgUser = { id: string; name: string | null; email: string };
type OrgIBS = { id: string; name: string; criticality: string | null };
type OrgRole = { id: string; abbreviation: string; title: string; isSMF: boolean; defaultHolderId: string | null };

type Participant = {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  roleTitle: string;
  exerciseRole: string;
  deputyParticipantId: string | null;
};

type Readiness = {
  checks: {
    id: string;
    label: string;
    why: string;
    ok: boolean;
    required: boolean;
    stage: StageKey;
    fixHref?: string;
  }[];
  canGoReady: boolean;
  strict: boolean;
};

type ExerciseSnapshot = {
  id: string;
  title: string;
  status: string;
  plannedDate: Date | null;
  durationMin: number | null;
  timeZone: string | null;
  speedMultiplier: number;
  location: string | null;
  classification: string;
  regulatorMode: boolean;
  regulatorAudience: string | null;
  objectives: string[];
  facilitatorId: string | null;
  coFacilitatorId: string | null;
  briefingSentAt: Date | null;
  briefingSkippedReason: string | null;
  ibsIds: string[];
  scenarioId: string;
  scenarioTitle: string;
  totalInjects: number;
  visibleInjects: number;
};

type Props = {
  exercise: ExerciseSnapshot;
  readiness: Readiness;
  participants: Participant[];
  orgUsers: OrgUser[];
  orgRoles: OrgRole[];
  orgIBSs: OrgIBS[];
  canEdit: boolean;
};

const TZ_PRESETS = ["Europe/London", "Europe/Dublin", "Europe/Paris", "America/New_York", "Asia/Singapore"];
const DURATION_PRESETS = [60, 90, 120, 180, 240, 480];

type StageKey = "BASICS" | "SCENARIOS" | "TEAM" | "INJECTS" | "PREFLIGHT";

const STAGES: { key: StageKey; label: string; hint: string; step: number }[] = [
  { key: "BASICS", label: "Basics", hint: "Date, duration, jurisdiction", step: 1 },
  { key: "SCENARIOS", label: "Scenarios", hint: "IBSs + objectives", step: 2 },
  { key: "TEAM", label: "Team", hint: "Facilitator + roster", step: 3 },
  { key: "INJECTS", label: "Injects", hint: "Timeline + coverage", step: 4 },
  { key: "PREFLIGHT", label: "Pre-flight", hint: "Briefing + sign-off", step: 5 },
];

export default function PlanningWorkspace({
  exercise,
  readiness,
  participants,
  orgUsers,
  orgRoles,
  orgIBSs,
  canEdit,
}: Props) {
  const pct = readiness.checks.length === 0
    ? 100
    : Math.round((readiness.checks.filter((c) => c.ok).length / readiness.checks.length) * 100);
  const failedRequired = readiness.checks.filter((c) => !c.ok && (c.required || readiness.strict));
  const tone =
    readiness.canGoReady ? "bg-emerald-500" : pct >= 60 ? "bg-amber-500" : "bg-rose-500";

  // ─── Tab state ──────────────────────────────────────────────────────
  // URL is the source of truth (?stage=BASICS|…). The first render with no
  // ?stage param picks a smart default and pushes it into the URL via the
  // hydration effect below. localStorage seeds the default on return visits.
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const STORAGE_KEY = `planning:${exercise.id}:stage`;
  const urlStage = searchParams.get("stage");

  const smartDefault = useMemo<StageKey>(() => {
    for (const s of STAGES) {
      const stageChecks = readiness.checks.filter((c) => c.stage === s.key);
      if (stageChecks.some((c) => !c.ok && (c.required || readiness.strict))) {
        return s.key;
      }
    }
    return "PREFLIGHT";
  }, [readiness]);

  const active: StageKey =
    urlStage && isStageKey(urlStage) ? (urlStage as StageKey) : smartDefault;

  // One-shot mount hydration: if URL has no ?stage, prefer localStorage's
  // last-used tab, else the smart default. Runs once; subsequent changes
  // come from setActive (user click) and flow through router.replace.
  useEffect(() => {
    if (urlStage && isStageKey(urlStage)) return;
    let seed: StageKey = smartDefault;
    if (typeof window !== "undefined") {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored && isStageKey(stored)) seed = stored as StageKey;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", seed);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setActive = (next: StageKey) => {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, next);
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("stage", next);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-5">
      {/* ─── Live readiness gauge ─────────────────────────────────────── */}
      <section className="sticky top-2 z-10 rounded-xl border border-line bg-surface-1/95 p-4 shadow-[var(--shadow-card)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
              <ShieldCheck size={14} className="text-indigo-600 dark:text-indigo-300" />
              Planning · {pct}% ready
              {readiness.strict && (
                <span className="rounded-full bg-violet-600 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-white">
                  Strict
                </span>
              )}
            </p>
            <p className="text-[11px] text-soft">
              {readiness.checks.filter((c) => c.ok).length} of {readiness.checks.length} checks pass
              {failedRequired.length > 0 && (
                <span className="ml-2 font-semibold text-rose-700 dark:text-rose-300">
                  · {failedRequired.length} required failing
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-surface-2">
              <div className={`h-full ${tone}`} style={{ width: `${pct}%` }} />
            </div>
            {canEdit && exercise.status === "PLANNING" && (
              <form action={transitionDraftToReadyAction}>
                <input type="hidden" name="exerciseId" value={exercise.id} />
                <button
                  disabled={!readiness.canGoReady}
                  className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-emerald-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none disabled:hover:translate-y-0"
                >
                  <CheckCircle2 size={12} />
                  Mark READY
                </button>
              </form>
            )}
          </div>
        </div>
        {failedRequired.length > 0 && (
          <details className="mt-2">
            <summary className="cursor-pointer text-[11px] font-semibold text-ink">
              Show {failedRequired.length} failing required check{failedRequired.length === 1 ? "" : "s"}
            </summary>
            <ul className="mt-1.5 space-y-0.5 text-[11px] text-rose-800 dark:text-rose-200">
              {failedRequired.map((c) => (
                <li key={c.id} className="flex items-center gap-1.5">
                  <AlertOctagon size={10} />
                  <button
                    type="button"
                    onClick={() => setActive(c.stage)}
                    className="text-left underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none"
                  >
                    {c.label}
                  </button>
                </li>
              ))}
            </ul>
          </details>
        )}
      </section>

      {/* ─── Tab list (the 5 planning stages) ─────────────────────────── */}
      <PlanningTabs
        readiness={readiness}
        active={active}
        onChange={setActive}
      />

      {/* ─── Active stage panel ───────────────────────────────────────── */}
      <div
        role="tabpanel"
        id={`stage-panel-${active.toLowerCase()}`}
        aria-labelledby={`stage-tab-${active.toLowerCase()}`}
        className="space-y-4"
      >
        {active === "BASICS" && <ScheduleCard exercise={exercise} canEdit={canEdit} />}
        {active === "SCENARIOS" && (
          <ScenariosPanel exercise={exercise} orgIBSs={orgIBSs} canEdit={canEdit} />
        )}
        {active === "TEAM" && (
          <RosterCard
            exercise={exercise}
            participants={participants}
            orgUsers={orgUsers}
            orgRoles={orgRoles}
            canEdit={canEdit}
          />
        )}
        {active === "INJECTS" && <InjectsPanel exercise={exercise} canEdit={canEdit} />}
        {active === "PREFLIGHT" && <BriefingCard exercise={exercise} canEdit={canEdit} />}

        {canEdit && exercise.status === "PLANNING" && (
          <p className="text-center text-[11px] text-soft">
            Prefer the guided 5-step wizard for this stage?{" "}
            <Link
              href={`/exercises/new?step=${stageStep(active)}&id=${exercise.id}`}
              className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
            >
              Open in wizard →
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}

function isStageKey(s: string): s is StageKey {
  return s === "BASICS" || s === "SCENARIOS" || s === "TEAM" || s === "INJECTS" || s === "PREFLIGHT";
}

function stageStep(s: StageKey): number {
  return STAGES.find((x) => x.key === s)?.step ?? 1;
}

// ────────────────────────────────────────────────────────────────────────────
// Schedule card
// ────────────────────────────────────────────────────────────────────────────

// ────────────────────────────────────────────────────────────────────────────
// Planning tabs — the 5 wizard stages turned into a click-to-show tab list.
// Each tab is one stage; the active stage's panel renders below.
// ────────────────────────────────────────────────────────────────────────────

function PlanningTabs({
  readiness,
  active,
  onChange,
}: {
  readiness: Readiness;
  active: StageKey;
  onChange: (s: StageKey) => void;
}) {
  const byStage = useMemo(() => {
    const map = new Map<StageKey, Readiness["checks"]>();
    for (const s of STAGES) map.set(s.key, []);
    for (const c of readiness.checks) {
      const list = map.get(c.stage);
      if (list) list.push(c);
    }
    return map;
  }, [readiness.checks]);

  const refs = useRef<Record<string, HTMLButtonElement | null>>({});

  const onKeyDown = (e: React.KeyboardEvent, idx: number) => {
    if (e.key !== "ArrowLeft" && e.key !== "ArrowRight" && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    let next = idx;
    if (e.key === "ArrowLeft") next = (idx - 1 + STAGES.length) % STAGES.length;
    if (e.key === "ArrowRight") next = (idx + 1) % STAGES.length;
    if (e.key === "Home") next = 0;
    if (e.key === "End") next = STAGES.length - 1;
    const nextKey = STAGES[next].key;
    onChange(nextKey);
    refs.current[nextKey]?.focus();
  };

  return (
    <div
      role="tablist"
      aria-label="Planning stages"
      className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5"
    >
      {STAGES.map((s, idx) => {
        const list = byStage.get(s.key) ?? [];
        const passed = list.filter((c) => c.ok).length;
        const total = list.length;
        const failedRequired = list.filter((c) => !c.ok && (c.required || readiness.strict));
        const allPass = total > 0 && passed === total;
        const hasBlocker = failedRequired.length > 0;
        const pct = total === 0 ? 100 : Math.round((passed / total) * 100);
        const isActive = active === s.key;
        const tone = allPass
          ? "border-emerald-400 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-950/30"
          : hasBlocker
            ? "border-rose-300 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
            : "border-amber-300 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30";
        const fillTone = allPass ? "bg-emerald-500" : hasBlocker ? "bg-rose-500" : "bg-amber-500";
        return (
          <button
            key={s.key}
            ref={(el) => {
              refs.current[s.key] = el;
            }}
            id={`stage-tab-${s.key.toLowerCase()}`}
            role="tab"
            type="button"
            aria-selected={isActive}
            aria-controls={`stage-panel-${s.key.toLowerCase()}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onChange(s.key)}
            onKeyDown={(e) => onKeyDown(e, idx)}
            className={`rounded-lg border p-3 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${tone} ${
              isActive
                ? "shadow-[var(--shadow-card-md)] ring-2 ring-indigo-500"
                : "opacity-80 hover:opacity-100 hover:shadow-[var(--shadow-card)]"
            }`}
          >
            <div className="flex items-baseline justify-between gap-2">
              <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-ink">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/60 font-mono text-[9px] text-ink dark:bg-black/30">
                  {s.step}
                </span>
                {s.label}
              </p>
              {allPass ? (
                <CheckCircle2 size={12} className="text-emerald-600 dark:text-emerald-300" />
              ) : (
                <AlertOctagon
                  size={12}
                  className={
                    hasBlocker
                      ? "text-rose-600 dark:text-rose-300"
                      : "text-amber-600 dark:text-amber-300"
                  }
                />
              )}
            </div>
            <p className="mt-0.5 text-[10px] text-soft">{s.hint}</p>
            <div className="mt-2 flex items-center gap-1.5 text-[10px]">
              <span className="font-mono font-semibold text-ink">
                {passed}/{total || 0}
              </span>
              <div className="h-1 flex-1 overflow-hidden rounded-full bg-white/50 dark:bg-black/20">
                <div className={`h-full ${fillTone}`} style={{ width: `${pct}%` }} />
              </div>
            </div>
            {failedRequired.length > 0 && (
              <ul className="mt-1.5 space-y-0.5 text-[10px] text-rose-800 dark:text-rose-200">
                {failedRequired.slice(0, 2).map((c) => (
                  <li key={c.id} className="truncate">
                    · {c.label}
                  </li>
                ))}
                {failedRequired.length > 2 && (
                  <li className="italic text-rose-700/80 dark:text-rose-300/80">
                    + {failedRequired.length - 2} more
                  </li>
                )}
              </ul>
            )}
          </button>
        );
      })}
    </div>
  );
}

function ScheduleCard({ exercise, canEdit }: { exercise: ExerciseSnapshot; canEdit: boolean }) {
  const allOk = !!exercise.plannedDate && !!exercise.durationMin;
  const dateStr = exercise.plannedDate
    ? exercise.plannedDate.toISOString().slice(0, 16)
    : "";
  return (
    <Card icon={CalendarClock} title="Schedule" ok={allOk}>
      <form action={setExerciseScheduleAction} className="grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="exerciseId" value={exercise.id} />
        <Field
          label="Planned date + time"
          name="plannedDate"
          type="datetime-local"
          defaultValue={dateStr}
          disabled={!canEdit}
          required
        />
        <div>
          <label className="block text-sm">
            <span className="text-ink">Duration (min)</span>
          </label>
          <div className="mt-1 flex flex-wrap gap-1">
            {DURATION_PRESETS.map((d) => (
              <DurationChip key={d} value={d} current={exercise.durationMin} />
            ))}
          </div>
          <input
            type="number"
            name="durationMin"
            min={15}
            max={2880}
            step={15}
            defaultValue={exercise.durationMin ?? 180}
            disabled={!canEdit}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
          />
        </div>
        <label className="block text-sm">
          <span className="text-ink">Time zone</span>
          <select
            name="timeZone"
            defaultValue={exercise.timeZone ?? "Europe/London"}
            disabled={!canEdit}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
          >
            {TZ_PRESETS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          <span className="text-ink">Speed multiplier</span>
          <select
            name="speedMultiplier"
            defaultValue={String(exercise.speedMultiplier)}
            disabled={!canEdit}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
          >
            <option value="1">×1 real-time</option>
            <option value="5">×5</option>
            <option value="15">×15</option>
            <option value="60">×60 (1 min = 1 D-Day hr)</option>
          </select>
        </label>
        <label className="block text-sm sm:col-span-2">
          <span className="text-ink">Location</span>
          <input
            name="location"
            maxLength={200}
            defaultValue={exercise.location ?? ""}
            disabled={!canEdit}
            placeholder="e.g. London war-room · distributed · hybrid" aria-label="e.g. London war-room · distributed · hybrid"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
          />
        </label>
        {exercise.regulatorMode && (
          <div className="sm:col-span-3">
            <RegulatorAudienceInline exercise={exercise} canEdit={canEdit} />
          </div>
        )}
        {canEdit && (
          <div className="sm:col-span-3 flex justify-end">
            <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500">
              <Save size={11} />
              Save schedule
            </button>
          </div>
        )}
      </form>
    </Card>
  );
}

function RegulatorAudienceInline({
  exercise,
  canEdit,
}: {
  exercise: ExerciseSnapshot;
  canEdit: boolean;
}) {
  return (
    <form action={setRegulatorAudienceAction} className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
      <input type="hidden" name="exerciseId" value={exercise.id} />
      <label className="block text-sm">
        <span className="text-ink">Regulator audience (required in regulator mode)</span>
        <input
          name="regulatorAudience"
          maxLength={120}
          defaultValue={exercise.regulatorAudience ?? ""}
          placeholder="e.g. PRA SS1/21 · FCA SYSC 15A · BoE FMI · DORA Art. 25" aria-label="e.g. PRA SS1/21 · FCA SYSC 15A · BoE FMI · DORA Art. 25"
          disabled={!canEdit}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
        />
      </label>
      {canEdit && (
        <button className="self-end rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[11px] text-ink hover:border-line-strong">
          Save
        </button>
      )}
    </form>
  );
}

function DurationChip({ value, current }: { value: number; current: number | null }) {
  const label = value < 60 ? `${value}m` : value % 60 === 0 ? `${value / 60}h` : `${Math.floor(value / 60)}h ${value % 60}m`;
  const active = current === value;
  return (
    <button
      type="button"
      onClick={(e) => {
        const input = e.currentTarget.parentElement?.parentElement?.querySelector<HTMLInputElement>(
          'input[name="durationMin"]',
        );
        if (input) input.value = String(value);
      }}
      className={`rounded-md border px-2 py-1 text-[11px] ${
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
          : "border-line bg-surface-1 text-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Roster card
// ────────────────────────────────────────────────────────────────────────────

function RosterCard({
  exercise,
  participants,
  orgUsers,
  orgRoles,
  canEdit,
}: {
  exercise: ExerciseSnapshot;
  participants: Participant[];
  orgUsers: OrgUser[];
  orgRoles: OrgRole[];
  canEdit: boolean;
}) {
  const [showAdd, setShowAdd] = useState(false);
  const ok = participants.length >= 2;
  const smfRoles = orgRoles.filter((r) => r.isSMF);
  const filledByAbbr = new Set(participants.map((p) => p.roleTitle));
  const unfilledSMFs = smfRoles.filter((r) => !filledByAbbr.has(r.abbreviation));

  return (
    <Card icon={Users} title="Roster" ok={ok} subtitle={`${participants.length} on roster · ${unfilledSMFs.length} SMF seats unfilled`}>
      <div className="space-y-3">
        {/* Co-facilitator picker */}
        <form action={setCoFacilitatorAction} className="grid gap-2 sm:grid-cols-[1fr_auto] items-end">
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <label className="block text-sm">
            <span className="flex items-center gap-1.5 text-ink">
              <Crown size={12} className="text-amber-600" />
              Backup facilitator (recommended)
            </span>
            <select
              name="coFacilitatorId"
              defaultValue={exercise.coFacilitatorId ?? ""}
              disabled={!canEdit}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            >
              <option value="">— none —</option>
              {orgUsers
                .filter((u) => u.id !== exercise.facilitatorId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                  </option>
                ))}
            </select>
          </label>
          {canEdit && (
            <button className="rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[11px] text-ink hover:border-line-strong">
              Save
            </button>
          )}
        </form>

        {/* Participant list */}
        {participants.length > 0 && (
          <ul className="space-y-1">
            {participants.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-0 p-2 text-xs"
              >
                <div className="min-w-0">
                  <p className="font-medium text-ink">{p.userName}</p>
                  <p className="text-[10px] text-soft">
                    <span className="font-mono">{p.roleTitle}</span> · {p.exerciseRole}
                  </p>
                </div>
                {canEdit && (
                  <form action={removeExerciseMemberAction}>
                    <input type="hidden" name="exerciseId" value={exercise.id} />
                    <input type="hidden" name="participantId" value={p.id} />
                    <button className="text-soft hover:text-rose-700" title="Remove">
                      <Trash2 size={11} />
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Unfilled SMF roles — one-click add */}
        {unfilledSMFs.length > 0 && canEdit && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-2 text-xs dark:border-amber-800/60 dark:bg-amber-950/30">
            <p className="font-semibold text-amber-900 dark:text-amber-100">
              SMF seats not yet filled
            </p>
            <p className="mt-0.5 text-[10px] text-amber-800 dark:text-amber-200">
              Click a seat below to assign — uses the default holder when one is set.
            </p>
            <div className="mt-1 flex flex-wrap gap-1">
              {unfilledSMFs.map((r) => (
                <SmfQuickAdd key={r.id} exerciseId={exercise.id} role={r} orgUsers={orgUsers} />
              ))}
            </div>
          </div>
        )}

        {/* Add participant */}
        {canEdit && (
          <>
            {!showAdd ? (
              <button
                type="button"
                onClick={() => setShowAdd(true)}
                className="inline-flex items-center gap-1 rounded-md border border-dashed border-line bg-surface-0 px-3 py-1.5 text-xs text-muted hover:border-line-strong hover:text-ink"
              >
                <UserPlus size={11} />
                Add a participant
              </button>
            ) : (
              <form
                action={async (fd) => {
                  await assignMemberAction(fd);
                  setShowAdd(false);
                }}
                className="grid gap-2 rounded-md border border-line bg-surface-0 p-2 sm:grid-cols-[2fr_1fr_auto] items-end"
              >
                <input type="hidden" name="exerciseId" value={exercise.id} />
                <input type="hidden" name="exerciseRole" value="PARTICIPANT" />
                <label className="text-[11px]">
                  <span className="text-muted">User</span>
                  <select
                    name="userId"
                    required
                    defaultValue=""
                    className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-sm"
                  >
                    <option value="" disabled>
                      — pick —
                    </option>
                    {orgUsers
                      .filter((u) => !participants.some((p) => p.userId === u.id))
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name ?? u.email}
                        </option>
                      ))}
                  </select>
                </label>
                <label className="text-[11px]">
                  <span className="text-muted">Role title</span>
                  <input
                    name="roleTitle"
                    required
                    maxLength={120}
                    placeholder="e.g. CRO" aria-label="e.g. CRO"
                    list={`role-suggestions-${exercise.id}`}
                    className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-sm"
                  />
                  <datalist id={`role-suggestions-${exercise.id}`}>
                    {orgRoles.map((r) => (
                      <option key={r.id} value={r.abbreviation}>
                        {r.title}
                      </option>
                    ))}
                  </datalist>
                </label>
                <div className="flex items-center gap-1">
                  <button className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500">
                    Add
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="text-[10px] text-soft hover:text-ink"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>
    </Card>
  );
}

function SmfQuickAdd({
  exerciseId,
  role,
  orgUsers,
}: {
  exerciseId: string;
  role: OrgRole;
  orgUsers: OrgUser[];
}) {
  const defaultUser = role.defaultHolderId
    ? orgUsers.find((u) => u.id === role.defaultHolderId)
    : null;
  return (
    <form action={assignMemberAction}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="roleTitle" value={role.abbreviation} />
      <input type="hidden" name="exerciseRole" value="PARTICIPANT" />
      <input
        type="hidden"
        name="userId"
        value={defaultUser?.id ?? orgUsers[0]?.id ?? ""}
      />
      <button
        type="submit"
        disabled={!defaultUser && orgUsers.length === 0}
        title={
          defaultUser
            ? `Assign ${defaultUser.name ?? defaultUser.email} as ${role.abbreviation}`
            : `No default holder set for ${role.abbreviation}`
        }
        className="rounded-full bg-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-900 hover:bg-amber-300 dark:bg-amber-900/60 dark:text-amber-100"
      >
        + {role.abbreviation}
      </button>
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Scenarios panel — objectives + IBSs. (Injects moved to their own tab.)
// ────────────────────────────────────────────────────────────────────────────

function ScenariosPanel({
  exercise,
  orgIBSs,
  canEdit,
}: {
  exercise: ExerciseSnapshot;
  orgIBSs: OrgIBS[];
  canEdit: boolean;
}) {
  const ok = exercise.ibsIds.length > 0 && exercise.objectives.length > 0;
  return (
    <Card
      icon={Target}
      title="Scenarios — objectives + IBSs"
      ok={ok}
      subtitle={`${exercise.objectives.length} objective${exercise.objectives.length === 1 ? "" : "s"} · ${exercise.ibsIds.length} IBS${exercise.ibsIds.length === 1 ? "" : "s"} linked · scenario: ${exercise.scenarioTitle}`}
    >
      <div className="space-y-4">
        <form action={setExerciseObjectivesAction}>
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <label className="block text-sm">
            <span className="flex items-center gap-1.5 text-ink">
              <Sparkles size={12} className="text-indigo-600 dark:text-indigo-300" />
              Objectives (one per line, 1-5)
            </span>
            <textarea
              name="objectivesText"
              rows={4}
              maxLength={2000}
              disabled={!canEdit}
              defaultValue={exercise.objectives.join("\n")}
              placeholder={"e.g.\n- Test 4h FCA notification path under cyber pressure\n- Validate dual-approval continuity-activation decision"}
              aria-label="Objectives, one per line"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
            />
          </label>
          {canEdit && (
            <div className="mt-1 flex justify-end">
              <button className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500">
                Save objectives
              </button>
            </div>
          )}
        </form>

        <IbsMultiSelect exercise={exercise} orgIBSs={orgIBSs} canEdit={canEdit} />
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Injects panel — scheduled count, scenario context, deep-link to timeline.
// ────────────────────────────────────────────────────────────────────────────

function InjectsPanel({
  exercise,
  canEdit,
}: {
  exercise: ExerciseSnapshot;
  canEdit: boolean;
}) {
  const ok = exercise.visibleInjects > 0;
  return (
    <Card
      icon={Layers}
      title="Injects"
      ok={ok}
      subtitle={`${exercise.visibleInjects} of ${exercise.totalInjects} inject${exercise.totalInjects === 1 ? "" : "s"} visible · scenario: ${exercise.scenarioTitle}`}
    >
      <div className="space-y-3 text-sm">
        <p className="text-muted">
          Injects are the events and stimuli that drop into the war-room during the run. They live
          in the scenario; the inject editor lets you reorder, hide, or address them for this
          exercise.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          {canEdit && (
            <Link
              href={`/exercises/new?step=4&id=${exercise.id}`}
              className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-indigo-500"
            >
              <Edit3 size={12} />
              Open inject timeline
            </Link>
          )}
          <Link
            href={`/scenarios/${exercise.scenarioId}`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] text-ink hover:border-line-strong"
          >
            <Edit3 size={11} />
            Edit the source scenario
          </Link>
        </div>
      </div>
    </Card>
  );
}

function IbsMultiSelect({
  exercise,
  orgIBSs,
  canEdit,
}: {
  exercise: ExerciseSnapshot;
  orgIBSs: OrgIBS[];
  canEdit: boolean;
}) {
  const [picked, setPicked] = useState(new Set(exercise.ibsIds));
  const toggle = (id: string) => {
    setPicked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  return (
    <form action={setExerciseIbsLinksAction}>
      <input type="hidden" name="exerciseId" value={exercise.id} />
      <input type="hidden" name="ibsIdsCsv" value={Array.from(picked).join(",")} />
      <p className="flex items-center gap-1.5 text-sm text-ink">
        <Globe size={12} className="text-indigo-600 dark:text-indigo-300" />
        Important Business Services tested
      </p>
      {orgIBSs.length === 0 ? (
        <p className="mt-1 rounded-md border border-dashed border-line bg-surface-0 p-2 text-[11px] text-muted">
          No IBSs in your org register yet.{" "}
          <Link href="/ibs/new" className="font-medium text-indigo-600 underline">
            Add one
          </Link>
          .
        </p>
      ) : (
        <ul className="mt-1 grid gap-1 sm:grid-cols-2">
          {orgIBSs.map((ibs) => (
            <li key={ibs.id}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs ${
                  picked.has(ibs.id)
                    ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/40"
                    : "border-line bg-surface-0 hover:border-line-strong"
                }`}
              >
                <input
                  type="checkbox"
                  checked={picked.has(ibs.id)}
                  onChange={() => toggle(ibs.id)}
                  disabled={!canEdit}
                />
                <span className="min-w-0 flex-1">
                  <span className="block font-medium text-ink">{ibs.name}</span>
                  {ibs.criticality && (
                    <span className="block text-[10px] text-soft">{ibs.criticality}</span>
                  )}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
      {canEdit && orgIBSs.length > 0 && (
        <div className="mt-1 flex justify-end">
          <button className="rounded-md bg-indigo-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-indigo-500">
            Save IBS links ({picked.size})
          </button>
        </div>
      )}
    </form>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Briefing card
// ────────────────────────────────────────────────────────────────────────────

function BriefingCard({ exercise, canEdit }: { exercise: ExerciseSnapshot; canEdit: boolean }) {
  const ok = !!exercise.briefingSentAt || !!exercise.briefingSkippedReason;
  return (
    <Card icon={Mail} title="Briefing" ok={ok} subtitle={
      exercise.briefingSentAt
        ? `Sent ${exercise.briefingSentAt.toISOString().slice(0, 10)}`
        : exercise.briefingSkippedReason
          ? `Skipped: ${exercise.briefingSkippedReason}`
          : "Pre-exercise briefing not yet sent or skipped"
    }>
      <div className="space-y-2">
        <p className="text-[11px] text-soft">
          The full draft + .ics download live on the wizard&apos;s Pre-flight step. Open it for the
          complete pre-flight summary including cost, DORA preview, and the readiness gate.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={`/exercises/new?step=5&id=${exercise.id}`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] font-medium text-ink hover:border-line-strong"
          >
            <Edit3 size={11} />
            Open pre-flight + briefing draft
          </Link>
          <a
            href={`/api/exercises/${exercise.id}/ics`}
            className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] font-medium text-ink hover:border-line-strong"
          >
            <CalendarClock size={11} />
            Download .ics
          </a>
          {canEdit && !exercise.briefingSentAt && (
            <form action={markBriefingSentAction} className="inline">
              <input type="hidden" name="exerciseId" value={exercise.id} />
              <button className="inline-flex items-center gap-1 rounded-md bg-emerald-600 px-2 py-1 text-[11px] font-semibold text-white hover:bg-emerald-500">
                <Send size={11} />
                Mark briefing sent
              </button>
            </form>
          )}
          {canEdit && !exercise.briefingSkippedReason && (
            <form action={markBriefingSkippedAction} className="inline flex items-center gap-1">
              <input type="hidden" name="exerciseId" value={exercise.id} />
              <input
                name="reason"
                required
                maxLength={200}
                placeholder="Reason for skipping…" aria-label="Reason for skipping…"
                className="rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-[11px]"
              />
              <button className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] text-ink hover:border-line-strong">
                Mark skipped
              </button>
            </form>
          )}
        </div>
      </div>
    </Card>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Generic card chrome
// ────────────────────────────────────────────────────────────────────────────

function Card({
  icon: Icon,
  title,
  ok,
  subtitle,
  children,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  ok: boolean;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-line bg-surface-1">
      <header className="flex items-center gap-2 p-4">
        {ok ? (
          <CheckCircle2 size={16} className="shrink-0 text-emerald-600 dark:text-emerald-300" />
        ) : (
          <AlertOctagon size={16} className="shrink-0 text-amber-600 dark:text-amber-300" />
        )}
        <Icon size={14} className="text-soft" />
        <div>
          <p className="text-sm font-semibold text-ink">{title}</p>
          {subtitle && <p className="text-[11px] text-soft">{subtitle}</p>}
        </div>
      </header>
      <div className="border-t border-line p-4">{children}</div>
    </section>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
      />
    </label>
  );
}
