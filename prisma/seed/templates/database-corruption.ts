import type { ScenarioTemplate } from "../types";

export const databaseCorruption: ScenarioTemplate = {
  slug: "database-corruption",
  title: "Database Corruption — Botched Schema Migration",
  category: "Data Integrity",
  srrRef: "3.3",
  background:
    "A schema-migration job runs in production at 02:00 to add a column and backfill values. The backfill query has a subtle WHERE-clause bug that overwrites 80,000 customer balance records with the value 0 before failing. The migration was reviewed by two engineers and approved. The mistake is detected at 07:30 when a customer calls because their savings balance shows £0.",
  agenda: "02:00 Migration runs\n07:30 First customer report\n08:00 Engineering confirms data loss\n09:00 Point-in-time recovery decision\n13:00 PITR complete\n14:00 Reconciliation\n16:00 Customer comms",
  dDayDate: "2026-03-18T07:30:00Z",
  durationMin: 240,
  cause:
    "A schema migration adds an `account_status` column. The backfill query intended to set status to 'ACTIVE' for all non-deleted accounts. A copy-paste error in the WHERE clause caused the UPDATE to also zero the `balance_pence` column on the same rows. The migration logged the row count but no one read the log carefully because the migration appeared to succeed.",
  impactNarrative:
    "80,000 deposit accounts now show a £0 balance in the canonical database. Mobile app reads from a 60-second cache so the impact appears gradually as caches expire. Customer service receives 12 calls in the first 30 minutes. Engineering confirms: data is genuinely overwritten in the primary database, not just a display bug. Point-in-time recovery (PITR) is the only path; estimated restore time 4-5 hours. During that window, the database is read-only.",
  characteristics: [
    "Quiet during the night — runs while no one is watching.",
    "Data integrity, not availability — the system stays up while the data is wrong.",
    "Customer trust hit — customers seeing £0 will not trust 'just a glitch'.",
    "Recovery is slow — PITR for a 4TB database takes hours.",
    "Reconciliation needed — what happened between the migration and the restore point?",
  ],
  assumptions: [
    "PITR is enabled and tested in the last 90 days.",
    "Database is single-region; cross-region copies are async with 30s lag.",
    "Customer-facing read paths cache balances for up to 60 seconds.",
  ],
  takeaways:
    "Schema migrations need staged rollouts and validated dry-runs — not just code review. Backups you've never restored are stories. Customer impact of a data-integrity incident lingers far past the technical fix.",
  stressVariables: [
    { name: "Records affected", options: ["10k", "80k", "500k", "All"] },
    { name: "PITR target", options: ["Last good backup (4h ago)", "Specific txn boundary", "Cross-region replica (30s lag)"] },
    { name: "Reconciliation complexity", options: ["Reads only between corruption and PITR", "Writes occurred during the window"] },
  ],
  caseStudy: {
    title: "GitLab — accidental deletion of production database (31 January 2017)",
    causation:
      "An engineer attempting to recover from replication lag deleted the wrong database. None of five planned backup mechanisms worked. The team restored from a 6-hour-old snapshot.",
    impactScale:
      "GitLab.com was offline for ~18 hours. Approximately 5,000 projects, 5,000 comments and 700 user accounts created in the 6 hours before the deletion were permanently lost.",
    duration:
      "18 hours of outage; days of follow-up reconciliation and customer communication. GitLab live-streamed the recovery for transparency.",
    sourceUrl: "https://about.gitlab.com/blog/postmortem-of-database-outage-of-january-31/",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: true,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Deposit access service", description: "Customer access to existing deposit balances.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Mobile and online banking", description: "Authenticated channels showing balance.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Customer support tooling", description: "Agent console access to canonical balance.", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "07:30",
      title: "First customer report",
      description:
        "A customer calls reporting savings balance shows £0. Agent escalates. Within 10 minutes, 4 more similar calls. Engineering reviews migration log and spots the row-count anomaly that was previously dismissed.",
      expectedActions: ["Read the migration log carefully", "Sample-test affected rows in production database"],
      objectives: ["Test signal-from-customer-feedback loop"],
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["CTO", "CRO"],
      ccRoleTitles: ["CCO"],
    },
    {
      eventNo: 2,
      scheduledTime: "09:00",
      title: "PITR decision",
      description:
        "Engineering confirms the corruption. PITR is the only fix. PITR will: (a) take ~4 hours; (b) put the database read-only during recovery; (c) lose any writes between 02:00 and now. Customer service must triage what happens to customers who tried to transact in those 7.5 hours.",
      expectedActions: ["Convene IMT", "Make PITR decision and record in log", "Plan write-window reconciliation"],
      objectives: ["Test high-stakes recovery decision-making"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["COO"],
    },
    {
      eventNo: 3,
      scheduledTime: "13:00",
      title: "PITR complete — reconciliation begins",
      description:
        "Database restored to 01:55 state. All writes since then need to be replayed from application logs. Some writes are deterministic (a payment send), others are not (a balance check that now returns a different number). Reconciliation team works through 6,200 in-flight transactions manually.",
      expectedActions: ["Reconciliation workflow established", "Customer-affected list compiled for proactive comms"],
      objectives: ["Test reconciliation discipline"],
      senderRoleTitle: "CFO",
      toRoleTitles: ["CRO", "Treasury Lead"],
      ccRoleTitles: [],
    },
    {
      eventNo: 4,
      scheduledTime: "16:00",
      title: "Customer comms",
      description:
        "All affected customers get a personal email + SMS. Press statement issued acknowledging the migration error. FCA notified.",
      expectedActions: ["Customer-comms approved by CCO + CRO + Head of Compliance"],
      objectives: ["Test crisis comms quality under sensitive subject"],
      senderRoleTitle: "CCO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Comms Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "11:00",
      summary: "Mortgage application impact",
      description:
        "A small number of mortgage applications today used the corrupted balance check as part of affordability assessment. ~40 applications are now in an indeterminate state. Mortgage operations team needs guidance.",
      senderRoleTitle: "Head of Compliance",
      toRoleTitles: ["CRO"],
      ccRoleTitles: [],
    },
    {
      injectNo: 2,
      scheduledTime: "12:30",
      summary: "Social media spread",
      description:
        "A customer posts a screenshot of their £0 balance to Twitter. Tweet gets 4,000 retweets in 30 minutes. Comments include 'this happened to me too' from real customers.",
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["CCO", "Comms Lead"],
      ccRoleTitles: ["CEO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Migration discipline", text: "What's your policy for dry-running schema migrations against production data shape?" },
    { category: "PITR", text: "When was PITR last tested end-to-end against a realistic dataset?" },
    { category: "Customer", text: "What's your stance on proactive notification for data-integrity incidents?" },
  ],
  debriefQuestions: [
    { category: "Prevention", text: "What review or automation would have caught the bad WHERE clause?" },
    { category: "Recovery", text: "Was the reconciliation accurate and complete?" },
  ],
};
