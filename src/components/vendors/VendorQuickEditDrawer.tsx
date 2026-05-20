"use client";

import Link from "next/link";
import { ExternalLink } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { quickUpdateVendorAction } from "@/app/actions/vendors";

export type VendorQuickEditRow = {
  id: string;
  name: string;
  serviceKind: string | null;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | string;
  isDoraCritical: boolean;
  isMaterialThirdParty?: boolean;
  hyperscaler: string | null;
  region: string | null;
  statusUrl: string | null;
  contractStartAt: Date | null;
  contractEndAt: Date | null;
  exitPlanReviewedAt: Date | null;
  exitPlanRTOMin: number | null;
};

const TIERS: { id: "TIER_1" | "TIER_2" | "TIER_3"; label: string; tone: string }[] = [
  {
    id: "TIER_1",
    label: "Tier 1 · mission-critical",
    tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  },
  {
    id: "TIER_2",
    label: "Tier 2 · business-critical",
    tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  },
  {
    id: "TIER_3",
    label: "Tier 3 · operational",
    tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  },
];

function toDateInput(d: Date | null): string {
  if (!d) return "";
  return d.toISOString().slice(0, 10);
}

type Props = {
  open: boolean;
  onClose: () => void;
  row: VendorQuickEditRow | null;
};

export default function VendorQuickEditDrawer({ open, onClose, row }: Props) {
  if (!row) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={row.name}
      subtitle="Quick edit · core register fields. Open the full editor for contacts, assurance and contract value."
      width="md"
      headerExtras={
        <Link
          href={`/vendors/${row.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] text-muted hover:border-line-strong hover:text-ink"
        >
          <ExternalLink size={11} />
          Full editor
        </Link>
      }
    >
      <form action={quickUpdateVendorAction} className="space-y-5 p-5">
        <input type="hidden" name="id" value={row.id} />

        <label className="block text-sm">
          <span className="text-ink">Name</span>
          <input
            name="name"
            defaultValue={row.name}
            required
            maxLength={200}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-ink">Service kind</span>
          <input
            name="serviceKind"
            defaultValue={row.serviceKind ?? ""}
            placeholder="e.g. Cloud infrastructure, Payments processor"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-ink">Tier</legend>
          <div className="flex flex-col gap-1.5">
            {TIERS.map((t) => (
              <label
                key={t.id}
                className={`flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-xs font-medium has-[:checked]:border-indigo-400 has-[:checked]:bg-accent-soft`}
              >
                <input
                  type="radio"
                  name="tier"
                  value={t.id}
                  defaultChecked={row.tier === t.id}
                  className="accent-indigo-500"
                />
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${t.tone}`}
                >
                  {t.id.replace("_", " ")}
                </span>
                <span className="text-ink">{t.label}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="space-y-2">
          <legend className="text-sm text-ink">Designations</legend>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-xs has-[:checked]:border-indigo-400 has-[:checked]:bg-accent-soft">
            <input
              type="checkbox"
              name="isDoraCritical"
              defaultChecked={row.isDoraCritical}
              className="accent-indigo-500"
            />
            <span className="font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
              DORA-critical ICT provider
            </span>
          </label>
          <label className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-xs has-[:checked]:border-indigo-400 has-[:checked]:bg-accent-soft">
            <input
              type="checkbox"
              name="isMaterialThirdParty"
              defaultChecked={row.isMaterialThirdParty ?? false}
              className="accent-indigo-500"
            />
            <span className="font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-200">
              Material third party
            </span>
          </label>
        </fieldset>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink">Hyperscaler</span>
            <input
              name="hyperscaler"
              defaultValue={row.hyperscaler ?? ""}
              placeholder="AWS / Azure / GCP"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink">Region</span>
            <input
              name="region"
              defaultValue={row.region ?? ""}
              placeholder="eu-west-1, UK South…"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
        </div>

        <label className="block text-sm">
          <span className="text-ink">Status page URL</span>
          <input
            type="url"
            name="statusUrl"
            defaultValue={row.statusUrl ?? ""}
            placeholder="https://status.example.com"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink">Contract start</span>
            <input
              type="date"
              name="contractStartAt"
              defaultValue={toDateInput(row.contractStartAt)}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink">Contract end</span>
            <input
              type="date"
              name="contractEndAt"
              defaultValue={toDateInput(row.contractEndAt)}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink">Exit plan last reviewed</span>
            <input
              type="date"
              name="exitPlanReviewedAt"
              defaultValue={toDateInput(row.exitPlanReviewedAt)}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink">Exit RTO (minutes)</span>
            <input
              type="number"
              name="exitPlanRTOMin"
              min={0}
              defaultValue={row.exitPlanRTOMin ?? ""}
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
            />
          </label>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-line pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-md border border-line bg-surface-0 px-3 py-2 text-sm text-muted hover:border-line-strong hover:text-ink"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            Save changes
          </button>
        </div>
      </form>
    </Drawer>
  );
}
