"use client";

import { useActionState, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Sparkles, UserPlus } from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import type { FirmTier } from "@/generated/prisma/enums";
import { inviteMemberAction, type InviteResult } from "@/app/actions/org";

/**
 * "Add teammate" entry point used in the /org hero. Replaces the old
 * minimal modal — opens a drawer with the full onboard form so the
 * admin can capture role, job title, phone and 24/7 OOH phone up-front.
 * Those fields are stored on the Invitation row and copied to the new
 * User on accept (no manual fill-in by the invitee).
 *
 * Tier-aware: TIER_1 + TIER_2 firms mark job title + OOH phone as
 * required (their regulator footprint expects it); TIER_3 leaves both
 * optional. Auto-opens when `?invite=1` is in the URL.
 */
export default function OrgOnboardDrawer({
  tier,
}: {
  tier: FirmTier | null;
}) {
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
        Add teammate
      </button>
      <Drawer
        open={open}
        onClose={() => setOpen(false)}
        title="Onboard a teammate"
        subtitle="One form — sends the invite and pre-fills their profile on accept."
        width="md"
      >
        <OnboardFormBody tier={tier} onSuccess={() => setOpen(false)} />
      </Drawer>
    </>
  );
}

function OnboardFormBody({
  tier,
  onSuccess,
}: {
  tier: FirmTier | null;
  onSuccess: () => void;
}) {
  const [state, action, pending] = useActionState<InviteResult | undefined, FormData>(
    inviteMemberAction,
    undefined,
  );

  useEffect(() => {
    if (state?.ok && state.emailed) {
      const t = setTimeout(onSuccess, 1200);
      return () => clearTimeout(t);
    }
  }, [state, onSuccess]);

  const stricter = tier === "TIER_1" || tier === "TIER_2";

  return (
    <form action={action} className="space-y-5 p-5 text-sm">
      <section className="space-y-3">
        <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
          Identity + access
        </h3>
        <label className="block text-xs">
          <span className="text-soft">Email *</span>
          <input
            name="email"
            type="email"
            required
            autoFocus
            placeholder="teammate@company.com" aria-label="teammate@company.com"
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
      </section>

      <section className="space-y-3">
        <header>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-soft">
            Contact pre-fill
          </h3>
          <p className="mt-0.5 text-[11px] text-muted">
            {stricter
              ? "Tier 1 + 2 firms keep these on file for every responder. Marked required."
              : "Optional — fill what you know now, the invitee can complete the rest after accepting."}
          </p>
        </header>
        <label className="block text-xs">
          <span className="text-soft">
            Job title{stricter && " *"}
          </span>
          <input
            name="prefillJobTitle"
            required={stricter}
            placeholder="e.g. Head of Operational Resilience" aria-label="e.g. Head of Operational Resilience"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-xs">
            <span className="text-soft">Phone</span>
            <input
              name="prefillPhone"
              placeholder="+44 …" aria-label="+44 …"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="text-soft">
              Out-of-hours phone{stricter && " *"}
            </span>
            <input
              name="prefillOutOfHoursPhone"
              required={stricter}
              placeholder="+44 …" aria-label="+44 …"
              className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <label className="block text-xs">
          <span className="text-soft">Location</span>
          <input
            name="prefillLocation"
            placeholder="e.g. London HQ" aria-label="e.g. London HQ"
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2 text-sm"
          />
        </label>
      </section>

      {state && !state.ok && (
        <p className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200">
          {state.error}
        </p>
      )}
      {state?.ok && (
        <p className="flex items-center gap-1.5 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200">
          <Sparkles size={11} />
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
          className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-700 disabled:opacity-50 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {pending ? "Sending…" : "Send invitation"}
        </button>
      </footer>
    </form>
  );
}
