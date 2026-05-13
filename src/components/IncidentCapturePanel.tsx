"use client";

import { useRef, useState } from "react";
import {
  recordDecisionAction,
  addSitrepAction,
  recordIMTMeetingAction,
} from "@/app/actions/decisions";
import { addLogEntryAction, createCommsDraftAction } from "@/app/actions/exercises";

type Props = {
  exerciseId: string;
  incidentId: string | null;
  dDayHHMM: string;
};

type Tab = "LOG" | "DECISION" | "SITREP" | "MEETING" | "COMMS";

export default function IncidentCapturePanel({ exerciseId, incidentId, dDayHHMM }: Props) {
  const [tab, setTab] = useState<Tab>("LOG");
  const formRef = useRef<HTMLFormElement>(null);

  const tabs: { id: Tab; label: string; disabledWhenNoIncident: boolean }[] = [
    { id: "LOG", label: "Log entry", disabledWhenNoIncident: false },
    { id: "DECISION", label: "Decision", disabledWhenNoIncident: true },
    { id: "SITREP", label: "Sitrep", disabledWhenNoIncident: true },
    { id: "MEETING", label: "IMT meeting", disabledWhenNoIncident: true },
    { id: "COMMS", label: "Comms draft", disabledWhenNoIncident: false },
  ];

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex flex-wrap border-b border-slate-200">
        {tabs.map((t) => {
          const isDisabled = t.disabledWhenNoIncident && !incidentId;
          return (
            <button
              key={t.id}
              type="button"
              disabled={isDisabled}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2 text-xs font-medium ${
                tab === t.id
                  ? "border-b-2 border-indigo-600 text-slate-900"
                  : isDisabled
                    ? "text-slate-300"
                    : "text-slate-500 hover:text-slate-700"
              }`}
              title={isDisabled ? "Invoke the IMT first" : undefined}
            >
              {t.label}
            </button>
          );
        })}
        <span className="ml-auto self-center pr-3 font-mono text-xs text-slate-500">
          D-Day {dDayHHMM}
        </span>
      </div>

      {tab === "LOG" && (
        <form
          ref={formRef}
          action={async (fd) => {
            await addLogEntryAction(fd);
            formRef.current?.reset();
          }}
          className="grid grid-cols-3 gap-2 p-3 text-sm"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="dDayTime" value={dDayHHMM} />
          <select name="kind" required className="rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option value="OBSERVATION">Observation</option>
            <option value="ACTION">Action</option>
            <option value="RISK">Risk</option>
            <option value="ASK">Ask</option>
            <option value="EVIDENCE">Evidence</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="RESOURCE">Resource</option>
            <option value="NOTE">Note</option>
          </select>
          <input
            name="body"
            required
            placeholder="What happened? (use Decision tab for formal decisions)"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button className="col-span-3 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            Add to log
          </button>
        </form>
      )}

      {tab === "DECISION" && incidentId && (
        <DecisionForm exerciseId={exerciseId} incidentId={incidentId} />
      )}
      {tab === "SITREP" && incidentId && (
        <SitrepForm exerciseId={exerciseId} incidentId={incidentId} />
      )}
      {tab === "MEETING" && incidentId && (
        <MeetingForm exerciseId={exerciseId} incidentId={incidentId} dDayHHMM={dDayHHMM} />
      )}

      {tab === "COMMS" && (
        <form
          action={async (fd) => {
            await createCommsDraftAction(fd);
          }}
          className="grid grid-cols-2 gap-2 p-3 text-sm"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <select
            name="audience"
            required
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            <option value="CUSTOMER">Customer</option>
            <option value="REGULATOR">Regulator</option>
            <option value="INTERNAL">Internal team</option>
            <option value="SENIOR_MGMT">Senior management</option>
            <option value="MEDIA">Media</option>
          </select>
          <select
            name="stakeholder"
            defaultValue=""
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
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
          <input
            name="subject"
            required
            placeholder="Subject"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Draft body…"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            Save draft
          </button>
        </form>
      )}

      {(tab === "DECISION" || tab === "SITREP" || tab === "MEETING") && !incidentId && (
        <p className="p-4 text-xs text-slate-500">
          Invoke the IMT first to record decisions, sitreps, and meeting minutes.
        </p>
      )}
    </div>
  );
}

function DecisionForm({ exerciseId, incidentId }: { exerciseId: string; incidentId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await recordDecisionAction(fd);
        ref.current?.reset();
      }}
      className="grid grid-cols-2 gap-2 p-3 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />
      <select
        name="decisionType"
        required
        defaultValue="OTHER"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="ACTIVATE_BCP">Activate BCP (CEO + CRO joint)</option>
        <option value="DEACTIVATE_BCP">Deactivate BCP</option>
        <option value="NOTIFY_FCA">Notify FCA (within 4h)</option>
        <option value="NOTIFY_PRA">Notify PRA (within 4h)</option>
        <option value="NOTIFY_ICO">Notify ICO (within 72h)</option>
        <option value="CONVENE_ACTION_COMMITTEE">Convene Board Action Committee</option>
        <option value="APPROVE_CRISIS_COMMS">Approve crisis communications</option>
        <option value="APPROVE_REGULATOR_COMMS">Approve regulator notification text</option>
        <option value="CFO_EMERGENCY_SPEND">CFO emergency spend (£100k cap)</option>
        <option value="DRAW_CONTINGENT_LIQUIDITY">Draw contingent liquidity</option>
        <option value="DO_NOT_PAY_RANSOM">Do not pay ransom (Board + Legal)</option>
        <option value="INSURANCE_INVOCATION">Invoke insurance</option>
        <option value="RECOVERY_OPTION_CHOSEN">Recovery option chosen</option>
        <option value="OTHER">Other</option>
      </select>
      <input
        name="title"
        required
        placeholder="One-line decision (e.g. 'Activate BCP — Tier 1 outage')"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="rationale"
        rows={2}
        placeholder="Why this decision? (rationale for the audit trail)"
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button className="col-span-2 rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500">
        Record decision
      </button>
    </form>
  );
}

function SitrepForm({ exerciseId, incidentId }: { exerciseId: string; incidentId: string }) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await addSitrepAction(fd);
        ref.current?.reset();
      }}
      className="grid grid-cols-2 gap-2 p-3 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />
      <input
        name="businessUnit"
        required
        placeholder="Business unit (e.g. Tech Recovery)"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <select
        name="status"
        required
        defaultValue="AMBER"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      >
        <option value="GREEN">🟢 Green</option>
        <option value="AMBER">🟡 Amber</option>
        <option value="RED">🔴 Red</option>
      </select>
      <textarea
        name="summary"
        required
        rows={2}
        placeholder="Situation summary"
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="issues"
        rows={2}
        placeholder="Issues / blockers"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="asks"
        rows={2}
        placeholder="Asks of the IMT"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <input
        name="nextUpdateDDayTime"
        placeholder="Next update at D-Day HH:MM"
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
        File sitrep
      </button>
    </form>
  );
}

function MeetingForm({
  exerciseId,
  incidentId,
  dDayHHMM,
}: {
  exerciseId: string;
  incidentId: string;
  dDayHHMM: string;
}) {
  const ref = useRef<HTMLFormElement>(null);
  return (
    <form
      ref={ref}
      action={async (fd) => {
        await recordIMTMeetingAction(fd);
        ref.current?.reset();
      }}
      className="grid grid-cols-2 gap-2 p-3 text-sm"
    >
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="incidentId" value={incidentId} />
      <p className="col-span-2 text-[11px] text-slate-500">
        Standing agenda per Afin IMP §6.2.5. "Next meeting" time is required as the meeting's
        formal output.
      </p>
      <textarea
        name="situation"
        rows={2}
        placeholder="Current situation"
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="decisions"
        rows={2}
        placeholder="Decisions taken in this meeting"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="actions"
        rows={2}
        placeholder="Actions assigned (owner, due time)"
        className="rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <textarea
        name="risks"
        rows={2}
        placeholder="Risks flagged"
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <input
        name="nextMeetingDDay"
        required
        placeholder={`Next meeting at D-Day HH:MM (started at ${dDayHHMM})`}
        className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
      />
      <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
        Record IMT meeting
      </button>
    </form>
  );
}
