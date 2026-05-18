"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Phone,
  Plus,
  ShieldAlert,
  Trash2,
  User,
} from "lucide-react";
import {
  deleteVendorAction,
  linkVendorToIBSAction,
  unlinkVendorFromIBSAction,
} from "@/app/actions/vendors";

type VendorRow = {
  id: string;
  name: string;
  description: string | null;
  serviceKind: string | null;
  tier: "TIER_1" | "TIER_2" | "TIER_3" | string;
  contactName: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  statusUrl: string | null;
  isDoraCritical: boolean;
  hyperscaler: string | null;
  region: string | null;
  assuranceKind: string | null;
  assuranceExpiryAt: Date | null;
  exitPlanReviewedAt: Date | null;
  ibsLinks: { ibsId: string; ibs: { id: string; code: string; name: string } }[];
};

type Ibs = { id: string; code: string; name: string };

type Filter = "all" | "TIER_1" | "TIER_2" | "TIER_3";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "TIER_1", label: "Tier 1" },
  { id: "TIER_2", label: "Tier 2" },
  { id: "TIER_3", label: "Tier 3" },
];

const TIER_TONE: Record<string, { chip: string; ring: string; bar: string }> = {
  TIER_1: {
    chip: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
    ring: "border-rose-300 dark:border-rose-700/60",
    bar: "bg-rose-500",
  },
  TIER_2: {
    chip: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
    ring: "border-amber-300 dark:border-amber-700/60",
    bar: "bg-amber-500",
  },
  TIER_3: {
    chip: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
    ring: "border-cyan-300 dark:border-cyan-700/60",
    bar: "bg-cyan-500",
  },
};

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1 · mission-critical",
  TIER_2: "Tier 2 · business-critical",
  TIER_3: "Tier 3 · operational",
};

export default function VendorGrid({
  vendors,
  ibsList,
  canManage,
}: {
  vendors: VendorRow[];
  ibsList: Ibs[];
  canManage: boolean;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const [now] = useState(() => Date.now());

  const groups = useMemo(() => {
    const out: Record<string, VendorRow[]> = { TIER_1: [], TIER_2: [], TIER_3: [] };
    for (const v of vendors) {
      const k = v.tier in out ? v.tier : "TIER_3";
      out[k].push(v);
    }
    for (const k of Object.keys(out)) {
      out[k].sort((a, b) => a.name.localeCompare(b.name));
    }
    return out;
  }, [vendors]);

  const q = query.trim().toLowerCase();
  const matches = (v: VendorRow) =>
    q === "" ||
    v.name.toLowerCase().includes(q) ||
    (v.serviceKind ?? "").toLowerCase().includes(q) ||
    (v.description ?? "").toLowerCase().includes(q) ||
    (v.hyperscaler ?? "").toLowerCase().includes(q);

  const visibleKeys: ("TIER_1" | "TIER_2" | "TIER_3")[] =
    filter === "all" ? ["TIER_1", "TIER_2", "TIER_3"] : [filter];

  const visibleCount = visibleKeys.reduce(
    (acc, k) => acc + groups[k].filter(matches).length,
    0,
  );

  return (
    <section className="space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, service, hyperscaler…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div role="tablist" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const count = f.id === "all" ? vendors.length : groups[f.id].length;
            const active = filter === f.id;
            const tone = f.id !== "all" ? TIER_TONE[f.id] : null;
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? tone
                      ? tone.chip
                      : "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{f.label}</span>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                    active ? "bg-white/30 dark:bg-black/30" : "bg-surface-2 text-soft"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {visibleCount === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No vendors match this view.
        </div>
      )}

      {visibleKeys.map((k) => {
        const items = groups[k].filter(matches);
        if (items.length === 0) return null;
        const tone = TIER_TONE[k];
        return (
          <section key={k}>
            <header className="mb-2 flex items-center gap-2">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${tone.chip}`}
              >
                {TIER_LABEL[k]}
              </span>
              <span className="text-[11px] text-soft">
                {items.length} vendor{items.length === 1 ? "" : "s"}
              </span>
            </header>
            <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {items.map((v) => (
                <li key={v.id}>
                  <VendorCard
                    vendor={v}
                    ibsList={ibsList}
                    canManage={canManage}
                    expanded={openId === v.id}
                    onToggle={() => setOpenId(openId === v.id ? null : v.id)}
                    now={now}
                  />
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </section>
  );
}

function VendorCard({
  vendor,
  ibsList,
  canManage,
  expanded,
  onToggle,
  now,
}: {
  vendor: VendorRow;
  ibsList: Ibs[];
  canManage: boolean;
  expanded: boolean;
  onToggle: () => void;
  now: number;
}) {
  const tone = TIER_TONE[vendor.tier] ?? TIER_TONE.TIER_3;
  const hasExit =
    vendor.exitPlanReviewedAt != null;
  const assuranceFresh =
    vendor.assuranceKind != null &&
    vendor.assuranceKind !== "NONE" &&
    (!vendor.assuranceExpiryAt ||
      vendor.assuranceExpiryAt.getTime() > now + 60 * 86_400_000);

  return (
    <article
      className={`group flex h-full flex-col rounded-xl border bg-surface-1 transition-all hover:shadow-[var(--shadow-card-md)] ${tone.ring}`}
    >
      <div className={`h-1 rounded-t-xl ${tone.bar}`} />
      <div className="flex flex-col gap-3 p-4">
        <header className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h3 className="truncate text-sm font-semibold text-ink">{vendor.name}</h3>
            {vendor.serviceKind && (
              <p className="truncate text-[11px] text-muted">{vendor.serviceKind}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone.chip}`}
            >
              {vendor.tier.replace("_", " ")}
            </span>
            {vendor.isDoraCritical && (
              <span className="rounded-full bg-indigo-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-200">
                DORA
              </span>
            )}
          </div>
        </header>

        {vendor.description && (
          <p className="line-clamp-2 text-xs text-muted">{vendor.description}</p>
        )}

        {/* Contact + hyperscaler / region row */}
        <div className="flex flex-wrap items-center gap-2 text-[10px] text-soft">
          {vendor.hyperscaler && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
              {vendor.hyperscaler}
              {vendor.region ? ` · ${vendor.region}` : ""}
            </span>
          )}
          {vendor.contactEmail && (
            <span title={vendor.contactEmail}>
              <Mail size={11} />
            </span>
          )}
          {vendor.contactPhone && (
            <span title={vendor.contactPhone}>
              <Phone size={11} />
            </span>
          )}
          {vendor.statusUrl && (
            <a
              href={vendor.statusUrl}
              target="_blank"
              rel="noopener"
              title="Status page"
              className="hover:text-ink"
            >
              <ExternalLink size={11} />
            </a>
          )}
          {vendor.contactName && (
            <span className="flex items-center gap-1 text-muted">
              <User size={10} />
              <span className="truncate">{vendor.contactName}</span>
            </span>
          )}
        </div>

        {/* Posture pills */}
        <div className="flex flex-wrap gap-1 text-[10px]">
          <PosturePill ok={assuranceFresh} label="Assurance" />
          <PosturePill ok={hasExit} label="Exit plan" />
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-1.5 py-0.5 text-muted">
            <Boxes size={10} />
            {vendor.ibsLinks.length} IBS{vendor.ibsLinks.length === 1 ? "" : "s"}
          </span>
        </div>

        {/* Footer */}
        <footer className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3">
          <button
            type="button"
            onClick={onToggle}
            className="inline-flex items-center gap-1 rounded-md text-[11px] font-medium text-muted hover:text-ink"
          >
            {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {expanded ? "Hide details" : "Show details"}
          </button>
          {canManage && (
            <div className="flex items-center gap-0.5">
              <Link
                href={`/vendors/${vendor.id}`}
                className="rounded-md px-2 py-1 text-[11px] text-muted hover:bg-surface-2 hover:text-ink"
              >
                Open
              </Link>
              <form action={deleteVendorAction}>
                <input type="hidden" name="id" value={vendor.id} />
                <button
                  type="submit"
                  className="rounded-md p-1 text-soft hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  aria-label="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </form>
            </div>
          )}
        </footer>

        {expanded && (
          <div className="space-y-3 border-t border-line pt-3 text-xs">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                Supports IBSs
              </p>
              {vendor.ibsLinks.length === 0 ? (
                <p className="mt-1 text-soft">No IBS links yet.</p>
              ) : (
                <ul className="mt-1 flex flex-wrap gap-1">
                  {vendor.ibsLinks.map((l) => (
                    <li
                      key={l.ibsId}
                      className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[11px]"
                    >
                      <span className="font-mono text-soft">{l.ibs.code}</span>
                      <span className="truncate text-muted">{l.ibs.name}</span>
                      {canManage && (
                        <form action={unlinkVendorFromIBSAction} className="inline">
                          <input type="hidden" name="vendorId" value={vendor.id} />
                          <input type="hidden" name="ibsId" value={l.ibsId} />
                          <button className="ml-1 text-soft hover:text-rose-600">×</button>
                        </form>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {canManage && ibsList.length > 0 && (
                <form action={linkVendorToIBSAction} className="mt-2 flex items-center gap-1">
                  <input type="hidden" name="vendorId" value={vendor.id} />
                  <select
                    name="ibsId"
                    defaultValue=""
                    className="flex-1 rounded border border-line bg-surface-0 px-2 py-1 text-[11px]"
                  >
                    <option value="" disabled>
                      + link IBS…
                    </option>
                    {ibsList
                      .filter((i) => !vendor.ibsLinks.some((l) => l.ibsId === i.id))
                      .map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.code} — {i.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-2 py-1 text-[11px] text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
                  >
                    <Plus size={10} />
                    Link
                  </button>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

function PosturePill({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
      }`}
    >
      {ok ? <CheckCircle2 size={9} /> : <ShieldAlert size={9} />}
      {label}
    </span>
  );
}

