"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ScenarioAddWizard from "@/components/scenarios/ScenarioAddWizard";

/**
 * Top-right "New scenario" entry point used in the /scenarios hero.
 * Auto-opens when `?new=1` is present so deep-links from the global
 * Compose menu land directly on the modal.
 */
export default function ScenarioAddButton() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // One-shot URL → local-state sync on mount and on URL change. The
    // setState lint rule is conservative here: this is an external-state
    // bridge, not a derived-state cascade.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (searchParams.get("new") === "1") setOpen(true);
  }, [searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <Plus size={14} strokeWidth={2.4} />
        New scenario
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Create a new scenario"
        subtitle="Three-step wizard — identity, CMORG framing, risk coverage."
        size="lg"
      >
        <ScenarioAddWizard onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
