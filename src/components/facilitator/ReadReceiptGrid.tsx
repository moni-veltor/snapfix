"use client";

import { ChevronLeft, ChevronRight, Search } from "lucide-react";
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

const PARTICIPANT_PAGE_SIZE = 25;
const MESSAGE_WINDOW = 40;

export default function ReadReceiptGrid({ messages, participants, cells }: Props) {
  const [filter, setFilter] = useState<"ALL" | "UNREAD" | "ADDRESSED">("UNREAD");
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  const [showAllMessages, setShowAllMessages] = useState(messages.length <= MESSAGE_WINDOW);

  const cellMap = useMemo(() => {
    const m = new Map<string, Cell>();
    for (const c of cells) {
      m.set(`${c.participantId}:${c.messageKind}:${c.messageId}`, c);
    }
    return m;
  }, [cells]);

  // Most recent messages first when truncating, so the facilitator
  // sees what just landed — flip back to scheduledTime for the table.
  const visibleMessages = useMemo(() => {
    if (showAllMessages || messages.length <= MESSAGE_WINDOW) return messages;
    return [...messages]
      .sort((a, b) => b.scheduledTime.localeCompare(a.scheduledTime))
      .slice(0, MESSAGE_WINDOW)
      .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));
  }, [messages, showAllMessages]);

  const filteredParticipants = useMemo(() => {
    const q = query.trim().toLowerCase();
    return participants.filter((p) => {
      if (q !== "") {
        const hit =
          p.name.toLowerCase().includes(q) || p.roleTitle.toLowerCase().includes(q);
        if (!hit) return false;
      }
      if (filter === "ALL") return true;
      return visibleMessages.some((msg) => {
        const c = cellMap.get(`${p.id}:${msg.kind}:${msg.id}`);
        if (!c) return false;
        if (filter === "UNREAD") return c.state === "ADDRESSED";
        if (filter === "ADDRESSED") return c.state === "ADDRESSED" || c.state === "READ";
        return false;
      });
    });
  }, [participants, visibleMessages, cellMap, filter, query]);

  // Reset to page 1 whenever the filter / search / visible-set changes.
  const totalPages = Math.max(1, Math.ceil(filteredParticipants.length / PARTICIPANT_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedParticipants = filteredParticipants.slice(
    (currentPage - 1) * PARTICIPANT_PAGE_SIZE,
    currentPage * PARTICIPANT_PAGE_SIZE,
  );

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
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[180px] flex-1">
          <Search
            size={12}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-soft"
          />
          <input
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Filter by participant or role…"
            aria-label="Search participants"
            className="w-full rounded-md border border-line bg-surface-1 py-1 pl-7 pr-2 text-xs text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
          />
        </div>
        <div className="flex gap-1">
          {(["ALL", "ADDRESSED", "UNREAD"] as const).map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => {
                setFilter(f);
                setPage(1);
              }}
              aria-pressed={filter === f}
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

      <div className="flex flex-wrap items-baseline justify-between gap-2 text-xs text-muted">
        <div>
          <span className="text-emerald-700 dark:text-emerald-300">✓ {readCount} read</span>
          {" · "}
          <span className="text-amber-700 dark:text-amber-300">⊙ {unreadCount} unread</span>
          {" · "}
          {visibleMessages.length}
          {!showAllMessages && messages.length > MESSAGE_WINDOW
            ? ` of ${messages.length}`
            : ""}{" "}
          message{visibleMessages.length === 1 ? "" : "s"} to {participants.length} participants
        </div>
        {messages.length > MESSAGE_WINDOW && (
          <button
            type="button"
            onClick={() => setShowAllMessages((s) => !s)}
            className="rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2"
          >
            {showAllMessages ? `Show last ${MESSAGE_WINDOW} only` : `Show all ${messages.length}`}
          </button>
        )}
      </div>

      <div className="overflow-auto rounded-md border border-line">
        <table className="w-full border-collapse text-xs">
          <thead className="sticky top-0 bg-surface-2">
            <tr>
              <th className="sticky left-0 z-10 min-w-[180px] border-b border-line bg-surface-2 p-2 text-left font-medium">
                Participant
              </th>
              {visibleMessages.map((m) => (
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
            {pagedParticipants.map((p) => (
              <tr key={p.id}>
                <td className="sticky left-0 z-10 border-b border-line bg-surface-1 p-2">
                  <div className="font-medium text-ink">{p.name}</div>
                  <div className="text-[10px] text-muted">{p.roleTitle}</div>
                </td>
                {visibleMessages.map((m) => {
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
            {pagedParticipants.length === 0 && (
              <tr>
                <td
                  colSpan={visibleMessages.length + 1}
                  className="p-6 text-center text-xs text-muted"
                >
                  No participants match this view.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <nav
          aria-label="Read-receipt participant pagination"
          className="flex items-center justify-between gap-2 text-[11px] text-muted"
        >
          <span>
            Showing {(currentPage - 1) * PARTICIPANT_PAGE_SIZE + 1}–
            {Math.min(filteredParticipants.length, currentPage * PARTICIPANT_PAGE_SIZE)} of{" "}
            {filteredParticipants.length}
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Previous page"
            >
              <ChevronLeft size={12} />
              Prev
            </button>
            <span className="px-2 font-mono">
              {currentPage} / {totalPages}
            </span>
            <button
              type="button"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-1 px-2 py-1 text-[11px] font-medium text-ink hover:bg-surface-2 disabled:cursor-not-allowed disabled:opacity-40"
              aria-label="Next page"
            >
              Next
              <ChevronRight size={12} />
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
