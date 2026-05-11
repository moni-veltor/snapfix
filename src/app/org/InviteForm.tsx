"use client";

import { useActionState } from "react";
import { inviteMemberAction, type InviteResult } from "@/app/actions/org";

export default function InviteForm() {
  const [state, action, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteMemberAction,
    undefined,
  );
  return (
    <form action={action} className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_auto_auto]">
      <input
        name="email"
        type="email"
        required
        placeholder="teammate@company.com"
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      />
      <select
        name="role"
        defaultValue="MEMBER"
        className="rounded border border-slate-300 px-3 py-2 text-sm"
      >
        <option value="MEMBER">Member</option>
        <option value="ADMIN">Admin</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700 disabled:opacity-50"
      >
        {pending ? "Sending…" : "Send invitation"}
      </button>
      {state && !state.ok && (
        <p className="sm:col-span-3 text-sm text-rose-700">{state.error}</p>
      )}
      {state?.ok && (
        <p className="sm:col-span-3 text-sm text-emerald-700">
          Invitation {state.emailed ? "emailed" : "created — check server logs for the link"} ✓
          {!state.emailed && (
            <>
              {" "}
              <a className="underline" href={state.acceptUrl}>
                Open accept link
              </a>
            </>
          )}
        </p>
      )}
    </form>
  );
}
