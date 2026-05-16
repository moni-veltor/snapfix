"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import IBSForm from "@/components/IBSForm";

type ResourceSuggestion = { value: string; source: "system" | "vendor" | "library" };

type Props = {
  techSuggestions: ResourceSuggestion[];
  vendorSuggestions: ResourceSuggestion[];
  informationSuggestions: ResourceSuggestion[];
  processSuggestions: ResourceSuggestion[];
  variant?: "primary" | "ghost";
  label?: string;
};

/**
 * Top-right "Add IBS" entry point used in the /ibs hero. Opens the
 * tabbed IBSForm inside a modal; on submit the action redirects to
 * /ibs/{id}, which unmounts the modal naturally.
 */
export default function IBSAddButton({
  techSuggestions,
  vendorSuggestions,
  informationSuggestions,
  processSuggestions,
  variant = "primary",
  label = "Add IBS",
}: Props) {
  const [open, setOpen] = useState(false);

  const cls =
    variant === "primary"
      ? "inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      : "inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-xs font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400";

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className={cls}>
        <Plus size={variant === "primary" ? 14 : 12} strokeWidth={2.4} />
        {label}
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Add an Important Business Service"
        subtitle="Methodology, impact tolerance, resource map and importance assessment."
        size="xl"
      >
        <IBSForm
          techSuggestions={techSuggestions}
          vendorSuggestions={vendorSuggestions}
          informationSuggestions={informationSuggestions}
          processSuggestions={processSuggestions}
        />
      </Modal>
    </>
  );
}
