"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import ExerciseAddWizard from "@/components/exercises/ExerciseAddWizard";

type Scenario = { id: string; title: string; dDayDate: string };

type Props = {
  scenarios: Scenario[];
};

/**
 * Top-right "Plan exercise" entry point used in the /exercises hero.
 * Auto-opens when `?new=1` is present so deep-links from the global
 * Compose menu land directly on the modal.
 */
export default function ExerciseAddButton({ scenarios }: Props) {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // External-state bridge — see comment in ScenarioAddButton.
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
        <CalendarPlus size={14} strokeWidth={2.4} />
        Plan exercise
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Plan a new exercise"
        subtitle="Three-step wizard — scenario, schedule, details."
        size="lg"
      >
        <ExerciseAddWizard scenarios={scenarios} onDone={() => setOpen(false)} />
      </Modal>
    </>
  );
}
