"use client";

import { useActionState } from "react";
import { subscribeNewsletterAction, type NewsletterState } from "@/app/actions/newsletter";

export default function NewsletterSignup({ source = "footer" }: { source?: string }) {
  const [state, action, pending] = useActionState<NewsletterState, FormData>(
    subscribeNewsletterAction,
    undefined,
  );

  if (state?.ok) {
    return (
      <p
        role="status"
        className="rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-200"
      >
        You're on the list. We'll be in touch.
      </p>
    );
  }

  return (
    <form action={action} className="pt-2">
      <label htmlFor="newsletter-email" className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
        Get monthly briefings on operational resilience
      </label>
      <div className="mt-1 flex gap-2">
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="you@firm.com"
          aria-label="Email address"
          className="flex-1 rounded-md border border-white/10 bg-white/[0.04] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
        />
        <input type="hidden" name="source" value={source} />
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-indigo-500 px-3 py-2 text-sm font-medium text-white hover:bg-indigo-400 disabled:opacity-60"
        >
          {pending ? "…" : "Subscribe"}
        </button>
      </div>
      {state?.error && (
        <p className="mt-2 text-xs text-rose-300" role="alert">
          {state.error}
        </p>
      )}
    </form>
  );
}
