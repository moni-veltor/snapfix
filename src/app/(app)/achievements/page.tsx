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
import { loadAchievementOrgState } from "@/lib/achievements/state";
import { TOPIC_LABEL } from "@/lib/achievements/types";

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

  const state = await loadAchievementOrgState(orgId);
  const summary = await evaluateAchievements({ orgId, state });

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
    <div className="space-y-8">
      <header className="relative overflow-hidden rounded-2xl border-2 border-indigo-400 bg-gradient-brand p-6 text-white shadow-[var(--shadow-card-glow)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-30"
          style={{
            backgroundImage:
              "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4) 1px, transparent 0)",
            backgroundSize: "32px 32px",
          }}
        />
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-5">
            <Hoot mood={summary.totalUnlocked > 0 ? "happy" : "thinking"} size={88} />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/80">
                Resilience programme
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">{rank}</h1>
              <p className="mt-1 text-sm text-white/90">
                Level {level} ·{" "}
                <span className="font-semibold">{summary.totalXp.toLocaleString()} XP</span>
                {" · "}
                {summary.totalUnlocked}/{summary.totalRules} unlocked
              </p>
              <p className="mt-2 max-w-xl text-[11px] text-white/80">{pitch}</p>
            </div>
          </div>
          <ProgressRing
            value={Math.round(progressPct * 100)}
            label={`${Math.round(progressPct * 100)}%`}
            sublabel={`to lvl ${level + 1}`}
            size={120}
            thickness={10}
            gradient={false}
            color="#ffffff"
          />
        </div>
        <div className="relative mt-5 grid grid-cols-2 gap-2 text-xs sm:grid-cols-5">
          <Stat icon={Sparkles} label="L1 Awareness" count={tally.l1} />
          <Stat icon={Sparkles} label="L2 Documented" count={tally.l2} />
          <Stat icon={Sparkles} label="L3 Tested" count={tally.l3} />
          <Stat icon={Sparkles} label="L4 Measured" count={tally.l4} />
          <Stat icon={Crown} label="L5 Optimised" count={tally.l5} />
        </div>
      </header>

      <AchievementsBoard
        maturity={summary.maturity}
        achievements={summary.achievements}
        byTopic={summary.byTopic}
        closestToUnlock={closestToUnlock}
        recentlyUnlocked={recentlyUnlocked}
      />
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  count,
}: {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  label: string;
  count: number;
}) {
  return (
    <div className="flex items-center gap-2 rounded-lg bg-white/10 px-3 py-2">
      <Icon size={12} className="text-white/70" />
      <span className="text-[10px] uppercase tracking-wider text-white/70">{label}</span>
      <span className="ml-auto text-base font-semibold text-white">{count}</span>
    </div>
  );
}
