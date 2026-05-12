"use client";

import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    undefined,
  );

  return (
    <form
      action={formAction}
      className="space-y-4 rounded-xl border border-white/[0.08] bg-[color:var(--night-surface)] p-6"
    >
      <Field label="Your name" name="name" required />
      <Field label="Work email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required minLength={8} />
      <Field label="Organisation name" name="organizationName" required placeholder="e.g. Astro Bank" />
      <label className="block text-sm">
        <span className="text-slate-300">Firm tier</span>
        <select
          name="tier"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
        >
          <option value="" className="bg-[color:var(--night-surface)]">
            Not sure / Other
          </option>
          <option value="TIER_1" className="bg-[color:var(--night-surface)]">
            Tier 1 — Global universal / G-SIB (e.g. HSBC)
          </option>
          <option value="TIER_2" className="bg-[color:var(--night-surface)]">
            Tier 2 — Digital challenger (e.g. Starling)
          </option>
          <option value="TIER_3" className="bg-[color:var(--night-surface)]">
            Tier 3 — New bank / EMI / fintech
          </option>
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Drives the recommended scenarios in your library. You can change this later.
        </span>
      </label>
      <p className="text-xs text-slate-500">
        You'll be the owner. Invite teammates after signing in.
      </p>
      {state?.error && <p className="text-sm text-rose-400">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-indigo-500 px-4 py-2 font-medium text-white hover:bg-indigo-400 disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-300">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-white/[0.08] bg-white/[0.03] px-3 py-2 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-400/40"
      />
    </label>
  );
}
