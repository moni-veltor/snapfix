"use client";

import {
  Boxes,
  Building,
  CheckCircle2,
  Database,
  Plus,
  Server,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import { addLibraryIBSAction } from "@/app/actions/ibs";
import { withToast } from "@/lib/toast-action";
import {
  IBS_CATEGORIES,
  type IBSCategory,
  type LibraryIBS,
} from "@/lib/ibs-library";
import {
  SECTOR_GROUPS,
  SECTOR_SHORT_LABEL,
  SECTOR_TONE,
  SECTORS,
} from "@/lib/library/sectors";
import type { LibraryBrowserConfig, LibraryCardContext } from "../types";

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1",
  TIER_2: "Tier 2",
  TIER_3: "Tier 3",
};

const HARM_ICONS: { key: keyof LibraryIBS; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Tech", icon: Server },
  { key: "coversDataAvailability", label: "Avail.", icon: Wifi },
  { key: "coversDataIntegrity", label: "Integ.", icon: Database },
  { key: "coversThirdParty", label: "3rd", icon: Boxes },
];

const CATEGORY_TONE: Record<string, string> = {
  Payments: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  "Customer access": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  "Cards & ATM": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Lending: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  Onboarding: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  Trading: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  Insurance: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  Support: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  "Branch & cash": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  Treasury: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  "Energy supply": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "Water supply": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  "Telecoms service": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "Healthcare delivery": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  "Government service": "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  "Transport service": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  "Retail commerce": "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  Logistics: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "Education delivery": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  Manufacturing: "bg-stone-200 text-stone-800 dark:bg-stone-800/60 dark:text-stone-200",
  "Media delivery": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  "Professional services": "bg-zinc-200 text-zinc-800 dark:bg-zinc-800/60 dark:text-zinc-200",
};

export const IBS_LIBRARY_CONFIG: LibraryBrowserConfig<LibraryIBS> = {
  itemKey: (i) => i.slug,
  existingKey: (i) => i.name,
  title: "IBS library",
  subtitle:
    "Important Business Services across tier-1 banks, tier-2 fintechs and tier-3 insurers. Codes are sequenced automatically on add.",
  filters: [
    {
      kind: "search",
      key: "search",
      placeholder: "Search by name, outcome, category…",
      getHaystack: (i) => `${i.name} ${i.outcome} ${i.category}`,
    },
    {
      kind: "multi-chip",
      key: "sectors",
      label: "Sector",
      options: SECTORS.map((s) => ({
        value: s,
        label: SECTOR_SHORT_LABEL[s],
        tone: SECTOR_TONE[s],
      })),
      getValues: (i) => i.sectors ?? [],
      groups: SECTOR_GROUPS.map((g) => ({
        id: g.id,
        label: g.label,
        values: g.sectors,
      })),
    },
    {
      kind: "single-chip",
      key: "category",
      label: "Category",
      options: IBS_CATEGORIES.map((c) => ({
        value: c,
        label: c,
        tone: CATEGORY_TONE[c],
      })),
      getValue: (i) => i.category as IBSCategory,
    },
    {
      kind: "multi-chip",
      key: "tier",
      label: "Firm tier",
      // IBSs may apply to multiple tiers; multi-chip means "any tier in this
      // set matches" which lines up with how the data is shaped.
      options: [
        { value: "TIER_1", label: "Tier 1" },
        { value: "TIER_2", label: "Tier 2" },
        { value: "TIER_3", label: "Tier 3" },
      ],
      getValues: (i) => i.tiers,
    },
  ],
  card: (ibs, ctx) => <IBSCard ibs={ibs} ctx={ctx} />,
};

function IBSCard({ ibs, ctx }: { ibs: LibraryIBS; ctx: LibraryCardContext }) {
  const catTone = CATEGORY_TONE[ibs.category] ?? "bg-surface-2 text-muted";
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        ctx.already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header>
          <h3 className="line-clamp-2 text-sm font-semibold text-ink">{ibs.name}</h3>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${catTone}`}
            >
              {ibs.category}
            </span>
            {ibs.tiers.map((t) => (
              <span
                key={t}
                className="rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted"
              >
                {TIER_LABEL[t]}
              </span>
            ))}
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${
                ibs.criticality === "CRITICAL"
                  ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                  : ibs.criticality === "HIGH"
                    ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                    : ibs.criticality === "MEDIUM"
                      ? "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200"
                      : "bg-surface-2 text-muted"
              }`}
            >
              {ibs.criticality}
            </span>
          </div>
        </header>

        <p className="line-clamp-2 text-xs text-muted">{ibs.outcome}</p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
            Tolerance {formatMinutes(ibs.toleranceMin)}
          </span>
          {ibs.fcaToleranceMin && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              FCA {formatMinutes(ibs.fcaToleranceMin)}
            </span>
          )}
          {ibs.praToleranceMin && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              PRA {formatMinutes(ibs.praToleranceMin)}
            </span>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {HARM_ICONS.map(({ key, label, icon: Icon }) => {
            const on = ibs[key] as boolean | undefined;
            return (
              <span
                key={label}
                title={`${label}${on ? "" : " — not covered"}`}
                className={`flex h-5 w-5 items-center justify-center rounded-md transition-colors ${
                  on
                    ? "bg-accent-soft text-indigo-700 dark:text-indigo-200"
                    : "bg-surface-2 text-soft"
                }`}
              >
                <Icon size={10} />
              </span>
            );
          })}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {ctx.already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In register
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not in register yet</span>
          )}
          {ctx.canAdd && !ctx.already && (
            <form
              action={withToast(addLibraryIBSAction, {
                success: `Added "${ibs.name}"`,
                description: "Sequenced under your IBS register",
                error: "Couldn't add this IBS",
              })}
            >
              <input type="hidden" name="slug" value={ibs.slug} />
              <button
                type="submit"
                className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
              >
                <Plus size={10} />
                Add
              </button>
            </form>
          )}
        </footer>
      </div>
    </article>
  );
}

function formatMinutes(min: number): string {
  if (min < 60) return `${min}m`;
  if (min < 1440) return `${Math.round(min / 60)}h`;
  return `${Math.round(min / 60 / 24)}d`;
}
