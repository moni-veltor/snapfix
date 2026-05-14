"use client";

import { useMemo, useState } from "react";

type Cell = {
  participantId: string;
  messageKind: "EVENT" | "INJECT";
  messageId: string;
  state: "READ" | "ADDRESSED" | "OUT";
  readAt: Date | null;
};

type Message = {
  kind: "EVENT" | "INJECT";
  id: string;
  no: number;
  scheduledTime: string;
  title: string;
};

type Participant = { id: string; name: string; roleTitle: string };

type Props = {
  messages: Message[];
  participants: Participant[];
  cells: Cell[];
};

export default function ReadReceiptGrid({ messages, participants, cells }: Props) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "ADDRESSED">("UNREAD");

  const cellMap = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const c of cells) {
      m.set(`${c.participantId}:${c.messageKind}:${c.messageId}`, c);
    }
    return m;
  }, [cells]);

  const visibleParticipants = useMemo(() => {
    if (filter === "ALL") return participants;
    return participants.filter((p) => {
      return messages.some((msg) => {
        const c = cellMap.get(`${p.id}:${msg.kind}:${msg.id}`);
        if (!c) return false;
        if (filter === "UNREAD") return c.state === "ADDRESSED";
        if (filter === "ADDRESSED") return c.state === "ADDRESSED" || c.state === "READ";
        return false;
      });
    });
  }, [participants, messages, cellMap, filter]);

  if (messages.length === 0) {
    return (
      <p className="rounded-md border border-dashed border-line bg-surface-1 p-6 text-center text-xs text-muted">
        Once you release events or injects, this grid shows you who&apos;s read what.
      </p>
    );
  }

  const unreadCount = cells.filter((c) => c.state === "ADDRESSED").length;
  const readCount = cells.filter((c) => c.state === "READ").length;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div className="text-xs text-muted">
          <span className="text-emerald-600 dark:text-emerald-400">✓ {readCount} read</span>
          {" · "}
          <span className="text-amber-700 dark:text-amber-300">⊙ {unreadCount} unread</span>
          {" · "}
          {messages.length} released to {participants.length} participants
        </div>
        <div className="flex gap-1">
          {(["ALL", "ADDRESSED", "UNREAD"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                filter === f
                  ? "bg-indigo-500 text-white"
                  : "bg-surface-2 text-muted hover:bg-surface-elev hover:text-ink"
              }`}
            >
              {f === "ALL" ? "All" : f === "ADDRESSED" ? "Addressed only" : "Unread only"}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-auto rounded-md border border-line">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-surface-2">
            <tr>
              <th className="sticky left-0 z-10 min-w-[180px] border-b border-line bg-surface-2 p-2 text-left font-medium">
                Participant
              </th>
              {messages.map((m) => (
                <th
                  key={`${m.kind}:${m.id}`}
                  className="border-b border-line px-1 py-2 text-center font-medium"
                  title={`${m.kind} #${m.no} · ${m.title}`}
                >
                  <div className="text-[10px] text-muted">{m.scheduledTime}</div>
                  <div className="font-mono text-[10px]">
                    {m.kind === "EVENT" ? "E" : "I"}
                    {m.no}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleParticipants.map((p) => (
              <tr key={p.id}>
                <td className="sticky left-0 z-10 border-b border-line bg-surface-1 p-2">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-[10px] text-muted">{p.roleTitle}</div>
                </td>
                {messages.map((m) => {
                  const c = cellMap.get(`${p.id}:${m.kind}:${m.id}`);
                  return (
                    <td
                      key={`${m.kind}:${m.id}`}
                      className={`border-b border-line text-center ${
                        c?.state === "READ"
                          ? "bg-emerald-100 dark:bg-emerald-900/40"
                          : c?.state === "ADDRESSED"
                            ? "bg-amber-100 dark:bg-amber-900/40"
                            : "bg-transparent"
                      }`}
                      title={
                        c?.state === "READ"
                          ? `Read at ${c.readAt?.toISOString().slice(11, 16)}`
                          : c?.state === "ADDRESSED"
                            ? "Addressed — unread"
                            : "Not addressed"
                      }
                    >
                      <span
                        className={
                          c?.state === "READ"
                            ? "text-emerald-700 dark:text-emerald-300"
                            : c?.state === "ADDRESSED"
                              ? "text-amber-700 dark:text-amber-300"
                              : "text-soft"
                        }
                      >
                        {c?.state === "READ" ? "✓" : c?.state === "ADDRESSED" ? "⊙" : "·"}
                      </span>
                    </td>
                  );
                })}
              </tr>
            ))}
            {visibleParticipants.length === 0 && (
              <tr>
                <td colSpan={messages.length + 1} className="p-6 text-center text-xs text-muted">
                  No participants match the current filter.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
