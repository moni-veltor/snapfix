"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { ArrowRight, Bell, Zap } from "lucide-react";

type InboxItem = {
  kind: "EVENT" | "INJECT";
  id: string;
  scheduledTime: string;
  title: string;
  description: string;
  senderRoleTitle: string | null;
};

type Props = {
  exerciseId: string;
  roleTitle: string;
  inbox: InboxItem[];
};

const STORAGE_PREFIX = "snapfix-seen-inbox";

/**
 * When a freshly released inject (or event) addressed to me lands in the
 * inbox during a live exercise, this fires a dramatic full-screen modal —
 * not just a quiet card appearing in a list. The "crucial fun modal" the
 * facilitator wants the participants to actually notice.
 *
 * Logic:
 *  - On mount, snapshot the current inbox ids into localStorage as "seen"
 *    so we don't fire a modal for pre-existing items on first load.
 *  - On every props update (driven by LivePoller's router.refresh), diff
 *    the new inbox against the seen set; for each truly-new item, queue
 *    a dramatic modal + a quieter toast.
 */
export default function InjectArrivalNotifier({
  exerciseId,
  roleTitle,
  inbox,
}: Props) {
  const storageKey = `${STORAGE_PREFIX}:${exerciseId}`;

  // Lazy-init the "seen" set from localStorage so no setState-in-effect
  // cascade is needed. First ever load: treat existing items as seen.
  const [seen, setSeen] = useState<Set<string>>(() => {
    if (typeof window === "undefined") return new Set();
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return new Set(JSON.parse(raw) as string[]);
    } catch {
      // fall through
    }
    const initial = inbox.map((i) => `${i.kind}:${i.id}`);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(initial));
    } catch {
      // ignore
    }
    return new Set(initial);
  });

  const unseen = useMemo(
    () => inbox.filter((i) => !seen.has(`${i.kind}:${i.id}`)),
    [inbox, seen],
  );

  // One toast per truly-new arrival, tracked via ref so polling doesn't
  // double-toast across renders.
  const toastedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const item of unseen) {
      const key = `${item.kind}:${item.id}`;
      if (toastedRef.current.has(key)) continue;
      toastedRef.current.add(key);
      toast(
        item.kind === "INJECT"
          ? "New inject — addressed to you"
          : "New event released",
        {
          description: item.title,
          icon: item.kind === "INJECT" ? "⚡" : "📨",
        },
      );
    }
  }, [unseen]);

  if (unseen.length === 0) return null;
  const current = unseen[0];
  const dismiss = () => {
    setSeen((prev) => {
      const next = new Set(prev);
      next.add(`${current.kind}:${current.id}`);
      try {
        window.localStorage.setItem(storageKey, JSON.stringify(Array.from(next)));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <ArrivalModal
      // Key by item id so React remounts ArrivalModal on each new item —
      // the typewriter effect resets without a setState-in-effect dance.
      key={`${current.kind}:${current.id}`}
      item={current}
      roleTitle={roleTitle}
      onDismiss={dismiss}
      remaining={unseen.length - 1}
    />
  );
}

function ArrivalModal({
  item,
  roleTitle,
  onDismiss,
  remaining,
}: {
  item: InboxItem;
  roleTitle: string;
  onDismiss: () => void;
  remaining: number;
}) {
  // Animate the title character-by-character for drama. Component is
  // keyed by item id externally, so mount = fresh state.
  const [revealed, setRevealed] = useState(0);
  useEffect(() => {
    const t = setInterval(() => {
      setRevealed((r) => (r >= item.title.length ? r : r + 2));
    }, 20);
    return () => clearInterval(t);
  }, [item.title.length]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter") onDismiss();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onDismiss]);

  const isInject = item.kind === "INJECT";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isInject ? "New inject" : "New event"}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onDismiss();
      }}
    >
      <div
        className={`w-full max-w-xl overflow-hidden rounded-2xl border-2 bg-surface-elev shadow-2xl ${
          isInject
            ? "border-amber-400 dark:border-amber-500"
            : "border-rose-400 dark:border-rose-500"
        }`}
        style={{
          animation: "snapfix-arrival 220ms ease-out",
        }}
      >
        <div
          className={`flex items-center justify-between px-5 py-3 text-white ${
            isInject ? "bg-amber-600" : "bg-rose-600"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white opacity-90" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-white" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-[0.22em]">
              {isInject ? "Inject" : "Event"} · just released
            </span>
          </div>
          <span className="font-mono text-[10px] opacity-90">D-Day {item.scheduledTime}</span>
        </div>

        <div className="space-y-4 p-6">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-12 w-12 items-center justify-center rounded-xl ${
                isInject
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-200"
                  : "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-200"
              }`}
            >
              {isInject ? <Zap size={22} /> : <Bell size={22} />}
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
                Addressed to <span className="text-ink">{roleTitle}</span>
                {item.senderRoleTitle && (
                  <>
                    {" · from "}
                    <span className="text-ink">{item.senderRoleTitle}</span>
                  </>
                )}
              </p>
              <h2 className="mt-0.5 text-lg font-semibold text-ink">
                {item.title.slice(0, revealed)}
                {revealed < item.title.length && (
                  <span className="ml-0.5 inline-block w-1.5 animate-pulse bg-current" style={{ height: "1em" }} />
                )}
              </h2>
            </div>
          </div>

          <p className="rounded-lg bg-surface-0 p-3 text-sm text-ink">
            {item.description.slice(0, 320)}
            {item.description.length > 320 && "…"}
          </p>
        </div>

        <footer className="flex items-center justify-between border-t border-line bg-surface-1 px-5 py-3">
          <span className="text-[11px] text-soft">
            {remaining > 0
              ? `${remaining} more new ${remaining === 1 ? "item" : "items"} after this`
              : "Press Esc or Enter to dismiss"}
          </span>
          <button
            type="button"
            onClick={onDismiss}
            autoFocus
            className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
          >
            {isInject ? "Begin response" : "Got it"}
            <ArrowRight size={14} />
          </button>
        </footer>
      </div>

      <style>{`
        @keyframes snapfix-arrival {
          from {
            opacity: 0;
            transform: scale(0.92) translateY(-6px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
