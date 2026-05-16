"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { UserPlus } from "lucide-react";
import Modal from "@/components/ui/Modal";
import { inviteMemberAction, type InviteResult } from "@/app/actions/org";

/**
 * Top-right "Invite teammate" entry point used in the /org hero.
 * Opens a focused modal with the invite form. Auto-opens when
 * `?invite=1` is in the URL so deep-links from the Compose menu land
 * directly on it.
 */
export default function OrgInviteButton() {
  const [open, setOpen] = useState(false);
  const searchParams = useSearchParams();

  useEffect(() => {
    // External-state bridge — one-shot URL→state sync.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (searchParams.get("invite") === "1") setOpen(true);
  }, [searchParams]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        <UserPlus size={14} strokeWidth={2.4} />
        Invite teammate
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Invite a teammate"
        subtitle="They'll receive an email with a link to accept and join your organisation."
        size="md"
      >
        <InviteFormBody onSuccess={() => setOpen(false)} />
      </Modal>
    </>
  );
}

function InviteFormBody({ onSuccess }: { onSuccess: () => void }) {
  const [state, action, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteMemberAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok && state.emailed) {
      // Close the modal a beat after success so the success line is visible.
      const t = setTimeout(onSuccess, 1200);
      return () => clearTimeout(t);
    }
  }, [state, onSuccess]);

  return (
    <form action={action} className="space-y-3 text-sm">
      <label className="block text-xs">
        <span className="text-soft">Email *</span>
        <input
          name="email"
          type="email"
          required
          placeholder="teammate@company.com"
          autoFocus
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        />
      </label>
      <label className="block text-xs">
        <span className="text-soft">Role *</span>
        <select
          name="role"
          defaultValue="MEMBER"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
        >
          <option value="MEMBER">Member — read-only on most surfaces</option>
          <option value="ADMIN">
            Admin — can manage registers, scenarios, exercises, members
          </option>
        </select>
        <span className="mt-1 block text-[10px] text-soft">
          You can change roles later. Only OWNERs can create OWNERs.
        </span>
      </label>

      {state && !state.ok && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          Invitation {state.emailed ? "emailed" : "created — check server logs for the link"} ✓
          {!state.emailed && state.acceptUrl && (
            <>
              {" "}
              <a className="underline" href={state.acceptUrl}>
                Open accept link
              </a>
            </>
          )}
        </p>
      )}

      <footer className="flex items-center justify-end gap-2 border-t border-line pt-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {pending ? "Sending…" : "Send invitation"}
        </button>
      </footer>
    </form>
  );
}
