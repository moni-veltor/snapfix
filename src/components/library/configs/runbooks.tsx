"use client";

import {
  BookOpen,
  CheckCircle2,
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
import { addRunbookFromLibraryAction } from "@/app/actions/runbooks";
import { withToast } from "@/lib/toast-action";
import type { LibraryRunbook } from "@/lib/library/runbooks";
import type { LibraryBrowserConfig, LibraryCardContext } from "../types";

const CATEGORY_LABEL: Record<string, string> = {
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
  string,
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

const CATEGORY_TONE: Record<string, string> = {
  CYBER: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  RANSOMWARE: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  CLOUD_REGION_OUTAGE: "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  VENDOR_FAILURE: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  BCP_ACTIVATION: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  DATA_INCIDENT: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  PEOPLE_DISRUPTION: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  REGULATORY_NOTIFICATION: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  OTHER: "bg-surface-2 text-muted",
};

export const RUNBOOK_LIBRARY_CONFIG: LibraryBrowserConfig<LibraryRunbook> = {
  itemKey: (r) => r.slug,
  existingKey: (r) => r.title,
  title: "Runbook library",
  subtitle:
    "Best-practice playbooks the IMT walks during an exercise or a real incident. Cloned as DRAFT — you'll customise step content to your firm's role vocabulary.",
  filters: [
    {
      kind: "search",
      key: "search",
      placeholder: "Search by title, description, category…",
      getHaystack: (r) => `${r.title} ${r.description} ${CATEGORY_LABEL[r.category] ?? r.category}`,
    },
    {
      kind: "single-chip",
      key: "category",
      label: "Category",
      options: Object.keys(CATEGORY_LABEL).map((c) => ({
        value: c,
        label: CATEGORY_LABEL[c],
        tone: CATEGORY_TONE[c],
      })),
      getValue: (r) => r.category,
    },
    {
      kind: "single-chip",
      key: "severity",
      label: "Auto-activates at",
      options: [
        { value: "LOW", label: "LOW+" },
        { value: "MEDIUM", label: "MEDIUM+" },
        { value: "HIGH", label: "HIGH+" },
        { value: "CRITICAL", label: "CRITICAL only" },
      ],
      getValue: (r) => r.trigger?.severityAtLeast ?? null,
    },
  ],
  card: (runbook, ctx) => <RunbookCard runbook={runbook} ctx={ctx} />,
};

function RunbookCard({
  runbook,
  ctx,
}: {
  runbook: LibraryRunbook;
  ctx: LibraryCardContext;
}) {
  const Icon = CATEGORY_ICON[runbook.category] ?? BookOpen;
  const categoryTone = CATEGORY_TONE[runbook.category] ?? "bg-surface-2 text-muted";
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        ctx.already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header>
          <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Icon size={11} />
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${categoryTone}`}
            >
              {CATEGORY_LABEL[runbook.category] ?? runbook.category}
            </span>
          </div>
          <h3 className="mt-1 line-clamp-2 font-display text-sm font-semibold text-ink">
            {runbook.title}
          </h3>
        </header>

        <p className="line-clamp-4 text-[12px] text-soft">{runbook.description}</p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
            {runbook.steps.length} steps
          </span>
          {runbook.ownerRoleTitle && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              Owner: {runbook.ownerRoleTitle}
            </span>
          )}
          {runbook.trigger?.severityAtLeast && (
            <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
              Auto ≥ {runbook.trigger.severityAtLeast}
            </span>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {ctx.already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In your org
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not added yet</span>
          )}
          {ctx.canAdd && !ctx.already && (
            <form
              action={withToast(addRunbookFromLibraryAction, {
                success: `Cloned "${runbook.title}"`,
                description: "Opened as DRAFT — customise step content",
                error: "Couldn't clone this runbook",
              })}
            >
              <input type="hidden" name="slug" value={runbook.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add to org
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}
