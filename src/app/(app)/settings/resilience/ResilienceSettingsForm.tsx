"use client";

import { useActionState, useState } from "react";
import { CheckCircle2 } from "lucide-react";
import {
  updateResilienceSettingsAction,
  type ResilienceSettingsState,
} from "@/app/actions/resilience-attestation";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

type OrgUser = { id: string; name: string | null; email: string };

type Props = {
  smfUserId: string | null;
  boardCommittee: string | null;
  cycleStartMonth: number | null;
  users: OrgUser[];
};

export default function ResilienceSettingsForm({
  smfUserId,
  boardCommittee,
  cycleStartMonth,
  users,
}: Props) {
  const [state, action, pending] = useActionState<ResilienceSettingsState, FormData>(
    updateResilienceSettingsAction,
    undefined,
  );

  // Controlled values seeded from the server, so the selection visibly
  // sticks after a save (an uncontrolled select can look like it reset).
  // Seeded once on mount; a full reload remounts with fresh server props.
  const [smf, setSmf] = useState(smfUserId ?? "");
  const [board, setBoard] = useState(boardCommittee ?? "");
  const [month, setMonth] = useState(cycleStartMonth ? String(cycleStartMonth) : "");

  return (
    <form action={action} className="space-y-5 rounded-xl border border-line bg-surface-1 p-5">
      <header>
        <h2 className="text-sm font-semibold text-ink">Annual attestation</h2>
        <p className="mt-0.5 text-[11px] text-soft">
          Who signs, which committee ratifies, and when the annual cycle opens. The named SMF is the
          only person who can sign the executive line of the attestation.
        </p>
      </header>

      <label className="block text-sm">
        <span className="text-ink">SMF accountable for operational resilience</span>
        <select
          name="smfUserId"
          value={smf}
          onChange={(e) => setSmf(e.target.value)}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
        >
          <option value="">— not set —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-soft">
          Signs the executive line. The sign-off button is gated to this person. Only members of
          this organisation appear here.
        </p>
      </label>

      <label className="block text-sm">
        <span className="text-ink">Board committee</span>
        <input
          name="boardCommittee"
          maxLength={200}
          value={board}
          onChange={(e) => setBoard(e.target.value)}
          placeholder="e.g. Board Risk Committee"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
        />
        <p className="mt-1 text-[11px] text-soft">
          Pre-fills the committee name when board ratification is recorded.
        </p>
      </label>

      <label className="block text-sm">
        <span className="text-ink">Cycle start month</span>
        <select
          name="cycleStartMonth"
          value={month}
          onChange={(e) => setMonth(e.target.value)}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
        >
          <option value="">January (default)</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-soft">
          The cycle opens at the start of this month; sign-off is due 90 days later.
        </p>
      </label>

      {state?.ok && (
        <p
          role="status"
          className="flex items-center gap-1.5 rounded-md border border-emerald-400/30 bg-emerald-500/[0.08] px-3 py-2 text-xs text-emerald-700 dark:text-emerald-300"
        >
          <CheckCircle2 size={14} />
          Saved.
        </p>
      )}
      {state?.error && (
        <p
          role="alert"
          className="rounded-md border border-rose-400/30 bg-rose-500/[0.08] px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
        >
          {state.error}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] disabled:opacity-60 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
