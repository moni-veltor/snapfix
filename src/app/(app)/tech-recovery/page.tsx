import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Library, Server } from "lucide-react";
import PageHero from "@/components/ui/PageHero";
import { ProgressRing, Bar } from "@/components/ui/charts";
import { postureScore, type SystemWithTests } from "@/lib/tech-recovery";
import SystemList from "@/components/tech/SystemList";
import SystemAddButton from "@/components/tech/SystemAddButton";

export default async function TechRecoveryPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const systems = await prisma.techSystem.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    include: {
      drTests: {
        orderBy: { testedAt: "desc" },
        take: 5,
      },
    },
  });

  const score = postureScore(systems as SystemWithTests[]);
  const tierCounts = {
    CRITICAL: systems.filter((s) => s.tier === "CRITICAL").length,
    ESSENTIAL: systems.filter((s) => s.tier === "ESSENTIAL").length,
    IMPORTANT: systems.filter((s) => s.tier === "IMPORTANT").length,
    ROUTINE: systems.filter((s) => s.tier === "ROUTINE").length,
  };

  const untested = systems.filter((s) => s.drTests.length === 0).length;
  const noRto = systems.filter((s) => s.rtoMin == null).length;
  const noFailoverCritical = systems.filter(
    (s) =>
      (s.tier === "CRITICAL" || s.tier === "ESSENTIAL") && s.failoverKind === "NONE",
  ).length;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Technical recovery"
        icon={Server}
        title="System recovery register"
        pitch="The systems behind your IBSs — recovery objectives, failover topology, backup posture, and the DR-test ledger that proves you can actually meet your RTOs."
        actions={
          canManage ? (
            <div className="flex items-center gap-2">
              <Link
                href="/tech-recovery/library"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                <Library size={14} strokeWidth={2.2} />
                Browse library
              </Link>
              <SystemAddButton />
            </div>
          ) : undefined
        }
      />

      {systems.length > 0 ? (
        <section className="grid gap-4 lg:grid-cols-[auto_1fr]">
          <div className="rounded-xl border border-line bg-surface-1 p-5">
            <ProgressRing
              value={score}
              label={String(score)}
              sublabel="Posture score"
              size={140}
              thickness={12}
            />
            <p className="mt-3 max-w-[160px] text-center text-[11px] text-muted">
              Composite across all systems — penalises missing RTOs, stale DR tests, failed
              tests, missing failover.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <Stat label="Systems" value={systems.length} />
            <Stat label="No RTO declared" value={noRto} tone={noRto > 0 ? "warn" : "ok"} />
            <Stat
              label="Never DR-tested"
              value={untested}
              tone={untested > 0 ? "critical" : "ok"}
            />
            <Stat
              label="No failover (critical/essential)"
              value={noFailoverCritical}
              tone={noFailoverCritical > 0 ? "critical" : "ok"}
            />
            <div className="rounded-lg border border-line bg-surface-0 p-3 sm:col-span-2 lg:col-span-1">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                Tier mix
              </p>
              <div className="mt-2">
                <Bar
                  segments={[
                    { label: "Critical", value: tierCounts.CRITICAL, color: "#ef4444" },
                    { label: "Essential", value: tierCounts.ESSENTIAL, color: "#f59e0b" },
                    { label: "Important", value: tierCounts.IMPORTANT, color: "#6366f1" },
                    { label: "Routine", value: tierCounts.ROUTINE, color: "#94a3b8" },
                  ]}
                  height={10}
                />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <section className="rounded-xl border border-dashed border-line bg-surface-1 p-12 text-center">
          <Server size={32} className="mx-auto text-indigo-500 dark:text-indigo-300" />
          <h2 className="mt-3 text-base font-semibold text-ink">
            No systems registered yet
          </h2>
          <p className="mx-auto mt-1 max-w-md text-sm text-muted">
            The technical recovery register is the inverse of the IBS register: instead of
            customer-facing services, you log the underlying systems and their recovery
            posture. Start with your tier-1 systems.
          </p>
          {canManage && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <Link
                href="/tech-recovery/library"
                className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Library size={11} />
                Browse the library
              </Link>
              <span className="text-xs text-soft">or use the Add system button above</span>
            </div>
          )}
        </section>
      )}

      <SystemList systems={systems as SystemWithTests[]} canManage={canManage} />
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "neutral",
}: {
  label: string;
  value: number;
  tone?: "ok" | "warn" | "critical" | "neutral";
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-0";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
