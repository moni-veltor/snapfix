import { notFound } from "next/navigation";
import Link from "next/link";
import {
  AlertTriangle,
  Archive,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  CircleCheck,
  Clock,
  GitBranch,
  PlayCircle,
  Trash2,
  X,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import RunbookEditor from "@/components/runbooks/RunbookEditor";
import {
  addRunbookEscalationAction,
  archiveRunbookAction,
  deleteRunbookAction,
  drillRunbookAction,
  markRunbookReviewedAction,
  removeRunbookEscalationAction,
  restoreRunbookAction,
} from "@/app/actions/runbooks";
import type { RunbookCategory, RunbookStatus } from "@/generated/prisma/enums";
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
      escalatesTo: {
        orderBy: [{ orderIdx: "asc" }],
        select: {
          id: true,
          severityAtLeast: true,
          rationale: true,
          target: {
            select: { id: true, title: true, status: true, category: true },
          },
        },
      },
      escalatedFrom: {
        orderBy: [{ orderIdx: "asc" }],
        select: {
          id: true,
          severityAtLeast: true,
          rationale: true,
          source: {
            select: { id: true, title: true, status: true, category: true },
          },
        },
      },
    },
  });
  if (!runbook) notFound();

  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [ibsOptions, scenarioOptions, orgRoles, reviewer, otherRunbooks] = await Promise.all([
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
    prisma.runbook.findMany({
      where: {
        orgId: me.orgId,
        id: { not: runbook.id },
        status: { not: "ARCHIVED" },
      },
      orderBy: [{ category: "asc" }, { title: "asc" }],
      select: { id: true, title: true, category: true, status: true },
    }),
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
    escalationTargets: runbook.escalatesTo.map((e) => ({
      id: e.target.id,
      title: e.target.title,
      status: e.target.status,
    })),
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
          <div className="flex flex-wrap items-center gap-2">
            {canManage && runbook.status !== "ARCHIVED" && runbook.steps.length > 0 && (
              <form action={drillRunbookAction}>
                <input type="hidden" name="id" value={runbook.id} />
                <button
                  type="submit"
                  className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
                  title="Spin up a walkthrough exercise that walks just this runbook"
                >
                  <PlayCircle size={14} />
                  Drill this runbook
                </button>
              </form>
            )}
            <Link
              href="/runbooks"
              className="inline-flex items-center gap-1.5 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
            >
              <ArrowLeft size={14} />
              Back
            </Link>
          </div>
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
        drillAgeDays={
          runbook.lastDrilledAt
            ? Math.floor(
                (nowSnapshot.getTime() - runbook.lastDrilledAt.getTime()) / 86_400_000,
              )
            : null
        }
        canManage={canManage}
      />

      <EscalationsPanel
        runbookId={runbook.id}
        escalatesTo={runbook.escalatesTo}
        escalatedFrom={runbook.escalatedFrom}
        otherRunbooks={otherRunbooks.filter(
          (r) =>
            !runbook.escalatesTo.some((e) => e.target.id === r.id) &&
            r.id !== runbook.id,
        )}
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

type EscalationLink = {
  id: string;
  severityAtLeast: string | null;
  rationale: string | null;
  target: {
    id: string;
    title: string;
    status: RunbookStatus;
    category: RunbookCategory;
  };
};

type ReverseEscalationLink = {
  id: string;
  severityAtLeast: string | null;
  rationale: string | null;
  source: {
    id: string;
    title: string;
    status: RunbookStatus;
    category: RunbookCategory;
  };
};

function EscalationsPanel({
  runbookId,
  escalatesTo,
  escalatedFrom,
  otherRunbooks,
  canManage,
}: {
  runbookId: string;
  escalatesTo: EscalationLink[];
  escalatedFrom: ReverseEscalationLink[];
  otherRunbooks: ReadonlyArray<{
    id: string;
    title: string;
    category: RunbookCategory;
    status: RunbookStatus;
  }>;
  canManage: boolean;
}) {
  return (
    <section className="grid gap-3 lg:grid-cols-2">
      <div className="rounded-xl border border-line bg-surface-1 p-4">
        <header className="flex items-center gap-2">
          <GitBranch size={14} className="text-indigo-600 dark:text-indigo-300" />
          <h2 className="font-display text-sm font-semibold text-ink">Escalates to</h2>
          <span className="text-[11px] text-soft">{escalatesTo.length}</span>
        </header>
        <p className="mt-1 text-[11px] text-soft">
          Downstream playbooks the IMT should activate when this one fires.
        </p>
        {escalatesTo.length === 0 ? (
          <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-[12px] text-soft">
            No escalation links yet.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {escalatesTo.map((link) => (
              <EscalationRow
                key={link.id}
                escalationId={link.id}
                otherId={link.target.id}
                otherTitle={link.target.title}
                otherStatus={link.target.status}
                severityAtLeast={link.severityAtLeast}
                rationale={link.rationale}
                direction="to"
                canManage={canManage}
              />
            ))}
          </ul>
        )}

        {canManage && otherRunbooks.length > 0 && (
          <form
            action={addRunbookEscalationAction}
            className="mt-3 flex flex-wrap items-center gap-2 border-t border-line pt-3"
          >
            <input type="hidden" name="sourceId" value={runbookId} />
            <select
              name="targetId"
              required
              defaultValue=""
              className="min-w-0 flex-1 rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[12px]"
            >
              <option value="" disabled>
                Pick a downstream runbook…
              </option>
              {otherRunbooks.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.title}
                  {r.status === "DRAFT" ? " (draft)" : ""}
                </option>
              ))}
            </select>
            <select
              name="severityAtLeast"
              defaultValue=""
              className="rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[12px]"
              title="Severity gate"
            >
              <option value="">Always</option>
              <option value="LOW">≥ LOW</option>
              <option value="MEDIUM">≥ MEDIUM</option>
              <option value="HIGH">≥ HIGH</option>
              <option value="CRITICAL">CRITICAL only</option>
            </select>
            <button
              type="submit"
              className="rounded-md bg-slate-900 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              Link
            </button>
          </form>
        )}
      </div>

      <div className="rounded-xl border border-line bg-surface-1 p-4">
        <header className="flex items-center gap-2">
          <GitBranch size={14} className="text-indigo-600 dark:text-indigo-300 rotate-180" />
          <h2 className="font-display text-sm font-semibold text-ink">Triggered by</h2>
          <span className="text-[11px] text-soft">{escalatedFrom.length}</span>
        </header>
        <p className="mt-1 text-[11px] text-soft">
          Upstream playbooks that route to this one when they fire.
        </p>
        {escalatedFrom.length === 0 ? (
          <p className="mt-3 rounded-md bg-surface-2 px-3 py-2 text-[12px] text-soft">
            Not linked from any upstream playbook.
          </p>
        ) : (
          <ul className="mt-3 space-y-1.5">
            {escalatedFrom.map((link) => (
              <EscalationRow
                key={link.id}
                escalationId={link.id}
                otherId={link.source.id}
                otherTitle={link.source.title}
                otherStatus={link.source.status}
                severityAtLeast={link.severityAtLeast}
                rationale={link.rationale}
                direction="from"
                canManage={canManage}
              />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function EscalationRow({
  escalationId,
  otherId,
  otherTitle,
  otherStatus,
  severityAtLeast,
  rationale,
  direction,
  canManage,
}: {
  escalationId: string;
  otherId: string;
  otherTitle: string;
  otherStatus: RunbookStatus;
  severityAtLeast: string | null;
  rationale: string | null;
  direction: "to" | "from";
  canManage: boolean;
}) {
  const draft = otherStatus === "DRAFT";
  return (
    <li className="flex items-start gap-2 rounded-md border border-line bg-surface-2/40 p-2.5 text-[12px]">
      <ArrowRight
        size={14}
        className={`mt-0.5 shrink-0 ${direction === "from" ? "rotate-180 text-soft" : "text-indigo-600 dark:text-indigo-300"}`}
      />
      <div className="min-w-0 flex-1">
        <Link
          href={`/runbooks/${otherId}`}
          className="font-medium text-ink hover:underline"
        >
          {otherTitle}
        </Link>
        <div className="mt-0.5 flex flex-wrap items-center gap-1 text-[10px] text-soft">
          {severityAtLeast ? (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              ≥ {severityAtLeast}
            </span>
          ) : (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">Always</span>
          )}
          {draft && (
            <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
              Target is DRAFT
            </span>
          )}
        </div>
        {rationale && <p className="mt-1 text-soft">{rationale}</p>}
      </div>
      {canManage && direction === "to" && (
        <form action={removeRunbookEscalationAction}>
          <input type="hidden" name="id" value={escalationId} />
          <button
            type="submit"
            className="shrink-0 rounded-md p-1 text-soft hover:bg-surface-1 hover:text-ink"
            title="Remove escalation"
          >
            <X size={12} />
          </button>
        </form>
      )}
    </li>
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
  drillAgeDays,
  canManage,
}: {
  runbookId: string;
  preflight: PreflightResult;
  freshnessLabel: string;
  freshnessTone: "ok" | "warn" | "bad" | "neutral";
  lastReviewedAt: Date | null;
  reviewerName: string | null;
  drillAgeDays: number | null;
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
          <DrillChip ageDays={drillAgeDays} />
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

function DrillChip({ ageDays }: { ageDays: number | null }) {
  if (ageDays === null) {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-soft"
        title="No drill recorded — click 'Drill this runbook' to walk it with the team."
      >
        <PlayCircle size={10} />
        Never drilled
      </span>
    );
  }
  const label = ageDays === 0 ? "Drilled today" : `Drilled ${ageDays}d ago`;
  const tone =
    ageDays > 180
      ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
      : "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200";
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${tone}`}>
      <PlayCircle size={10} />
      {label}
    </span>
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
