"use client";

import { useMemo } from "react";
import {
  AlertTriangle,
  ChevronRight,
  Crown,
  ShieldAlert,
  ShieldCheck,
  User,
} from "lucide-react";

export type ChainRoleRow = {
  id: string;
  abbreviation: string;
  title: string;
  isSMF: boolean;
  isExecutive: boolean;
  deputyOfRoleId: string | null;
  defaultHolderName: string | null;
  defaultHolderEmail: string | null;
};

type Chain = {
  /** The seat at the top of the chain (the one being deputised for). */
  apex: ChainRoleRow;
  /** Apex first, then deputy of apex, then deputy of deputy, ... */
  chain: ChainRoleRow[];
};

/**
 * Visualises the deputy graph in the org. Each "apex" — a seat that is
 * deputised for by another seat OR is itself an SMF/executive with no
 * deputy — gets a card showing the full chain (or a SPOF warning).
 *
 * The page that hosts this is `/org/roles` (the Deputy chains tab) so
 * an OWNER/ADMIN can see at a glance which SMF accountabilities sit on
 * a single shoulder.
 */
export default function DeputyChainsView({
  roles,
}: {
  roles: ChainRoleRow[];
}) {
  const chains = useMemo(() => buildChains(roles), [roles]);

  if (roles.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
        Build your role catalogue first — chains appear once seats exist.
      </div>
    );
  }

  const spofChains = chains.filter((c) => c.chain.length === 1 && needsDeputy(c.apex));
  const goodChains = chains.filter((c) => c.chain.length >= 2);
  const otherChains = chains.filter(
    (c) => c.chain.length === 1 && !needsDeputy(c.apex),
  );

  return (
    <div className="space-y-5">
      <header className="grid gap-3 sm:grid-cols-3">
        <Stat
          label="Chains with deputy"
          value={goodChains.length}
          tone="ok"
        />
        <Stat
          label="SMF/exec without deputy"
          value={spofChains.length}
          tone={spofChains.length > 0 ? "critical" : "ok"}
        />
        <Stat
          label="Longest chain"
          value={Math.max(0, ...chains.map((c) => c.chain.length))}
          tone="neutral"
        />
      </header>

      {spofChains.length > 0 && (
        <Section
          title="Single-point-of-failure chains"
          subtitle="SMF or executive seats with no named deputy — high-priority fix."
          tone="critical"
        >
          <ul className="grid gap-3 lg:grid-cols-2">
            {spofChains.map((c) => (
              <li key={c.apex.id}>
                <ChainCard chain={c} tone="critical" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {goodChains.length > 0 && (
        <Section
          title="Deputy chains"
          subtitle="Apex seat → deputy → deputy-of-deputy. Healthy depth shown left to right."
          tone="ok"
        >
          <ul className="grid gap-3 lg:grid-cols-2">
            {goodChains.map((c) => (
              <li key={c.apex.id}>
                <ChainCard chain={c} tone="ok" />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {otherChains.length > 0 && (
        <Section
          title="Standalone seats"
          subtitle="Non-SMF / non-executive seats with no deputy. Lower priority but worth covering."
          tone="info"
        >
          <ul className="grid gap-3 lg:grid-cols-3">
            {otherChains.map((c) => (
              <li key={c.apex.id}>
                <ChainCard chain={c} tone="info" />
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

// ─── Chain construction ──────────────────────────────────────────────────

function buildChains(roles: ChainRoleRow[]): Chain[] {
  const byId = new Map(roles.map((r) => [r.id, r]));
  // Apex roles = those that are NOT a deputy of anyone else. Each apex
  // gets a chain walking down through its deputies. Recursive children
  // are tracked so we don't infinite-loop on a cycle.
  const apexes = roles.filter((r) => r.deputyOfRoleId === null);
  const chains: Chain[] = [];
  for (const apex of apexes) {
    const chain: ChainRoleRow[] = [apex];
    const seen = new Set<string>([apex.id]);
    // Find roles where deputyOfRoleId === current. Walk one branch deep;
    // if multiple deputies exist for a seat, we pick the first by id for
    // visual clarity (the editor still shows them all).
    let cursor: ChainRoleRow | undefined = apex;
    while (cursor) {
      const next = roles.find(
        (r) => r.deputyOfRoleId === cursor!.id && !seen.has(r.id),
      );
      if (!next) break;
      seen.add(next.id);
      chain.push(next);
      cursor = next;
    }
    chains.push({ apex, chain });
  }
  // Sort: SMF/exec apexes first, then by abbreviation.
  return chains.sort((a, b) => {
    const pa = priority(a.apex);
    const pb = priority(b.apex);
    if (pa !== pb) return pa - pb;
    return a.apex.abbreviation.localeCompare(b.apex.abbreviation);
  });
  function priority(r: ChainRoleRow): number {
    if (r.isSMF) return 0;
    if (r.isExecutive) return 1;
    return 2;
  }
  void byId;
}

function needsDeputy(r: ChainRoleRow): boolean {
  return r.isSMF || r.isExecutive;
}

// ─── Subcomponents ───────────────────────────────────────────────────────

function Section({
  title,
  subtitle,
  tone,
  children,
}: {
  title: string;
  subtitle: string;
  tone: "ok" | "warn" | "critical" | "info";
  children: React.ReactNode;
}) {
  const dot =
    tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "critical"
          ? "bg-rose-500"
          : "bg-indigo-500";
  return (
    <section className="space-y-3">
      <header className="flex items-baseline gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <h2 className="text-sm font-semibold text-ink">{title}</h2>
        <p className="text-[11px] text-soft">{subtitle}</p>
      </header>
      {children}
    </section>
  );
}

function ChainCard({
  chain: { apex, chain },
  tone,
}: {
  chain: Chain;
  tone: "ok" | "critical" | "info";
}) {
  const ring =
    tone === "critical"
      ? "border-rose-300 dark:border-rose-700/60"
      : tone === "ok"
        ? "border-emerald-300 dark:border-emerald-700/60"
        : "border-line";
  const bar =
    tone === "critical"
      ? "from-rose-500 to-rose-400"
      : tone === "ok"
        ? "from-emerald-500 to-emerald-400"
        : "from-indigo-500 to-indigo-400";

  return (
    <article
      className={`flex h-full flex-col overflow-hidden rounded-xl border bg-surface-1 transition-all hover:shadow-[var(--shadow-card)] ${ring}`}
    >
      <div className={`h-1 bg-gradient-to-r ${bar}`} />
      <div className="flex flex-1 flex-col gap-3 p-4">
        <header className="flex items-center gap-2">
          {apex.isSMF ? (
            <Crown size={12} className="text-amber-600 dark:text-amber-300" />
          ) : apex.isExecutive ? (
            <ShieldCheck size={12} className="text-indigo-600 dark:text-indigo-300" />
          ) : (
            <User size={12} className="text-soft" />
          )}
          <span className="font-mono text-[11px] text-soft">{apex.abbreviation}</span>
          <h3 className="truncate text-sm font-semibold text-ink">{apex.title}</h3>
        </header>

        <ol className="space-y-1.5">
          {chain.map((r, i) => (
            <li key={r.id} className="flex items-center gap-2">
              {i > 0 && (
                <ChevronRight size={11} className="flex-none text-soft" />
              )}
              <span className="flex items-center gap-1.5 text-[12px]">
                <span className="font-mono text-[10px] text-soft">{r.abbreviation}</span>
                <span className="text-ink">
                  {r.defaultHolderName ?? r.defaultHolderEmail ?? (
                    <span className="italic text-soft">unassigned</span>
                  )}
                </span>
              </span>
            </li>
          ))}
        </ol>

        {tone === "critical" && (
          <div className="mt-auto flex items-center gap-1.5 rounded-md bg-rose-50 px-2 py-1 text-[10px] text-rose-800 dark:bg-rose-950/30 dark:text-rose-200">
            <AlertTriangle size={10} />
            No deputy — single shoulder for this accountability.
          </div>
        )}
        {tone === "ok" && (
          <div className="mt-auto text-[10px] text-soft">
            Chain depth {chain.length - 1}{" "}
            {chain.length - 1 === 1 ? "deputy" : "deputies"} deep.
          </div>
        )}
        {tone === "info" && needsDeputy(apex) && (
          <div className="mt-auto flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[10px] text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <ShieldAlert size={10} />
            Worth naming a deputy.
          </div>
        )}
      </div>
    </article>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "ok" | "warn" | "critical" | "neutral";
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="text-[10px] font-semibold uppercase tracking-wider text-soft">
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
