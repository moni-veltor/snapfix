"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Filter,
  Flame,
  Layers,
  Lock,
  Search,
  Shield,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
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
  type SerializableAchievement,
  type TopicMaturity,
} from "@/lib/achievements/types";

/**
 * Client-side achievement shape — `rule.evaluate` is stripped at the server
 * boundary because Next.js refuses functions in client component props.
 */
type EvaluatedAchievement = SerializableAchievement;

const ALL_LEVELS: AchievementLevel[] = [1, 2, 3, 4, 5];

/** Topic tab strip — same shape as ScenarioDetailTabs. */
const TOPIC_TABS: {
  key: AchievementTopic;
  label: string;
  hint: string;
  icon: LucideIcon;
}[] = [
  { key: "coverage", label: "Coverage", hint: "Registers + breadth", icon: Layers },
  { key: "cadence", label: "Cadence", hint: "Exercise rhythm", icon: Flame },
  { key: "people", label: "People", hint: "Roster + decisions", icon: Users },
  { key: "governance", label: "Governance", hint: "Clocks + closures", icon: ShieldCheck },
  { key: "resilience", label: "Resilience", hint: "DR + runbooks", icon: Shield },
];

// Keep Briefcase imported for future People sub-categorisation.
void Briefcase;

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
  /** Optional one-line summary surfaced under the maturity strip. */
  pitch?: string;
};

/** Sentinel for "show every level in the active topic" — used by the audit toggle. */
type LevelSelection = AchievementLevel | "all";

type StatusFilter = "all" | "unlocked" | "in-progress";
type ScopeFilter = "all" | "org" | "user";

export default function AchievementsBoard({
  maturity,
  achievements,
  closestToUnlock,
  recentlyUnlocked,
  pitch,
}: Props) {
  const [activeTopic, setActiveTopic] = useState<AchievementTopic>("coverage");
  const [activeLevel, setActiveLevel] = useState<LevelSelection>(1);
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

  /**
   * Per-topic "active level" = lowest level (1..5) with at least one
   * in-progress rule. Defaults the level sub-tab so the user lands on
   * the level they're working on, not the one they've already nailed.
   */
  const topicDefaultLevel = useMemo(() => {
    const out = {} as Record<AchievementTopic, AchievementLevel>;
    for (const topic of (Object.keys(out) as AchievementTopic[]).concat([
      "coverage",
      "cadence",
      "people",
      "governance",
      "resilience",
    ] as AchievementTopic[])) {
      // dedupe handled by Object.keys order; just set per topic below
      out[topic as AchievementTopic] = 1;
    }
    for (const topic of [
      "coverage",
      "cadence",
      "people",
      "governance",
      "resilience",
    ] as AchievementTopic[]) {
      const pool = achievements.filter((a) => a.rule.topic === topic);
      const found = ALL_LEVELS.find((l) =>
        pool.some((a) => a.rule.level === l && !a.unlocked),
      );
      out[topic] = found ?? 5;
    }
    return out;
  }, [achievements]);

  // When the topic changes, snap level back to that topic's default. Users
  // can still pick another level or "all" manually.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setActiveLevel(topicDefaultLevel[activeTopic]);
  }, [activeTopic, topicDefaultLevel]);

  // Topic counts for the tab badges — number of unlocked rules per topic.
  const topicCounts = useMemo(() => {
    const out: Record<AchievementTopic, { total: number; unlocked: number }> = {
      coverage: { total: 0, unlocked: 0 },
      cadence: { total: 0, unlocked: 0 },
      people: { total: 0, unlocked: 0 },
      governance: { total: 0, unlocked: 0 },
      resilience: { total: 0, unlocked: 0 },
    };
    for (const a of achievements) {
      out[a.rule.topic].total += 1;
      if (a.unlocked) out[a.rule.topic].unlocked += 1;
    }
    return out;
  }, [achievements]);

  const filtered = useMemo(() => {
    let pool = achievements.filter((a) => a.rule.topic === activeTopic);
    if (activeScope === "org") pool = pool.filter((a) => a.rule.scope !== "user");
    if (activeScope === "user") pool = pool.filter((a) => a.rule.scope === "user");
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

  const activeTopicMaturity = useMemo(
    () => maturity.find((m) => m.topic === activeTopic) ?? null,
    [maturity, activeTopic],
  );
  const activeTopicTotal = achievements.filter((a) => a.rule.topic === activeTopic).length;

  // Per-level counts inside the active topic — drives the level sub-tab badges.
  const levelCountsForActiveTopic = useMemo(() => {
    const out: Record<AchievementLevel, { total: number; unlocked: number }> = {
      1: { total: 0, unlocked: 0 },
      2: { total: 0, unlocked: 0 },
      3: { total: 0, unlocked: 0 },
      4: { total: 0, unlocked: 0 },
      5: { total: 0, unlocked: 0 },
    };
    for (const a of achievements) {
      if (a.rule.topic !== activeTopic) continue;
      out[a.rule.level].total += 1;
      if (a.unlocked) out[a.rule.level].unlocked += 1;
    }
    return out;
  }, [achievements, activeTopic]);

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
    <div className="space-y-6">
      {/* ─── Compact maturity strip (horizontal pill row) ───────────────── */}
      <section className="rounded-xl border border-line bg-surface-1 p-2">
        <ul className="flex flex-wrap items-stretch gap-1">
          {topicsWithData.map((m) => (
            <li key={m.topic} className="flex-1 min-w-[150px]">
              <MaturityPill
                maturity={m}
                isActive={activeTopic === m.topic}
                onClick={() => setActiveTopic(m.topic)}
              />
            </li>
          ))}
        </ul>
        {pitch && <p className="mt-2 px-1 text-[11px] text-soft">{pitch}</p>}
      </section>

      {/* ─── Topic tabs (primary navigation) ────────────────────────────── */}
      <TopicTabStrip
        active={activeTopic}
        counts={topicCounts}
        onChange={setActiveTopic}
      />

      {/* ─── Two-column layout: main grid + side rail ───────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        {/* Main column — level sub-tabs + filter bar + grid */}
        <div className="min-w-0 space-y-4">
          {/* Level sub-tabs (per-topic, replaces the level filter) */}
          <LevelSubTabs
            active={activeLevel}
            counts={levelCountsForActiveTopic}
            onChange={setActiveLevel}
          />

          {/* Filter bar — refines within the active topic + level */}
          <div className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-3">
            <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted">
              <Filter size={11} />
              Refine
            </span>
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
            {filtered.length} of {activeTopicTotal} shown in{" "}
            <span className="font-semibold text-ink">{TOPIC_LABEL[activeTopic]}</span>
            {activeTopicMaturity && activeTopicMaturity.level > 0 && (
              <>
                {" "}
                · {TOPIC_LABEL[activeTopic]} is at L{activeTopicMaturity.level}
              </>
            )}
            {activeLevel !== "all" && (
              <>
                {" "}
                · viewing L{activeLevel} {LEVEL_LABEL[activeLevel as AchievementLevel]}
              </>
            )}
            {(activeStatus !== "all" || activeScope !== "all" || query) &&
              " · filtered"}
          </p>

          {/* Cards — grouped by level only when "all" is selected, else flat. */}
          {activeLevel === "all" ? (
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
                      <p className="text-[11px] text-soft">
                        {LEVEL_DESCRIPTION[level]}
                      </p>
                    </header>
                    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                      {items.map((a) => (
                        <li key={a.rule.id}>
                          <BadgeCard
                            achievement={a}
                            onOpen={() => setSelected(a)}
                          />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </section>
          ) : (
            <section className="space-y-3">
              <header className="flex flex-wrap items-baseline gap-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${LEVEL_TONE[activeLevel as AchievementLevel]}`}
                >
                  L{activeLevel} · {LEVEL_LABEL[activeLevel as AchievementLevel]}
                </span>
                <p className="text-[11px] text-soft">
                  {LEVEL_DESCRIPTION[activeLevel as AchievementLevel]}
                </p>
              </header>
              <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((a) => (
                  <li key={a.rule.id}>
                    <BadgeCard achievement={a} onOpen={() => setSelected(a)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-10 text-center text-sm text-soft">
              No achievements match these filters.
            </div>
          )}
        </div>

        {/* Right rail (lg+) — closest-to-unlock + recently-unlocked */}
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <article className="rounded-xl border border-line bg-surface-1 p-4">
            <header className="mb-3 flex items-center gap-2">
              <Target size={14} className="text-indigo-600 dark:text-indigo-300" />
              <h2 className="text-sm font-semibold text-ink">What to do next</h2>
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
        </aside>
      </div>

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

// ─── Filter tabs ─────────────────────────────────────────────────────────

function TopicTabStrip({
  active,
  counts,
  onChange,
}: {
  active: AchievementTopic;
  counts: Record<AchievementTopic, { total: number; unlocked: number }>;
  onChange: (v: AchievementTopic) => void;
}) {
  return (
    <div
      role="tablist"
      className="sticky top-0 z-10 -mx-1 flex flex-wrap gap-1 rounded-xl border border-line bg-surface-1/95 p-1 backdrop-blur"
    >
      {TOPIC_TABS.map((t) => {
        const isActive = active === t.key;
        const Icon = t.icon;
        const c = counts[t.key];
        return (
          <button
            key={t.key}
            role="tab"
            type="button"
            aria-selected={isActive}
            onClick={() => onChange(t.key)}
            className={`group flex min-w-[140px] flex-1 items-center gap-2 rounded-lg px-3 py-2 text-left transition-all ${
              isActive
                ? "bg-gradient-brand text-white shadow-[var(--shadow-card)]"
                : "text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <Icon size={14} className="shrink-0" />
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">{t.label}</span>
              <span
                className={`block truncate text-[10px] ${
                  isActive ? "text-white/80" : "text-soft"
                }`}
              >
                {t.hint}
              </span>
            </span>
            {c.total > 0 && (
              <span
                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${
                  isActive
                    ? "bg-white/25 text-white"
                    : c.unlocked > 0
                      ? "bg-accent-soft text-indigo-700 dark:text-indigo-200"
                      : "bg-surface-2 text-soft"
                }`}
              >
                {c.unlocked}/{c.total}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Level sub-tabs — one row of L1-L5 pills inside the active topic, plus
 * an "Audit (all levels)" toggle that restores the legacy full-scroll
 * view. Defaults the sub-tab to the topic's lowest in-progress level so
 * the user lands on the work that's in front of them.
 */
function LevelSubTabs({
  active,
  counts,
  onChange,
}: {
  active: LevelSelection;
  counts: Record<AchievementLevel, { total: number; unlocked: number }>;
  onChange: (v: LevelSelection) => void;
}) {
  return (
    <div role="tablist" className="flex flex-wrap items-center gap-1.5 rounded-xl border border-line bg-surface-1 p-2">
      {ALL_LEVELS.map((l) => {
        const isActive = active === l;
        const c = counts[l];
        const full = c.total > 0 && c.unlocked === c.total;
        return (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(l)}
            className={`flex flex-1 min-w-[120px] items-center gap-2 rounded-lg px-3 py-1.5 text-left transition-all ${
              isActive
                ? `${LEVEL_TONE[l]} shadow-[var(--shadow-card)]`
                : "bg-surface-0 text-muted hover:bg-surface-2 hover:text-ink"
            }`}
          >
            <span className="text-[10px] font-bold uppercase tracking-wider">
              L{l}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-semibold">
                {LEVEL_LABEL[l]}
              </span>
              <span className="block truncate text-[10px] opacity-70">
                {c.unlocked}/{c.total}
                {full && " · ✓"}
              </span>
            </span>
          </button>
        );
      })}
      <button
        type="button"
        role="tab"
        aria-selected={active === "all"}
        onClick={() => onChange("all")}
        className={`rounded-md border px-3 py-1.5 text-[11px] font-medium transition-all ${
          active === "all"
            ? "border-line-strong bg-surface-2 text-ink"
            : "border-line bg-surface-0 text-soft hover:bg-surface-2 hover:text-ink"
        }`}
        title="Show all levels stacked"
      >
        Audit · all
      </button>
    </div>
  );
}

/**
 * Compact maturity pill — replaces the chunky MaturityTile. Renders one
 * topic in a horizontal strip with topic label · level · slim 5-segment bar.
 */
function MaturityPill({
  maturity: m,
  isActive,
  onClick,
}: {
  maturity: TopicMaturity;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full items-center gap-2 rounded-lg border p-2 text-left transition-all hover:bg-surface-2 ${
        isActive
          ? "border-indigo-400 bg-accent-soft text-indigo-900 dark:text-indigo-100"
          : "border-line bg-surface-0 text-muted"
      }`}
    >
      <span className="min-w-0 flex-1">
        <span className="block text-[10px] font-semibold uppercase tracking-wider text-soft">
          {m.topicLabel}
        </span>
        <span className="block font-display text-sm font-bold text-ink">
          {m.level === 0 ? "—" : `L${m.level}`}
        </span>
      </span>
      <div className="flex flex-none flex-col items-end gap-1">
        <div className="flex gap-0.5">
          {ALL_LEVELS.map((l) => {
            const filled = m.unlockedByLevel[l] === m.totalByLevel[l] && m.totalByLevel[l] > 0;
            const partial = m.unlockedByLevel[l] > 0 && !filled;
            return (
              <div
                key={l}
                title={`L${l} ${LEVEL_LABEL[l]} — ${m.unlockedByLevel[l]}/${m.totalByLevel[l]}`}
                className={`h-1.5 w-3 rounded-full ${
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
      </div>
    </button>
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

