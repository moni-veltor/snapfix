"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Check, ChevronDown, ExternalLink, Plus } from "lucide-react";

type Org = {
  id: string;
  name: string;
  logoBlobUrl: string | null;
};

type Props = {
  active: Org;
  /** Available orgs the current user can switch to. When the list has
   *  only one entry, the switcher renders as a passive label + "coming
   *  soon" hint for multi-org membership. */
  orgs?: Org[];
};

/**
 * Org switcher dropdown — replaces the static org name in the sidebar
 * header. When only one org is available it gracefully degrades to a
 * non-interactive label + a "join another org" hint, so the surface is
 * already in place when multi-tenant memberships ship.
 */
export default function OrgSwitcher({ active, orgs }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const others = (orgs ?? []).filter((o) => o.id !== active.id);
  const interactive = others.length > 0;

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative w-full">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex w-full items-center gap-2 overflow-hidden rounded-md px-2 py-1.5 text-left hover:bg-surface-2"
      >
        {active.logoBlobUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={active.logoBlobUrl}
            alt={active.name}
            className="h-6 w-6 shrink-0 rounded object-contain"
          />
        ) : (
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-accent-soft text-[10px] font-bold text-indigo-700 dark:text-indigo-200">
            {initials(active.name)}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-xs font-semibold text-ink">
          {active.name}
        </span>
        <ChevronDown
          size={11}
          className={`shrink-0 text-soft transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute left-0 right-0 z-50 mt-1 overflow-hidden rounded-xl border border-line bg-surface-elev shadow-[var(--shadow-card-lg)]"
        >
          <div className="border-b border-line py-1.5">
            <div className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-soft">
              Active
            </div>
            <div className="flex items-center gap-2 px-3 py-1.5 text-xs">
              <Check size={12} className="text-emerald-600 dark:text-emerald-300" />
              <span className="font-semibold text-ink">{active.name}</span>
            </div>
          </div>

          {interactive ? (
            <div className="border-b border-line py-1.5">
              <div className="px-3 pb-1 pt-1 text-[9px] font-semibold uppercase tracking-[0.18em] text-soft">
                Switch to
              </div>
              {others.map((o) => (
                <button
                  key={o.id}
                  type="button"
                  // Wired by L's full implementation; placeholder for now.
                  disabled
                  className="flex w-full items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-accent-soft text-[9px] font-bold text-indigo-700 dark:text-indigo-200">
                    {initials(o.name)}
                  </span>
                  <span>{o.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="border-b border-line bg-accent-soft/30 px-3 py-2 text-[10px] text-muted">
              Multi-org membership is coming soon. You&apos;ll be able to join
              advisor / consultancy orgs from the same account.
            </div>
          )}

          <div className="py-1.5">
            <Link
              href="/sign-up"
              className="flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
            >
              <span className="flex items-center gap-2">
                <Plus size={11} />
                Create another organisation
              </span>
              <ExternalLink size={10} className="text-soft" />
            </Link>
            <Link
              href="/org"
              className="flex items-center gap-2 px-3 py-1.5 text-xs text-ink hover:bg-surface-2"
            >
              <ExternalLink size={11} className="text-soft" />
              Manage current organisation
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

function initials(s: string): string {
  const parts = s.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return (s[0] ?? "?").toUpperCase();
}
