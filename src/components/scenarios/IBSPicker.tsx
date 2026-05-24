"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Plus, Search, Link2, X } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { withToast } from "@/lib/toast-action";
import {
  addIBSAction,
  linkIBSToRegisterAction,
} from "@/app/actions/scenarios";

export type ApprovedIBS = {
  id: string;
  code: string;
  name: string;
  criticality: string;
  impactToleranceMin: number;
};

type Props = {
  mode: "add" | "link";
  scenarioId: string;
  scenarioIBSId?: string;
  availableIBSs: ApprovedIBS[];
};

const addAction = withToast(addIBSAction, {
  success: "IBS attached",
  error: "Could not attach IBS",
});

const linkAction = withToast(linkIBSToRegisterAction, {
  success: "Linked to register",
  description: "The scenario IBS now traces to your approved register.",
  error: "Could not link",
});

export default function IBSPicker({
  mode,
  scenarioId,
  scenarioIBSId,
  availableIBSs,
}: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [pending, startTransition] = useTransition();

  const action = mode === "add" ? addAction : linkAction;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return availableIBSs;
    return availableIBSs.filter(
      (i) =>
        i.code.toLowerCase().includes(q) ||
        i.name.toLowerCase().includes(q),
    );
  }, [availableIBSs, query]);

  if (availableIBSs.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-line bg-surface-1 p-4 text-sm">
        <p className="font-medium text-ink">
          {mode === "add"
            ? "No approved IBSs in your register yet."
            : "No approved IBSs to link to."}
        </p>
        <p className="mt-1 text-xs text-muted">
          Scenarios can only reference IBSs that exist in your approved register —
          this keeps exercises testing the firm&apos;s real services rather than design-time
          placeholders.
        </p>
        <Link
          href="/ibs"
          className="mt-3 inline-flex items-center gap-1.5 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent hover:opacity-90"
        >
          Go to the IBS register →
        </Link>
      </div>
    );
  }

  const close = () => {
    setOpen(false);
    setQuery("");
  };

  const list = (
    <div className="space-y-3">
      <label className="flex items-center gap-2 rounded-md border border-line bg-surface-0 px-3 py-2">
        <Search size={14} className="text-soft" aria-hidden />
        <span className="sr-only">Search IBSs</span>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by code or name…"
          className="flex-1 bg-transparent text-sm text-ink placeholder:text-soft focus:outline-none"
          autoFocus
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="rounded-md p-0.5 text-soft hover:bg-surface-2 hover:text-ink"
            aria-label="Clear search"
          >
            <X size={12} />
          </button>
        )}
      </label>

      <p className="text-[11px] text-muted">
        {filtered.length} of {availableIBSs.length} approved IBS
        {availableIBSs.length === 1 ? "" : "s"} shown
      </p>

      <ul className="max-h-[55vh] space-y-1 overflow-y-auto pr-1">
        {filtered.length === 0 ? (
          <li className="rounded-md border border-dashed border-line px-3 py-6 text-center text-xs text-muted">
            No approved IBSs match &ldquo;{query}&rdquo;.
          </li>
        ) : (
          filtered.map((ibs) => (
            <li key={ibs.id}>
              <form
                action={(fd) => {
                  startTransition(() => action(fd));
                  close();
                }}
                className="group flex items-center justify-between gap-3 rounded-md border border-transparent px-3 py-2 text-left hover:border-line hover:bg-surface-2 focus-within:border-indigo-400/40 focus-within:bg-surface-2"
              >
                <input type="hidden" name="scenarioId" value={scenarioId} />
                {mode === "link" && scenarioIBSId && (
                  <input type="hidden" name="scenarioIBSId" value={scenarioIBSId} />
                )}
                <input type="hidden" name="organizationIBSId" value={ibs.id} />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-baseline gap-2">
                    <span className="font-mono text-[10px] text-soft">{ibs.code}</span>
                    <span className="truncate text-sm font-medium text-ink">{ibs.name}</span>
                  </div>
                  <div className="text-[11px] text-muted">
                    {ibs.criticality} · tolerance {ibs.impactToleranceMin} min
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={pending}
                  className="shrink-0 rounded-md bg-accent px-3 py-1.5 text-xs font-medium text-on-accent opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100 disabled:opacity-50"
                >
                  {mode === "add" ? "Add" : "Link"}
                </button>
              </form>
            </li>
          ))
        )}
      </ul>
    </div>
  );

  // Link mode: per-row inline disclosure (close to the row it's linking).
  if (mode === "link") {
    if (!open) {
      return (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] text-muted hover:border-indigo-300 hover:text-ink"
        >
          <Link2 size={11} />
          Link to register
        </button>
      );
    }
    return (
      <div className="rounded-xl border border-line bg-surface-1 p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Link to a register entry
          </div>
          <button
            type="button"
            onClick={close}
            className="rounded-md p-1 text-soft hover:bg-surface-2 hover:text-ink"
            aria-label="Close picker"
          >
            <X size={12} />
          </button>
        </div>
        {list}
      </div>
    );
  }

  // Add mode: open in a modal.
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md border-2 border-dashed border-indigo-300 bg-surface-1 px-3 py-2 text-xs font-medium text-ink hover:border-indigo-400 hover:bg-surface-2 dark:border-indigo-700"
      >
        <Plus size={12} />
        Add an IBS from the register
      </button>
      <Modal
        open={open}
        onClose={close}
        title="Pick an IBS from the register"
        subtitle={`${availableIBSs.length} approved IBS${availableIBSs.length === 1 ? "" : "s"} available. Scenarios can only reference IBSs that exist in your approved register.`}
        size="lg"
      >
        {list}
      </Modal>
    </>
  );
}
