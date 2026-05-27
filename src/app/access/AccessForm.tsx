"use client";

import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { submitAccessCodeAction, type AccessState } from "@/app/actions/access";

export default function AccessForm({ from }: { from: string }) {
  const [state, action, pending] = useActionState<AccessState, FormData>(
    submitAccessCodeAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="from" value={from} />
      <label htmlFor="access-code" className="block text-xs font-medium text-slate-300">
        Access code
      </label>
      <input
        id="access-code"
        name="code"
        type="password"
        required
        autoFocus
        autoComplete="one-time-code"
        aria-invalid={state?.error ? true : undefined}
        aria-describedby={state?.error ? "access-error" : undefined}
        className="w-full rounded-md border border-white/10 bg-white/[0.04] px-3 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
      />
      {state?.error && (
        <p
          id="access-error"
          role="alert"
          className="rounded-md border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-200"
        >
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="inline-flex w-full items-center justify-center gap-2 rounded-md bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-[0_0_24px_-4px_rgba(99,102,241,0.55)] hover:bg-indigo-400 disabled:opacity-60"
      >
        {pending ? "Checking…" : (
          <>
            Continue <ArrowRight size={14} />
          </>
        )}
      </button>
    </form>
  );
}
