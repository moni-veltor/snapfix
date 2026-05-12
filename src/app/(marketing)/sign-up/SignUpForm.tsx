"use client";

import { useActionState } from "react";
import { signUpAction, type AuthFormState } from "@/app/actions/auth";

export default function SignUpForm() {
  const [state, formAction, pending] = useActionState<AuthFormState, FormData>(
    signUpAction,
    undefined,
  );

  return (
    <form action={formAction} className="space-y-3">
      <Field label="Your name" name="name" required />
      <Field label="Work email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required minLength={8} />
      <Field
        label="Organisation name"
        name="organizationName"
        required
        placeholder="e.g. Astro Bank"
      />
      <label className="block text-sm">
        <span className="text-slate-700">Firm tier</span>
        <select
          name="tier"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
        >
          <option value="">Not sure / Other</option>
          <option value="TIER_1">Tier 1 — Global universal / G-SIB (e.g. HSBC, Barclays)</option>
          <option value="TIER_2">Tier 2 — Digital challenger (e.g. Starling, Monzo)</option>
          <option value="TIER_3">Tier 3 — New bank, neobank, EMI, fintech</option>
        </select>
        <span className="mt-1 block text-xs text-slate-500">
          Determines which scenarios are highlighted in the library. You can change it later.
        </span>
      </label>
      <p className="text-xs text-slate-500">
        You'll be the owner. Invite teammates after signing in.
      </p>
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Creating account…" : "Create account"}
      </button>
    </form>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
