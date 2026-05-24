"use client";

import { useRef, useState } from "react";
import { MessageSquare, Smile } from "lucide-react";
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

/**
 * Team chat back-channel. Separate from the scenario inbox — this is where
 * participants talk to each other ("on a call with FCA", "can someone draft
 * the holding statement?"). Renders chronologically with reactions inline.
 */
export default function ChatPanel({ exerciseId, meId, messages }: Props) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <div className="flex h-[420px] flex-col rounded-md border border-line bg-surface-1">
      <header className="flex items-center gap-2 border-b border-line px-3 py-2">
        <MessageSquare size={14} className="text-indigo-500 dark:text-indigo-300" />
        <h3 className="text-xs font-semibold uppercase tracking-wider text-ink">
          Team chat
        </h3>
        <span className="text-[10px] text-soft">
          {messages.length} message{messages.length === 1 ? "" : "s"}
        </span>
      </header>

      <ol className="flex-1 space-y-2 overflow-y-auto px-3 py-3 text-sm">
        {messages.length === 0 ? (
          <li className="rounded-md border border-dashed border-line bg-surface-0 p-3 text-center text-xs text-muted">
            No messages yet. This is your team back-channel — say what you're
            working on, ask for help, coordinate the cascade.
          </li>
        ) : (
          messages.map((m) => (
            <ChatRow key={m.id} m={m} exerciseId={exerciseId} meId={meId} />
          ))
        )}
      </ol>

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
          placeholder="Say something to the team…" aria-label="Say something to the team…"
          autoComplete="off"
          className="flex-1 rounded-md border border-line bg-surface-0 px-2.5 py-1.5 text-sm placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
        />
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400"
        >
          Send
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
    <li
      className={`group rounded-md p-2 ${mine ? "bg-indigo-500/[0.06]" : "bg-surface-0"}`}
    >
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
                  <button
                    type="submit"
                    className="rounded p-1 text-sm hover:bg-surface-2"
                  >
                    {e}
                  </button>
                </form>
              ))}
            </div>
          )}
        </div>
      </div>
    </li>
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
