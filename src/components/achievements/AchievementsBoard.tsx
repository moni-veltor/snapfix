"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Filter,
  Lock,
  Search,
  Sparkles,
  Target,
} from "lucide-react";
import Drawer from "@/components/ui/Drawer";
import { ACHIEVEMENT_ICONS } from "./icons";
import {
  LEVEL_DESCRIPTION,
  LEVEL_LABEL,
  LEVEL_TONE,
  TOPIC_LABEL,
  type AchievementLevel,
  type AchievementTopic,
  type EvaluatedAchievement,
  type TopicMaturity,
} from "@/lib/achievements/types";

const ALL_LEVELS: AchievementLevel[] = [1, 2, 3, 4, 5];

type RecentUnlock = {
  achievementId: string;
  level: AchievementLevel;
  unlockedAt: Date;
  xpAwarded: number;
  title: string;
  topic: AchievementTopic;
};

type Props = {
  maturity: TopicMaturity[];
  achievements: EvaluatedAchievement[];
  /** Reserved for future use (per-topic pre-bucketing); component re-buckets internally. */
  byTopic?: Record<AchievementTopic, EvaluatedAchievement[]>;
  closestToUnlock: EvaluatedAchievement[];
  recentlyUnlocked: RecentUnlock[];
};

type StatusFilter = "all" | "unlocked" | "in-progress";
type ScopeFilter = "all" | "org" | "user";

export default function AchievementsBoard({
  maturity,
  achievements,
  closestToUnlock,
  recentlyUnlocked,
}: Props) {
  const [activeTopic, setActiveTopic] = useState<AchievementTopic | "all">("coverage");
  const [activeLevel, setActiveLevel] = useState<AchievementLevel | "all">("all");
  const [activeStatus, setActiveStatus] = useState<StatusFilter>("all");
  const [activeScope, setActiveScope] = useState<ScopeFilter>("all");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<EvaluatedAchievement | null>(null);

  const topicsWithData = useMemo(
    () => maturity.filter((m) => m.totalByLevel[1] + m.totalByLevel[2] + m.totalByLevel[3] + m.totalByLevel[4] + m.totalByLevel[5] > 0),
    [maturity],
  );

  // Hide the scope toggle entirely when no personal rules exist (no scope=user).
  const hasPersonalRules = useMemo(
    () => achievements.some((a) => a.rule.scope === "user"),
    [achievements],
  );

  const filtered = useMemo(() => {
    let pool = achievements;
    if (activeScope === "org") pool = pool.filter((a) => a.rule.scope !== "user");
    if (activeScope === "user") pool = pool.filter((a) => a.rule.scope === "user");
    if (activeTopic !== "all")
      pool = pool.filter((a) => a.rule.topic === activeTopic);
    if (activeLevel !== "all") pool = pool.filter((a) => a.rule.level === activeLevel);
    if (activeStatus === "unlocked") pool = pool.filter((a) => a.unlocked);
    if (activeStatus === "in-progress") pool = pool.filter((a) => !a.unlocked);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      pool = pool.filter(
        (a) =>
          a.rule.title.toLowerCase().includes(q) ||
          a.rule.description.toLowerCase().includes(q),
      );
    }
    return pool;
  }, [achievements, activeTopic, activeLevel, activeStatus, activeScope, query]);

  const groupedByLevel = useMemo(() => {
    const out: Record<AchievementLevel, EvaluatedAchievement[]> = {
      1: [],
      2: [],
      3: [],
      4: [],
      5: [],
    };
    for (const a of filtered) out[a.rule.level].push(a);
    return out;
  }, [filtered]);

  return (
    <div className="space-y-8">
      {/* ─── Maturity dashboard ─────────────────────────────────────────── */}
      <section>
        <header className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-soft">
            Maturity ladder
          </h2>
          <p className="text-[11px] text-soft">
            5 levels per topic — climb from Awareness to Optimised.
          </p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {topicsWithData.map((m) => (
            <li key={m.topic}>
              <MaturityTile
                maturity={m}
                isActive={activeTopic === m.topic}
                onClick={() =>
                  setActiveTopic(activeTopic === m.topic ? "all" : m.topic)
                }
              />
            </li>
          ))}
        </ul>
      </section>

      {/* ─── Closest-to-unlock + Recently unlocked ──────────────────────── */}
      <section className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-xl border border-line bg-surface-1 p-4 lg:col-span-2">
          <header className="mb-3 flex items-center gap-2">
            <Target size={14} className="text-indigo-600 dark:text-indigo-300" />
            <h2 className="text-sm font-semibold text-ink">What to do next</h2>
            <span className="text-[11px] text-soft">
              ({closestToUnlock.length} closest to unlock)
            </span>
          </header>
          {closestToUnlock.length === 0 ? (
            <p className="text-[12px] text-soft">
              Everything available is unlocked — keep the streak going.
            </p>
          ) : (
            <ol className="space-y-2">
              {closestToUnlock.map((a) => (
                <li key={a.rule.id}>
                  <ClosestRow item={a} onOpen={() => setSelected(a)} />
                </li>
              ))}
            </ol>
          )}
        </article>
        <article className="rounded-xl border border-line bg-surface-1 p-4">
          <header className="mb-3 flex items-center gap-2">
            <Sparkles size={14} className="text-amber-500" />
            <h2 className="text-sm font-semibold text-ink">Recently unlocked</h2>
          </header>
          {recentlyUnlocked.length === 0 ? (
            <p className="text-[12px] text-soft">
              No unlocks yet — your first IBS will get the ball rolling.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {recentlyUnlocked.map((r) => (
                <li
                  key={`${r.achievementId}-${r.unlockedAt.toISOString()}`}
                  className="flex items-center justify-between gap-2 text-[12px]"
                >
                  <span className="truncate text-ink">{r.title}</span>
                  <span className="flex-none text-[10px] text-soft">
                    {formatRelative(r.unlockedAt)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </article>
      </section>

      {/* ─── Filter bar ─────────────────────────────────────────────────── */}
      <section className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
            <Filter size={11} />
            Filter
          </span>
          <TopicTabs active={activeTopic} onChange={setActiveTopic} />
          <span className="h-4 w-px bg-line" />
          <LevelTabs active={activeLevel} onChange={setActiveLevel} />
          <span className="h-4 w-px bg-line" />
          <StatusTabs active={activeStatus} onChange={setActiveStatus} />
          {hasPersonalRules && (
            <>
              <span className="h-4 w-px bg-line" />
              <ScopeTabs active={activeScope} onChange={setActiveScope} />
            </>
          )}
          <label className="relative ml-auto">
            <Search
              size={12}
              className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-soft"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search achievements"
              className="w-48 rounded-md border border-line bg-surface-0 px-7 py-1 text-xs text-ink placeholder:text-soft focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400"
            />
          </label>
        </div>
        <p className="text-[11px] text-soft">
          {filtered.length} of {achievements.length} shown
          {(activeTopic !== "all" ||
            activeLevel !== "all" ||
            activeStatus !== "all" ||
            activeScope !== "all" ||
            query) &&
            " · filtered"}
        </p>
      </section>

      {/* ─── Grid (grouped by level) ────────────────────────────────────── */}
      <section className="space-y-6">
        {ALL_LEVELS.map((level) => {
          const items = groupedByLevel[level];
          if (items.length === 0) return null;
          return (
            <div key={level} className="space-y-3">
              <header className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${LEVEL_TONE[level]}`}
                >
                  L{level} · {LEVEL_LABEL[level]}
                </span>
                <p className="text-[11px] text-soft">{LEVEL_DESCRIPTION[level]}</p>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((a) => (
                  <li key={a.rule.id}>
                    <BadgeCard achievement={a} onOpen={() => setSelected(a)} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-10 text-center text-sm text-soft">
            No achievements match these filters.
          </div>
        )}
      </section>

      {/* ─── Detail drawer ──────────────────────────────────────────────── */}
      <Drawer
        open={selected !== null}
        onClose={() => setSelected(null)}
        title={selected?.rule.title ?? ""}
        subtitle={
          selected
            ? `${TOPIC_LABEL[selected.rule.topic]} · L${selected.rule.level} ${LEVEL_LABEL[selected.rule.level]}`
            : undefined
        }
        width="md"
      >
        {selected && <AchievementDetail item={selected} />}
      </Drawer>
    </div>
  );
}

// ─── Maturity tile ───────────────────────────────────────────────────────

function MaturityTile({
  maturity: m,
  isActive,
  onClick,
}: {
  maturity: TopicMaturity;
  isActive: boolean;
  onClick: () => void;
}) {
  const total = ALL_LEVELS.reduce((n, l) => n + m.totalByLevel[l], 0);
  const unlocked = ALL_LEVELS.reduce((n, l) => n + m.unlockedByLevel[l], 0);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group flex h-full w-full flex-col rounded-xl border bg-surface-1 p-4 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        isActive
          ? "border-indigo-400 ring-2 ring-indigo-300 dark:border-indigo-600 dark:ring-indigo-700"
          : "border-line"
      }`}
    >
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-soft">
          {m.topicLabel}
        </span>
        <span className="font-mono text-[11px] text-soft">
          {unlocked}/{total}
        </span>
      </div>
      <p className="mt-1 font-display text-2xl font-bold text-ink">
        {m.level === 0 ? "—" : `L${m.level}`}
      </p>
      <p className="text-[11px] text-soft">
        {m.level === 0 ? "Awakening" : LEVEL_LABEL[m.level as AchievementLevel]}
      </p>
      <div className="mt-3 flex gap-1">
        {ALL_LEVELS.map((l) => {
          const filled = m.unlockedByLevel[l] === m.totalByLevel[l] && m.totalByLevel[l] > 0;
          const partial = m.unlockedByLevel[l] > 0 && !filled;
          return (
            <div
              key={l}
              title={`L${l} ${LEVEL_LABEL[l]} — ${m.unlockedByLevel[l]}/${m.totalByLevel[l]}`}
              className={`h-1.5 flex-1 rounded-full ${
                filled
                  ? "bg-emerald-500 dark:bg-emerald-400"
                  : partial
                    ? "bg-amber-400"
                    : "bg-surface-2"
              }`}
            />
          );
        })}
      </div>
      <p className="mt-2 text-[10px] text-soft">
        {m.level < 5
          ? `${Math.round(m.progressInLevel * 100)}% into L${(m.level + 1) as AchievementLevel}`
          : "Optimised — sustain the score"}
      </p>
    </button>
  );
}

// ─── Filter tabs ─────────────────────────────────────────────────────────

function TopicTabs({
  active,
  onChange,
}: {
  active: AchievementTopic | "all";
  onChange: (v: AchievementTopic | "all") => void;
}) {
  const options: { value: AchievementTopic | "all"; label: string }[] = [
    { value: "all", label: "All" },
    { value: "coverage", label: TOPIC_LABEL.coverage },
    { value: "cadence", label: TOPIC_LABEL.cadence },
    { value: "people", label: TOPIC_LABEL.people },
    { value: "governance", label: TOPIC_LABEL.governance },
    { value: "resilience", label: TOPIC_LABEL.resilience },
  ];
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {options.map((o) => (
        <TabChip
          key={o.value}
          label={o.label}
          active={active === o.value}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

function LevelTabs({
  active,
  onChange,
}: {
  active: AchievementLevel | "all";
  onChange: (v: AchievementLevel | "all") => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      <TabChip
        label="Any level"
        active={active === "all"}
        onClick={() => onChange("all")}
      />
      {ALL_LEVELS.map((l) => (
        <TabChip
          key={l}
          label={`L${l}`}
          active={active === l}
          onClick={() => onChange(l)}
        />
      ))}
    </div>
  );
}

function StatusTabs({
  active,
  onChange,
}: {
  active: StatusFilter;
  onChange: (v: StatusFilter) => void;
}) {
  const options: { value: StatusFilter; label: string }[] = [
    { value: "all", label: "Any status" },
    { value: "unlocked", label: "Unlocked" },
    { value: "in-progress", label: "In progress" },
  ];
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {options.map((o) => (
        <TabChip
          key={o.value}
          label={o.label}
          active={active === o.value}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

function ScopeTabs({
  active,
  onChange,
}: {
  active: ScopeFilter;
  onChange: (v: ScopeFilter) => void;
}) {
  const options: { value: ScopeFilter; label: string }[] = [
    { value: "all", label: "Everyone" },
    { value: "org", label: "Org-wide" },
    { value: "user", label: "Personal" },
  ];
  return (
    <div role="tablist" className="flex flex-wrap gap-1">
      {options.map((o) => (
        <TabChip
          key={o.value}
          label={o.label}
          active={active === o.value}
          onClick={() => onChange(o.value)}
        />
      ))}
    </div>
  );
}

function TabChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all ${
        active
          ? "bg-slate-900 text-white dark:bg-indigo-500"
          : "bg-surface-0 text-muted hover:bg-surface-2 hover:text-ink"
      }`}
    >
      {label}
    </button>
  );
}

// ─── Badge card ──────────────────────────────────────────────────────────

function BadgeCard({
  achievement: a,
  onOpen,
}: {
  achievement: EvaluatedAchievement;
  onOpen: () => void;
}) {
  const Icon = ACHIEVEMENT_ICONS[a.rule.icon];
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`flex h-full w-full flex-col gap-3 rounded-xl border p-4 text-left transition-all hover:-translate-y-px hover:shadow-[var(--shadow-card-md)] ${
        a.unlocked
          ? `bg-surface-1 ${LEVEL_BORDER[a.rule.level]}`
          : "border-line bg-surface-1 opacity-80"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${
            a.unlocked ? LEVEL_TONE[a.rule.level] : "bg-surface-2 text-soft"
          }`}
        >
          <Icon size={18} />
        </span>
        {a.unlocked ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200">
            <CheckCircle2 size={9} />
            Unlocked
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-[9px] font-medium uppercase tracking-wider text-soft">
            <Lock size={9} />
            {a.result.status === "inProgress" && a.result.progress > 0
              ? `${Math.round(a.result.progress * 100)}%`
              : "Locked"}
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-semibold text-ink">{a.rule.title}</h3>
        <p className="mt-1 line-clamp-2 text-[12px] text-soft">{a.rule.description}</p>
      </div>
      {a.result.valueLabel && (
        <p className="text-[11px] font-mono text-muted">{a.result.valueLabel}</p>
      )}
      {!a.unlocked && a.result.status === "inProgress" && (
        <div className="h-1 overflow-hidden rounded-full bg-surface-2">
          <div
            className="h-full bg-indigo-400"
            style={{ width: `${Math.round(a.result.progress * 100)}%` }}
          />
        </div>
      )}
      <footer className="mt-auto flex items-center justify-between text-[10px] text-soft">
        <span className="flex items-center gap-1">
          {TOPIC_LABEL[a.rule.topic]} · L{a.rule.level}
          {a.rule.scope === "user" && (
            <span className="rounded-full bg-indigo-100 px-1.5 py-0 text-[9px] font-semibold uppercase tracking-wider text-indigo-800 dark:bg-indigo-950/40 dark:text-indigo-200">
              Personal
            </span>
          )}
        </span>
        {a.unlocked && a.xpAwarded > 0 && (
          <span className="font-semibold text-ink">+{a.xpAwarded} XP</span>
        )}
      </footer>
    </button>
  );
}

const LEVEL_BORDER: Record<AchievementLevel, string> = {
  1: "border-slate-300 dark:border-slate-700",
  2: "border-cyan-300 dark:border-cyan-700",
  3: "border-emerald-300 dark:border-emerald-700",
  4: "border-amber-300 dark:border-amber-700",
  5: "border-indigo-300 dark:border-indigo-700",
};

// ─── Closest-to-unlock row ───────────────────────────────────────────────

function ClosestRow({
  item,
  onOpen,
}: {
  item: EvaluatedAchievement;
  onOpen: () => void;
}) {
  const Icon = ACHIEVEMENT_ICONS[item.rule.icon];
  const progress = item.result.status === "inProgress" ? item.result.progress : 0;
  return (
    <button
      type="button"
      onClick={onOpen}
      className="group flex w-full items-center gap-3 rounded-md border border-line bg-surface-0 p-2 text-left hover:bg-surface-2"
    >
      <span
        className={`flex h-8 w-8 flex-none items-center justify-center rounded-md ${LEVEL_TONE[item.rule.level]}`}
      >
        <Icon size={14} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-ink">{item.rule.title}</p>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1 flex-1 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-indigo-400"
              style={{ width: `${Math.max(2, Math.round(progress * 100))}%` }}
            />
          </div>
          <span className="text-[10px] font-mono text-soft">
            {Math.round(progress * 100)}%
          </span>
        </div>
        {item.result.valueLabel && (
          <p className="mt-0.5 text-[10px] text-soft">{item.result.valueLabel}</p>
        )}
      </div>
      <ChevronRight
        size={14}
        className="flex-none text-soft transition-transform group-hover:translate-x-0.5"
      />
    </button>
  );
}

// ─── Detail drawer body ──────────────────────────────────────────────────

function AchievementDetail({ item }: { item: EvaluatedAchievement }) {
  const Icon = ACHIEVEMENT_ICONS[item.rule.icon];
  const progress = item.result.status === "inProgress" ? item.result.progress : 1;
  return (
    <div className="space-y-5 p-5">
      <div className="flex items-center gap-3">
        <span
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${LEVEL_TONE[item.rule.level]}`}
        >
          <Icon size={22} />
        </span>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            {TOPIC_LABEL[item.rule.topic]} · L{item.rule.level} {LEVEL_LABEL[item.rule.level]}
          </p>
          {item.unlocked ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 size={11} />
              Unlocked
              {item.unlockedAt && (
                <span className="ml-1 text-soft">
                  {item.unlockedAt.toISOString().slice(0, 10)}
                </span>
              )}
            </p>
          ) : (
            <p className="mt-0.5 inline-flex items-center gap-1 text-[11px] font-semibold text-soft">
              <Lock size={11} />
              {item.result.status === "inProgress" && item.result.progress > 0
                ? `${Math.round(item.result.progress * 100)}% there`
                : "Not started"}
            </p>
          )}
        </div>
      </div>

      <p className="text-sm text-ink">{item.rule.description}</p>

      <section className="rounded-md border border-line bg-surface-0 p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-soft">
          Current state
        </h3>
        <p className="mt-1 font-mono text-sm text-ink">
          {item.result.valueLabel ?? "—"}
        </p>
        {item.result.status === "inProgress" && (
          <>
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-surface-2">
              <div
                className="h-full bg-indigo-500"
                style={{ width: `${Math.round(progress * 100)}%` }}
              />
            </div>
            {item.result.nextLabel && (
              <p className="mt-2 text-[11px] text-soft">Next: {item.result.nextLabel}</p>
            )}
          </>
        )}
      </section>

      <section className="rounded-md border border-line bg-surface-0 p-3">
        <h3 className="text-[10px] font-semibold uppercase tracking-wider text-soft">
          Maturity level
        </h3>
        <p className="mt-1 text-[12px] text-soft">
          <span className="font-semibold text-ink">
            L{item.rule.level} {LEVEL_LABEL[item.rule.level]}
          </span>{" "}
          — {LEVEL_DESCRIPTION[item.rule.level]}
        </p>
      </section>

      <section className="flex items-center justify-between rounded-md border border-line bg-surface-0 p-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
            Reward
          </p>
          <p className="mt-1 text-sm font-semibold text-ink">
            +{item.rule.xp ?? defaultXp(item.rule.level)} XP
          </p>
        </div>
        <span className="text-[10px] text-soft">
          {item.rule.sticky
            ? "Sticky — stays earned"
            : "Live — regression de-levels"}
        </span>
      </section>

      {item.rule.deepLink && !item.unlocked && (
        <Link
          href={item.rule.deepLink}
          className="inline-flex w-full items-center justify-between gap-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Take me there
          <ArrowRight size={14} />
        </Link>
      )}
      {item.rule.deepLink && item.unlocked && (
        <Link
          href={item.rule.deepLink}
          className="inline-flex w-full items-center justify-between gap-2 rounded-md border border-line-strong bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:bg-surface-2"
        >
          View the records
          <ArrowRight size={14} />
        </Link>
      )}
    </div>
  );
}

function defaultXp(level: AchievementLevel): number {
  switch (level) {
    case 1:
      return 25;
    case 2:
      return 50;
    case 3:
      return 100;
    case 4:
      return 200;
    case 5:
      return 400;
  }
}

function formatRelative(d: Date): string {
  const now = Date.now();
  const diffMs = now - d.getTime();
  const days = Math.floor(diffMs / (24 * 3600 * 1000));
  if (days < 1) return "today";
  if (days < 2) return "1d ago";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

