"use client";

import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Smile, Send } from "lucide-react";
import { postChatMessageAction, toggleReactionAction } from "@/app/actions/chat";
import Pill from "@/components/ui/Pill";

type ChatMessageView = {
  id: string;
  body: string;
  authorName: string;
  authorRoleAbbreviation: string | null;
  dDayTime: string | null;
  createdAt: Date;
  authorId: string;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

type Props = {
  exerciseId: string;
  meId: string;
  messages: ChatMessageView[];
};

const QUICK_EMOJI = ["👍", "🙏", "⚠️", "👀", "✅", "❓"];
const LOCAL_KEY_OPEN = "snapfix-chat-open";

/**
 * Floating chat drawer — bottom-right pill that expands into a Slack-style
 * panel. Always reachable, never in the way. Persists open/closed in
 * localStorage so it remembers your preference across reloads.
 */
export default function FloatingChatDrawer({ exerciseId, meId, messages }: Props) {
  const [open, setOpen] = useState(false);
  const [lastSeenCount, setLastSeenCount] = useState(messages.length);
  const formRef = useRef<HTMLFormElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Restore open state on mount
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(LOCAL_KEY_OPEN);
    if (stored === "1") setOpen(true);
  }, []);

  // Track unread count
  useEffect(() => {
    if (open) {
      setLastSeenCount(messages.length);
    }
  }, [open, messages.length]);

  // Auto-scroll to bottom on new messages when open
  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem(LOCAL_KEY_OPEN, next ? "1" : "0");
      }
      return next;
    });
  };

  const unread = Math.max(0, messages.length - lastSeenCount);

  if (!open) {
    return (
      <button
        type="button"
        onClick={toggle}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-[var(--shadow-card-lg)] transition-all hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        aria-label="Open team chat"
      >
        <MessageSquare size={16} />
        <span>Team chat</span>
        {messages.length > 0 && (
          <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px] font-semibold">
            {messages.length}
          </span>
        )}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-semibold text-white ring-2 ring-surface-0">
            {unread}
          </span>
        )}
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 flex h-[520px] w-[380px] flex-col overflow-hidden rounded-2xl border border-line bg-surface-1 shadow-[var(--shadow-card-lg)]">
      <header className="flex items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-gradient-brand text-white">
            <MessageSquare size={14} />
          </div>
          <div>
            <div className="text-sm font-semibold text-ink">Team chat</div>
            <div className="text-[10px] text-soft">
              {messages.length} message{messages.length === 1 ? "" : "s"} · back-channel
            </div>
          </div>
        </div>
        <button
          type="button"
          onClick={toggle}
          className="rounded-md p-1.5 text-soft hover:bg-surface-1 hover:text-ink"
          aria-label="Close chat"
        >
          <X size={16} />
        </button>
      </header>

      <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        {messages.length === 0 ? (
          <div className="flex h-full items-center justify-center px-6 text-center">
            <div>
              <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-accent-soft text-indigo-600 dark:text-indigo-300">
                <MessageSquare size={20} />
              </div>
              <p className="text-sm font-medium text-ink">No messages yet</p>
              <p className="mt-1 text-xs text-muted">
                Start the back-channel — say what you're working on, ask for help, coordinate the cascade.
              </p>
            </div>
          </div>
        ) : (
          messages.map((m) => (
            <ChatRow key={m.id} m={m} exerciseId={exerciseId} meId={meId} />
          ))
        )}
      </div>

      <form
        ref={formRef}
        action={async (fd) => {
          await postChatMessageAction(fd);
          formRef.current?.reset();
        }}
        className="flex items-center gap-2 border-t border-line p-2"
      >
        <input type="hidden" name="exerciseId" value={exerciseId} />
        <input
          name="body"
          required
          maxLength={2000}
          placeholder="Message the team…" aria-label="Message the team…"
          autoComplete="off"
          className="flex-1 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-sm placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          type="submit"
          aria-label="Send"
          className="flex h-9 w-9 items-center justify-center rounded-md bg-slate-900 text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  );
}

function ChatRow({
  m,
  exerciseId,
  meId,
}: {
  m: ChatMessageView;
  exerciseId: string;
  meId: string;
}) {
  const [showPicker, setShowPicker] = useState(false);
  const mine = m.authorId === meId;

  return (
    <div className={`group rounded-md p-2 ${mine ? "bg-indigo-500/[0.06]" : "bg-surface-0"}`}>
      <div className="flex items-baseline gap-1.5">
        {m.authorRoleAbbreviation && (
          <Pill variant="info" tone="soft" size="sm">
            {m.authorRoleAbbreviation}
          </Pill>
        )}
        <span className="text-xs font-semibold text-ink">{m.authorName}</span>
        <span className="text-[10px] text-soft">
          {m.dDayTime && <>D-Day {m.dDayTime} · </>}
          {relativeTime(m.createdAt)}
        </span>
      </div>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{m.body}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {m.reactions.map((r) => (
          <ReactionPill
            key={r.emoji}
            exerciseId={exerciseId}
            targetId={m.id}
            emoji={r.emoji}
            count={r.count}
            mine={r.mine}
          />
        ))}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowPicker((s) => !s)}
            aria-label="Add reaction"
            className="rounded-full p-1 text-soft opacity-0 transition-opacity hover:bg-surface-2 hover:text-ink group-hover:opacity-100"
          >
            <Smile size={12} />
          </button>
          {showPicker && (
            <div className="absolute bottom-full left-0 z-10 mb-1 flex gap-0.5 rounded-md border border-line bg-surface-elev p-1 shadow-[var(--shadow-card-lg)]">
              {QUICK_EMOJI.map((e) => (
                <form
                  key={e}
                  action={async (fd) => {
                    await toggleReactionAction(fd);
                    setShowPicker(false);
                  }}
                >
                  <input type="hidden" name="exerciseId" value={exerciseId} />
                  <input type="hidden" name="targetType" value="CHAT" />
                  <input type="hidden" name="targetId" value={m.id} />
                  <input type="hidden" name="emoji" value={e} />
                  <button type="submit" className="rounded p-1 text-sm hover:bg-surface-2">
                    {e}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ReactionPill({
  exerciseId,
  targetId,
  emoji,
  count,
  mine,
}: {
  exerciseId: string;
  targetId: string;
  emoji: string;
  count: number;
  mine: boolean;
}) {
  return (
    <form action={toggleReactionAction}>
      <input type="hidden" name="exerciseId" value={exerciseId} />
      <input type="hidden" name="targetType" value="CHAT" />
      <input type="hidden" name="targetId" value={targetId} />
      <input type="hidden" name="emoji" value={emoji} />
      <button
        type="submit"
        className={`flex items-center gap-1 rounded-full border px-1.5 py-0.5 text-[11px] transition-all ${
          mine
            ? "border-indigo-400 bg-indigo-500/15 text-indigo-700 dark:text-indigo-200"
            : "border-line bg-surface-2 text-muted hover:border-line-strong"
        }`}
      >
        <span>{emoji}</span>
        <span>{count}</span>
      </button>
    </form>
  );
}

function relativeTime(d: Date): string {
  const seconds = Math.round((Date.now() - d.getTime()) / 1000);
  if (seconds < 30) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
