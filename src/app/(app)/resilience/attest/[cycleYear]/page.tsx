import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ShieldCheck, RefreshCw, CalendarClock, FileCheck2 } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import StatusBadge from "@/components/ui/StatusBadge";
import AttestationTabs from "@/components/resilience/AttestationTabs";
import {
  OverviewPanel,
  IBSPanel,
  VendorsPanel,
  ExercisesPanel,
  ActionItemsPanel,
  SignOffPanel,
} from "@/components/resilience/SnapshotPanels";
import { regenerateAttestationSnapshotAction } from "@/app/actions/resilience-attestation";
import {
  computeCycleDueAt,
  daysUntil,
  type ResilienceSnapshot,
} from "@/lib/resilience-attestation";

export const metadata = { title: "Attestation cycle — SnapFix" };

export default async function AttestationCyclePage({
  params,
}: {
  params: Promise<{ cycleYear: string }>;
}) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { cycleYear } = await params;
  const year = Number.parseInt(cycleYear, 10);
  if (!Number.isFinite(year)) notFound();

  const [cycle, org] = await Promise.all([
    prisma.orgResilienceAttestation.findFirst({
      where: { orgId: me.orgId, cycleYear: year },
      include: {
        firstLineSignedBy: { select: { name: true, email: true } },
        secondLineSignedBy: { select: { name: true, email: true } },
        executiveSignedBy: { select: { name: true, email: true } },
        materialChanges: { select: { id: true } },
      },
    }),
    prisma.organization.findUnique({
      where: { id: me.orgId },
      select: {
        attestationCycleStartMonth: true,
        smfAccountableForResilience: { select: { name: true, email: true } },
      },
    }),
  ]);

  if (!cycle) notFound();

  const snapshot = (cycle.snapshotJson ?? null) as ResilienceSnapshot | null;
  const startMonth = org?.attestationCycleStartMonth ?? null;
  const due = computeCycleDueAt(year, startMonth);
  const dleft = daysUntil(due);
  const smfName =
    org?.smfAccountableForResilience?.name ?? org?.smfAccountableForResilience?.email ?? null;

  const testedIds = new Set(
    snapshot?.exerciseHistoryLast12Months.flatMap((e) => e.ibsIds) ?? [],
  );

  const signLines = [
    {
      key: "first",
      label: "First line (business owner)",
      signedAt: cycle.firstLineSignedAt,
      signerName: cycle.firstLineSignedBy?.name ?? cycle.firstLineSignedBy?.email ?? null,
      notes: cycle.firstLineNotes,
    },
    {
      key: "second",
      label: "Second line (risk & compliance)",
      signedAt: cycle.secondLineSignedAt,
      signerName: cycle.secondLineSignedBy?.name ?? cycle.secondLineSignedBy?.email ?? null,
      notes: cycle.secondLineNotes,
    },
    {
      key: "executive",
      label: "Executive (SMF accountable)",
      signedAt: cycle.executiveSignedAt,
      signerName: cycle.executiveSignedBy?.name ?? cycle.executiveSignedBy?.email ?? null,
      notes: cycle.executiveNotes,
    },
  ];

  return (
    <div className="space-y-6">
      <Link
        href="/resilience/attest"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        All cycles
      </Link>

      <PageHero
        eyebrow="Annual self-attestation"
        icon={ShieldCheck}
        title={cycle.cycleLabel ?? `FY${year}`}
        pitch={
          <span className="flex flex-wrap items-center gap-2">
            <StatusBadge status={cycle.status} labelOverride={statusLabel(cycle.status)} />
            <span className="text-[11px] text-soft">
              Opened {cycle.openedAt.toISOString().slice(0, 10)}
            </span>
            {cycle.status === "ATTESTED" ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 dark:text-emerald-300">
                <FileCheck2 size={12} /> Attested
              </span>
            ) : (
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-medium ${
                  dleft < 0
                    ? "text-rose-700 dark:text-rose-300"
                    : dleft <= 30
                      ? "text-amber-700 dark:text-amber-300"
                      : "text-soft"
                }`}
              >
                <CalendarClock size={12} />
                {dleft < 0 ? `${Math.abs(dleft)}d overdue` : `Due in ${dleft}d`}
              </span>
            )}
          </span>
        }
        actions={
          cycle.status === "DRAFT" ? (
            <form action={regenerateAttestationSnapshotAction}>
              <input type="hidden" name="cycleId" value={cycle.id} />
              <button className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2">
                <RefreshCw size={13} />
                Refresh snapshot
              </button>
            </form>
          ) : undefined
        }
      />

      {!snapshot ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          This cycle has no snapshot yet.{" "}
          {cycle.status === "DRAFT" && "Use “Refresh snapshot” to capture the current posture."}
        </div>
      ) : (
        <AttestationTabs
          counts={{
            ibs: snapshot.ibsRegister.length,
            vendors: snapshot.vendorCriticality.length,
            exercises: snapshot.exerciseHistoryLast12Months.length,
            actions: snapshot.openActionItems.length,
          }}
          panels={{
            overview: <OverviewPanel snapshot={snapshot} generatedAt={snapshot.generatedAt} />,
            ibs: <IBSPanel rows={snapshot.ibsRegister} testedIds={testedIds} />,
            vendors: <VendorsPanel rows={snapshot.vendorCriticality} />,
            exercises: <ExercisesPanel rows={snapshot.exerciseHistoryLast12Months} />,
            actions: <ActionItemsPanel rows={snapshot.openActionItems} />,
            signoff: (
              <SignOffPanel
                lines={signLines}
                board={{
                  approvedAt: cycle.boardApprovedAt,
                  committee: cycle.boardCommittee,
                  minuteRef: cycle.boardMinuteRef,
                }}
                smfName={smfName}
              />
            ),
          }}
        />
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
