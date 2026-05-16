"use client";

import { Printer } from "lucide-react";

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
    >
      <Printer size={12} />
      Print / save as PDF
    </button>
  );
}
