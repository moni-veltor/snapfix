"use client";

import { useRef, useState } from "react";
import {
  ClipboardList,
  FileText,
  Gavel,
  Mail,
  MessageSquareWarning,
  Users,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import {
  recordDecisionAction,
  addSitrepAction,
  recordIMTMeetingAction,
} from "@/app/actions/decisions";
import { addLogEntryAction, createCommsDraftAction } from "@/app/actions/exercises";

type RecentInject = {
  id: string;
  injectNo: number;
  summary: string;
};

type OrgDecisionPreset = {
  id: string;
  label: string;
  hint: string | null;
};

type Props = {
  exerciseId: string;
  incidentId: string | null;
  dDayHHMM: string;
  /** Injects released within ~last hour — offered as decision-trigger picks. */
  recentInjects?: RecentInject[];
  /** Org-defined custom decision presets — shown alongside built-ins. */
  orgDecisionPresets?: OrgDecisionPreset[];
};

type CaptureKind = "LOG" | "DECISION" | "SITREP" | "MEETING" | "COMMS";

const KINDS: {
  id: CaptureKind;
  label: string;
  icon: typeof FileText;
  requiresIncident: boolean;
  hint: string;
}[] = [
  { id: "LOG", label: "Log entry", icon: ClipboardList, requiresIncident: false, hint: "Observation · action · risk · ask · …" },
  { id: "DECISION", label: "Decision", icon: Gavel, requiresIncident: true, hint: "Formal decision for the audit trail" },
  { id: "SITREP", label: "Sitrep", icon: MessageSquareWarning, requiresIncident: true, hint: "BU status update for the IMT" },
  { id: "MEETING", label: "IMT meeting", icon: Users, requiresIncident: true, hint: "Minutes + next-meeting time" },
  { id: "COMMS", label: "Comms draft", icon: Mail, requiresIncident: false, hint: "Stakeholder message — awaits approval" },
];

/**
 * Live-capture launcher. Replaces the older long-tab interior with five
 * compact buttons that fire-from-context drawers — each capture form
 * opens in a focused side panel so a participant logging a decision
 * isn't dropping out of the incident view.
 */
export default function IncidentCapturePanel({
  exerciseId,
  incidentId,
  dDayHHMM,
  recentInjects = [],
  orgDecisionPresets = [],
}: Props) {
  const [openKind, setOpenKind] = useState<CaptureKind | null>(null);
  const close = () => setOpenKind(null);

  return (
    <div className="rounded-md border border-line bg-surface-1 dark:border-slate-700 dark:bg-slate-900">
      <div className="flex flex-wrap items-center gap-1.5 p-3">
        {KINDS.map((k) => {
          const Icon = k.icon;
          const disabled = k.requiresIncident && !incidentId;
          return (
            <button
              key={k.id}
              type="button"
              disabled={disabled}
              onClick={() => setOpenKind(k.id)}
              title={disabled ? "Invoke the IMT first" : k.hint}
              className={`inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-xs font-medium transition-colors ${
                disabled
                  ? "border-line bg-surface-2 text-soft opacity-60"
                  : "border-line bg-surface-1 text-ink hover:border-indigo-400 hover:bg-surface-2 dark:border-slate-700"
              }`}
            >
              <Icon size={12} />
              {k.label}
            </button>
          );
        })}
        <span className="ml-auto font-mono text-xs text-muted">
          D-Day {dDayHHMM}
        </span>
      </div>

      <Drawer
        open={openKind !== null}
        onClose={close}
        title={KINDS.find((k) => k.id === openKind)?.label ?? ""}
        subtitle={`D-Day ${dDayHHMM}`}
        width="md"
      >
        {openKind === "LOG" && (
          <LogForm exerciseId={exerciseId} dDayHHMM={dDayHHMM} onSaved={close} />
        )}
        {openKind === "DECISION" && incidentId && (
          <DecisionForm
            exerciseId={exerciseId}
            incidentId={incidentId}
            recentInjects={recentInjects}
            orgDecisionPresets={orgDecisionPresets}
            onSaved={close}
          />
        )}
        {openKind === "SITREP" && incidentId && (
          <SitrepForm exerciseId={exerciseId} incidentId={incidentId} onSaved={close} />
        )}
        {openKind === "MEETING" && incidentId && (
          <MeetingForm
            exerciseId={exerciseId}
            incidentId={incidentId}
            dDayHHMM={dDayHHMM}
            onSaved={close}
          />
        )}
        {openKind === "COMMS" && (
          <CommsForm exerciseId={exerciseId} onSaved={close} />
        )}
      </Drawer>
    </div>
  );
}

function LogForm({
  exerciseId,
  dDayHHMM,
  onSaved,
}: {
  exerciseId: string;
  dDayHHMM: string;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addLogEntryAction(fd);
        ref.current?.reset();
        onSaved();
      }}
      className="space-y-3 p-4 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="dDayTime" value={dDayHHMM} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Kind
        </span>
        <select
          name="kind"
          required
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        >
          <option value="OBSERVATION">Observation — what you saw</option>
          <option value="ACTION">Action — what you did</option>
          <option value="RISK">Risk — what could go wrong</option>
          <option value="ASK">Ask — need from someone else</option>
          <option value="EVIDENCE">Evidence — artefact / screenshot</option>
          <option value="CHALLENGE">Challenge — push-back / disagreement</option>
          <option value="RESOURCE">Resource — system / doc / person</option>
          <option value="NOTE">Note — general memo</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Body
        </span>
        <textarea
          name="body"
          required
          rows={3}
          placeholder="What happened? (use Decision for formal decisions.)"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Add to log
      </button>
    </form>
  );
}

function DecisionForm({
  exerciseId,
  incidentId,
  recentInjects,
  orgDecisionPresets,
  onSaved,
}: {
  exerciseId: string;
  incidentId: string;
  recentInjects: RecentInject[];
  orgDecisionPresets: OrgDecisionPreset[];
  onSaved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  const suggestedTriggerId = recentInjects[0]?.id ?? "";
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await recordDecisionAction(fd);
        ref.current?.reset();
        onSaved();
      }}
      className="space-y-3 p-4 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Decision type
        </span>
        <select
          name="decisionPick"
          required
          defaultValue="builtin:OTHER"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        >
          <optgroup label="Built-in IMT decisions">
            <option value="builtin:ACTIVATE_BCP">Activate BCP (CEO + CRO joint)</option>
            <option value="builtin:DEACTIVATE_BCP">Deactivate BCP</option>
            <option value="builtin:NOTIFY_FCA">Notify FCA (within 4h)</option>
            <option value="builtin:NOTIFY_PRA">Notify PRA (within 4h)</option>
            <option value="builtin:NOTIFY_ICO">Notify ICO (within 72h)</option>
            <option value="builtin:CONVENE_ACTION_COMMITTEE">Convene Board Action Committee</option>
            <option value="builtin:APPROVE_CRISIS_COMMS">Approve crisis communications</option>
            <option value="builtin:APPROVE_REGULATOR_COMMS">Approve regulator notification text</option>
            <option value="builtin:CFO_EMERGENCY_SPEND">CFO emergency spend (£100k cap)</option>
            <option value="builtin:DRAW_CONTINGENT_LIQUIDITY">Draw contingent liquidity</option>
            <option value="builtin:DO_NOT_PAY_RANSOM">Do not pay ransom (Board + Legal)</option>
            <option value="builtin:INSURANCE_INVOCATION">Invoke insurance</option>
            <option value="builtin:RECOVERY_OPTION_CHOSEN">Recovery option chosen</option>
            <option value="builtin:OTHER">Other</option>
          </optgroup>
          {orgDecisionPresets.length > 0 && (
            <optgroup label="Org-specific">
              {orgDecisionPresets.map((p) => (
                <option key={p.id} value={`org:${p.id}`} title={p.hint ?? undefined}>
                  {p.label}
                </option>
              ))}
            </optgroup>
          )}
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Title *
        </span>
        <input
          name="title"
          required
          placeholder="e.g. 'Activate BCP — Tier 1 outage'"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Rationale
        </span>
        <textarea
          name="rationale"
          rows={3}
          placeholder="Why this decision? (rationale for the audit trail)"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      {recentInjects.length > 0 && (
        <label className="block">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
            Triggered by inject
          </span>
          <select
            name="triggeredByInjectId"
            defaultValue={suggestedTriggerId}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
          >
            <option value="">— none —</option>
            {recentInjects.map((i) => (
              <option key={i.id} value={i.id}>
                #{i.injectNo} · {i.summary.length > 70 ? `${i.summary.slice(0, 70)}…` : i.summary}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[10px] text-soft">
            Auto-suggested from most recent release — clear if not applicable.
          </p>
        </label>
      )}

      <button
        type="submit"
        className="w-full rounded-md bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500"
      >
        Record decision
      </button>
    </form>
  );
}

function SitrepForm({
  exerciseId,
  incidentId,
  onSaved,
}: {
  exerciseId: string;
  incidentId: string;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addSitrepAction(fd);
        ref.current?.reset();
        onSaved();
      }}
      className="space-y-3 p-4 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Business unit *
        </span>
        <input
          name="businessUnit"
          required
          placeholder="e.g. Tech Recovery, Payments"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Status *
        </span>
        <select
          name="status"
          required
          defaultValue="AMBER"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        >
          <option value="GREEN">🟢 Green</option>
          <option value="AMBER">🟡 Amber</option>
          <option value="RED">🔴 Red</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Summary *
        </span>
        <textarea
          name="summary"
          required
          rows={3}
          placeholder="Two-line state-of-the-world for the IMT."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Issues
        </span>
        <textarea
          name="issues"
          rows={2}
          placeholder="Anything broken or at risk."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Asks
        </span>
        <textarea
          name="asks"
          rows={2}
          placeholder="What you need from the IMT."
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Next update due (D-Day HH:MM)
        </span>
        <input
          name="nextUpdateDDayTime"
          placeholder="e.g. 10:30"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        File sitrep
      </button>
    </form>
  );
}

function MeetingForm({
  exerciseId,
  incidentId,
  dDayHHMM,
  onSaved,
}: {
  exerciseId: string;
  incidentId: string;
  dDayHHMM: string;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await recordIMTMeetingAction(fd);
        ref.current?.reset();
        onSaved();
      }}
      className="space-y-3 p-4 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />
      <p className="text-[11px] text-soft">
        Standing agenda — next meeting time is required as the meeting&apos;s
        formal output.
      </p>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Situation
        </span>
        <textarea
          name="situation"
          rows={2}
          placeholder="Current situation"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Decisions
        </span>
        <textarea
          name="decisions"
          rows={2}
          placeholder="Decisions taken in this meeting"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Actions
        </span>
        <textarea
          name="actions"
          rows={2}
          placeholder="Actions assigned (owner, due time)"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Risks
        </span>
        <textarea
          name="risks"
          rows={2}
          placeholder="Risks flagged"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Next meeting at D-Day HH:MM *
        </span>
        <input
          name="nextMeetingDDay"
          required
          placeholder={`started at ${dDayHHMM}`}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Record IMT meeting
      </button>
    </form>
  );
}

function CommsForm({
  exerciseId,
  onSaved,
}: {
  exerciseId: string;
  onSaved: () => void;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await createCommsDraftAction(fd);
        ref.current?.reset();
        onSaved();
      }}
      className="space-y-3 p-4 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Audience *
        </span>
        <select
          name="audience"
          required
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        >
          <option value="CUSTOMER">Customer</option>
          <option value="REGULATOR">Regulator</option>
          <option value="INTERNAL">Internal team</option>
          <option value="SENIOR_MGMT">Senior management</option>
          <option value="MEDIA">Media</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Policy stakeholder
        </span>
        <select
          name="stakeholder"
          defaultValue=""
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        >
          <option value="">— Policy stakeholder —</option>
          <option value="EMPLOYEES">Employees (must come BEFORE customers)</option>
          <option value="CUSTOMERS">Customers</option>
          <option value="REGULATORS">Regulators (PRA/FCA)</option>
          <option value="ICO">ICO</option>
          <option value="MEDIA">Media (AFTER customers)</option>
          <option value="THIRD_PARTY_VENDORS">Third-party vendors</option>
          <option value="INTERMEDIARIES">Intermediaries</option>
          <option value="SHAREHOLDERS">Shareholders</option>
          <option value="INSURERS">Insurers</option>
        </select>
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Subject *
        </span>
        <input
          name="subject"
          required
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-muted">
          Body *
        </span>
        <textarea
          name="body"
          required
          rows={5}
          placeholder="Draft body…"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-2 py-1.5"
        />
      </label>

      <button
        type="submit"
        className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
      >
        Save draft
      </button>
    </form>
  );
}
