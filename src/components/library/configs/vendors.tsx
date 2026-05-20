"use client";

import {
  CheckCircle2,
  Cloud,
  Plus,
  Shield,
  ShieldCheck,
  type LucideIcon,
} from "lucide-react";
import { addLibraryVendorAction } from "@/app/actions/vendors";
import { withToast } from "@/lib/toast-action";
import {
  VENDOR_CATEGORIES,
  type LibraryVendor,
  type VendorCategory,
} from "@/lib/vendor-library";
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

const CATEGORY_TONE: Record<VendorCategory, string> = {
  "Core banking": "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  Payments: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  "Card issuing": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "Open banking": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "KYC / Identity": "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  "AML / Sanctions": "bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-950/40 dark:text-fuchsia-200",
  Fraud: "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  Reconciliations: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  "Documents & e-sign": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
  "Cloud & infra": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  Communications: "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "Customer & CRM": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  Treasury: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950/40 dark:text-yellow-200",
  "Energy & utilities": "bg-orange-100 text-orange-800 dark:bg-orange-950/40 dark:text-orange-200",
  "Telecoms infra": "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  "Healthcare IT": "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
  "Retail & ecommerce": "bg-pink-100 text-pink-800 dark:bg-pink-950/40 dark:text-pink-200",
  "Transport & travel": "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-200",
  "Logistics & shipping": "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  "Government IT": "bg-slate-200 text-slate-800 dark:bg-slate-800/60 dark:text-slate-200",
  "Education tech": "bg-lime-100 text-lime-800 dark:bg-lime-950/40 dark:text-lime-200",
  "Media & broadcast": "bg-purple-100 text-purple-800 dark:bg-purple-950/40 dark:text-purple-200",
  "Manufacturing & industrial": "bg-stone-200 text-stone-800 dark:bg-stone-800/60 dark:text-stone-200",
  Cybersecurity: "bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-200",
  "Productivity & HR": "bg-teal-100 text-teal-800 dark:bg-teal-950/40 dark:text-teal-200",
};

const ASSURANCE_LABEL: Record<string, string> = {
  SOC2_TYPE_2: "SOC 2 · Type 2",
  SOC2_TYPE_1: "SOC 2 · Type 1",
  ISAE3402: "ISAE 3402",
  ISO27001: "ISO 27001",
};

export const VENDOR_LIBRARY_CONFIG: LibraryBrowserConfig<LibraryVendor> = {
  itemKey: (v) => v.slug,
  existingKey: (v) => v.name,
  title: "Vendor library",
  subtitle:
    "Pre-built providers active in UK banking & fintech. Click Add and the vendor lands in your register with sensible tier + assurance defaults.",
  filters: [
    {
      kind: "search",
      key: "search",
      placeholder: "Search by vendor, service, category…",
      getHaystack: (v) => `${v.name} ${v.serviceKind} ${v.description} ${v.category}`,
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
      getValues: (v) => v.sectors ?? [],
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
      options: VENDOR_CATEGORIES.map((c) => ({
        value: c,
        label: c,
        tone: CATEGORY_TONE[c],
      })),
      getValue: (v) => v.category,
    },
    {
      kind: "single-chip",
      key: "tier",
      label: "Suggested tier",
      options: [
        { value: "TIER_1", label: "Tier 1" },
        { value: "TIER_2", label: "Tier 2" },
        { value: "TIER_3", label: "Tier 3" },
      ],
      getValue: (v) => v.suggestedTier,
    },
    {
      kind: "toggle",
      key: "doraOnly",
      label: "DORA-critical only",
      helpText: "Hide vendors not flagged as ICT-critical under DORA.",
      predicate: (v) => v.isDoraCritical,
    },
  ],
  card: (vendor, ctx) => <VendorCard vendor={vendor} ctx={ctx} />,
};

function VendorCard({
  vendor,
  ctx,
}: {
  vendor: LibraryVendor;
  ctx: LibraryCardContext;
}) {
  const catTone = CATEGORY_TONE[vendor.category] ?? "bg-surface-2 text-muted";
  const TierIcon: LucideIcon = ShieldCheck;
  return (
    <article
      className={`flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        ctx.already ? "border-emerald-300 dark:border-emerald-700/60" : "border-line"
      }`}
    >
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header>
          <h3 className="line-clamp-1 text-sm font-semibold text-ink">{vendor.name}</h3>
          <p className="mt-0.5 line-clamp-1 text-[11px] text-soft">{vendor.serviceKind}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${catTone}`}
            >
              {vendor.category}
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-muted">
              <TierIcon size={9} />
              {TIER_LABEL[vendor.suggestedTier]}
            </span>
            {vendor.isDoraCritical && (
              <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                <Shield size={9} />
                DORA
              </span>
            )}
          </div>
        </header>

        <p className="line-clamp-3 text-xs text-muted">{vendor.description}</p>

        <div className="flex flex-wrap items-center gap-1 text-[10px] text-soft">
          {vendor.hyperscaler && (
            <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5">
              <Cloud size={9} />
              {vendor.hyperscaler}
            </span>
          )}
          {vendor.region && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">{vendor.region}</span>
          )}
          {vendor.assuranceKind && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5">
              {ASSURANCE_LABEL[vendor.assuranceKind] ?? vendor.assuranceKind}
            </span>
          )}
        </div>

        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          {ctx.already ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
              <CheckCircle2 size={10} />
              In register
            </span>
          ) : (
            <span className="text-[10px] text-soft">Not added yet</span>
          )}
          {ctx.canAdd && !ctx.already && (
            <form
              action={withToast(addLibraryVendorAction, {
                success: `Added ${vendor.name}`,
                description: "Opened in your vendor register",
                error: "Couldn't add this vendor",
              })}
            >
              <input type="hidden" name="slug" value={vendor.slug} />
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
