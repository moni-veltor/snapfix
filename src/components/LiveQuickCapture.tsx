"use client";

import { useRef, useState } from "react";
import { addLogEntryAction, createCommsDraftAction } from "@/app/actions/exercises";

type Props = {
  exerciseId: string;
  dDayHHMM: string;
};

type Tab = "LOG" | "COMMS";

export default function LiveQuickCapture({ exerciseId, dDayHHMM }: Props) {
  const [tab, setTab] = useState<Tab>("LOG");
  const logRef = useRef<HTMLFormElement>(null);
  const commsRef = useRef<HTMLFormElement>(null);

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <div className="flex border-b border-slate-200">
        <TabButton active={tab === "LOG"} onClick={() => setTab("LOG")}>
          Log entry
        </TabButton>
        <TabButton active={tab === "COMMS"} onClick={() => setTab("COMMS")}>
          Comms draft
        </TabButton>
        <span className="ml-auto self-center pr-3 font-mono text-xs text-slate-500">
          D-Day {dDayHHMM}
        </span>
      </div>

      {tab === "LOG" && (
        <form
          ref={logRef}
          action={async (fd) => {
            await addLogEntryAction(fd);
            logRef.current?.reset();
          }}
          className="grid grid-cols-3 gap-2 p-3 text-sm"
        >
          <input type="hidden" name="exerciseId" value={exerciseId} />
          <input type="hidden" name="dDayTime" value={dDayHHMM} />
          <select name="kind" required className="rounded border border-slate-300 px-2 py-1.5 text-sm">
            <option value="DECISION">Decision</option>
            <option value="ACTION">Action</option>
            <option value="CHALLENGE">Challenge</option>
            <option value="RESOURCE">Resource</option>
            <option value="NOTE">Note</option>
          </select>
          <input
            name="body"
            required
            placeholder="What happened? (e.g. 'CTO authorised public statement')"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button className="col-span-3 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            Add to log
          </button>
        </form>
      )}

      {tab === "COMMS" && (
        <form
          ref={commsRef}
          action={async (fd) => {
            await createCommsDraftAction(fd);
            commsRef.current?.reset();
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
          <input
            name="subject"
            required
            placeholder="Subject"
            className="rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Draft message body…"
            className="col-span-2 rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
          <button className="col-span-2 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
            Save draft
          </button>
        </form>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-xs font-medium ${
        active ? "border-b-2 border-indigo-600 text-slate-900" : "text-slate-500 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}
