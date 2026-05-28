import {
  Building2,
  Boxes,
  Target,
  CheckSquare,
  ShieldCheck,
  Clock,
  CircleDashed,
} from "lucide-react";
import type {
  ResilienceSnapshot,
  SnapshotIBS,
  SnapshotVendor,
  SnapshotExercise,
  SnapshotActionItem,
} from "@/lib/resilience-attestation";

const CRIT_TONE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  MEDIUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  LOW: "bg-surface-2 text-muted",
};

function critPill(value: string) {
  const tone = CRIT_TONE[value] ?? "bg-surface-2 text-muted";
  return (
    <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone}`}>
      {value}
    </span>
  );
}

// ─── Overview ────────────────────────────────────────────────────────────────

export function OverviewPanel({ snapshot, generatedAt }: { snapshot: ResilienceSnapshot; generatedAt: string }) {
  const ibs = snapshot.ibsRegister;
  const approved = ibs.filter((i) => i.status === "APPROVED").length;
  const tested = new Set(
    snapshot.exerciseHistoryLast12Months.flatMap((e) => e.ibsIds),
  );
  const untested = ibs.filter((i) => !tested.has(i.id)).length;

  const stats = [
    { label: "IBS in register", value: ibs.length, sub: `${approved} approved`, icon: Building2 },
    { label: "Tested (12mo)", value: tested.size, sub: `${untested} untested`, icon: Target, tone: untested > 0 ? "warn" : "ok" },
    { label: "Exercises (12mo)", value: snapshot.exerciseHistoryLast12Months.length, sub: "in window", icon: Target },
    { label: "Open action items", value: snapshot.openActionItems.length, sub: "not closed", icon: CheckSquare, tone: snapshot.openActionItems.length > 0 ? "warn" : "ok" },
    { label: "Vendors mapped", value: snapshot.vendorCriticality.length, sub: `${snapshot.vendorCriticality.filter((v) => v.isMaterialThirdParty).length} MTP`, icon: Boxes },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted">
        Snapshot frozen {new Date(generatedAt).toISOString().slice(0, 16).replace("T", " ")} UTC.
        Everything below is the firm&apos;s posture at that moment — later edits to the register or
        exercises don&apos;t change it.
      </p>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {stats.map((s) => {
          const Icon = s.icon;
          const tone =
            s.tone === "warn"
              ? "border-amber-300/60 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/20"
              : s.tone === "ok"
                ? "border-emerald-300/50 bg-emerald-50/50 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                : "border-line bg-surface-1";
          return (
            <div key={s.label} className={`rounded-xl border p-3 ${tone}`}>
              <Icon size={14} className="text-soft" aria-hidden />
              <div className="mt-2 font-display text-2xl font-semibold text-ink">{s.value}</div>
              <div className="text-[11px] font-medium text-ink">{s.label}</div>
              <div className="text-[10px] text-soft">{s.sub}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── IBS register ──────────────────────────────────────────────────────────

export function IBSPanel({ rows, testedIds }: { rows: SnapshotIBS[]; testedIds: Set<string> }) {
  if (rows.length === 0) return <EmptyPanel label="No IBSs in the register snapshot." />;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {rows.map((ibs) => {
        const attestedLines = ibs.attestations.filter((a) => a.status === "ATTESTED").length;
        return (
          <li key={ibs.id} className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[10px] text-soft">{ibs.code}</span>
                <span className="text-sm font-medium text-ink">{ibs.name}</span>
                {critPill(ibs.criticality)}
                {ibs.status !== "APPROVED" && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                    {ibs.status}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[11px] text-muted">
                Tolerance {ibs.impactToleranceMin}m
                {ibs.fcaToleranceMin != null && ` · FCA ${ibs.fcaToleranceMin}m`}
                {ibs.praToleranceMin != null && ` · PRA ${ibs.praToleranceMin}m`}
                {" · "}
                {attestedLines}/3 lines attested
              </div>
            </div>
            <span
              className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
                testedIds.has(ibs.id)
                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                  : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              }`}
            >
              {testedIds.has(ibs.id) ? "Tested (12mo)" : "Not tested"}
            </span>
          </li>
        );
      })}
    </ul>
  );
}

// ─── Vendors ────────────────────────────────────────────────────────────────

export function VendorsPanel({ rows }: { rows: SnapshotVendor[] }) {
  if (rows.length === 0) return <EmptyPanel label="No vendors mapped in the snapshot." />;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {rows.map((v) => (
        <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{v.name}</span>
              {v.tier && critPill(v.tier.replace("TIER_", "T"))}
              {v.isMaterialThirdParty && (
                <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-200">
                  MTP
                </span>
              )}
              {v.isDoraCritical && (
                <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-violet-700 dark:bg-violet-950/50 dark:text-violet-200">
                  DORA-critical
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">
              {v.ibsIds.length} IBS link{v.ibsIds.length === 1 ? "" : "s"}
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Exercises ──────────────────────────────────────────────────────────────

export function ExercisesPanel({ rows }: { rows: SnapshotExercise[] }) {
  if (rows.length === 0) return <EmptyPanel label="No exercises in the last 12 months. That's a finding in itself." />;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {rows.map((e) => (
        <li key={e.id} className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-ink">{e.title}</span>
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-soft">
                {e.status}
              </span>
              {e.mode !== "PRODUCTION" && (
                <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-soft">
                  {e.mode}
                </span>
              )}
            </div>
            <div className="mt-0.5 text-[11px] text-muted">
              {e.scenarioTitle} · {e.ibsIds.length} IBS · {e.actionItemCount} action item{e.actionItemCount === 1 ? "" : "s"}
              {e.plannedDate && ` · ${e.plannedDate.slice(0, 10)}`}
            </div>
          </div>
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${
              e.hasAAR
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
            }`}
          >
            {e.hasAAR ? "AAR filed" : "No AAR"}
          </span>
        </li>
      ))}
    </ul>
  );
}

// ─── Action items ─────────────────────────────────────────────────────────

export function ActionItemsPanel({ rows }: { rows: SnapshotActionItem[] }) {
  if (rows.length === 0) return <EmptyPanel label="No open action items. Clean slate." />;
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {rows.map((ai) => (
        <li key={ai.id} className="flex flex-wrap items-center justify-between gap-3 bg-surface-1 p-3">
          <div className="min-w-0">
            <div className="text-sm font-medium text-ink">{ai.title}</div>
            <div className="mt-0.5 text-[11px] text-muted">
              {ai.ownerText ?? (ai.ownerUserId ? "Assigned" : "Unassigned")}
              {ai.dueAt && ` · due ${ai.dueAt.slice(0, 10)}`}
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            {critPill(ai.priority)}
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-medium text-soft">
              {ai.status.replace(/_/g, " ")}
            </span>
          </div>
        </li>
      ))}
    </ul>
  );
}

// ─── Sign-off (read-only in R2) ─────────────────────────────────────────────

export function SignOffPanel({
  lines,
  board,
  smfName,
}: {
  lines: { key: string; label: string; signedAt: Date | null; signerName: string | null; notes: string | null }[];
  board: { approvedAt: Date | null; committee: string | null; minuteRef: string | null };
  smfName: string | null;
}) {
  return (
    <div className="space-y-4">
      <ol className="space-y-2">
        {lines.map((l, i) => (
          <li
            key={l.key}
            className={`flex items-start gap-3 rounded-xl border p-3 ${
              l.signedAt
                ? "border-emerald-300/50 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/20"
                : "border-line bg-surface-1"
            }`}
          >
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
                l.signedAt
                  ? "bg-emerald-500 text-white"
                  : "bg-surface-2 text-soft"
              }`}
            >
              {l.signedAt ? <ShieldCheck size={14} /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-medium text-ink">{l.label}</span>
                {l.key === "executive" && smfName && (
                  <span className="text-[11px] text-muted">· {smfName}</span>
                )}
              </div>
              {l.signedAt ? (
                <p className="mt-0.5 text-[11px] text-muted">
                  Signed {l.signedAt.toISOString().slice(0, 16).replace("T", " ")} UTC
                  {l.signerName && ` by ${l.signerName}`}
                  {l.notes && ` — "${l.notes}"`}
                </p>
              ) : (
                <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
                  <CircleDashed size={11} /> Awaiting signature
                </p>
              )}
            </div>
          </li>
        ))}
        <li
          className={`flex items-start gap-3 rounded-xl border p-3 ${
            board.approvedAt
              ? "border-emerald-300/50 bg-emerald-50/40 dark:border-emerald-800/50 dark:bg-emerald-950/20"
              : "border-line bg-surface-1"
          }`}
        >
          <span
            className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold ${
              board.approvedAt ? "bg-emerald-500 text-white" : "bg-surface-2 text-soft"
            }`}
          >
            {board.approvedAt ? <ShieldCheck size={14} /> : <Clock size={13} />}
          </span>
          <div className="min-w-0 flex-1">
            <span className="text-sm font-medium text-ink">Board ratification</span>
            {board.approvedAt ? (
              <p className="mt-0.5 text-[11px] text-muted">
                {board.committee ?? "Board"} · {board.approvedAt.toISOString().slice(0, 10)}
                {board.minuteRef && ` · ${board.minuteRef}`}
              </p>
            ) : (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-soft">
                <CircleDashed size={11} /> Not yet ratified
              </p>
            )}
          </div>
        </li>
      </ol>

      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-4 text-center text-xs text-muted">
        The three-line signing flow ships in <span className="font-medium text-ink">R3</span>. This
        panel is read-only for now — it shows where each cycle sits in the chain.
      </div>
    </div>
  );
}

function EmptyPanel({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
      {label}
    </div>
  );
}
