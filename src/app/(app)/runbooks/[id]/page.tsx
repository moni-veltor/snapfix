import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  CircleCheck,
  Clock,
  Trash2,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import RunbookEditor from "@/components/runbooks/RunbookEditor";
import {
  archiveRunbookAction,
  deleteRunbookAction,
  markRunbookReviewedAction,
  restoreRunbookAction,
} from "@/app/actions/runbooks";
import { withToast } from "@/lib/toast-action";
import {
  evaluateRunbookPreflight,
  runbookFreshness,
  type PreflightResult,
  type PreflightIssue,
} from "@/lib/runbook-preflight";

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

  const [ibsOptions, scenarioOptions, orgRoles, reviewer] = await Promise.all([
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
    prisma.organizationRole.findMany({
      where: { orgId: me.orgId },
      select: { title: true, abbreviation: true },
    }),
    runbook.lastReviewedById
      ? prisma.user.findUnique({
          where: { id: runbook.lastReviewedById },
          select: { name: true, email: true },
        })
      : Promise.resolve(null),
  ]);

  const orgRoleCatalogue = new Set<string>();
  for (const r of orgRoles) {
    if (r.title) orgRoleCatalogue.add(r.title.trim().toLowerCase());
    if (r.abbreviation) orgRoleCatalogue.add(r.abbreviation.trim().toLowerCase());
  }
  const nowSnapshot = new Date();
  const preflight = evaluateRunbookPreflight({
    id: runbook.id,
    status: runbook.status,
    ownerRoleTitle: runbook.ownerRoleTitle,
    lastReviewedAt: runbook.lastReviewedAt,
    steps: runbook.steps,
    ibsLinkCount: runbook.ibsLinks.length,
    hasTrigger: runbook.trigger !== null,
    orgRoleCatalogue,
    now: nowSnapshot,
  });
  const freshness = runbookFreshness(runbook.lastReviewedAt, nowSnapshot);

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
        pitch={runbook.description ?? "IMT playbook"}
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

      <PreflightPanel
        runbookId={runbook.id}
        preflight={preflight}
        freshnessLabel={freshness.label}
        freshnessTone={freshness.tone}
        lastReviewedAt={runbook.lastReviewedAt}
        reviewerName={reviewer?.name ?? reviewer?.email ?? null}
        canManage={canManage}
      />

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

function PreflightPanel({
  runbookId,
  preflight,
  freshnessLabel,
  freshnessTone,
  lastReviewedAt,
  reviewerName,
  canManage,
}: {
  runbookId: string;
  preflight: PreflightResult;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn" | "bad" | "neutral";
  lastReviewedAt: Date | null;
  reviewerName: string | null;
  canManage: boolean;
}) {
  const panelTone =
    preflight.readiness === "BLOCKED"
      ? "border-rose-300 bg-rose-50/40 dark:border-rose-900/60 dark:bg-rose-950/20"
      : preflight.readiness === "NEEDS_REVIEW"
        ? "border-amber-300 bg-amber-50/40 dark:border-amber-900/60 dark:bg-amber-950/20"
        : "border-emerald-300 bg-emerald-50/40 dark:border-emerald-900/60 dark:bg-emerald-950/20";

  const HeaderIcon =
    preflight.readiness === "READY"
      ? CircleCheck
      : preflight.readiness === "NEEDS_REVIEW"
        ? AlertTriangle
        : AlertTriangle;

  const headerColour =
    preflight.readiness === "READY"
      ? "text-emerald-700 dark:text-emerald-300"
      : preflight.readiness === "NEEDS_REVIEW"
        ? "text-amber-700 dark:text-amber-300"
        : "text-rose-700 dark:text-rose-300";

  return (
    <section className={`rounded-xl border ${panelTone} p-4`}>
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <HeaderIcon size={18} className={headerColour} />
          <h2 className={`font-display text-base font-semibold ${headerColour}`}>
            {preflight.readiness === "READY"
              ? "Pre-flight clean — ready to activate"
              : preflight.readiness === "NEEDS_REVIEW"
                ? `Pre-flight: ${preflight.warningCount} warning${preflight.warningCount === 1 ? "" : "s"} to fix`
                : `Pre-flight blocked — ${preflight.blockerCount} item${preflight.blockerCount === 1 ? "" : "s"} prevent activation`}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <FreshnessPanelChip label={freshnessLabel} tone={freshnessTone} />
          {lastReviewedAt && reviewerName && (
            <span className="text-soft">
              by {reviewerName} on {lastReviewedAt.toISOString().slice(0, 10)}
            </span>
          )}
          {canManage && (
            <form action={withToast(markRunbookReviewedAction, { success: "Marked reviewed" })}>
              <input type="hidden" name="id" value={runbookId} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <CheckCircle2 size={12} />
                Mark reviewed
              </button>
            </form>
          )}
        </div>
      </header>

      {preflight.issues.length === 0 ? (
        <p className="mt-3 text-[12px] text-soft">
          Steps + owners + IBS + trigger + freshness all check out. This runbook will route
          cleanly when activated in an exercise or a live incident.
        </p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {preflight.issues.map((issue) => (
            <IssueRow key={issue.code} issue={issue} />
          ))}
        </ul>
      )}
    </section>
  );
}

function IssueRow({ issue }: { issue: PreflightIssue }) {
  const dotColour =
    issue.severity === "blocker"
      ? "bg-rose-500"
      : "bg-amber-500";
  return (
    <li className="flex items-start gap-2 rounded-md bg-surface-1 p-2.5 text-[12px]">
      <span className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${dotColour}`} />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-ink">{issue.message}</p>
        {issue.detail && <p className="text-soft">{issue.detail}</p>}
      </div>
      {issue.fixHref && (
        <Link
          href={issue.fixHref}
          className="shrink-0 rounded-md border border-line bg-surface-2 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-1"
        >
          Fix
        </Link>
      )}
    </li>
  );
}

function FreshnessPanelChip({
  label,
  tone,
}: {
  label: string;
  tone: "ok" | "warn" | "bad" | "neutral";
}) {
  const cls =
    tone === "ok"
      ? "bg-surface-2 text-soft"
      : tone === "warn"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : tone === "bad"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "bg-surface-2 text-soft";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${cls}`}>
      <Clock size={10} />
      {label}
    </span>
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
