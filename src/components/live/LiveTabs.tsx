"use client";

import { useEffect, useState } from "react";
import {
  Compass,
  Inbox,
  ListChecks,
  Megaphone,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";

type TabKey = "briefing" | "inbox" | "decisions" | "comms" | "team";

type Props = {
  briefing: ReactNode;
  inbox: ReactNode;
  decisions: ReactNode;
  comms: ReactNode;
  team: ReactNode;
  unreadCount?: number;
  decisionsBadge?: number;
  commsBadge?: number;
  teamBadge?: number;
};

const STORAGE_KEY = "snapfix-live-tab";

export default function LiveTabs({
  briefing,
  inbox,
  decisions,
  comms,
  team,
  unreadCount = 0,
  decisionsBadge = 0,
  commsBadge = 0,
  teamBadge = 0,
}: Props) {
  const [tab, setTab] = useState<TabKey>("briefing");

  // Persist active tab so refreshes don't lose context. The initial setTab
  // is deliberate — we hydrate with the default tab so SSR matches, then
  // jump to the stored tab on mount.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as TabKey | null;
    if (stored && ["briefing", "inbox", "decisions", "comms", "team"].includes(stored)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setTab(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, tab);
  }, [tab]);

  const tabs: { key: TabKey; label: string; icon: typeof Compass; badge: number; hint: string }[] = [
    { key: "briefing", label: "Briefing", icon: Compass, badge: 0, hint: "Role + next actions" },
    { key: "inbox", label: "Inbox", icon: Inbox, badge: unreadCount, hint: "Messages for you" },
    { key: "decisions", label: "Decisions", icon: ListChecks, badge: decisionsBadge, hint: "Log + closure gate" },
    { key: "comms", label: "Comms", icon: Megaphone, badge: commsBadge, hint: "Drafts + regulator" },
    { key: "team", label: "Team", icon: Users, badge: teamBadge, hint: "Seats + feed" },
  ];

  return (
    <div className="space-y-4">
      <div
        role="tablist"
        className="sticky top-0 z-20 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
      >
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setTab(t.key)}
              className={`group relative flex min-w-[120px] flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
                active
                  ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                  : "text-muted hover:bg-surface-2 hover:text-ink"
              }`}
            >
              <Icon size={14} className="shrink-0" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold">{t.label}</span>
                <span
                  className={`block truncate text-[10px] ${
                    active ? "text-white/80" : "text-soft"
                  }`}
                >
                  {t.hint}
                </span>
              </span>
              {t.badge > 0 && (
                <span
                  className={`flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-semibold ${
                    active
                      ? "bg-white/30 text-white"
                      : "bg-rose-600 text-white"
                  }`}
                >
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div hidden={tab !== "briefing"}>{briefing}</div>
      <div hidden={tab !== "inbox"}>{inbox}</div>
      <div hidden={tab !== "decisions"}>{decisions}</div>
      <div hidden={tab !== "comms"}>{comms}</div>
      <div hidden={tab !== "team"}>{team}</div>
    </div>
  );
}
