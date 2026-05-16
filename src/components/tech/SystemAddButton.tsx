"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import SystemAddWizard from "@/components/tech/SystemAddWizard";

/**
 * Top-right "Add system" entry point used in the /tech-recovery hero.
 * Opens the 4-step SystemAddWizard inside a modal; the wizard closes
 * itself on submit via the onDone callback.
 */
export default function SystemAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <Plus size={14} strokeWidth={2.4} />
        Add system
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a system"
        subtitle="Four-step wizard — basics, objectives, failover, backups."
        size="lg"
      >
        <SystemAddWizard onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
