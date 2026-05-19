import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, BookOpen, Archive, Trash2 } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import RunbookEditor from "@/components/runbooks/RunbookEditor";
import {
  archiveRunbookAction,
  deleteRunbookAction,
  restoreRunbookAction,
} from "@/app/actions/runbooks";

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
      ibsLinks: { select: { ibsId: true } },
      scenarioLinks: { select: { scenarioId: true } },
    },
  });
  if (!runbook) notFound();

  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [ibsOptions, scenarioOptions] = await Promise.all([
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
    prisma.scenario.findMany({
      where: { orgId: me.orgId, isTemplate: false },
      orderBy: { title: "asc" },
      select: { id: true, title: true, category: true },
    }),
  ]);

  const scenarioCategories = Array.from(
    new Set(scenarioOptions.map((s) => s.category).filter((c): c is string => !!c)),
  ).sort();

  const totalEstimated = runbook.steps.reduce(
    (sum, s) => sum + (s.estimatedMin ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow={`${runbook.category.replace(/_/g, " ")}${runbook.status === "PUBLISHED" ? ` · v${runbook.version}` : ""}`}
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
          sub="sum of step estimates"
        />
        <MetaTile
          label="IBSs covered"
          value={String(runbook.ibsLinks.length)}
          sub={runbook.ibsLinks.length === 0 ? "use the link panel below" : undefined}
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

      <RunbookEditor
        runbook={{
          id: runbook.id,
          title: runbook.title,
          description: runbook.description,
          category: runbook.category,
          ownerRoleTitle: runbook.ownerRoleTitle,
          status: runbook.status,
          version: runbook.version,
          publishedAt: runbook.publishedAt,
          trigger: runbook.trigger
            ? {
                severityAtLeast: runbook.trigger.severityAtLeast,
                scenarioCategoryEquals: runbook.trigger.scenarioCategoryEquals,
              }
            : null,
        }}
        steps={runbook.steps.map((s) => ({
          id: s.id,
          orderIdx: s.orderIdx,
          title: s.title,
          description: s.description,
          kind: s.kind,
          ownerRoleTitle: s.ownerRoleTitle,
          estimatedMin: s.estimatedMin,
          successCriteria: s.successCriteria,
          blocksOrders: s.blocksOrders,
          decisionTypeCode: s.decisionTypeCode,
          orgDecisionTypeId: s.orgDecisionTypeId,
          regulatorTrigger: serializeJsonTrigger(s.regulatorTrigger),
          commsTemplate: serializeJsonComms(s.commsTemplate),
        }))}
        ibsOptions={ibsOptions}
        ibsSelectedIds={runbook.ibsLinks.map((l) => l.ibsId)}
        scenarioOptions={scenarioOptions}
        scenarioSelectedIds={runbook.scenarioLinks.map((l) => l.scenarioId)}
        scenarioCategories={scenarioCategories}
        canEdit={canManage}
      />

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

function serializeJsonTrigger(
  v: unknown,
): { regulator: string; slaHours: number; trigger: string } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  if (typeof obj.regulator !== "string" || typeof obj.slaHours !== "number") return null;
  const trigger = typeof obj.trigger === "string" ? obj.trigger : "POST_INVOCATION";
  return { regulator: obj.regulator, slaHours: obj.slaHours, trigger };
}

function serializeJsonComms(
  v: unknown,
): { stakeholder: string; subject: string; bodyTemplate: string } | null {
  if (!v || typeof v !== "object") return null;
  const obj = v as Record<string, unknown>;
  if (
    typeof obj.stakeholder !== "string" ||
    typeof obj.subject !== "string" ||
    typeof obj.bodyTemplate !== "string"
  )
    return null;
  return {
    stakeholder: obj.stakeholder,
    subject: obj.subject,
    bodyTemplate: obj.bodyTemplate,
  };
}
