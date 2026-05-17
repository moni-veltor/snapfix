import Link from "next/link";
import { CalendarPlus } from "lucide-react";

/**
 * Top-right entry point on the /exercises hero. Links to the full-page
 * 5-step Plan-an-Exercise wizard at /exercises/new. (Previously opened a
 * 3-step modal; replaced when the wizard shipped.)
 */
export default function ExerciseAddButton() {
  return (
    <Link
      href="/exercises/new"
      className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
    >
      <CalendarPlus size={14} strokeWidth={2.4} />
      Plan exercise
    </Link>
  );
}
