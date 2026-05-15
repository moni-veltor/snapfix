"use client";

import { useState } from "react";
import { Plus, Zap } from "lucide-react";
import Modal from "@/components/ui/Modal";
import InjectComposer from "@/components/scenario/InjectComposer";

type Props = {
  scenarioId: string;
  nextInjectNo: number;
  knownRoles: string[];
  /** Button label / variant overrides for placement-specific use. */
  triggerLabel?: string;
  triggerSubdued?: boolean;
};

/**
 * Modal wrapper around InjectComposer. Provides a sticky "Add inject" CTA
 * that opens the rich composer (template picker + preview + validator) in
 * a wide modal. Closes on success; the composer fires a Sonner toast.
 */
export default function InjectComposerModal({
  scenarioId,
  nextInjectNo,
  knownRoles,
  triggerLabel = "Add inject",
  triggerSubdued = false,
}: Props) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={
          triggerSubdued
            ? "inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong hover:bg-surface-2"
            : "inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
        }
      >
        <Plus size={12} />
        {triggerLabel}
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="xl"
        title={
          <span className="flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200">
              <Zap size={14} />
            </span>
            Compose an inject
          </span>
        }
        subtitle="Start from a template or compose your own — preview shows what the participant will see."
      >
        <InjectComposer
          scenarioId={scenarioId}
          nextInjectNo={nextInjectNo}
          knownRoles={knownRoles}
          onSuccess={() => setOpen(false)}
          bare
        />
      </Modal>
    </>
  );
}
