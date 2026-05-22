import Link from "next/link";
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Clock,
  Cloud,
  Database,
  ListChecks,
  Megaphone,
  Plus,
  Server,
  ShieldAlert,
  Siren,
  Users,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import LibraryBrowserButton from "@/components/library/LibraryBrowserButton";
import { RUNBOOK_LIBRARY_CONFIG } from "@/components/library/configs/runbooks";
import { LIBRARY_RUNBOOKS } from "@/lib/library/runbooks";
import {
  evaluateRunbookPreflight,
  runbookFreshness,
  type PreflightResult,
  type FreshnessChip,
} from "@/lib/runbook-preflight";
import type { RunbookCategory } from "@/generated/prisma/enums";

export const metadata = { title: "Runbooks — SnapFix" };

const CATEGORY_LABEL: Record<RunbookCategory, string> = {
  CYBER: "Cyber",
  RANSOMWARE: "Ransomware",
  CLOUD_REGION_OUTAGE: "Cloud region outage",
  VENDOR_FAILURE: "Vendor failure",
  BCP_ACTIVATION: "BCP activation",
  DATA_INCIDENT: "Data incident",
  PEOPLE_DISRUPTION: "People disruption",
  REGULATORY_NOTIFICATION: "Regulatory notification",
  OTHER: "Other",
};

const CATEGORY_ICON: Record<
  RunbookCategory,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  CYBER: ShieldAlert,
  RANSOMWARE: Siren,
  CLOUD_REGION_OUTAGE: Cloud,
  VENDOR_FAILURE: Server,
  BCP_ACTIVATION: ListChecks,
  DATA_INCIDENT: Database,
  PEOPLE_DISRUPTION: Users,
  REGULATORY_NOTIFICATION: Megaphone,
  OTHER: BookOpen,
};

export default async function RunbooksPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [runbooks, org, orgRoles] = await Promise.all([
    prisma.runbook.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ status: "asc" }, { category: "asc" }, { title: "asc" }],
      include: {
        _count: { select: { steps: true, ibsLinks: true, scenarioLinks: true } },
        trigger: true,
        steps: { select: { ownerRoleTitle: true } },
      },
    }),
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: { tier: true },
    }),
    prisma.organizationRole.findMany({
      where: { orgId: me.orgId },
      select: { title: true, abbreviation: true },
    }),
  ]);

  // Pre-flight evaluator needs a normalised lookup of every role title +
  // abbreviation in the org catalogue so step-owner strings match either form.
  const orgRoleCatalogue = new Set<string>();
  for (const r of orgRoles) {
    if (r.title) orgRoleCatalogue.add(r.title.trim().toLowerCase());
    if (r.abbreviation) orgRoleCatalogue.add(r.abbreviation.trim().toLowerCase());
  }

  // Compute pre-flight + freshness once per runbook; freeze "now" so chip
  // ages are consistent across the whole list.
  const nowSnapshot = new Date();
  const preflightById = new Map<string, PreflightResult>();
  const freshnessById = new Map<string, FreshnessChip>();
  for (const r of runbooks) {
    preflightById.set(
      r.id,
      evaluateRunbookPreflight({
        id: r.id,
        status: r.status,
        ownerRoleTitle: r.ownerRoleTitle,
        lastReviewedAt: r.lastReviewedAt,
        steps: r.steps,
        ibsLinkCount: r._count.ibsLinks,
        hasTrigger: r.trigger !== null,
        orgRoleCatalogue,
        now: nowSnapshot,
      }),
    );
    freshnessById.set(r.id, runbookFreshness(r.lastReviewedAt, nowSnapshot));
  }

  const existingTitles = runbooks.map((r) => r.title);
  const existingTitleSet = new Set(existingTitles);

  const active = runbooks.filter((r) => r.status !== "ARCHIVED");
  const archived = runbooks.filter((r) => r.status === "ARCHIVED");

  // Tier-aware library stats. "Applicable" templates are the ones tagged
  // for the firm's tier; we surface how many are still un-added so admins
  // know how much there is to seed without opening the drawer.
  const applicableLibrary = org.tier
    ? LIBRARY_RUNBOOKS.filter((l) =>
        (l.applicableTiers as readonly string[]).includes(org.tier as string),
      )
    : LIBRARY_RUNBOOKS;
  const addedApplicable = applicableLibrary.filter((l) =>
    existingTitleSet.has(l.title),
  ).length;

  // Group active runbooks by category for readability.
  const byCategory = new Map<RunbookCategory, typeof runbooks>();
  for (const r of active) {
    const list = byCategory.get(r.category) ?? [];
    list.push(r);
    byCategory.set(r.category, list);
  }
  const orderedCategories = Array.from(byCategory.keys()).sort((a, b) =>
    CATEGORY_LABEL[a].localeCompare(CATEGORY_LABEL[b]),
  );

  // Hero readiness roll-up — counts across active runbooks only, so admins
  // see at a glance whether the live playbook set is fit to activate.
  let readyCount = 0;
  let needsReviewCount = 0;
  let blockedCount = 0;
  for (const r of active) {
    const pre = preflightById.get(r.id);
    if (!pre) continue;
    if (pre.readiness === "READY") readyCount++;
    else if (pre.readiness === "NEEDS_REVIEW") needsReviewCount++;
    else blockedCount++;
  }

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Operational playbooks"
        icon={BookOpen}
        title="Runbooks"
        pitch={
          org.tier
            ? `${addedApplicable} of ${applicableLibrary.length} tier-applicable templates added · ${LIBRARY_RUNBOOKS.length} total in library`
            : `${runbooks.length} active · ${LIBRARY_RUNBOOKS.length} library templates available`
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              <LibraryBrowserButton
                config={RUNBOOK_LIBRARY_CONFIG}
                items={LIBRARY_RUNBOOKS}
                existingKeys={existingTitles}
                canAdd={canManage}
                label="Add from library"
              />
              <Link
                href="/runbooks/new"
                className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
              >
                <Plus size={14} />
                New runbook
              </Link>
            </div>
          ) : null
        }
      />

      {active.length === 0 ? (
        <EmptyState
          canManage={canManage}
          libraryCount={
            applicableLibrary.filter((l) => !existingTitleSet.has(l.title)).length
          }
        />
      ) : (
        <div className="space-y-6">
          <ReadinessBand
            ready={readyCount}
            needsReview={needsReviewCount}
            blocked={blockedCount}
          />
          {orderedCategories.map((cat) => {
            const Icon = CATEGORY_ICON[cat];
            return (
              <section key={cat} className="space-y-3">
                <header className="flex items-center gap-2">
                  <Icon size={14} className="text-muted" />
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
                    {CATEGORY_LABEL[cat]}
                  </h2>
                  <span className="text-[11px] text-soft">
                    ({byCategory.get(cat)!.length})
                  </span>
                </header>
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {byCategory.get(cat)!.map((r) => (
                    <li key={r.id}>
                      <RunbookCard
                        runbook={r}
                        preflight={preflightById.get(r.id)!}
                        freshness={freshnessById.get(r.id)!}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}

      {archived.length > 0 && (
        <details className="rounded-xl border border-line bg-surface-1 p-4">
          <summary className="cursor-pointer text-sm font-medium text-muted">
            Archived ({archived.length})
          </summary>
          <ul className="mt-3 space-y-1.5">
            {archived.map((r) => (
              <li key={r.id} className="flex items-center justify-between text-sm">
                <Link href={`/runbooks/${r.id}`} className="text-soft hover:underline">
                  {r.title}
                </Link>
                <span className="text-[11px] text-soft">
                  {r.archivedAt?.toISOString().slice(0, 10)}
                </span>
              </li>
            ))}
          </ul>
        </details>
      )}
    </div>
  );
}

function RunbookCard({
  runbook,
  preflight,
  freshness,
}: {
  runbook: {
    id: string;
    title: string;
    description: string | null;
    category: RunbookCategory;
    ownerRoleTitle: string | null;
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    version: number;
    publishedAt: Date | null;
    _count: { steps: number; ibsLinks: number; scenarioLinks: number };
    trigger: { severityAtLeast: string | null; scenarioCategoryEquals: string | null } | null;
  };
  preflight: PreflightResult;
  freshness: FreshnessChip;
}) {
  const Icon = CATEGORY_ICON[runbook.category];
  return (
    <Link
      href={`/runbooks/${runbook.id}`}
      className="block h-full rounded-xl border border-line bg-surface-1 p-4 transition hover:border-indigo-300 hover:shadow-sm"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
          <Icon size={11} />
          {CATEGORY_LABEL[runbook.category]}
        </div>
        <StatusBadge status={runbook.status} version={runbook.version} />
      </div>
      <h3 className="mt-2 font-display text-base font-semibold text-ink">{runbook.title}</h3>
      {runbook.description && (
        <p className="mt-1 line-clamp-2 text-[12px] text-soft">{runbook.description}</p>
      )}
      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-soft">Steps</dt>
          <dd className="font-mono font-semibold text-ink">{runbook._count.steps}</dd>
        </div>
        <div>
          <dt className="text-soft">IBSs</dt>
          <dd className="font-mono font-semibold text-ink">{runbook._count.ibsLinks}</dd>
        </div>
        <div>
          <dt className="text-soft">Scenarios</dt>
          <dd className="font-mono font-semibold text-ink">{runbook._count.scenarioLinks}</dd>
        </div>
      </dl>
      <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[10px]">
        <ReadinessChip preflight={preflight} />
        <FreshnessChipView chip={freshness} />
        {runbook.ownerRoleTitle && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-soft">
            {runbook.ownerRoleTitle}
          </span>
        )}
        {runbook.trigger?.severityAtLeast && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-soft">
            Auto ≥ {runbook.trigger.severityAtLeast}
          </span>
        )}
      </div>
    </Link>
  );
}

function ReadinessChip({ preflight }: { preflight: PreflightResult }) {
  if (preflight.readiness === "BLOCKED") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
        title={`${preflight.blockerCount} blocker${preflight.blockerCount === 1 ? "" : "s"} prevent activation`}
      >
        <AlertTriangle size={10} />
        Blocked · {preflight.blockerCount}
      </span>
    );
  }
  if (preflight.readiness === "NEEDS_REVIEW") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        title={`${preflight.warningCount} warning${preflight.warningCount === 1 ? "" : "s"}`}
      >
        <AlertTriangle size={10} />
        {preflight.warningCount} to fix
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
      <CheckCircle2 size={10} />
      Ready
    </span>
  );
}

function FreshnessChipView({ chip }: { chip: FreshnessChip }) {
  const tone =
    chip.tone === "ok"
      ? "bg-surface-2 text-soft"
      : chip.tone === "warn"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : chip.tone === "bad"
          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
          : "bg-surface-2 text-soft";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${tone}`}
      title={chip.title}
    >
      <Clock size={10} />
      {chip.label}
    </span>
  );
}

function ReadinessBand({
  ready,
  needsReview,
  blocked,
}: {
  ready: number;
  needsReview: number;
  blocked: number;
}) {
  const total = ready + needsReview + blocked;
  if (total === 0) return null;
  return (
    <section className="grid gap-2 rounded-xl border border-line bg-surface-1 p-4 sm:grid-cols-3">
      <BandTile
        icon={CheckCircle2}
        label="Ready to activate"
        value={ready}
        tone="ok"
      />
      <BandTile
        icon={AlertTriangle}
        label="Needs review"
        value={needsReview}
        tone="warn"
        sub="Warnings that won't block activation"
      />
      <BandTile
        icon={AlertTriangle}
        label="Blocked"
        value={blocked}
        tone="bad"
        sub="Won't activate in an exercise"
      />
    </section>
  );
}

function BandTile({
  icon: Icon,
  label,
  value,
  tone,
  sub,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  value: number;
  tone: "ok" | "warn" | "bad";
  sub?: string;
}) {
  const colour =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : "text-rose-700 dark:text-rose-300";
  return (
    <div className="flex items-start gap-3">
      <Icon size={16} className={`mt-0.5 ${colour}`} />
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</p>
        <p className={`font-display text-2xl font-bold ${colour}`}>{value}</p>
        {sub && <p className="text-[11px] text-soft">{sub}</p>}
      </div>
    </div>
  );
}

function StatusBadge({
  status,
  version,
}: {
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  version: number;
}) {
  if (status === "PUBLISHED")
    return (
      <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
        v{version}
      </span>
    );
  if (status === "ARCHIVED")
    return (
      <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-900/40 dark:text-rose-200">
        Archived
      </span>
    );
  return (
    <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
      Draft
    </span>
  );
}

function EmptyState({
  canManage,
  libraryCount,
}: {
  canManage: boolean;
  libraryCount: number;
}) {
  return (
    <section className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-8 text-center">
      <BookOpen size={28} className="mx-auto text-soft" />
      <h2 className="mt-3 font-display text-lg font-semibold text-ink">
        No runbooks yet
      </h2>
      <p className="mx-auto mt-1 max-w-xl text-sm text-muted">
        Runbooks are structured playbooks the IMT walks during an exercise or a real
        incident. Start from a library template &mdash; they&apos;re best-practice
        playbooks you&apos;ll customise to match your firm&apos;s role vocabulary.
      </p>
      {canManage && libraryCount > 0 && (
        <p className="mt-3 text-[11px] text-soft">
          {libraryCount} library template{libraryCount === 1 ? "" : "s"} available to clone.
        </p>
      )}
    </section>
  );
}
