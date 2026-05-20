"use client";

import Link from "next/link";
import {
  Building,
  Boxes,
  Database,
  ExternalLink,
  Server,
  Users,
  Wifi,
  type LucideIcon,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { quickUpdateIBSAction } from "@/app/actions/ibs";

export type IBSQuickEditRow = {
  id: string;
  code: string;
  name: string;
  outcome: string | null;
  status: "DRAFT" | "APPROVED" | "DEPRECATED" | string;
  criticality: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL" | string;
  impactToleranceMin: number;
  processOwner: string | null;
  coversPeople: boolean;
  coversProperty: boolean;
  coversTechnology: boolean;
  coversDataAvailability: boolean;
  coversDataIntegrity: boolean;
  coversThirdParty: boolean;
};

const CRITICALITY: { id: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW"; label: string; tone: string }[] =
  [
    {
      id: "CRITICAL",
      label: "Critical",
      tone: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    },
    {
      id: "HIGH",
      label: "High",
      tone: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    },
    {
      id: "MEDIUM",
      label: "Medium",
      tone: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    },
    {
      id: "LOW",
      label: "Low",
      tone: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
    },
  ];

const HARMS: { key: keyof IBSQuickEditRow; label: string; icon: LucideIcon }[] = [
  { key: "coversPeople", label: "People", icon: Users },
  { key: "coversProperty", label: "Property", icon: Building },
  { key: "coversTechnology", label: "Technology", icon: Server },
  { key: "coversDataAvailability", label: "Data availability", icon: Wifi },
  { key: "coversDataIntegrity", label: "Data integrity", icon: Database },
  { key: "coversThirdParty", label: "Third party", icon: Boxes },
];

type Props = {
  open: boolean;
  onClose: () => void;
  row: IBSQuickEditRow | null;
};

export default function IBSQuickEditDrawer({ open, onClose, row }: Props) {
  if (!row) return null;

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={
        <span className="flex items-center gap-2">
          <span className="font-mono text-xs text-soft">{row.code}</span>
          <span>{row.name}</span>
        </span>
      }
      subtitle="Quick edit · the most-changed fields. Use full editor for tolerances + resource map."
      width="md"
      headerExtras={
        <Link
          href={`/ibs/${row.id}`}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] text-muted hover:border-line-strong hover:text-ink"
        >
          <ExternalLink size={11} />
          Full editor
        </Link>
      }
    >
      <form action={quickUpdateIBSAction} className="space-y-5 p-5">
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

        <fieldset className="space-y-2">
          <legend className="text-sm text-ink">Criticality</legend>
          <div className="flex flex-wrap gap-2">
            {CRITICALITY.map((c) => (
              <label
                key={c.id}
                className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wider transition-all ${c.tone} ring-1 ring-transparent has-[:checked]:ring-2 has-[:checked]:ring-indigo-500`}
              >
                <input
                  type="radio"
                  name="criticality"
                  value={c.id}
                  defaultChecked={row.criticality === c.id}
                  className="sr-only"
                />
                {c.label}
              </label>
            ))}
          </div>
        </fieldset>

        <label className="block text-sm">
          <span className="text-ink">Status</span>
          <select
            name="status"
            defaultValue={row.status}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          >
            <option value="DRAFT">Draft</option>
            <option value="APPROVED">Approved</option>
            <option value="DEPRECATED">Deprecated</option>
          </select>
        </label>

        <label className="block text-sm">
          <span className="text-ink">Impact tolerance (minutes)</span>
          <input
            type="number"
            name="impactToleranceMin"
            min={0}
            defaultValue={row.impactToleranceMin}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          />
        </label>

        <label className="block text-sm">
          <span className="text-ink">Process owner</span>
          <input
            name="processOwner"
            defaultValue={row.processOwner ?? ""}
            placeholder="e.g. Head of Payments"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
          />
        </label>

        <fieldset className="space-y-2">
          <legend className="text-sm text-ink">Harm coverage</legend>
          <p className="text-[11px] text-soft">
            Which harm dimensions this service can impact when disrupted.
          </p>
          <div className="grid grid-cols-2 gap-2">
            {HARMS.map(({ key, label, icon: Icon }) => (
              <label
                key={key}
                className="flex cursor-pointer items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2 text-xs text-ink has-[:checked]:border-indigo-400 has-[:checked]:bg-accent-soft"
              >
                <input
                  type="checkbox"
                  name={key}
                  defaultChecked={row[key] as boolean}
                  className="accent-indigo-500"
                />
                <Icon size={12} className="text-soft" />
                <span>{label}</span>
              </label>
            ))}
          </div>
        </fieldset>

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
