"use client";

import { useActionState } from "react";
import { acceptInvitationAction, type AcceptResult } from "@/app/actions/invitations";

type Props =
  | { token: string; mode: "signed-in"; email?: never }
  | { token: string; mode: "new-account"; email: string };

export default function AcceptForm({ token, mode, email }: Props) {
  const [state, action, pending] = useActionState<AcceptResult, FormData>(
    acceptInvitationAction,
    undefined,
  );

  return (
    <form action={action} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
      <input type="hidden" name="token" value={token} />
      {mode === "new-account" && (
        <>
          <Field label="Email" value={email} readOnly disabled />
          <Field label="Your name" name="name" required maxLength={100} />
          <Field label="Choose a password" name="password" type="password" required minLength={8} />
        </>
      )}
      {mode === "signed-in" && (
        <p className="text-sm text-muted">Click below to join the organisation.</p>
      )}
      {state?.error && <p className="text-sm text-rose-700">{state.error}</p>}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Accepting…" : mode === "new-account" ? "Create account and join" : "Accept invitation"}
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
      <span className="text-ink">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400 disabled:bg-slate-50 disabled:text-slate-500"
      />
    </label>
  );
}
