import { notFound } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  CheckSquare,
  Megaphone,
  ShieldAlert,
  Workflow,
  Clock,
  Archive,
  Trash2,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import {
  archiveRunbookAction,
  deleteRunbookAction,
  restoreRunbookAction,
} from "@/app/actions/runbooks";
import type { RunbookStepKind } from "@/generated/prisma/enums";

const KIND_LABEL: Record<RunbookStepKind, string> = {
  ACTION: "Action",
  DECISION: "Decision",
  NOTIFICATION: "Notification",
  COMMS: "Comms",
  CHECKPOINT: "Checkpoint",
};

const KIND_ICON: Record<
  RunbookStepKind,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  ACTION: Workflow,
  DECISION: CheckSquare,
  NOTIFICATION: ShieldAlert,
  COMMS: Megaphone,
  CHECKPOINT: Clock,
};

const KIND_TONE: Record<RunbookStepKind, string> = {
  ACTION: "bg-surface-2 text-ink",
  DECISION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-900/40 dark:text-indigo-200",
  NOTIFICATION: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-200",
  COMMS: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200",
  CHECKPOINT: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200",
};

export default async function RunbookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const runbook = await prisma.runbook.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      steps: { orderBy: { orderIdx: "asc" } },
      trigger: true,
      ibsLinks: { include: { ibs: { select: { id: true, code: true, name: true } } } },
      scenarioLinks: { include: { scenario: { select: { id: true, title: true } } } },
    },
  });
  if (!runbook) notFound();

  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const totalEstimated = runbook.steps.reduce(
    (sum, s) => sum + (s.estimatedMin ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={`${runbook.category.replace(/_/g, " ")} · v${runbook.version}`}
        icon={BookOpen}
        title={runbook.title}
        pitch={
          runbook.description ??
          "Step-by-step playbook the IMT walks during an exercise or a real incident."
        }
        actions={
          <Link
            href="/runbooks"
            className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <MetaTile label="Steps" value={String(runbook.steps.length)} />
        <MetaTile
          label="Estimated wall-clock"
          value={totalEstimated === 0 ? "—" : `${totalEstimated}m`}
          sub="sum of step estimates (DAG order ignored)"
        />
        <MetaTile
          label="IBSs covered"
          value={String(runbook.ibsLinks.length)}
          sub={runbook.ibsLinks.length === 0 ? "link IBSs on next commit" : undefined}
        />
        <MetaTile
          label="Auto-activates"
          value={
            runbook.trigger?.severityAtLeast
              ? `≥ ${runbook.trigger.severityAtLeast}`
              : "Manual"
          }
          sub={runbook.trigger?.scenarioCategoryEquals ?? undefined}
        />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-ink">Steps</h2>
          <p className="text-[11px] text-soft">
            Visual builder lands in the next commit. Steps below are the cloned
            library content (or empty for a freshly-created runbook).
          </p>
        </div>

        {runbook.steps.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-6 text-center text-sm text-soft">
            No steps yet. The visual builder ships in Commit B — for now this runbook
            is a registry entry with metadata only.
          </div>
        ) : (
          <ol className="space-y-2">
            {runbook.steps.map((s, i) => {
              const Icon = KIND_ICON[s.kind];
              return (
                <li
                  key={s.id}
                  className="rounded-xl border border-line bg-surface-1 p-4"
                >
                  <div className="flex items-start gap-3">
                    <span className="mt-0.5 inline-flex h-6 w-6 flex-none items-center justify-center rounded-full bg-surface-2 font-mono text-[11px] font-semibold text-muted">
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${KIND_TONE[s.kind]}`}
                        >
                          <Icon size={10} />
                          {KIND_LABEL[s.kind]}
                        </span>
                        <h3 className="text-sm font-semibold text-ink">{s.title}</h3>
                        {s.ownerRoleTitle && (
                          <span className="text-[11px] text-soft">
                            · {s.ownerRoleTitle}
                          </span>
                        )}
                        {s.estimatedMin !== null && (
                          <span className="text-[11px] text-soft">
                            · ~{s.estimatedMin}m
                          </span>
                        )}
                      </div>
                      {s.description && (
                        <p className="mt-1 text-[12px] text-soft">{s.description}</p>
                      )}
                      {s.successCriteria && (
                        <p className="mt-1 text-[11px] text-emerald-700 dark:text-emerald-300">
                          ✓ {s.successCriteria}
                        </p>
                      )}
                      {s.blocksOrders.length > 0 && (
                        <p className="mt-1 text-[10px] text-soft">
                          depends on step{s.blocksOrders.length === 1 ? "" : "s"}{" "}
                          {s.blocksOrders.map((n) => n + 1).join(", ")}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      {runbook.scenarioLinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-ink">Tested by scenarios</h2>
          <ul className="flex flex-wrap gap-2">
            {runbook.scenarioLinks.map((l) => (
              <li key={l.scenario.id}>
                <Link
                  href={`/scenarios/${l.scenario.id}`}
                  className="inline-flex items-center rounded-full border border-line bg-surface-1 px-3 py-1 text-[12px] hover:bg-surface-2"
                >
                  {l.scenario.title}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {runbook.ibsLinks.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-base font-semibold text-ink">Covers IBSs</h2>
          <ul className="flex flex-wrap gap-2">
            {runbook.ibsLinks.map((l) => (
              <li key={l.ibs.id}>
                <Link
                  href={`/ibs/${l.ibs.id}`}
                  className="inline-flex items-center rounded-full border border-line bg-surface-1 px-3 py-1 text-[12px] hover:bg-surface-2"
                >
                  <span className="font-mono text-[10px] text-muted">{l.ibs.code}</span>
                  <span className="ml-1.5">{l.ibs.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {canManage && (
        <section className="rounded-xl border border-rose-300 bg-rose-50/50 p-4 dark:border-rose-900 dark:bg-rose-950/20">
          <h2 className="text-sm font-semibold text-rose-900 dark:text-rose-200">
            Manage
          </h2>
          <p className="mt-1 text-[11px] text-rose-800/80 dark:text-rose-300/80">
            Archive keeps the record + history. Delete is permanent.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {runbook.status !== "ARCHIVED" ? (
              <form action={archiveRunbookAction}>
                <input type="hidden" name="id" value={runbook.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  <Archive size={13} />
                  Archive
                </button>
              </form>
            ) : (
              <form action={restoreRunbookAction}>
                <input type="hidden" name="id" value={runbook.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2"
                >
                  Restore
                </button>
              </form>
            )}
            <form action={deleteRunbookAction}>
              <input type="hidden" name="id" value={runbook.id} />
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 rounded-md border border-rose-300 bg-rose-100 px-3 py-1.5 text-sm font-medium text-rose-900 hover:bg-rose-200 dark:border-rose-800 dark:bg-rose-900/40 dark:text-rose-200"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}

function MetaTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-4">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-ink">{value}</p>
      {sub && <p className="mt-1 text-[11px] text-soft">{sub}</p>}
    </div>
  );
}
