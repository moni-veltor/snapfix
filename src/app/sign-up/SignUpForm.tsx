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
      <Field label="Name" name="name" required />
      <Field label="Email" name="email" type="email" required />
      <Field label="Password" name="password" type="password" required minLength={8} />
      <label className="block text-sm">
        <span className="text-slate-700">Role</span>
        <select
          name="role"
          required
          className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          defaultValue="PARTICIPANT"
        >
          <option value="PARTICIPANT">Participant</option>
          <option value="FACILITATOR">Facilitator</option>
        </select>
      </label>
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
