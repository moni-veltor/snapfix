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

      <div className="group relative">
        {/* Soft glow behind the input — slides in on focus */}
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px -z-10 rounded-2xl opacity-0 blur-xl transition group-focus-within:opacity-60"
          style={{
            background:
              "linear-gradient(120deg, rgba(99,102,241,0.6), rgba(34,211,238,0.45))",
          }}
        />
        <label htmlFor="access-code" className="sr-only">
          Access code
        </label>
        <input
          id="access-code"
          name="code"
          type="password"
          required
          autoFocus
          autoComplete="one-time-code"
          placeholder="enter your access code"
          aria-invalid={state?.error ? true : undefined}
          aria-describedby={state?.error ? "access-error" : undefined}
          style={{ fontFamily: "var(--font-mono-primary), ui-monospace, monospace" }}
          className="block w-full rounded-2xl border border-white/[0.08] bg-white/[0.04] px-5 py-4 text-center text-lg tracking-[0.18em] text-white placeholder:text-slate-600 placeholder:tracking-normal placeholder:font-sans focus:border-indigo-300/40 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-400/30"
        />
      </div>

      <button
        type="submit"
        disabled={pending}
        className="group/btn relative inline-flex w-full items-center justify-center gap-2 overflow-hidden rounded-2xl px-5 py-4 text-sm font-semibold text-white shadow-[0_0_40px_-6px_rgba(99,102,241,0.55)] transition disabled:opacity-60"
      >
        {/* Two-stop gradient that shifts on hover */}
        <span
          aria-hidden
          className="absolute inset-0 -z-10 bg-[linear-gradient(110deg,#6366F1_0%,#7C3AED_50%,#06B6D4_100%)] transition-transform duration-500 ease-out group-hover/btn:scale-110"
        />
        <span aria-hidden className="absolute inset-0 -z-10 rounded-2xl ring-1 ring-inset ring-white/15" />
        {pending ? (
          <span className="inline-flex items-center gap-2">
            <Spinner /> Checking…
          </span>
        ) : (
          <>
            Continue
            <ArrowRight size={16} className="transition-transform group-hover/btn:translate-x-0.5" />
          </>
        )}
      </button>

      {state?.error && (
        <p
          id="access-error"
          role="alert"
          className="rounded-xl border border-rose-400/30 bg-rose-500/[0.08] px-4 py-2.5 text-center text-xs text-rose-200"
        >
          {state.error}
        </p>
      )}
    </form>
  );
}

function Spinner() {
  return (
    <svg
      className="h-4 w-4 animate-spin text-white/90"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeOpacity="0.25" strokeWidth="3" />
      <path d="M22 12a10 10 0 0 1-10 10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}
