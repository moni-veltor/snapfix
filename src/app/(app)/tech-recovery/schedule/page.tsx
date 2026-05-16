import Link from "next/link";
import { ArrowLeft, CalendarClock, CheckCircle2, Clock } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import {
  attestDRTestAction,
  updateDRScheduleAction,
} from "@/app/actions/tech-recovery";
import ToastForm from "@/components/ui/ToastForm";
import SubmitButton from "@/components/ui/SubmitButton";

export const metadata = { title: "DR test schedule — SnapFix" };

const TIER_TONE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  ESSENTIAL: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  IMPORTANT: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  ROUTINE: "bg-surface-2 text-muted",
};

const BUCKETS: { id: string; label: string; description: string; fromDay: number; toDay: number | null; tone: "critical" | "warn" | "info" | "ok" }[] = [
  {
    id: "overdue",
    label: "Overdue",
    description: "Next-due date has passed. Schedule immediately.",
    fromDay: -36500,
    toDay: 0,
    tone: "critical",
  },
  {
    id: "30d",
    label: "Due in 30 days",
    description: "Day 0–30. Slot the test into this month's calendar.",
    fromDay: 0,
    toDay: 31,
    tone: "warn",
  },
  {
    id: "90d",
    label: "Due in 90 days",
    description: "Day 31–90. Plan into the quarter.",
    fromDay: 31,
    toDay: 91,
    tone: "info",
  },
  {
    id: "later",
    label: "Later than 90 days",
    description: "More than 90 days out. No immediate action.",
    fromDay: 91,
    toDay: null,
    tone: "ok",
  },
];

export default async function DRSchedulePage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const systems = await prisma.techSystem.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: {
      drTests: {
        orderBy: { testedAt: "desc" },
        take: 1,
        include: { attestedBy: { select: { name: true, email: true } } },
      },
    },
  });

  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();
  function daysUntil(d: Date | null | undefined): number | null {
    if (!d) return null;
    return Math.floor((d.getTime() - now) / 86_400_000);
  }

  const unscheduled = systems.filter((s) => !s.nextDrTestDueAt);
  const scheduled = systems.filter((s) => s.nextDrTestDueAt);

  const bucketed = BUCKETS.map((b) => ({
    bucket: b,
    rows: scheduled.filter((s) => {
      const d = daysUntil(s.nextDrTestDueAt);
      if (d === null) return false;
      if (d < b.fromDay) return false;
      if (b.toDay !== null && d >= b.toDay) return false;
      return true;
    }),
  }));

  // Pending attestations — latest DR test per system not yet attested.
  const pendingAttestations = systems.filter(
    (s) => s.drTests[0] && !s.drTests[0].attestedById,
  );

  return (
    <div className="space-y-6">
      <Link
        href="/tech-recovery"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to tech recovery
      </Link>

      <PageHero
        eyebrow="DR programme"
        icon={CalendarClock}
        title="DR-test schedule"
        pitch={`${scheduled.length} system${scheduled.length === 1 ? "" : "s"} on a schedule, ${unscheduled.length} without. ${pendingAttestations.length} test${pendingAttestations.length === 1 ? "" : "s"} await tech-lead attestation.`}
      />

      {/* Pending attestations */}
      {pendingAttestations.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <CheckCircle2 size={13} />
            Pending tech-lead attestation
          </h2>
          <p className="text-xs text-muted">
            DR tests recorded but not yet signed off. Attestation closes the loop and
            advances the next-due date by the configured cadence.
          </p>
          <ul className="space-y-1.5">
            {pendingAttestations.map((s) => {
              const t = s.drTests[0];
              return (
                <li
                  key={s.id}
                  className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800/60 dark:bg-amber-950/30"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-ink">{s.name}</span>
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TIER_TONE[s.tier]}`}
                        >
                          {s.tier}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-muted">
                        Tested {t.testedAt.toISOString().slice(0, 10)} · outcome {t.outcome}
                        {t.rtoActualMin != null && (
                          <> · actual RTO {t.rtoActualMin}m</>
                        )}
                      </p>
                    </div>
                    {canManage && (
                      <ToastForm
                        action={attestDRTestAction}
                        toast={{
                          success: "Attestation recorded",
                          description: "Next-due date advanced if cadence configured.",
                          error: "Couldn't attest this test",
                        }}
                      >
                        <input type="hidden" name="testId" value={t.id} />
                        <SubmitButton tone="ok" size="sm">
                          Attest
                        </SubmitButton>
                      </ToastForm>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Scheduled buckets */}
      <div className="space-y-6">
        {bucketed.map(({ bucket, rows }) => (
          <section key={bucket.id} className="space-y-2">
            <header>
              <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                <BucketDot tone={bucket.tone} />
                {bucket.label}
                <span className="text-xs font-normal text-soft">
                  {rows.length} system{rows.length === 1 ? "" : "s"}
                </span>
              </h2>
              <p className="mt-0.5 text-[11px] text-soft">{bucket.description}</p>
            </header>
            {rows.length === 0 ? (
              <p className="rounded-md border border-dashed border-line bg-surface-1 px-3 py-2 text-xs text-soft">
                Nothing in this window.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {rows.map((s) => (
                  <li key={s.id}>
                    <ScheduledRow system={s} daysUntil={daysUntil(s.nextDrTestDueAt)} canManage={canManage} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        ))}
      </div>

      {/* Unscheduled */}
      {unscheduled.length > 0 && (
        <section className="space-y-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
            <Clock size={13} className="text-soft" />
            Not yet scheduled
            <span className="text-xs font-normal text-soft">
              {unscheduled.length} system{unscheduled.length === 1 ? "" : "s"}
            </span>
          </h2>
          <p className="text-[11px] text-soft">
            Set a cadence + next-due date below for each system.
          </p>
          <ul className="space-y-1.5">
            {unscheduled.map((s) => (
              <li key={s.id}>
                <ScheduledRow system={s} daysUntil={null} canManage={canManage} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

type SystemRow = {
  id: string;
  name: string;
  tier: string;
  drTestCadenceMonths: number | null;
  nextDrTestDueAt: Date | null;
  drTests: Array<{
    testedAt: Date;
    outcome: string;
    attestedBy: { name: string | null; email: string } | null;
    attestedAt: Date | null;
  }>;
};

function ScheduledRow({
  system,
  daysUntil,
  canManage,
}: {
  system: SystemRow;
  daysUntil: number | null;
  canManage: boolean;
}) {
  const lastTest = system.drTests[0];
  return (
    <div className="rounded-md border border-line bg-surface-1 p-3 text-sm">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="font-medium text-ink">{system.name}</span>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TIER_TONE[system.tier]}`}
            >
              {system.tier}
            </span>
            {system.drTestCadenceMonths && (
              <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
                Every {system.drTestCadenceMonths}mo
              </span>
            )}
          </div>
          <p className="mt-0.5 text-[11px] text-soft">
            {system.nextDrTestDueAt ? (
              <>
                Next due{" "}
                <span className="text-muted">
                  {system.nextDrTestDueAt.toISOString().slice(0, 10)}
                </span>
                {daysUntil !== null && (
                  <>
                    {" — "}
                    {daysUntil < 0 ? `${Math.abs(daysUntil)}d overdue` : `${daysUntil}d away`}
                  </>
                )}
              </>
            ) : (
              <span className="text-soft">No next-due date set.</span>
            )}
            {lastTest && (
              <>
                {" · "}Last tested {lastTest.testedAt.toISOString().slice(0, 10)}
                {" · "}outcome {lastTest.outcome}
                {lastTest.attestedAt ? (
                  <> · attested ✓</>
                ) : (
                  <> · awaiting attestation</>
                )}
              </>
            )}
          </p>
        </div>
      </div>

      {canManage && (
        <details className="mt-2">
          <summary className="cursor-pointer text-[11px] text-muted hover:text-ink">
            Edit schedule
          </summary>
          <form
            action={updateDRScheduleAction}
            className="mt-2 flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="systemId" value={system.id} />
            <label className="text-xs">
              <span className="text-soft">Cadence (months)</span>
              <input
                type="number"
                name="drTestCadenceMonths"
                min={1}
                max={36}
                defaultValue={system.drTestCadenceMonths ?? ""}
                placeholder="3"
                className="mt-1 w-24 rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Next due</span>
              <input
                type="date"
                name="nextDrTestDueAt"
                defaultValue={system.nextDrTestDueAt?.toISOString().slice(0, 10) ?? ""}
                className="mt-1 rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Save
            </button>
          </form>
        </details>
      )}
    </div>
  );
}

function BucketDot({ tone }: { tone: "critical" | "warn" | "info" | "ok" }) {
  const cls =
    tone === "critical"
      ? "bg-rose-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "info"
          ? "bg-cyan-500"
          : "bg-emerald-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}
