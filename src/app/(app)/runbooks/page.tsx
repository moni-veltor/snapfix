import Link from "next/link";
import {
  BookOpen,
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

  const runbooks = await prisma.runbook.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ status: "asc" }, { category: "asc" }, { title: "asc" }],
    include: {
      _count: { select: { steps: true, ibsLinks: true, scenarioLinks: true } },
      trigger: true,
    },
  });

  const existingTitles = runbooks.map((r) => r.title);

  const active = runbooks.filter((r) => r.status !== "ARCHIVED");
  const archived = runbooks.filter((r) => r.status === "ARCHIVED");

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

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Operational playbooks"
        icon={BookOpen}
        title="Runbooks"
        pitch="Structured step-by-step playbooks the IMT walks when an incident lands. Each step has an owner role and an expected time, so the same workflow that runs an exercise also runs a real incident."
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
        <EmptyState canManage={canManage} libraryCount={LIBRARY_RUNBOOKS.filter((l) => !new Set(existingTitles).has(l.title)).length} />
      ) : (
        <div className="space-y-6">
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
                      <RunbookCard runbook={r} />
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
      <div className="mt-3 flex flex-wrap gap-2 text-[10px] text-soft">
        {runbook.ownerRoleTitle && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5">
            Owner: {runbook.ownerRoleTitle}
          </span>
        )}
        {runbook.trigger?.severityAtLeast && (
          <span className="rounded-full bg-surface-2 px-2 py-0.5">
            Auto ≥ {runbook.trigger.severityAtLeast}
          </span>
        )}
      </div>
    </Link>
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
