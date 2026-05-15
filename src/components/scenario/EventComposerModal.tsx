"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import EventComposer from "@/components/scenario/EventComposer";

type Props = {
  scenarioId: string;
  nextEventNo: number;
  knownRoles: string[];
  triggerLabel?: string;
  triggerSubdued?: boolean;
};

/**
 * Modal wrapper around EventComposer. Mirrors InjectComposerModal — a
 * sticky CTA opens a wide modal with the rich composer (preview +
 * validator). Closes on success; composer fires a Sonner toast.
 */
export default function EventComposerModal({
  scenarioId,
  nextEventNo,
  knownRoles,
  triggerLabel = "Add event",
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
            <span className="flex h-7 w-7 items-center justify-center rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
              <FileText size={14} />
            </span>
            Compose an event
          </span>
        }
        subtitle="Scheduled beat in the master scenario event list — preview shows what the participant will see."
      >
        <EventComposer
          scenarioId={scenarioId}
          nextEventNo={nextEventNo}
          knownRoles={knownRoles}
          onSuccess={() => setOpen(false)}
          bare
        />
      </Modal>
    </>
  );
}
