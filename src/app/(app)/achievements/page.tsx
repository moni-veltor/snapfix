import { redirect } from "next/navigation";
import { Crown, Sparkles } from "lucide-react";
import { auth } from "@/lib/auth";
import AchievementsBoard from "@/components/achievements/AchievementsBoard";
import Hoot from "@/components/fun/Hoot";
import { ProgressRing } from "@/components/ui/charts";
import {
  evaluateAchievements,
  findRuleById,
  loadRecentlyUnlocked,
  pickClosestToUnlock,
} from "@/lib/achievements/engine";
import {
  loadAchievementOrgState,
  loadAchievementPersonalState,
} from "@/lib/achievements/state";
import {
  TOPIC_LABEL,
  toSerializableAchievement,
} from "@/lib/achievements/types";

export const metadata = { title: "Achievements — SnapFix" };

const RANKS = [
  "Recruit", // 1
  "Apprentice", // 2
  "Practitioner", // 3
  "Specialist", // 4
  "Expert", // 5
  "Master", // 6
  "Mentor", // 7
  "Architect", // 8
  "Grandmaster", // 9
  "Resilience Legend", // 10+
];

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const orgId = session.user.orgId;
  const userId = session.user.id ?? null;

  const [state, personal] = await Promise.all([
    loadAchievementOrgState(orgId),
    userId ? loadAchievementPersonalState(orgId, userId) : Promise.resolve(null),
  ]);
  const summary = await evaluateAchievements({
    orgId,
    state,
    userId: userId ?? undefined,
    personal,
  });

  const recentRows = await loadRecentlyUnlocked(orgId, 8);
  const recentlyUnlocked = recentRows
    .map((r) => {
      const rule = findRuleById(r.achievementId);
      if (!rule) return null;
      return {
        achievementId: r.achievementId,
        level: r.level,
        unlockedAt: r.unlockedAt,
        xpAwarded: r.xpAwarded,
        title: rule.title,
        topic: rule.topic,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null);

  const closestToUnlock = pickClosestToUnlock(summary.achievements, 5);

  // ── Resilience rank ─────────────────────────────────────────────────────
  // 500 XP per level, with a 1.15× ramp so the curve flattens politely.
  let level = 1;
  let need = 500;
  let remaining = summary.totalXp;
  while (remaining >= need && level < 12) {
    remaining -= need;
    level += 1;
    need = Math.round(need * 1.15);
  }
  const rank = RANKS[Math.min(level - 1, RANKS.length - 1)];
  const progressPct = need === 0 ? 0 : remaining / need;

  // ── Topic + level tallies for the header strip ──────────────────────────
  const tally = {
    l1: 0,
    l2: 0,
    l3: 0,
    l4: 0,
    l5: 0,
  } as Record<"l1" | "l2" | "l3" | "l4" | "l5", number>;
  for (const a of summary.achievements) {
    if (!a.unlocked) continue;
    tally[`l${a.rule.level}` as keyof typeof tally] += 1;
  }

  // ── Pitch line based on furthest topic ──────────────────────────────────
  const topMaturity = summary.maturity.reduce(
    (best, m) => (m.level > best.level ? m : best),
    summary.maturity[0] ?? null,
  );
  const pitch = topMaturity && topMaturity.level > 0
    ? `You're L${topMaturity.level} ${topMaturity.topic ? TOPIC_LABEL[topMaturity.topic] : ""} on the maturity ladder. ${summary.totalUnlocked} of ${summary.totalRules} achievements unlocked across every topic.`
    : `Climb the maturity ladder — every topic has 5 levels and 50 achievements. ${summary.totalRules} live in the catalogue today.`;

  return (
    <div className="space-y-6">
      {/* Compact hero — same gradient identity, single-line layout, ~100px. */}
      <header className="relative flex flex-wrap items-center justify-between gap-4 overflow-hidden rounded-xl border border-indigo-400 bg-gradient-brand px-4 py-3 text-white shadow-[var(--shadow-card-glow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex min-w-0 items-center gap-3">
          <Hoot mood={summary.totalUnlocked > 0 ? "happy" : "thinking"} size={48} />
          <div className="min-w-0">
            <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-white/80">
              Resilience programme
            </p>
            <h1 className="truncate font-display text-xl font-semibold tracking-tight">
              {rank}
            </h1>
            <p className="text-[11px] text-white/85">
              Level {level} ·{" "}
              <span className="font-semibold">{summary.totalXp.toLocaleString()} XP</span>{" "}
              · {summary.totalUnlocked}/{summary.totalRules} unlocked
            </p>
          </div>
        </div>
        <div className="relative flex items-center gap-2 text-[10px]">
          <InlinePill icon={Sparkles} label="L1" count={tally.l1} />
          <InlinePill icon={Sparkles} label="L2" count={tally.l2} />
          <InlinePill icon={Sparkles} label="L3" count={tally.l3} />
          <InlinePill icon={Sparkles} label="L4" count={tally.l4} />
          <InlinePill icon={Crown} label="L5" count={tally.l5} highlight />
          <ProgressRing
            value={Math.round(progressPct * 100)}
            label={`${Math.round(progressPct * 100)}%`}
            sublabel={`lvl ${level + 1}`}
            size={64}
            thickness={6}
            gradient={false}
            color="#ffffff"
          />
        </div>
      </header>

      <AchievementsBoard
        maturity={summary.maturity}
        achievements={summary.achievements.map(toSerializableAchievement)}
        closestToUnlock={closestToUnlock.map(toSerializableAchievement)}
        recentlyUnlocked={recentlyUnlocked}
        pitch={pitch}
      />
    </div>
  );
}

function InlinePill({
  icon: Icon,
  label,
  count,
  highlight,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count: number;
  highlight?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 ${
        highlight ? "bg-white/30" : "bg-white/10"
      } text-white`}
    >
      <Icon size={10} className="text-white/80" />
      <span className="font-semibold tracking-wider">{label}</span>
      <span className="font-mono">{count}</span>
    </span>
  );
}

