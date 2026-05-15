"use client";

import { useEffect } from "react";
import { ArrowLeft, RefreshCw } from "lucide-react";
import Hoot from "@/components/fun/Hoot";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log to whatever telemetry sink we're using; for now console.
    console.error("[snapfix:error]", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-md py-16 text-center">
      <div className="mx-auto mb-4 flex justify-center">
        <Hoot mood="alert" size={96} />
      </div>
      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        Something went sideways
      </h1>
      <p className="mt-2 text-sm text-muted">
        Sorry — that part of SnapFix hit an unexpected error. The team has
        been notified.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-[10px] text-soft">
          Reference: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={reset}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <RefreshCw size={14} />
          Try again
        </button>
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3.5 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          <ArrowLeft size={14} />
          Go back
        </button>
      </div>
    </div>
  );
}
