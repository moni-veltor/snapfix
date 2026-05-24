"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Edit3,
  Plus,
  Server,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import {
  deleteTechSystemAction,
  logDRTestAction,
  upsertTechSystemAction,
} from "@/app/actions/tech-recovery";
import {
  FAILOVER_LABEL,
  SYSTEM_KIND_LABEL,
  SYSTEM_TIER_CHIP,
  SYSTEM_TIER_LABEL,
  fmtMin,
  systemHealth,
  type SystemWithTests,
} from "@/lib/tech-recovery";

type Props = {
  systems: SystemWithTests[];
  canManage: boolean;
};

type TierFilter = "ALL" | "CRITICAL" | "ESSENTIAL" | "IMPORTANT" | "ROUTINE";

const TIER_FILTERS: { id: TierFilter; label: string }[] = [
  { id: "ALL", label: "All" },
  { id: "CRITICAL", label: "Critical" },
  { id: "ESSENTIAL", label: "Essential" },
  { id: "IMPORTANT", label: "Important" },
  { id: "ROUTINE", label: "Routine" },
];

export default function SystemList({ systems, canManage }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [logging, setLogging] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [tierFilter, setTierFilter] = useState<TierFilter>("ALL");
  const [query, setQuery] = useState("");

  const tierCounts = systems.reduce(
    (acc, s) => {
      acc[s.tier] = (acc[s.tier] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  const q = query.trim().toLowerCase();
  const filtered = systems.filter((s) => {
    if (tierFilter !== "ALL" && s.tier !== tierFilter) return false;
    if (
      q &&
      !s.name.toLowerCase().includes(q) &&
      !(s.description ?? "").toLowerCase().includes(q) &&
      !(s.owner ?? "").toLowerCase().includes(q)
    )
      return false;
    return true;
  });

  return (
    <section className="space-y-3">
      <header className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-ink">Systems</h2>
      </header>

      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search systems by name, owner or description…"
          className="min-w-[220px] flex-1 rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <div role="tablist" className="flex flex-wrap gap-1">
          {TIER_FILTERS.map((t) => {
            const active = tierFilter === t.id;
            const count = t.id === "ALL" ? systems.length : tierCounts[t.id] ?? 0;
            return (
              <button
                key={t.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setTierFilter(t.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
                    : "bg-surface-1 text-muted hover:bg-surface-2 hover:text-ink"
                }`}
              >
                <span>{t.label}</span>
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

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No systems match this view.
        </div>
      ) : (
        <ul className="space-y-2">
          {filtered.map((s) => (
            <li key={s.id}>
              {editingId === s.id ? (
                <SystemForm system={s} onDone={() => setEditingId(null)} />
              ) : (
                <SystemRow
                  system={s}
                  canManage={canManage}
                  expanded={expandedId === s.id}
                  logging={logging === s.id}
                  onToggle={() => setExpandedId(expandedId === s.id ? null : s.id)}
                  onEdit={() => setEditingId(s.id)}
                  onLogOpen={() => setLogging(s.id)}
                  onLogClose={() => setLogging(null)}
                />
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function SystemRow({
  system,
  canManage,
  expanded,
  logging,
  onToggle,
  onEdit,
  onLogOpen,
  onLogClose,
}: {
  system: SystemWithTests;
  canManage: boolean;
  expanded: boolean;
  logging: boolean;
  onToggle: () => void;
  onEdit: () => void;
  onLogOpen: () => void;
  onLogClose: () => void;
}) {
  const health = systemHealth(system);
  const latest = system.drTests[0];

  return (
    <div className="rounded-lg border border-line bg-surface-1">
      <div className="flex flex-wrap items-start gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md bg-accent-soft text-indigo-600 dark:text-indigo-300">
          <Server size={16} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-2">
            <h3 className="text-sm font-semibold text-ink">{system.name}</h3>
            <span
              className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${SYSTEM_TIER_CHIP[system.tier]}`}
            >
              {SYSTEM_TIER_LABEL[system.tier]}
            </span>
            <span className="text-[10px] uppercase tracking-wider text-soft">
              {SYSTEM_KIND_LABEL[system.kind]}
            </span>
            {system.owner && (
              <span className="text-[11px] text-muted">· owner: {system.owner}</span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span>
              RTO <span className="font-mono text-ink">{fmtMin(system.rtoMin)}</span>
            </span>
            <span>
              RPO <span className="font-mono text-ink">{fmtMin(system.rpoMin)}</span>
            </span>
            <span>
              MTPD <span className="font-mono text-ink">{fmtMin(system.mtpdMin)}</span>
            </span>
            <span>
              Failover{" "}
              <span className="text-ink">{FAILOVER_LABEL[system.failoverKind]}</span>
            </span>
            {latest ? (
              <span>
                Last test{" "}
                <span className="text-ink">
                  {latest.testedAt.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </span>{" "}
                · {latest.outcome}
              </span>
            ) : (
              <span className="text-rose-600 dark:text-rose-300">Never DR-tested</span>
            )}
          </div>
          {health.badges.length > 0 && (
            <div className="mt-1.5 flex flex-wrap gap-1">
              {health.badges.map((b, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-medium uppercase tracking-wider ${
                    b.tone === "critical"
                      ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                      : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  }`}
                >
                  {b.tone === "critical" ? (
                    <ShieldAlert size={9} />
                  ) : (
                    <AlertTriangle size={9} />
                  )}
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onToggle}
            className="rounded-md p-1.5 text-soft hover:bg-surface-2 hover:text-ink"
            aria-label={expanded ? "Collapse" : "Expand"}
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
          </button>
          {canManage && (
            <>
              <button
                type="button"
                onClick={onEdit}
                className="rounded-md p-1.5 text-soft hover:bg-surface-2 hover:text-ink"
                aria-label="Edit"
              >
                <Edit3 size={13} />
              </button>
              <form action={deleteTechSystemAction}>
                <input type="hidden" name="id" value={system.id} />
                <button
                  type="submit"
                  className="rounded-md p-1.5 text-soft hover:bg-rose-100 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
                  aria-label="Delete"
                >
                  <Trash2 size={13} />
                </button>
              </form>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="space-y-3 border-t border-line bg-surface-0 p-3">
          {system.description && (
            <p className="text-xs text-muted">{system.description}</p>
          )}
          <div className="grid grid-cols-2 gap-2 text-[11px] sm:grid-cols-3">
            <Kv label="Primary region" value={system.primaryRegion ?? "—"} />
            <Kv label="Failover region" value={system.failoverRegion ?? "—"} />
            <Kv
              label="Backup frequency"
              value={system.backupFrequency ?? "—"}
            />
            <Kv
              label="Backup retention"
              value={
                system.backupRetentionDays != null
                  ? `${system.backupRetentionDays} days`
                  : "—"
              }
            />
            <Kv
              label="Last backup validated"
              value={
                system.lastBackupValidatedAt
                  ? system.lastBackupValidatedAt.toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })
                  : "—"
              }
            />
            <Kv
              label="DR test outcomes"
              value={
                system.drTests.length === 0
                  ? "—"
                  : system.drTests.map((t) => t.outcome).join(", ")
              }
            />
          </div>

          {system.notes && (
            <div className="rounded-md border border-line bg-surface-1 p-2.5 text-xs">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                Notes
              </div>
              <p className="mt-1 whitespace-pre-wrap text-muted">{system.notes}</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                DR-test ledger
              </p>
              {canManage && !logging && (
                <button
                  type="button"
                  onClick={onLogOpen}
                  className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-0.5 text-[11px] text-ink hover:bg-surface-2"
                >
                  <Plus size={10} />
                  Log a DR test
                </button>
              )}
            </div>
            {logging && (
              <DRTestForm systemId={system.id} onDone={onLogClose} />
            )}
            {system.drTests.length === 0 ? (
              <p className="mt-1 text-[11px] text-muted">No DR tests logged yet.</p>
            ) : (
              <ul className="mt-2 space-y-1">
                {system.drTests.map((t) => (
                  <li
                    key={t.id}
                    className="flex items-center justify-between rounded-md border border-line bg-surface-1 px-2 py-1.5 text-[11px]"
                  >
                    <span className="flex items-center gap-2">
                      <OutcomePill outcome={t.outcome} />
                      <span className="text-ink">
                        {t.testedAt.toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                      {t.rtoActualMin != null && system.rtoMin && (
                        <span
                          className={
                            t.rtoActualMin <= system.rtoMin
                              ? "text-emerald-600 dark:text-emerald-300"
                              : "text-rose-600 dark:text-rose-300"
                          }
                        >
                          actual RTO {fmtMin(t.rtoActualMin)} vs target {fmtMin(system.rtoMin)}
                        </span>
                      )}
                    </span>
                    {t.participants && (
                      <span className="truncate text-soft">{t.participants}</span>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Kv({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-0.5 text-ink">{value}</div>
    </div>
  );
}

function OutcomePill({ outcome }: { outcome: "PASS" | "PARTIAL" | "FAIL" }) {
  const cls =
    outcome === "PASS"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
      : outcome === "PARTIAL"
        ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
        : "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200";
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${cls}`}
    >
      {outcome === "PASS" && <CheckCircle2 size={9} />}
      {outcome === "PARTIAL" && <AlertTriangle size={9} />}
      {outcome === "FAIL" && <ShieldAlert size={9} />}
      {outcome}
    </span>
  );
}

function SystemForm({
  system,
  onDone,
}: {
  system?: SystemWithTests;
  onDone: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await upsertTechSystemAction(fd);
        onDone();
      }}
      className="space-y-4 rounded-lg border-2 border-dashed border-indigo-300 bg-surface-1 p-4 text-sm dark:border-indigo-700"
    >
      {system && <input type="hidden" name="id" value={system.id} />}

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        <input
          name="name"
          required
          defaultValue={system?.name ?? ""}
          placeholder="System name (e.g. Core ledger)" aria-label="System name (e.g. Core ledger)"
          className="rounded border border-line-strong bg-surface-0 px-3 py-2"
        />
        <input
          name="owner"
          defaultValue={system?.owner ?? ""}
          placeholder="Owner team or person" aria-label="Owner team or person"
          className="rounded border border-line-strong bg-surface-0 px-3 py-2"
        />
        <select
          name="kind"
          defaultValue={system?.kind ?? "APPLICATION"}
          className="rounded border border-line-strong bg-surface-0 px-3 py-2"
        >
          {Object.entries(SYSTEM_KIND_LABEL).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <select
          name="tier"
          defaultValue={system?.tier ?? "IMPORTANT"}
          className="rounded border border-line-strong bg-surface-0 px-3 py-2"
        >
          {Object.entries(SYSTEM_TIER_LABEL).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
      </div>

      <textarea
        name="description"
        rows={2}
        defaultValue={system?.description ?? ""}
        placeholder="What this system does" aria-label="What this system does"
        className="w-full rounded border border-line-strong bg-surface-0 px-3 py-2"
      />

      <fieldset className="grid grid-cols-3 gap-2 border-t border-line pt-3 text-xs">
        <legend className="col-span-3 text-[10px] font-semibold uppercase tracking-wider text-muted">
          Objectives (minutes)
        </legend>
        <input
          type="number"
          name="rtoMin"
          min={0}
          defaultValue={system?.rtoMin ?? ""}
          placeholder="RTO" aria-label="RTO"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
        <input
          type="number"
          name="rpoMin"
          min={0}
          defaultValue={system?.rpoMin ?? ""}
          placeholder="RPO" aria-label="RPO"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
        <input
          type="number"
          name="mtpdMin"
          min={0}
          defaultValue={system?.mtpdMin ?? ""}
          placeholder="MTPD" aria-label="MTPD"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-3">
        <legend className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-muted sm:col-span-3">
          Failover
        </legend>
        <select
          name="failoverKind"
          defaultValue={system?.failoverKind ?? "NONE"}
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        >
          {Object.entries(FAILOVER_LABEL).map(([v, label]) => (
            <option key={v} value={v}>
              {label}
            </option>
          ))}
        </select>
        <input
          name="primaryRegion"
          defaultValue={system?.primaryRegion ?? ""}
          placeholder="Primary region" aria-label="Primary region"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
        <input
          name="failoverRegion"
          defaultValue={system?.failoverRegion ?? ""}
          placeholder="Failover region" aria-label="Failover region"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
      </fieldset>

      <fieldset className="grid grid-cols-1 gap-2 border-t border-line pt-3 text-xs sm:grid-cols-3">
        <legend className="col-span-1 text-[10px] font-semibold uppercase tracking-wider text-muted sm:col-span-3">
          Backup posture
        </legend>
        <input
          name="backupFrequency"
          defaultValue={system?.backupFrequency ?? ""}
          placeholder="Frequency (continuous/hourly/daily/…)" aria-label="Frequency (continuous/hourly/daily/…)"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
        <input
          type="number"
          name="backupRetentionDays"
          min={0}
          defaultValue={system?.backupRetentionDays ?? ""}
          placeholder="Retention (days)" aria-label="Retention (days)"
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
        <input
          type="date"
          name="lastBackupValidatedAt"
          defaultValue={
            system?.lastBackupValidatedAt
              ? system.lastBackupValidatedAt.toISOString().slice(0, 10)
              : ""
          }
          className="rounded border border-line-strong bg-surface-0 px-2 py-1.5"
        />
      </fieldset>

      <textarea
        name="notes"
        rows={2}
        defaultValue={system?.notes ?? ""}
        placeholder="Notes — runbook URL, on-call rota, escalation path…" aria-label="Notes — runbook URL, on-call rota, escalation path…"
        className="w-full rounded border border-line-strong bg-surface-0 px-3 py-2 text-xs"
      />

      <div className="flex justify-end gap-2 border-t border-line pt-3">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-xs font-medium text-ink hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {system ? "Save" : "Add system"}
        </button>
      </div>
    </form>
  );
}

function DRTestForm({ systemId, onDone }: { systemId: string; onDone: () => void }) {
  return (
    <form
      action={async (fd) => {
        await logDRTestAction(fd);
        onDone();
      }}
      className="mt-2 space-y-2 rounded-md border border-indigo-300 bg-surface-1 p-3 text-xs dark:border-indigo-700"
    >
      <input type="hidden" name="systemId" value={systemId} />
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <label className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-soft">Tested at</span>
          <input
            type="date"
            name="testedAt"
            defaultValue={new Date().toISOString().slice(0, 10)}
            className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-soft">Outcome</span>
          <select
            name="outcome"
            defaultValue="PASS"
            className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
          >
            <option value="PASS">Pass</option>
            <option value="PARTIAL">Partial</option>
            <option value="FAIL">Fail</option>
          </select>
        </label>
        <label className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-soft">RTO actual (min)</span>
          <input
            type="number"
            name="rtoActualMin"
            min={0}
            className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
          />
        </label>
        <label className="space-y-0.5">
          <span className="text-[10px] uppercase tracking-wider text-soft">RPO actual (min)</span>
          <input
            type="number"
            name="rpoActualMin"
            min={0}
            className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
          />
        </label>
      </div>
      <input
        name="participants"
        placeholder="Who ran the test" aria-label="Who ran the test"
        className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
      />
      <textarea
        name="notes"
        rows={2}
        placeholder="Notes — what worked, what didn't, follow-ups" aria-label="Notes — what worked, what didn't, follow-ups"
        className="w-full rounded border border-line bg-surface-0 px-2 py-1.5"
      />
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onDone}
          className="rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-2 py-1 text-[11px] font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Log DR test
        </button>
      </div>
    </form>
  );
}
