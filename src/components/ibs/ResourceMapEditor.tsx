"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  Boxes,
  Building,
  Building2,
  CheckCircle2,
  Database,
  ExternalLink,
  Eye,
  Filter,
  GitBranch,
  List,
  Network,
  Plus,
  Printer,
  Server,
  ShieldAlert,
  Sparkles,
  Trash2,
  Users,
  Workflow,
  X,
  type LucideIcon,
} from "lucide-react";
import {
  addIBSResourceAction,
  removeIBSResourceAction,
  updateIBSResourceAction,
} from "@/app/actions/ibs-resources";

const ResourceNetworkView = dynamic(() => import("./ResourceNetworkView"), {
  ssr: false,
  loading: () => (
    <div className="grid h-[640px] place-items-center rounded-lg border border-line bg-surface-0 text-sm text-muted">
      Loading network…
    </div>
  ),
});

export type Kind = "TECHNOLOGY" | "THIRD_PARTY" | "INFORMATION" | "PROCESS" | "PEOPLE" | "FACILITY";
export type Crit = "CRITICAL" | "IMPORTANT" | "SUPPORTING";

export type Resource = {
  id: string;
  kind: Kind;
  label: string;
  criticality: Crit;
  vendor: { id: string; name: string; statusUrl?: string | null } | null;
  techSystem: {
    id: string;
    name: string;
    tier: string | null;
    /** Most recent DR test outcome — null when no DR test has been run. */
    lastDrTest?: { testedAt: Date; outcome: string } | null;
    nextDrTestDueAt?: Date | null;
  } | null;
  department: { id: string; name: string } | null;
  note: string | null;
};

export type SharedPeer = { id: string; code: string; name: string };

type Props = {
  ibsId: string;
  ibsCode: string;
  ibsName: string;
  resources: Resource[];
  sharedBy: Record<string, SharedPeer[]>;
  vendors: { id: string; name: string }[];
  techSystems: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  canEdit: boolean;
  /** Optional slot rendered above the resource grid — used for the network view toggle in Commit C. */
  toolbarExtra?: React.ReactNode;
};

const KIND_META: Record<Kind, { label: string; icon: LucideIcon; tone: string; bg: string }> = {
  PEOPLE: { label: "People", icon: Users, tone: "text-rose-600 dark:text-rose-300", bg: "bg-rose-100 dark:bg-rose-950/40" },
  TECHNOLOGY: { label: "Technology", icon: Server, tone: "text-cyan-600 dark:text-cyan-300", bg: "bg-cyan-100 dark:bg-cyan-950/40" },
  THIRD_PARTY: { label: "3rd parties", icon: Boxes, tone: "text-emerald-600 dark:text-emerald-300", bg: "bg-emerald-100 dark:bg-emerald-950/40" },
  INFORMATION: { label: "Information", icon: Database, tone: "text-violet-600 dark:text-violet-300", bg: "bg-violet-100 dark:bg-violet-950/40" },
  PROCESS: { label: "Processes", icon: Workflow, tone: "text-indigo-600 dark:text-indigo-300", bg: "bg-indigo-100 dark:bg-indigo-950/40" },
  FACILITY: { label: "Facilities", icon: Building, tone: "text-amber-600 dark:text-amber-300", bg: "bg-amber-100 dark:bg-amber-950/40" },
};

const CRIT_RANK: Record<Crit, number> = { CRITICAL: 3, IMPORTANT: 2, SUPPORTING: 1 };

const CRIT_TONE: Record<Crit, string> = {
  CRITICAL: "border-rose-400 text-rose-800 dark:text-rose-200 bg-rose-50/70 dark:bg-rose-950/30",
  IMPORTANT: "border-amber-400 text-amber-800 dark:text-amber-200 bg-amber-50/70 dark:bg-amber-950/30",
  SUPPORTING: "border-line text-ink bg-surface-0",
};

const CRIT_DOT: Record<Crit, string> = {
  CRITICAL: "bg-rose-500",
  IMPORTANT: "bg-amber-500",
  SUPPORTING: "bg-slate-400",
};

export default function ResourceMapEditor({
  ibsId,
  ibsCode,
  ibsName,
  resources,
  sharedBy,
  vendors,
  techSystems,
  departments,
  canEdit,
  toolbarExtra,
}: Props) {
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [showCriticalOnly, setShowCriticalOnly] = useState(false);
  const [showSharedOnly, setShowSharedOnly] = useState(false);
  const [showSpofLens, setShowSpofLens] = useState(false);
  const [addingKind, setAddingKind] = useState<Kind | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "network">("list");

  // Filtered & grouped resources
  const grouped = useMemo(() => {
    const filtered = resources.filter((r) => {
      if (showCriticalOnly && r.criticality !== "CRITICAL") return false;
      if (showSharedOnly) {
        const peers = sharedBy[r.label.toLowerCase()] ?? [];
        if (peers.length === 0) return false;
      }
      return true;
    });
    const map = new Map<Kind, Resource[]>();
    for (const k of Object.keys(KIND_META) as Kind[]) map.set(k, []);
    for (const r of filtered) {
      const list = map.get(r.kind);
      if (list) list.push(r);
    }
    // Sort by criticality desc, then by label for stability
    for (const list of map.values()) {
      list.sort((a, b) => {
        const c = CRIT_RANK[b.criticality] - CRIT_RANK[a.criticality];
        return c !== 0 ? c : a.label.localeCompare(b.label);
      });
    }
    return map;
  }, [resources, showCriticalOnly, showSharedOnly, sharedBy]);

  // SPOF lens — across all dependencies, those shared by ≥1 other IBS
  const spofRows = useMemo(() => {
    const rows: { label: string; criticality: Crit; peers: SharedPeer[]; kinds: Kind[] }[] = [];
    const byLabel = new Map<string, Resource[]>();
    for (const r of resources) {
      const key = r.label.toLowerCase();
      const list = byLabel.get(key) ?? [];
      list.push(r);
      byLabel.set(key, list);
    }
    for (const [key, ours] of byLabel) {
      const peers = sharedBy[key] ?? [];
      if (peers.length === 0) continue;
      const maxCrit = ours.reduce<Crit>(
        (acc, r) => (CRIT_RANK[r.criticality] > CRIT_RANK[acc] ? r.criticality : acc),
        "SUPPORTING",
      );
      rows.push({
        label: ours[0].label,
        criticality: maxCrit,
        peers,
        kinds: Array.from(new Set(ours.map((r) => r.kind))),
      });
    }
    rows.sort((a, b) => {
      const c = CRIT_RANK[b.criticality] - CRIT_RANK[a.criticality];
      return c !== 0 ? c : b.peers.length - a.peers.length;
    });
    return rows;
  }, [resources, sharedBy]);

  const totalCrit = resources.filter((r) => r.criticality === "CRITICAL").length;
  const totalShared = resources.filter((r) => (sharedBy[r.label.toLowerCase()] ?? []).length > 0).length;

  return (
    <section className="rounded-xl border border-line bg-surface-1 p-5">
      {/* Header + filter toolbar */}
      <header className="space-y-2">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-ink">Resource map</h3>
            <p className="mt-0.5 text-xs text-muted">
              {resources.length} dependencies · {totalCrit} critical · {totalShared} shared with other IBSs
            </p>
          </div>
          {toolbarExtra}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-soft">
              <Filter size={10} />
              Filter:
            </span>
            <FilterChip active={showCriticalOnly} onClick={() => setShowCriticalOnly((v) => !v)}>
              <span className={`mr-1 inline-block h-1.5 w-1.5 rounded-full ${CRIT_DOT.CRITICAL}`} />
              Critical only ({totalCrit})
            </FilterChip>
            <FilterChip active={showSharedOnly} onClick={() => setShowSharedOnly((v) => !v)}>
              <ShieldAlert size={10} className="mr-1 inline" />
              Shared only ({totalShared})
            </FilterChip>
            <FilterChip active={showSpofLens} onClick={() => setShowSpofLens((v) => !v)}>
              <Eye size={10} className="mr-1 inline" />
              SPOF lens
            </FilterChip>
            {showSpofLens && (
              <Link
                href={`/ibs/${ibsId}/spof-brief`}
                className="inline-flex items-center gap-0.5 rounded-full border border-line bg-surface-0 px-2 py-0.5 text-muted hover:border-line-strong hover:text-ink"
              >
                <Printer size={10} className="mr-1" />
                Print brief
              </Link>
            )}
          </div>
          <div className="inline-flex overflow-hidden rounded-md border border-line">
            <button
              type="button"
              onClick={() => setViewMode("list")}
              className={`inline-flex items-center gap-1 px-2 py-0.5 ${
                viewMode === "list"
                  ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                  : "bg-surface-0 text-muted hover:text-ink"
              }`}
            >
              <List size={10} />
              List
            </button>
            <button
              type="button"
              onClick={() => setViewMode("network")}
              className={`inline-flex items-center gap-1 border-l border-line px-2 py-0.5 ${
                viewMode === "network"
                  ? "bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                  : "bg-surface-0 text-muted hover:text-ink"
              }`}
            >
              <GitBranch size={10} />
              Network
            </button>
          </div>
        </div>
      </header>

      {viewMode === "network" && !showSpofLens ? (
        <div className="mt-4">
          <ResourceNetworkView
            ibsCode={ibsCode}
            ibsName={ibsName}
            resources={resources}
            sharedBy={sharedBy}
          />
        </div>
      ) : showSpofLens ? (
        <SpofLens rows={spofRows} ibsCode={ibsCode} />
      ) : (
        <div className="mt-4 grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          {/* IBS centre + kind sections */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 rounded-lg bg-gradient-brand-soft p-3">
              <Network size={14} className="text-indigo-600 dark:text-indigo-300" />
              <span className="font-mono text-sm font-semibold text-ink">{ibsCode}</span>
              <span className="text-sm text-ink">{ibsName}</span>
            </div>
            {(Object.keys(KIND_META) as Kind[]).map((kind) => (
              <KindSection
                key={kind}
                kind={kind}
                items={grouped.get(kind) ?? []}
                sharedBy={sharedBy}
                selectedLabel={selectedLabel}
                onSelect={setSelectedLabel}
                onAdd={() => setAddingKind(kind)}
                canEdit={canEdit}
                ibsId={ibsId}
              />
            ))}
            {addingKind && (
              <AddInline
                ibsId={ibsId}
                kind={addingKind}
                vendors={vendors}
                techSystems={techSystems}
                departments={departments}
                onClose={() => setAddingKind(null)}
              />
            )}
          </div>

          {/* Shared-dependency / selected detail panel */}
          <SidePanel
            selectedLabel={selectedLabel}
            sharedBy={sharedBy}
            resources={resources}
            onClear={() => setSelectedLabel(null)}
          />
        </div>
      )}
    </section>
  );
}

// ────────────────────────────────────────────────────────────────────────────
// Filter / kind section / tag / inline-add / side panel
// ────────────────────────────────────────────────────────────────────────────

function FilterChip({
  active,
  children,
  onClick,
}: {
  active: boolean;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`inline-flex items-center rounded-full border px-2 py-0.5 ${
        active
          ? "border-indigo-500 bg-indigo-50 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
          : "border-line bg-surface-0 text-muted hover:border-line-strong hover:text-ink"
      }`}
    >
      {children}
    </button>
  );
}

function KindSection({
  kind,
  items,
  sharedBy,
  selectedLabel,
  onSelect,
  onAdd,
  canEdit,
  ibsId,
}: {
  kind: Kind;
  items: Resource[];
  sharedBy: Record<string, SharedPeer[]>;
  selectedLabel: string | null;
  onSelect: (label: string | null) => void;
  onAdd: () => void;
  canEdit: boolean;
  ibsId: string;
}) {
  const meta = KIND_META[kind];
  const Icon = meta.icon;
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px] font-semibold uppercase tracking-wider text-soft">
        <span className="flex items-center gap-1.5">
          <span className={`flex h-5 w-5 items-center justify-center rounded ${meta.bg}`}>
            <Icon size={11} className={meta.tone} />
          </span>
          {meta.label}
          <span className="text-soft">· {items.length}</span>
        </span>
        {canEdit && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-0.5 rounded-md border border-line bg-surface-0 px-1.5 py-0.5 text-[10px] text-muted hover:border-line-strong hover:text-ink"
          >
            <Plus size={9} />
            Add
          </button>
        )}
      </div>
      {items.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-surface-0 p-2 text-[10px] text-soft">
          No {meta.label.toLowerCase()} dependencies recorded.
        </p>
      ) : (
        <div className="flex flex-wrap gap-1.5">
          {items.map((r) => (
            <ResourceTag
              key={r.id}
              resource={r}
              peers={sharedBy[r.label.toLowerCase()] ?? []}
              selected={selectedLabel === r.label}
              onSelect={() => onSelect(selectedLabel === r.label ? null : r.label)}
              canEdit={canEdit}
              ibsId={ibsId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ResourceTag({
  resource,
  peers,
  selected,
  onSelect,
  canEdit,
  ibsId,
}: {
  resource: Resource;
  peers: SharedPeer[];
  selected: boolean;
  onSelect: () => void;
  canEdit: boolean;
  ibsId: string;
}) {
  const entity = resource.vendor ?? resource.techSystem ?? resource.department;
  const entityHref = resource.vendor
    ? `/vendors/${resource.vendor.id}`
    : resource.techSystem
      ? `/tech-recovery`
      : resource.department
        ? `/org`
        : null;
  return (
    <div
      className={`group relative inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] transition-all ${CRIT_TONE[resource.criticality]} ${
        selected ? "ring-2 ring-indigo-400 ring-offset-1 ring-offset-surface-1" : ""
      } ${peers.length > 0 ? "shadow-[0_0_0_1px_rgba(217,119,6,0.3)]" : ""}`}
    >
      <span
        className={`inline-block h-1.5 w-1.5 rounded-full ${CRIT_DOT[resource.criticality]}`}
        title={resource.criticality}
      />
      <LiveIndicator resource={resource} />
      <button type="button" onClick={onSelect} className="text-left">
        {resource.label}
      </button>
      {peers.length > 0 && (
        <span
          className="rounded-full bg-amber-600 px-1 text-[9px] font-semibold text-white"
          title={`Shared with ${peers.length} other IBS${peers.length === 1 ? "" : "s"}`}
        >
          +{peers.length}
        </span>
      )}
      {entity && entityHref && (
        <Link
          href={entityHref}
          className="ml-0.5 text-soft hover:text-ink"
          title={`Open ${entity.name}`}
        >
          <ExternalLink size={10} />
        </Link>
      )}
      {canEdit && (
        <span className="ml-1 hidden gap-0.5 group-hover:inline-flex">
          <CriticalityMenu resourceId={resource.id} ibsId={ibsId} current={resource.criticality} />
          <form action={removeIBSResourceAction} className="inline">
            <input type="hidden" name="ibsId" value={ibsId} />
            <input type="hidden" name="resourceId" value={resource.id} />
            <button
              type="submit"
              className="text-soft hover:text-rose-700"
              title="Remove"
              aria-label="Remove"
            >
              <Trash2 size={10} />
            </button>
          </form>
        </span>
      )}
    </div>
  );
}

function CriticalityMenu({
  resourceId,
  ibsId,
  current,
}: {
  resourceId: string;
  ibsId: string;
  current: Crit;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-soft hover:text-ink"
        title="Set criticality"
        aria-label="Set criticality"
      >
        <Sparkles size={10} />
      </button>
      {open && (
        <span className="absolute right-0 top-4 z-20 rounded-md border border-line bg-surface-1 p-1 shadow-[var(--shadow-card-lg)]">
          {(["CRITICAL", "IMPORTANT", "SUPPORTING"] as Crit[]).map((c) => (
            <form key={c} action={updateIBSResourceAction} className="block">
              <input type="hidden" name="ibsId" value={ibsId} />
              <input type="hidden" name="resourceId" value={resourceId} />
              <input type="hidden" name="criticality" value={c} />
              <button
                type="submit"
                onClick={() => setOpen(false)}
                className={`block w-full whitespace-nowrap rounded px-2 py-1 text-left text-[10px] hover:bg-surface-2 ${
                  c === current ? "bg-surface-2 font-semibold" : ""
                }`}
              >
                <span className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${CRIT_DOT[c]}`} />
                {c.charAt(0) + c.slice(1).toLowerCase()}
              </button>
            </form>
          ))}
        </span>
      )}
    </span>
  );
}

function AddInline({
  ibsId,
  kind,
  vendors,
  techSystems,
  departments,
  onClose,
}: {
  ibsId: string;
  kind: Kind;
  vendors: { id: string; name: string }[];
  techSystems: { id: string; name: string }[];
  departments: { id: string; name: string }[];
  onClose: () => void;
}) {
  const [label, setLabel] = useState("");
  const [link, setLink] = useState<{ type: "" | "vendor" | "system" | "dept"; id: string } | null>(null);
  const meta = KIND_META[kind];

  // Suggest entities matching the typed label
  const suggestions = useMemo(() => {
    if (label.length < 2) return [] as { type: "vendor" | "system" | "dept"; id: string; name: string }[];
    const q = label.toLowerCase();
    const out: { type: "vendor" | "system" | "dept"; id: string; name: string }[] = [];
    if (kind === "THIRD_PARTY") {
      out.push(...vendors.filter((v) => v.name.toLowerCase().includes(q)).slice(0, 4).map((v) => ({ type: "vendor" as const, id: v.id, name: v.name })));
    }
    if (kind === "TECHNOLOGY") {
      out.push(...techSystems.filter((s) => s.name.toLowerCase().includes(q)).slice(0, 4).map((s) => ({ type: "system" as const, id: s.id, name: s.name })));
    }
    if (kind === "PEOPLE" || kind === "PROCESS") {
      out.push(...departments.filter((d) => d.name.toLowerCase().includes(q)).slice(0, 4).map((d) => ({ type: "dept" as const, id: d.id, name: d.name })));
    }
    return out;
  }, [label, kind, vendors, techSystems, departments]);

  return (
    <form
      action={async (fd) => {
        await addIBSResourceAction(fd);
        onClose();
      }}
      className="mt-3 space-y-2 rounded-md border border-indigo-200 bg-indigo-50/40 p-3 dark:border-indigo-800/60 dark:bg-indigo-950/30"
    >
      <input type="hidden" name="ibsId" value={ibsId} />
      <input type="hidden" name="kind" value={kind} />
      {link?.type === "vendor" && <input type="hidden" name="vendorId" value={link.id} />}
      {link?.type === "system" && <input type="hidden" name="techSystemId" value={link.id} />}
      {link?.type === "dept" && <input type="hidden" name="departmentId" value={link.id} />}

      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="flex items-center gap-1.5 text-[11px] font-semibold text-ink">
          <Plus size={11} />
          Add to {meta.label}
        </p>
        <button type="button" onClick={onClose} className="text-soft hover:text-ink">
          <X size={11} />
        </button>
      </div>

      <input
        name="label"
        required
        maxLength={160}
        value={label}
        onChange={(e) => {
          setLabel(e.target.value);
          setLink(null);
        }}
        placeholder={`e.g. ${kind === "THIRD_PARTY" ? "AWS" : kind === "TECHNOLOGY" ? "Core banking" : "..."}`}
        className="w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
        autoFocus
      />

      {suggestions.length > 0 && !link && (
        <div className="rounded-md border border-line bg-surface-0 p-1">
          <p className="px-1 text-[9px] uppercase tracking-wider text-soft">Link to existing</p>
          {suggestions.map((s) => (
            <button
              key={`${s.type}-${s.id}`}
              type="button"
              onClick={() => {
                setLabel(s.name);
                setLink({ type: s.type, id: s.id });
              }}
              className="flex w-full items-center gap-1.5 rounded px-1.5 py-1 text-left text-[11px] hover:bg-surface-2"
            >
              {s.type === "vendor" && <Building2 size={10} className="text-emerald-600" />}
              {s.type === "system" && <Server size={10} className="text-cyan-600" />}
              {s.type === "dept" && <Users size={10} className="text-rose-600" />}
              <span>{s.name}</span>
              <span className="ml-auto text-[9px] text-soft">
                {s.type === "vendor" ? "Vendor" : s.type === "system" ? "Tech system" : "Department"}
              </span>
            </button>
          ))}
        </div>
      )}

      {link && (
        <p className="flex items-center gap-1 text-[10px] text-emerald-700 dark:text-emerald-300">
          <CheckCircle2 size={10} />
          Linked to {link.type === "vendor" ? "vendor" : link.type === "system" ? "tech system" : "department"} —
          tag will deep-link to the entity page
        </p>
      )}

      <div className="flex items-center justify-between gap-2">
        <select
          name="criticality"
          defaultValue="SUPPORTING"
          className="rounded-md border border-line-strong bg-surface-1 px-2 py-1 text-[11px]"
        >
          <option value="CRITICAL">Critical</option>
          <option value="IMPORTANT">Important</option>
          <option value="SUPPORTING">Supporting</option>
        </select>
        <button className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-3 py-1 text-xs font-semibold text-white hover:bg-indigo-500">
          <Plus size={11} />
          Add
        </button>
      </div>
    </form>
  );
}

function SidePanel({
  selectedLabel,
  sharedBy,
  resources,
  onClear,
}: {
  selectedLabel: string | null;
  sharedBy: Record<string, SharedPeer[]>;
  resources: Resource[];
  onClear: () => void;
}) {
  if (!selectedLabel) {
    return (
      <div className="rounded-lg border border-line bg-surface-0 p-4">
        <div className="flex h-full flex-col items-center justify-center text-center">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            Shared-dependency view
          </div>
          <p className="mt-2 text-xs text-muted">
            Click a tag to see which other IBSs share it. Tags marked{" "}
            <span className="rounded-full bg-amber-100 px-1 text-amber-700">+N</span> are shared with
            N other services — your cross-IBS single-points-of-failure.
          </p>
          <p className="mt-2 text-[10px] text-soft">
            Hover any tag to show edit / set-criticality / remove actions.
          </p>
        </div>
      </div>
    );
  }
  const peers = sharedBy[selectedLabel.toLowerCase()] ?? [];
  const mine = resources.filter((r) => r.label.toLowerCase() === selectedLabel.toLowerCase());
  const entity = mine.find((r) => r.vendor || r.techSystem || r.department);
  return (
    <div className="space-y-3 rounded-lg border border-line bg-surface-0 p-4">
      <div>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
          Shared dependency
        </p>
        <p className="mt-0.5 text-sm font-medium text-ink">{selectedLabel}</p>
        {entity && (
          <p className="mt-1 text-[10px] text-soft">
            Linked to{" "}
            {entity.vendor ? (
              <Link href={`/vendors/${entity.vendor.id}`} className="text-indigo-600 underline">
                {entity.vendor.name} (vendor)
              </Link>
            ) : entity.techSystem ? (
              <span>{entity.techSystem.name} (tech system)</span>
            ) : (
              <span>{entity.department?.name} (department)</span>
            )}
          </p>
        )}
      </div>
      {peers.length === 0 ? (
        <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/30 dark:text-emerald-200">
          Only this IBS depends on <span className="font-medium">{selectedLabel}</span>. No shared-dependency risk.
        </div>
      ) : (
        <div className="space-y-2">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-200">
            <span className="font-semibold">{peers.length}</span> other IBS{peers.length === 1 ? "" : "s"} depend on this —
            if it fails, expect cascade impact.
          </div>
          <ul className="space-y-1 text-xs">
            {peers.map((p) => (
              <li key={p.id} className="flex items-center gap-2 rounded-md border border-line bg-surface-1 px-2 py-1.5">
                <span className="font-mono text-[10px] text-soft">{p.code}</span>
                <Link href={`/ibs/${p.id}`} className="truncate text-indigo-600 underline">
                  {p.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
      <button
        type="button"
        onClick={onClear}
        className="text-[11px] text-muted underline hover:text-ink"
      >
        Clear selection
      </button>
    </div>
  );
}

function LiveIndicator({ resource }: { resource: Resource }) {
  // Vendor with a status URL → "external status available" dot (cyan link).
  if (resource.vendor?.statusUrl) {
    return (
      <a
        href={resource.vendor.statusUrl}
        target="_blank"
        rel="noopener noreferrer"
        title={`Vendor status: ${resource.vendor.statusUrl}`}
        className="inline-flex items-center text-cyan-600 hover:text-cyan-700 dark:text-cyan-400"
      >
        <Activity size={9} />
      </a>
    );
  }
  // Tech system with DR test history → green if recent + PASS, amber if older,
  // rose if FAIL.
  if (resource.techSystem) {
    const last = resource.techSystem.lastDrTest;
    if (!last) {
      return <span className="text-rose-500" title="No DR test on record"><Activity size={9} /></span>;
    }
    // eslint-disable-next-line react-hooks/purity
    const ageDays = Math.floor((Date.now() - last.testedAt.getTime()) / (24 * 60 * 60 * 1000));
    const tone =
      last.outcome !== "PASS"
        ? "text-rose-500"
        : ageDays > 365
          ? "text-amber-500"
          : "text-emerald-500";
    return (
      <span
        className={tone}
        title={`DR test ${last.outcome.toLowerCase()} · ${ageDays} day${ageDays === 1 ? "" : "s"} ago`}
      >
        <Activity size={9} />
      </span>
    );
  }
  return null;
}

function SpofLens({ rows, ibsCode }: { rows: { label: string; criticality: Crit; peers: SharedPeer[]; kinds: Kind[] }[]; ibsCode: string }) {
  if (rows.length === 0) {
    return (
      <div className="mt-4 rounded-md border border-dashed border-line bg-surface-0 p-6 text-center text-sm text-muted">
        No shared dependencies detected for {ibsCode}. Either this IBS&apos;s deps are unique, or
        no other IBSs are registered yet.
      </div>
    );
  }
  return (
    <div className="mt-4 space-y-1.5">
      <p className="text-[11px] text-soft">
        Dependencies shared across IBSs, sorted by criticality + blast radius.
      </p>
      <ul className="space-y-1.5">
        {rows.map((r) => (
          <li
            key={r.label}
            className="flex flex-wrap items-center justify-between gap-2 rounded-md border bg-surface-0 p-2.5"
          >
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 text-sm font-medium text-ink">
                <span className={`inline-block h-2 w-2 rounded-full ${CRIT_DOT[r.criticality]}`} />
                {r.label}
                <span className="text-[10px] font-normal text-soft">
                  {r.kinds.map((k) => KIND_META[k].label).join(" / ")}
                </span>
              </p>
              <p className="mt-0.5 text-[10px] text-soft">
                Blast radius: <strong>{r.peers.length + 1}</strong> IBS{r.peers.length === 0 ? "" : "s"} ·{" "}
                {r.peers.map((p) => p.code).join(", ")}
              </p>
            </div>
            <span className={`rounded-full border px-1.5 py-0.5 text-[10px] font-semibold ${CRIT_TONE[r.criticality]}`}>
              {r.criticality}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
