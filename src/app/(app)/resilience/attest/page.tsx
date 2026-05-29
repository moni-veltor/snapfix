import Link from "next/link";
import { ShieldCheck, ArrowRight, AlertTriangle, FileCheck2, CalendarClock } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import StatusBadge from "@/components/ui/StatusBadge";
import { openAttestationCycleAction } from "@/app/actions/resilience-attestation";
import {
  computeCycleDueAt,
  daysUntil,
  type ResilienceSnapshot,
} from "@/lib/resilience-attestation";
import {
  evaluateAttestationReadiness,
  type AreaStatus,
} from "@/lib/attestation-readiness";

export const metadata = { title: "Annual attestation — SnapFix" };

type SignLine = { signedAt: Date | null; label: string };

export default async function AttestationDashboardPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const [org, cycles, pendingChanges] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: me.orgId },
      select: {
        attestationCycleStartMonth: true,
        smfAccountableForResilienceUserId: true,
        boardCommitteeForResilienceName: true,
        smfAccountableForResilience: { select: { name: true, email: true } },
      },
    }),
    prisma.orgResilienceAttestation.findMany({
      where: { orgId: me.orgId },
      orderBy: { cycleYear: "desc" },
      select: {
        id: true,
        cycleYear: true,
        cycleLabel: true,
        status: true,
        openedAt: true,
        firstLineSignedAt: true,
        secondLineSignedAt: true,
        executiveSignedAt: true,
        boardApprovedAt: true,
        snapshotJson: true,
      },
    }),
    prisma.orgResilienceMaterialChange.count({
      where: { orgId: me.orgId, reviewOutcome: "PENDING" },
    }),
  ]);

  const thisYear = new Date().getUTCFullYear();
  const hasThisYear = cycles.some((c) => c.cycleYear === thisYear);
  const startMonth = org?.attestationCycleStartMonth ?? null;
  const smfName = org?.smfAccountableForResilience?.name ?? org?.smfAccountableForResilience?.email ?? null;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Operational resilience"
        icon={ShieldCheck}
        title="Annual self-attestation"
        pitch="The firm-wide annual artefact a supervisor can ask to see within an hour. Roll up the IBS register, tolerances, 12 months of testing and the gap analysis, then have it signed by the named SMF."
        actions={
          !hasThisYear ? (
            <form action={openAttestationCycleAction}>
              <input type="hidden" name="cycleYear" value={thisYear} />
              <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                <ShieldCheck size={14} />
                Open FY{thisYear} cycle
              </button>
            </form>
          ) : undefined
        }
      />

      {/* Setup nudges */}
      {(!smfName || startMonth === null) && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-300/60 bg-amber-50 p-4 text-sm dark:border-amber-700/60 dark:bg-amber-950/30">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700 dark:text-amber-300" aria-hidden />
          <div>
            <p className="font-medium text-amber-900 dark:text-amber-100">Finish the attestation setup</p>
            <ul className="mt-1 space-y-0.5 text-xs text-amber-800/90 dark:text-amber-200/80">
              {!smfName && <li>· Name the SMF accountable for operational resilience — they sign the executive line.</li>}
              {startMonth === null && <li>· Set the cycle start month so due-dates compute correctly (defaults to January).</li>}
            </ul>
            <p className="mt-1.5 text-[11px] text-amber-700/80 dark:text-amber-300/70">
              Configurable on the org settings page. Sign-off (R3) needs the SMF named.
            </p>
          </div>
        </div>
      )}

      {pendingChanges > 0 && (
        <Link
          href="/resilience/material-changes"
          className="flex items-center justify-between gap-3 rounded-xl border border-line bg-surface-1 p-4 text-sm transition hover:border-line-strong"
        >
          <span className="flex items-center gap-2 text-ink">
            <AlertTriangle size={15} className="text-amber-600 dark:text-amber-300" />
            {pendingChanges} material change{pendingChanges === 1 ? "" : "s"} awaiting review
          </span>
          <ArrowRight size={14} className="text-soft" />
        </Link>
      )}

      {cycles.length === 0 ? (
        <EmptyState thisYear={thisYear} />
      ) : (
        <ul className="space-y-3">
          {cycles.map((c) => {
            const due = computeCycleDueAt(c.cycleYear, startMonth);
            const dleft = daysUntil(due);
            const lines: SignLine[] = [
              { signedAt: c.firstLineSignedAt, label: "1st line" },
              { signedAt: c.secondLineSignedAt, label: "2nd line" },
              { signedAt: c.executiveSignedAt, label: "Executive (SMF)" },
            ];
            const signedCount = lines.filter((l) => l.signedAt).length;
            const snapshot = (c.snapshotJson ?? null) as ResilienceSnapshot | null;
            const ibsCount = snapshot?.ibsRegister.length ?? 0;
            const readiness = snapshot
              ? evaluateAttestationReadiness(snapshot, {
                  firstLineSigned: !!c.firstLineSignedAt,
                  secondLineSigned: !!c.secondLineSignedAt,
                  executiveSigned: !!c.executiveSignedAt,
                  boardApproved: !!c.boardApprovedAt,
                })
              : null;

            return (
              <li key={c.id}>
                <Link
                  href={`/resilience/attest/${c.cycleYear}`}
                  className="group block rounded-xl border border-line bg-surface-1 p-5 transition hover:border-line-strong hover:shadow-[var(--shadow-card)]"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-display text-lg font-semibold text-ink">
                          {c.cycleLabel ?? `FY${c.cycleYear}`}
                        </h2>
                        <StatusBadge
                          status={c.status}
                          labelOverride={statusLabel(c.status)}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted">
                        Opened {c.openedAt.toISOString().slice(0, 10)} · {ibsCount} IBS in snapshot
                      </p>
                    </div>
                    <div className="text-right">
                      {c.status === "ATTESTED" ? (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-300">
                          <FileCheck2 size={13} /> Attested
                        </span>
                      ) : (
                        <span
                          className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            dleft < 0
                              ? "text-rose-700 dark:text-rose-300"
                              : dleft <= 30
                                ? "text-amber-700 dark:text-amber-300"
                                : "text-muted"
                          }`}
                        >
                          <CalendarClock size={13} />
                          {dleft < 0 ? `${Math.abs(dleft)}d overdue` : `Due in ${dleft}d`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Readiness roll-up */}
                  {readiness && (
                    <div className="mt-4 flex items-center gap-2">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${readinessChip(readiness.overall)}`}
                      >
                        {readinessLabel(readiness.overall)}
                      </span>
                      <span className="text-[11px] text-muted">
                        {readiness.readyCount} of {readiness.totalAreas} capability areas ready
                      </span>
                    </div>
                  )}

                  {/* Sign-off progress */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2">
                      <div
                        className={`h-full ${signedCount === 3 ? "bg-emerald-500" : "bg-indigo-500"}`}
                        style={{ width: `${(signedCount / 3) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-[11px] text-soft">{signedCount}/3 signed</span>
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {lines.map((l) => (
                      <span
                        key={l.label}
                        className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          l.signedAt
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "bg-surface-2 text-soft"
                        }`}
                      >
                        {l.signedAt ? "✓ " : ""}
                        {l.label}
                      </span>
                    ))}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function statusLabel(status: string): string {
  switch (status) {
    case "DRAFT":
      return "Draft";
    case "UNDER_REVIEW":
      return "Under review";
    case "ATTESTED":
      return "Attested";
    case "SUPERSEDED":
      return "Superseded";
    default:
      return status;
  }
}

function readinessChip(status: AreaStatus): string {
  switch (status) {
    case "READY":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
    case "PARTIAL":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200";
    case "GAP":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200";
  }
}

function readinessLabel(status: AreaStatus): string {
  switch (status) {
    case "READY":
      return "Ready";
    case "PARTIAL":
      return "Partial";
    case "GAP":
      return "Gaps";
  }
}

function EmptyState({ thisYear }: { thisYear: number }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center">
      <ShieldCheck size={28} className="mx-auto text-soft" aria-hidden />
      <h2 className="mt-3 font-display text-lg font-semibold text-ink">No attestation cycles yet</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted">
        Open this year&apos;s cycle to capture a frozen snapshot of your IBS register, tolerances,
        testing history and open action items — the evidence base the firm signs against.
      </p>
      <form action={openAttestationCycleAction} className="mt-5">
        <input type="hidden" name="cycleYear" value={thisYear} />
        <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          <ShieldCheck size={14} />
          Open FY{thisYear} cycle
        </button>
      </form>
    </div>
  );
}
