"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import VendorAddWizard from "@/components/vendors/VendorAddWizard";

/**
 * Top-right "Add vendor" entry point used in the /vendors hero. Opens
 * the 5-step VendorAddWizard inside a modal; the wizard closes itself
 * on submit via the onDone callback.
 */
export default function VendorAddButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <Plus size={14} strokeWidth={2.4} />
        Add vendor
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add a vendor"
        subtitle="Five-step wizard — basics, DORA, contract, assurance, exit plan."
        size="lg"
      >
        <VendorAddWizard onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
