"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  AlertCircle,
  Building,
  CheckCircle2,
  Crown,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Printer,
  Search,
  ShieldAlert,
  ShieldCheck,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";

export type MatrixSeat = {
  id: string;
  abbreviation: string;
  title: string;
  isSMF: boolean;
  isExecutive: boolean;
  isDeputy: boolean;
};

export type MatrixIBS = {
  id: string;
  code: string;
  name: string;
};

export type MatrixDepartment = {
  id: string;
  name: string;
  abbreviation: string | null;
};

export type MatrixMember = {
  id: string;
  name: string | null;
  email: string;
  orgRole: "OWNER" | "ADMIN" | "MEMBER" | string | null;
  jobTitle: string | null;
  location: string | null;
  phone: string | null;
  outOfHoursPhone: string | null;
  altEmail: string | null;
  department: MatrixDepartment | null;
  seats: MatrixSeat[];
  ownedIBSCount: number;
  ownedIBSSample: MatrixIBS[];
  openActionItemsCount: number;
};

type Filter = "all" | "smf" | "exec" | "missing" | "deputy-gap";

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "smf", label: "SMF seat" },
  { id: "exec", label: "Executive" },
  { id: "missing", label: "Missing data" },
  { id: "deputy-gap", label: "Deputy gap" },
];

const ROLE_TONE: Record<string, string> = {
  OWNER: "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200",
  ADMIN: "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-200",
  MEMBER: "bg-surface-2 text-muted",
};

function initials(s: string): string {
  const parts = s.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (s[0] ?? "?").toUpperCase();
}

function missingData(m: MatrixMember): string[] {
  const out: string[] = [];
  if (!m.jobTitle) out.push("job title");
  if (!m.phone) out.push("phone");
  if (!m.outOfHoursPhone) out.push("OOH phone");
  return out;
}

function hasDeputyGap(m: MatrixMember): boolean {
  // A person has a "deputy gap" when they hold an SMF seat and that seat
  // has no deputy chain (no other seat declares this one as deputyOf).
  // The matrix doesn't carry the full graph; we approximate by flagging
  // anyone holding an SMF or executive seat where the seat list shows
  // none of the others is a deputy of that seat. The server passes a
  // pre-computed flag is simpler — for V1 we flag any SMF holder with
  // 1 seat as a heuristic ("solo SMF") and let the user drill to fix.
  return m.seats.some((s) => s.isSMF) && m.seats.length === 1;
}

/**
 * Two-pane matrix view of the org: people grouped by department, with
 * a person-detail drawer on click. Filter strip + search + print
 * directory replace the flat members list and bridge the previously
 * disconnected /org · /org/roles · /org/departments pages.
 */
export default function OrgMatrix({
  members,
  canManage,
}: {
  members: MatrixMember[];
  canManage: boolean;
}) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [openId, setOpenId] = useState<string | null>(null);

  const q = query.trim().toLowerCase();
  const visible = useMemo(() => {
    return members.filter((m) => {
      if (
        q &&
        !(m.name ?? m.email).toLowerCase().includes(q) &&
        !m.email.toLowerCase().includes(q) &&
        !(m.jobTitle ?? "").toLowerCase().includes(q) &&
        !(m.department?.name ?? "").toLowerCase().includes(q)
      )
        return false;
      if (filter === "smf" && !m.seats.some((s) => s.isSMF)) return false;
      if (filter === "exec" && !m.seats.some((s) => s.isExecutive)) return false;
      if (filter === "missing" && missingData(m).length === 0) return false;
      if (filter === "deputy-gap" && !hasDeputyGap(m)) return false;
      return true;
    });
  }, [members, q, filter]);

  // Group visible members by department.
  const grouped = useMemo(() => {
    const groups = new Map<string, { dept: MatrixDepartment | null; rows: MatrixMember[] }>();
    for (const m of visible) {
      const key = m.department?.id ?? "__unassigned__";
      const g = groups.get(key) ?? {
        dept: m.department,
        rows: [],
      };
      g.rows.push(m);
      groups.set(key, g);
    }
    return [...groups.values()].sort((a, b) => {
      if (!a.dept) return 1;
      if (!b.dept) return -1;
      return a.dept.name.localeCompare(b.dept.name);
    });
  }, [visible]);

  const counts = {
    smf: members.filter((m) => m.seats.some((s) => s.isSMF)).length,
    exec: members.filter((m) => m.seats.some((s) => s.isExecutive)).length,
    missing: members.filter((m) => missingData(m).length > 0).length,
    deputyGap: members.filter(hasDeputyGap).length,
  };

  const selected = openId ? members.find((m) => m.id === openId) ?? null : null;

  return (
    <section className="space-y-4 print:space-y-2">
      {/* Filter strip — hidden in print view */}
      <div className="flex flex-wrap items-center gap-2 print:hidden">
        <div className="relative min-w-[220px] flex-1">
          <Search
            size={12}
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-soft"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, email, job title or department…"
            className="w-full rounded-md border border-line bg-surface-0 py-1.5 pl-8 pr-3 text-sm text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div role="tablist" className="flex flex-wrap gap-1">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            const count =
              f.id === "all"
                ? members.length
                : f.id === "smf"
                  ? counts.smf
                  : f.id === "exec"
                    ? counts.exec
                    : f.id === "missing"
                      ? counts.missing
                      : counts.deputyGap;
            return (
              <button
                key={f.id}
                role="tab"
                type="button"
                aria-selected={active}
                onClick={() => setFilter(f.id)}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all ${
                  active
                    ? "bg-slate-900 text-white dark:bg-indigo-500"
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
        <button
          type="button"
          onClick={() => window.print()}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          title="Print a responder directory for incident hand-out"
        >
          <Printer size={11} />
          Print directory
        </button>
      </div>

      {grouped.length === 0 && (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
          No members match this view.
        </div>
      )}

      {/* Department-grouped matrix */}
      <div className="space-y-4">
        {grouped.map((g, idx) => (
          <section key={g.dept?.id ?? `unassigned-${idx}`}>
            <header className="mb-2 flex items-center gap-2">
              <Building size={11} className="text-soft" />
              <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-soft">
                {g.dept?.name ?? "No department"}
              </h3>
              <span className="text-[10px] text-soft">
                {g.rows.length} {g.rows.length === 1 ? "person" : "people"}
              </span>
            </header>
            <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3 print:grid-cols-2">
              {g.rows.map((m) => (
                <li key={m.id}>
                  <PersonCard
                    person={m}
                    onClick={() => setOpenId(m.id)}
                  />
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      {/* Detail drawer — read-only summary + deep-links to edit */}
      <Drawer
        open={!!selected}
        onClose={() => setOpenId(null)}
        title={selected?.name ?? selected?.email ?? ""}
        subtitle={selected?.jobTitle ?? selected?.email ?? ""}
        width="md"
      >
        {selected && <PersonDetail person={selected} canManage={canManage} />}
      </Drawer>
    </section>
  );
}

function PersonCard({
  person,
  onClick,
}: {
  person: MatrixMember;
  onClick: () => void;
}) {
  const roleTone = ROLE_TONE[person.orgRole ?? "MEMBER"] ?? ROLE_TONE.MEMBER;
  const missing = missingData(person);
  const deputyGap = hasDeputyGap(person);
  return (
    <button
      type="button"
      onClick={onClick}
      className="group block w-full rounded-md border border-line bg-surface-1 p-3 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card)] focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 print:break-inside-avoid"
    >
      <header className="flex items-start gap-2">
        <div className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-indigo-100 text-xs font-semibold text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300">
          {initials(person.name ?? person.email)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">
            {person.name ?? person.email}
          </p>
          <p className="truncate text-[11px] text-soft">
            {person.jobTitle ?? person.email}
          </p>
        </div>
        <span
          className={`flex-none rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${roleTone}`}
        >
          {person.orgRole ?? "MEMBER"}
        </span>
      </header>

      {(person.seats.length > 0 || person.ownedIBSCount > 0) && (
        <div className="mt-2 flex flex-wrap gap-1 text-[10px]">
          {person.seats.slice(0, 4).map((s) => (
            <span
              key={s.id}
              className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${
                s.isSMF
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                  : s.isExecutive
                    ? "bg-indigo-100 text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200"
                    : "bg-surface-2 text-muted"
              }`}
              title={s.title}
            >
              {s.isSMF && <Crown size={9} />}
              {s.abbreviation}
            </span>
          ))}
          {person.seats.length > 4 && (
            <span className="rounded-full bg-surface-2 px-1.5 py-0.5 text-soft">
              +{person.seats.length - 4}
            </span>
          )}
          {person.ownedIBSCount > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 px-1.5 py-0.5 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200">
              <ShieldCheck size={9} />
              {person.ownedIBSCount} IBS
            </span>
          )}
        </div>
      )}

      <footer className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-soft">
        {missing.length > 0 && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-1.5 py-0.5 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
            title={`Missing: ${missing.join(", ")}`}
          >
            <AlertCircle size={9} />
            {missing.length} missing
          </span>
        )}
        {deputyGap && (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-1.5 py-0.5 text-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
            title="Holds an SMF seat with no deputy chain"
          >
            <ShieldAlert size={9} />
            Deputy gap
          </span>
        )}
        {missing.length === 0 && !deputyGap && person.phone && person.outOfHoursPhone && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-1.5 py-0.5 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-200">
            <CheckCircle2 size={9} />
            Exercise-ready
          </span>
        )}
      </footer>
    </button>
  );
}

function PersonDetail({
  person,
  canManage,
}: {
  person: MatrixMember;
  canManage: boolean;
}) {
  const missing = missingData(person);
  return (
    <div className="space-y-5 p-5">
      <section className="rounded-md border border-line bg-surface-0 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
          Contact
        </h3>
        <ul className="mt-2 space-y-1.5 text-sm">
          <li className="flex items-center gap-2 text-ink">
            <Mail size={11} className="text-soft" />
            <span className="truncate">{person.email}</span>
          </li>
          {person.altEmail && (
            <li className="flex items-center gap-2 text-muted">
              <Mail size={11} className="text-soft" />
              <span className="truncate">{person.altEmail} (alt)</span>
            </li>
          )}
          <li className="flex items-center gap-2">
            <Phone size={11} className="text-soft" />
            {person.phone ? (
              <span className="text-ink">{person.phone}</span>
            ) : (
              <span className="text-rose-700 dark:text-rose-300">No phone on file</span>
            )}
          </li>
          <li className="flex items-center gap-2">
            <PhoneCall size={11} className="text-soft" />
            {person.outOfHoursPhone ? (
              <span className="text-ink">{person.outOfHoursPhone} (OOH)</span>
            ) : (
              <span className="text-rose-700 dark:text-rose-300">No out-of-hours phone</span>
            )}
          </li>
          {person.location && (
            <li className="flex items-center gap-2 text-muted">
              <MapPin size={11} className="text-soft" />
              <span>{person.location}</span>
            </li>
          )}
        </ul>
      </section>

      <section className="rounded-md border border-line bg-surface-0 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
          IMT seats
        </h3>
        {person.seats.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No default seat assigned.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {person.seats.map((s) => (
              <li key={s.id} className="flex items-center gap-2">
                {s.isSMF && (
                  <Crown size={11} className="text-amber-600 dark:text-amber-300" />
                )}
                <span className="font-mono text-[11px] text-soft">{s.abbreviation}</span>
                <span className="text-ink">{s.title}</span>
                {s.isExecutive && (
                  <span className="ml-auto text-[10px] uppercase tracking-wider text-soft">
                    Executive
                  </span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-line bg-surface-0 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
          IBSs owned ({person.ownedIBSCount})
        </h3>
        {person.ownedIBSSample.length === 0 ? (
          <p className="mt-2 text-xs text-muted">No IBS process-ownership.</p>
        ) : (
          <ul className="mt-2 space-y-1 text-sm">
            {person.ownedIBSSample.map((i) => (
              <li key={i.id}>
                <Link
                  href={`/ibs/${i.id}`}
                  className="flex items-center gap-2 text-ink hover:underline"
                >
                  <span className="font-mono text-[11px] text-soft">{i.code}</span>
                  <span className="truncate">{i.name}</span>
                </Link>
              </li>
            ))}
            {person.ownedIBSCount > person.ownedIBSSample.length && (
              <li className="text-[11px] text-soft">
                +{person.ownedIBSCount - person.ownedIBSSample.length} more
              </li>
            )}
          </ul>
        )}
      </section>

      <section className="rounded-md border border-line bg-surface-0 p-4">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
          Readiness
        </h3>
        <div className="mt-2 flex flex-wrap gap-1.5 text-[10px]">
          <Chip
            label="phone"
            ok={!!person.phone}
          />
          <Chip
            label="OOH phone"
            ok={!!person.outOfHoursPhone}
          />
          <Chip
            label="job title"
            ok={!!person.jobTitle}
          />
          <Chip
            label="location"
            ok={!!person.location}
          />
        </div>
        {missing.length > 0 && (
          <p className="mt-2 text-[11px] text-rose-700 dark:text-rose-300">
            Missing: {missing.join(", ")}
          </p>
        )}
        {person.openActionItemsCount > 0 && (
          <p className="mt-2 text-[11px] text-muted">
            <span className="font-semibold text-ink">
              {person.openActionItemsCount}
            </span>{" "}
            open action item{person.openActionItemsCount === 1 ? "" : "s"} assigned.
          </p>
        )}
      </section>

      <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <Link
          href={`/org/${person.id}`}
          className="inline-flex items-center gap-1 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <ExternalLink size={11} />
          {canManage ? "Open profile to edit" : "Open full profile"}
        </Link>
      </footer>
    </div>
  );
}

function Chip({ label, ok }: { label: string; ok: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 ${
        ok
          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
          : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-200"
      }`}
    >
      {ok ? <CheckCircle2 size={9} /> : <AlertCircle size={9} />}
      <span>{label}</span>
    </span>
  );
}

