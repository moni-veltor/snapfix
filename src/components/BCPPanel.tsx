"use client";

import { useState } from "react";
import { activateBCPAction, deactivateBCPAction } from "@/app/actions/bcp";

type Activation = {
  id: string;
  activatedAt: Date;
  ceoName: string | null;
  croName: string | null;
  rationale: string | null;
  deactivatedAt: Date | null;
};

type OrgUser = { id: string; name: string | null; email: string };

type Props = {
  exerciseId: string;
  incidentId: string;
  activation: Activation | null;
  orgUsers: OrgUser[];
};

export default function BCPPanel({ exerciseId, incidentId, activation, orgUsers }: Props) {
  const [open, setOpen] = useState(false);

  if (activation && !activation.deactivatedAt) {
    return (
      <div className="rounded-md border border-violet-300 bg-violet-50 p-3 text-sm">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wide text-violet-800">
              Business Continuity Plan · active
            </div>
            <p className="mt-1 text-slate-700">
              Activated {activation.activatedAt.toISOString().slice(11, 16)} · joint CEO ({activation.ceoName ?? "—"}) + CRO ({activation.croName ?? "—"})
            </p>
            {activation.rationale && (
              <p className="mt-1 text-xs text-slate-600">{activation.rationale}</p>
            )}
          </div>
          <form action={deactivateBCPAction} className="flex items-center gap-2">
            <input type="hidden" name="exerciseId" value={exerciseId} />
            <input type="hidden" name="activationId" value={activation.id} />
            <input
              name="notes"
              placeholder="Standdown notes"
              className="rounded border border-slate-300 px-2 py-1 text-xs"
            />
            <button className="rounded border border-violet-400 bg-white px-2 py-1 text-xs text-violet-800 hover:bg-violet-100">
              Stand down BCP
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-slate-200 bg-white p-3 text-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-slate-700">
            Business Continuity
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Joint CEO + CRO decision (BCP §6.4.2.2). Activate when a disruptive event will
            interrupt one or more IBSs.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md bg-violet-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-violet-600"
        >
          Activate BCP
        </button>
      </div>
      {open && (
        <form action={activateBCPAction} className="mt-3 grid grid-cols-2 gap-2 text-sm">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="incidentId" value={incidentId} />
          <label className="block text-xs">
            <span className="font-medium text-slate-700">CEO approver *</span>
            <select
              name="ceoUserId"
              required
              defaultValue=""
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="" disabled>Select…</option>
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-xs">
            <span className="font-medium text-slate-700">CRO approver *</span>
            <select
              name="croUserId"
              required
              defaultValue=""
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="" disabled>Select…</option>
              {orgUsers.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name ?? u.email}
                </option>
              ))}
            </select>
          </label>
          <textarea
            name="rationale"
            rows={2}
            placeholder="Rationale (e.g. Tier 1 system down, RTO exceeded)"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button className="col-span-2 rounded-md bg-violet-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-600">
            Confirm — activate BCP
          </button>
        </form>
      )}
    </div>
  );
}
