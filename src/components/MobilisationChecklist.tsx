"use client";

import { useState } from "react";
import { mobiliseParticipantAction } from "@/app/actions/teams";

type Member = {
  participantId: string;
  userId: string;
  name: string | null;
  email: string;
  roleTitle: string;
  exerciseRole: string;
  teamKind: string | null;
  teamName: string | null;
  mobilisationStatus: string;
  deputyName: string | null;
};

type Props = {
  exerciseId: string;
  members: Member[];
  myParticipantId: string;
};

/** Compact mobilisation status board grouped by policy team. */
export default function MobilisationChecklist({ exerciseId, members, myParticipantId }: Props) {
  const [open, setOpen] = useState(true);

  const byTeam = new Map<string, Member[]>();
  for (const m of members) {
    const key = teamLabel(m.teamKind, m.teamName);
    if (!byTeam.has(key)) byTeam.set(key, []);
    byTeam.get(key)!.push(m);
  }

  const teamsInOrder = Array.from(byTeam.keys()).sort(teamOrder);

  const mobilisedCount = members.filter((m) => m.mobilisationStatus === "MOBILISED" || m.mobilisationStatus === "DEPUTY_STEPPED_UP").length;
  const unreachableCount = members.filter((m) => m.mobilisationStatus === "UNREACHABLE").length;

  return (
    <div className="rounded-md border border-slate-200 bg-white">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between p-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-700">
          Mobilisation · {mobilisedCount}/{members.length} mobilised
          {unreachableCount > 0 && (
            <span className="ml-2 rounded-full bg-rose-100 px-2 py-0.5 text-rose-700">
              {unreachableCount} unreachable
            </span>
          )}
        </span>
        <span className="text-xs text-slate-400">{open ? "−" : "+"}</span>
      </button>
      {open && (
        <div className="space-y-3 border-t border-slate-200 p-3">
          {teamsInOrder.map((teamKey) => (
            <div key={teamKey}>
              <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {teamKey}
              </div>
              <ul className="mt-1 divide-y divide-slate-100">
                {byTeam.get(teamKey)!.map((m) => (
                  <li key={m.participantId} className="flex flex-wrap items-center justify-between gap-2 py-1.5 text-xs">
                    <div className="min-w-0 flex-1">
                      <span className="font-medium text-slate-800">{m.name ?? m.email}</span>
                      <span className="ml-2 text-slate-500">{m.roleTitle}</span>
                      {m.deputyName && (
                        <span className="ml-2 text-[10px] text-slate-400">deputy: {m.deputyName}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusPill status={m.mobilisationStatus} />
                      {m.participantId === myParticipantId && (
                        <form action={mobiliseParticipantAction}>
                          <input type="hidden" name="exerciseId" value={exerciseId} />
                          <input type="hidden" name="participantId" value={m.participantId} />
                          <select
                            name="status"
                            defaultValue={m.mobilisationStatus}
                            onChange={(e) => (e.target.form as HTMLFormElement).requestSubmit()}
                            className="rounded border border-slate-300 px-1.5 py-0.5 text-[11px]"
                          >
                            <option value="UNCALLED">Uncalled</option>
                            <option value="MOBILISED">Mobilised</option>
                            <option value="UNREACHABLE">Unreachable</option>
                            <option value="DEPUTY_STEPPED_UP">Deputy stepped up</option>
                            <option value="STOOD_DOWN">Stood down</option>
                          </select>
                        </form>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function teamLabel(kind: string | null, name: string | null): string {
  if (kind && TEAM_KIND_LABEL[kind]) return TEAM_KIND_LABEL[kind];
  return name ?? "Other";
}

const TEAM_KIND_LABEL: Record<string, string> = {
  IMT: "Incident Management Team (strategic)",
  IRT_TECH: "Technology Response Team",
  IRT_CUSTOMER: "Customer Response Team",
  COMMS: "Communications Team",
  BRT_FINANCE: "BRT — Finance",
  BRT_BUILDINGS: "BRT — Buildings & Infrastructure",
  BRT_TECH: "BRT — Technology",
  BRT_COMMS: "BRT — Communications",
  EXECUTIVE_OBSERVERS: "Executive Observers",
  ACTION_COMMITTEE: "Board Action Committee",
  OTHER: "Other",
};

const TEAM_ORDER: Record<string, number> = {
  "Incident Management Team (strategic)": 1,
  "Technology Response Team": 2,
  "Customer Response Team": 3,
  "Communications Team": 4,
  "BRT — Finance": 5,
  "BRT — Buildings & Infrastructure": 6,
  "BRT — Technology": 7,
  "BRT — Communications": 8,
  "Executive Observers": 9,
  "Board Action Committee": 10,
  Other: 99,
};

function teamOrder(a: string, b: string): number {
  return (TEAM_ORDER[a] ?? 50) - (TEAM_ORDER[b] ?? 50);
}

function StatusPill({ status }: { status: string }) {
  const cls = STATUS_CLASS[status] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${cls}`}>
      {STATUS_LABEL[status] ?? status}
    </span>
  );
}

const STATUS_CLASS: Record<string, string> = {
  UNCALLED: "bg-slate-100 text-slate-600",
  MOBILISED: "bg-emerald-100 text-emerald-800",
  UNREACHABLE: "bg-rose-100 text-rose-800",
  DEPUTY_STEPPED_UP: "bg-violet-100 text-violet-800",
  STOOD_DOWN: "bg-slate-200 text-slate-600",
};

const STATUS_LABEL: Record<string, string> = {
  UNCALLED: "Uncalled",
  MOBILISED: "Mobilised",
  UNREACHABLE: "Unreachable",
  DEPUTY_STEPPED_UP: "Deputy stepped up",
  STOOD_DOWN: "Stood down",
};
