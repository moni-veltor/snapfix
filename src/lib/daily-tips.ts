/**
 * Daily resilience tip — Hoot picks a tip based on day-of-year. Same tip
 * for everyone on the same day, deterministic. Refresh tomorrow. Tips are
 * short, opinionated, drawn from operational-resilience practice.
 */

export type Tip = {
  topic:
    | "exercise"
    | "ibs"
    | "third-party"
    | "regulator"
    | "people"
    | "tech-recovery"
    | "culture";
  body: string;
};

export const TIPS: Tip[] = [
  {
    topic: "exercise",
    body:
      "A short focused drill every month beats one annual mega-exercise. Muscle memory comes from repetition.",
  },
  {
    topic: "exercise",
    body:
      "Run at least one third-party-only scenario per quarter — it's where the regulator's attention sits.",
  },
  {
    topic: "exercise",
    body:
      "If the same person always plays the CTO, you have a key-person dependency, not a tested deputy.",
  },
  {
    topic: "ibs",
    body:
      "An IBS without a customer-journey description is just an internal service. Always anchor outcomes to the customer.",
  },
  {
    topic: "ibs",
    body:
      "Two IBSs sharing the same critical third party is one outage away from a regulator briefing. Map your shared dependencies.",
  },
  {
    topic: "ibs",
    body:
      "Tolerance ≠ target. Tolerance is when intolerable harm starts; targets sit well inside it. Don't conflate them.",
  },
  {
    topic: "third-party",
    body:
      "An exit plan you've never rehearsed is a creative writing exercise. Trigger one in your next tabletop.",
  },
  {
    topic: "third-party",
    body:
      "Trace your 4th-party concentration: when many of your tier-1 vendors all run on the same hyperscaler, the concentration is yours.",
  },
  {
    topic: "third-party",
    body:
      "Contracts older than 3 years should be reviewed for DORA fit — DORA materially shifted what 'critical third party' means.",
  },
  {
    topic: "regulator",
    body:
      "FCA SUP 15A and PRA notifications have different triggers. Don't pick one and assume the other is handled.",
  },
  {
    topic: "regulator",
    body:
      "Notifications happen even if you 'fix it in time'. The clock is calendar-time, not best-effort time.",
  },
  {
    topic: "people",
    body:
      "Most real incidents are people problems disguised as tech problems. Cross-train deputies before the next outage tests it for you.",
  },
  {
    topic: "people",
    body:
      "An IMT roster of 8 with no deputies isn't a team — it's a hostage situation waiting for vacation season.",
  },
  {
    topic: "tech-recovery",
    body:
      "A backup you've never restored from is a hypothesis. Validate at the cadence your regulator believes you should.",
  },
  {
    topic: "tech-recovery",
    body:
      "If your RTO target was met in the DR test but only because you skipped the data-validation step, your actual RTO is much longer.",
  },
  {
    topic: "tech-recovery",
    body:
      "Active/active sounds great on architecture diagrams but failover is rarely tested under load. Run a chaos exercise.",
  },
  {
    topic: "culture",
    body:
      "Blameless post-incident reviews don't mean responsibility-less. Name who'll own each remediation; deadlines are not soft.",
  },
  {
    topic: "culture",
    body:
      "The IMT meets monthly even if there's no incident. Muscle atrophies fast — running through last quarter's lessons counts.",
  },
  {
    topic: "culture",
    body:
      "If your war room only opens during incidents, half your team will be lost just finding the join link.",
  },
  {
    topic: "tech-recovery",
    body:
      "Test what fails first, not what you can demo cleanly. Real incidents start at the edges.",
  },
];

/** Pick a tip deterministically by day-of-year so everyone sees the same one. */
export function tipForToday(date: Date = new Date()): Tip {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / 86_400_000);
  return TIPS[dayOfYear % TIPS.length];
}
