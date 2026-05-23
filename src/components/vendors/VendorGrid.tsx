"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Mail,
  Pencil,
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
import VendorQuickEditDrawer from "@/components/vendors/VendorQuickEditDrawer";
import type { VendorState } from "@/lib/vendor-state";

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
  isMaterialThirdParty?: boolean;
  hyperscaler: string | null;
  region: string | null;
  assuranceKind: string | null;
  assuranceExpiryAt: Date | null;
  contractEndAt: Date | null;
  contractRenewalNoticeDays: number | null;
  exitPlanReviewedAt: Date | null;
  ibsLinks: { ibsId: string; ibs: { id: string; code: string; name: string } }[];
  state: VendorState;
};

type SortKey = "tier" | "name" | "assurance" | "contract";
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "tier", label: "Tier (T1 first)" },
  { key: "name", label: "Name A→Z" },
  { key: "assurance", label: "Assurance soonest" },
  { key: "contract", label: "Contract soonest" },
];

function sortVendors(all: VendorRow[], sortKey: SortKey): VendorRow[] {
  const tierRank: Record<string, number> = { TIER_1: 0, TIER_2: 1, TIER_3: 2 };
  const cmpDate = (a: Date | null, b: Date | null): number => {
    if (!a && !b) return 0;
    if (!a) return 1;
    if (!b) return -1;
    return a.getTime() - b.getTime();
  };
  const out = [...all];
  if (sortKey === "name") {
    out.sort((a, b) => a.name.localeCompare(b.name));
  } else if (sortKey === "assurance") {
    out.sort((a, b) => cmpDate(a.assuranceExpiryAt, b.assuranceExpiryAt));
  } else if (sortKey === "contract") {
    out.sort((a, b) => cmpDate(a.contractEndAt, b.contractEndAt));
  } else {
    out.sort(
      (a, b) =>
        (tierRank[a.tier] ?? 99) - (tierRank[b.tier] ?? 99) ||
        a.name.localeCompare(b.name),
    );
  }
  return out;
}

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
  const [editId, setEditId] = useState<string | null>(null);
  const [doraOnly, setDoraOnly] = useState(false);
  const [actionRequired, setActionRequired] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>("tier");
  const [now] = useState(() => Date.now());

  const editVendor = editId ? vendors.find((v) => v.id === editId) ?? null : null;
  const editStub = editVendor ? { id: editVendor.id, name: editVendor.name } : null;

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
  const matches = (v: VendorRow) => {
    if (q !== "") {
      const hit =
        v.name.toLowerCase().includes(q) ||
        (v.serviceKind ?? "").toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        (v.hyperscaler ?? "").toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (doraOnly && !v.isDoraCritical) return false;
    if (actionRequired && v.state.attentionLevel !== "ACTION_REQUIRED") return false;
    return true;
  };

  const visibleKeys: ("TIER_1" | "TIER_2" | "TIER_3")[] =
    filter === "all" ? ["TIER_1", "TIER_2", "TIER_3"] : [filter];

  const visibleCount = visibleKeys.reduce(
    (acc, k) => acc + groups[k].filter(matches).length,
    0,
  );

  // Flat sorted list used whenever the active sort isn't the default
  // tier-grouped view. React Compiler handles memoisation automatically;
  // we just keep the computation pure.
  const filteredAll = vendors.filter((v) => {
    if (q !== "") {
      const hit =
        v.name.toLowerCase().includes(q) ||
        (v.serviceKind ?? "").toLowerCase().includes(q) ||
        (v.description ?? "").toLowerCase().includes(q) ||
        (v.hyperscaler ?? "").toLowerCase().includes(q);
      if (!hit) return false;
    }
    if (doraOnly && !v.isDoraCritical) return false;
    if (actionRequired && v.state.attentionLevel !== "ACTION_REQUIRED") return false;
    return true;
  });
  const flatSorted = sortVendors(filteredAll, sortKey);

  const useFlat = sortKey !== "tier";
  const actionRequiredCount = vendors.filter(
    (v) => v.state.attentionLevel === "ACTION_REQUIRED",
  ).length;
  const doraCount = vendors.filter((v) => v.isDoraCritical).length;

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
        <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-muted">
          <span>Sort</span>
          <select
            value={sortKey}
            onChange={(e) => setSortKey(e.target.value as SortKey)}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] text-ink"
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setDoraOnly((v) => !v)}
          aria-pressed={doraOnly}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            doraOnly
              ? "bg-indigo-600 text-white"
              : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          DORA only
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
              doraOnly ? "bg-white/30" : "bg-surface-2 text-soft"
            }`}
          >
            {doraCount}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActionRequired((v) => !v)}
          aria-pressed={actionRequired}
          disabled={actionRequiredCount === 0}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
            actionRequired
              ? "bg-rose-600 text-white"
              : actionRequiredCount === 0
                ? "bg-surface-1 text-soft opacity-60"
                : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
          }`}
        >
          <AlertTriangle size={11} />
          Action required
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
              actionRequired ? "bg-white/30" : "bg-surface-2 text-soft"
            }`}
          >
            {actionRequiredCount}
          </span>
        </button>
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

      {useFlat ? (
        flatSorted.length === 0 ? (
          <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
            No vendors match this view.
          </div>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {flatSorted.map((v) => (
              <li key={v.id}>
                <VendorCard
                  vendor={v}
                  ibsList={ibsList}
                  canManage={canManage}
                  expanded={openId === v.id}
                  onToggle={() => setOpenId(openId === v.id ? null : v.id)}
                  onEdit={() => setEditId(v.id)}
                  now={now}
                />
              </li>
            ))}
          </ul>
        )
      ) : (
        <>
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
                        onEdit={() => setEditId(v.id)}
                        now={now}
                      />
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </>
      )}

      <VendorQuickEditDrawer
        open={editStub !== null}
        onClose={() => setEditId(null)}
        vendor={editStub}
        canEdit={canManage}
      />
    </section>
  );
}

function VendorCard({
  vendor,
  ibsList,
  canManage,
  expanded,
  onToggle,
  onEdit,
  now,
}: {
  vendor: VendorRow;
  ibsList: Ibs[];
  canManage: boolean;
  expanded: boolean;
  onToggle: () => void;
  onEdit: () => void;
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

        {/* Alert chips (only render when something is overdue) */}
        {vendor.state.alerts.length > 0 && (
          <div className="flex flex-wrap gap-1 text-[10px]">
            {vendor.state.alerts.map((a) => (
              <span
                key={a.code}
                title={a.detail}
                className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-1.5 py-0.5 font-semibold text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
              >
                <AlertTriangle size={10} />
                {a.label}
              </span>
            ))}
          </div>
        )}

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
              <button
                type="button"
                onClick={onEdit}
                className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-muted hover:bg-surface-2 hover:text-ink"
              >
                <Pencil size={11} />
                Edit
              </button>
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

