"use client";

import { useState, useTransition } from "react";
import { invokeIncidentAction, standDownIncidentAction, assessSeverityAction } from "@/app/actions/incidents";
import { SEVERITY_THRESHOLDS } from "@/lib/severity";

type Incident = {
  id: string;
  shortCode: string;
  title: string;
  status: string;
  severity: string | null;
  severityFinancial: string | null;
  severityCustomer: string | null;
  severityData: string | null;
  severitySystems: string | null;
  severityReputational: string | null;
  consumerDutyTrigger: boolean;
  cyberDefaultHigh: boolean;
  invokedAt: Date | null;
  invokedByName: string | null;
};

type Props = {
  exerciseId: string;
  incident: Incident | null;
};

export default function IncidentBanner({ exerciseId, incident }: Props) {
  const [showSeverity, setShowSeverity] = useState(false);

  if (!incident || incident.status === "STOOD_DOWN") {
    return <NoIncidentBanner exerciseId={exerciseId} />;
  }

  const sev = incident.severity;
  return (
    <div className={`rounded-md border p-4 ${severityClass(sev)}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-700">
            <span className="rounded-full bg-rose-600 px-2 py-0.5 text-white">IMT INVOKED</span>
            <span className="font-mono">{incident.shortCode}</span>
            {incident.invokedByName && (
              <span className="font-normal text-muted">
                · invoked by {incident.invokedByName}
                {incident.invokedAt && ` at ${incident.invokedAt.toISOString().slice(11, 16)}`}
              </span>
            )}
          </div>
          <h2 className="mt-1 text-base font-semibold text-slate-900">{incident.title}</h2>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <SeverityPill level={sev} label="Overall" />
            <SeverityPill level={incident.severityFinancial} label="Fin" />
            <SeverityPill level={incident.severityCustomer} label="Cust" />
            <SeverityPill level={incident.severityData} label="Data" />
            <SeverityPill level={incident.severitySystems} label="Sys" />
            <SeverityPill level={incident.severityReputational} label="Rep" />
            {incident.consumerDutyTrigger && (
              <span className="rounded-full bg-amber-200 px-2 py-0.5 text-amber-900">
                Consumer Duty trigger
              </span>
            )}
            {incident.cyberDefaultHigh && (
              <span className="rounded-full bg-violet-200 px-2 py-0.5 text-violet-900">
                Cyber → High
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setShowSeverity((s) => !s)}
            className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-xs font-medium hover:bg-surface-0"
          >
            {sev ? "Reassess severity" : "Classify severity"}
          </button>
          <StandDownButton exerciseId={exerciseId} incidentId={incident.id} />
        </div>
      </div>

      {showSeverity && (
        <SeverityWizard exerciseId={exerciseId} incident={incident} onDone={() => setShowSeverity(false)} />
      )}
    </div>
  );
}

function NoIncidentBanner({ exerciseId }: { exerciseId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-md border border-rose-300 bg-rose-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold uppercase tracking-wide text-rose-700">
            No incident invoked
          </div>
          <p className="mt-1 text-sm text-slate-700">
            If something looks wrong, stand up the IMT. <em>Better to stand it up and back down
            than to fail to stand it up</em> — Afin IMP §6.2.2.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="rounded-md bg-rose-600 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-500"
        >
          🚨 Stand up the IMT
        </button>
      </div>

      {open && (
        <form action={invokeIncidentAction} className="mt-3 space-y-2 rounded-md bg-surface-1 p-3 text-sm">
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <label className="block text-xs">
            <span className="font-medium text-slate-700">Incident title *</span>
            <input
              name="title"
              required
              placeholder="e.g. Core banking outage"
              className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-slate-700">What's happening?</span>
            <textarea
              name="summary"
              rows={2}
              className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
          <label className="block text-xs">
            <span className="font-medium text-slate-700">Why invoke now? (rationale)</span>
            <input
              name="rationale"
              placeholder="e.g. customer-facing impact, regulator notification window"
              className="mt-1 w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
            />
          </label>
          <button className="w-full rounded-md bg-rose-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-rose-500">
            Confirm — stand up the IMT
          </button>
        </form>
      )}
    </div>
  );
}

function StandDownButton({ exerciseId, incidentId }: { exerciseId: string; incidentId: string }) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-line-strong bg-surface-1 px-3 py-1.5 text-xs font-medium hover:bg-surface-0"
      >
        Stand down
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm space-y-3 rounded-lg bg-surface-1 p-4">
            <h3 className="text-sm font-semibold">Stand down the IMT?</h3>
            <p className="text-xs text-slate-600">
              The "back down" reflex is legitimate — captures rationale for the audit log.
            </p>
            <form
              action={(fd) => {
                start(async () => {
                  await standDownIncidentAction(fd);
                  setOpen(false);
                });
              }}
              className="space-y-2"
            >
              <input type="hidden" name="exerciseId" value={exerciseId} />
              <input type="hidden" name="incidentId" value={incidentId} />
              <textarea
                name="reason"
                rows={2}
                required
                placeholder="Why are you standing down?"
                className="w-full rounded-md border border-line-strong px-2 py-1.5 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="flex-1 rounded-md border border-line-strong px-3 py-1.5 text-sm"
                >
                  Cancel
                </button>
                <button
                  disabled={pending}
                  className="flex-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white disabled:bg-slate-400"
                >
                  Stand down
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

function SeverityWizard({
  exerciseId,
  incident,
  onDone,
}: {
  exerciseId: string;
  incident: Incident;
  onDone: () => void;
}) {
  return (
    <form
      action={async (fd) => {
        await assessSeverityAction(fd);
        onDone();
      }}
      className="mt-4 space-y-3 rounded-md bg-surface-1 p-3"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incident.id} />
      <p className="text-xs text-muted">
        Classify across five dimensions (Afin IMP §6.2.1 + ORP App.1). Overall severity = the
        highest of the five. Aggravating factors promote to High.
      </p>

      <DimensionRow name="severityFinancial" label="Financial" defaultValue={incident.severityFinancial} thresholds={SEVERITY_THRESHOLDS.financial} />
      <DimensionRow name="severityCustomer" label="Customer" defaultValue={incident.severityCustomer} thresholds={SEVERITY_THRESHOLDS.customer} />
      <DimensionRow name="severityData" label="Data" defaultValue={incident.severityData} thresholds={SEVERITY_THRESHOLDS.dataImpact} />
      <DimensionRow name="severitySystems" label="Systems" defaultValue={incident.severitySystems} thresholds={SEVERITY_THRESHOLDS.systems} />
      <DimensionRow name="severityReputational" label="Reputational" defaultValue={incident.severityReputational} thresholds={SEVERITY_THRESHOLDS.reputational} />

      <div className="flex flex-col gap-2 rounded-md bg-amber-50 p-2 text-xs">
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="consumerDutyTrigger"
            defaultChecked={incident.consumerDutyTrigger}
            className="mt-0.5"
          />
          <span>
            <strong>Consumer Duty trigger</strong> — affects customers' ability to access funds,
            complete transactions, receive support, or exercise rights (IMP §6.2.4). Promotes
            severity to High regardless of financial threshold.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            type="checkbox"
            name="cyberDefaultHigh"
            defaultChecked={incident.cyberDefaultHigh}
            className="mt-0.5"
          />
          <span>
            <strong>Cyber default rule</strong> — ransomware or data exfiltration defaults to
            High unless explicitly assessed otherwise (BCPlans §6.3.8).
          </span>
        </label>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={onDone}
          className="flex-1 rounded-md border border-line-strong px-3 py-1.5 text-sm"
        >
          Cancel
        </button>
        <button className="flex-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
          Record severity
        </button>
      </div>
    </form>
  );
}

function DimensionRow({
  name,
  label,
  defaultValue,
  thresholds,
}: {
  name: string;
  label: string;
  defaultValue: string | null;
  thresholds: { HIGH: string; MEDIUM: string; LOW: string };
}) {
  return (
    <fieldset className="rounded-md border border-line p-2">
      <legend className="px-1 text-xs font-semibold text-slate-700">{label}</legend>
      <div className="grid grid-cols-3 gap-2 text-[11px]">
        {(["HIGH", "MEDIUM", "LOW"] as const).map((level) => (
          <label
            key={level}
            className="flex cursor-pointer items-start gap-1.5 rounded border border-line px-2 py-1 hover:bg-surface-0"
          >
            <input
              type="radio"
              name={name}
              value={level}
              defaultChecked={defaultValue === level}
              className="mt-0.5"
            />
            <span>
              <span className={`font-semibold ${LEVEL_COLOR[level]}`}>{level}</span>
              <span className="block text-muted">{thresholds[level]}</span>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

const LEVEL_COLOR = {
  HIGH: "text-rose-700",
  MEDIUM: "text-amber-700",
  LOW: "text-emerald-700",
};

function SeverityPill({ level, label }: { level: string | null; label: string }) {
  if (!level) {
    return (
      <span className="rounded-full bg-surface-2 px-2 py-0.5 text-muted">
        {label} —
      </span>
    );
  }
  return (
    <span className={`rounded-full px-2 py-0.5 font-medium ${PILL_COLOR[level] ?? "bg-surface-2"}`}>
      {label} {level}
    </span>
  );
}

const PILL_COLOR: Record<string, string> = {
  HIGH: "bg-rose-600 text-white",
  MEDIUM: "bg-amber-500 text-white",
  LOW: "bg-emerald-600 text-white",
};

function severityClass(sev: string | null): string {
  switch (sev) {
    case "HIGH":
      return "border-rose-300 bg-rose-50";
    case "MEDIUM":
      return "border-amber-300 bg-amber-50";
    case "LOW":
      return "border-emerald-300 bg-emerald-50";
    default:
      return "border-line-strong bg-surface-0";
  }
}
