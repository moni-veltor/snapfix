"use client";

import { useState } from "react";
import { activateBCPAction, deactivateBCPAction } from "@/app/actions/bcp";
import Section from "@/components/ui/Section";
import Button from "@/components/ui/Button";
import PolicyHint from "@/components/ui/PolicyHint";

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
      <Section
        title={
          <>
            Business Continuity · active
            <PolicyHint clause="BCP §6.4.2.2">
              Joint CEO + CRO decision. IM governance wraps BC.
            </PolicyHint>
          </>
        }
        variant="info"
        subtitle={`Activated ${activation.activatedAt.toISOString().slice(11, 16)} · CEO ${activation.ceoName ?? "—"} + CRO ${activation.croName ?? "—"}`}
      >
        {activation.rationale && (
          <p className="mb-2 text-xs text-slate-600 dark:text-slate-300">{activation.rationale}</p>
        )}
        <form action={deactivateBCPAction} className="flex items-center gap-2">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="activationId" value={activation.id} />
          <input
            name="notes"
            placeholder="Standdown notes"
            className="flex-1 rounded border border-slate-300 px-2 py-1 text-xs dark:border-slate-700 dark:bg-slate-900"
          />
          <Button variant="outline" size="sm" type="submit">
            Stand down BCP
          </Button>
        </form>
      </Section>
    );
  }

  return (
    <Section
      title={
        <>
          Business Continuity
          <PolicyHint clause="BCP §6.4.2.2">
            Joint CEO + CRO decision. Activate when a disruptive event will interrupt an IBS.
          </PolicyHint>
        </>
      }
      right={
        <Button variant="primary" size="sm" type="button" onClick={() => setOpen((o) => !o)}>
          Activate BCP
        </Button>
      }
    >
      {open && (
        <form action={activateBCPAction} className="grid grid-cols-1 gap-2 text-sm">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="incidentId" value={incidentId} />
          <label className="block text-xs">
            <span className="font-medium text-slate-700 dark:text-slate-200">CEO approver *</span>
            <select
              name="ceoUserId"
              required
              defaultValue=""
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
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
            <span className="font-medium text-slate-700 dark:text-slate-200">CRO approver *</span>
            <select
              name="croUserId"
              required
              defaultValue=""
              className="mt-1 w-full rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
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
            className="rounded border border-slate-300 px-2 py-1.5 text-sm dark:border-slate-700 dark:bg-slate-900"
          />
          <Button variant="primary" size="sm" type="submit">
            Confirm — activate BCP
          </Button>
        </form>
      )}
    </Section>
  );
}
