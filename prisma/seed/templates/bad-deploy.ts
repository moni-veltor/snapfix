import type { ScenarioTemplate } from "../types";

export const badDeploy: ScenarioTemplate = {
  slug: "bad-deploy-slow-rollback",
  title: "Bad Deploy, Slow Rollback",
  category: "Cloud & Infrastructure",
  srrRef: "3.2",
  background:
    "A routine Friday-morning deploy of the payments service ships a subtle bug: a feature flag is read incorrectly in one code path, causing 1 in 30 outbound payments to be rejected with a generic error. The CI passed, canary metrics passed (the bad path is rare), and the deploy went out to 100%. Customers and the contact centre detect it before the team does. Rollback is theoretically a single command — but the deploy also altered the database schema and rolling back invalidates several hundred in-flight transactions.",
  agenda:
    "11:00 Deploy lands\n12:30 Contact centre notices pattern\n13:00 Engineering pulled into incident\n14:00 Rollback decision\n15:30 Rollback + reconciliation\n17:00 Customer comms close-out",
  dDayDate: "2026-10-16T11:00:00Z",
  durationMin: 150,
  cause:
    "A feature-flag refactor changed the way a boolean was read from configuration. The new code path treats the absence of the flag as 'false' (correct in dev/test) but the production config file has the flag named with a typo that was previously silently mapped via a now-removed compatibility shim. Result: 3.3% of outbound payments fail with a 'temporary processing error' message.",
  impactNarrative:
    "Customers who fail mostly retry and succeed on the second attempt — masking the problem in aggregate metrics. Contact-centre call volume rises 40% with reports of 'sometimes my payment fails'. Engineering on-call sees a 0.3% error rate (well below SLO) and doesn't escalate. Customer Ops Lead correlates the call pattern with the deploy and pushes back to engineering. By the time rollback is on the table, the schema migration that shipped alongside has run, and rollback is no longer trivial.",
  characteristics: [
    "Slow-burn — failures look like noise.",
    "Mismatch between technical and customer-experience signals.",
    "Coupled deploy — code + schema together, complicating rollback.",
    "Friday-afternoon decision under pressure to leave on time.",
  ],
  assumptions: [
    "Canary deploys exist but the bug is rare enough to slip past canary metrics.",
    "Schema migrations and code deploys are co-tagged for rollback purposes.",
    "There is no 'forward-fix' patch path that's faster than rollback.",
  ],
  takeaways:
    "Customer-experience metrics matter as much as technical SLOs. Rollback as a paper procedure is not the same as rollback as a tested capability. Friday deploys are a cultural choice, not a technical one.",
  stressVariables: [
    { name: "Detection latency", options: ["10 min", "1 hour", "4 hours"] },
    { name: "Rollback complexity", options: ["Code only", "Code + schema (compatible)", "Code + schema (breaking)"] },
  ],
  caseStudy: {
    title: "Knight Capital — Algorithm deploy (1 August 2012)",
    causation:
      "Knight Capital deployed an updated trading algorithm to only 7 of 8 production servers, leaving a legacy code path active on the 8th. The legacy code interacted disastrously with the new code.",
    impactScale: "$440 million loss in 45 minutes. Knight Capital was effectively destroyed by the incident.",
    duration: "45 minutes to detect and stop; firm acquired within months.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: true,
    thirdParty: false,
  },

  ibsList: [
    { code: "IBS_01", name: "Payments (Faster Payments)", description: "Domestic GBP payments.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Mobile and online banking", description: "Customer access.", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "12:30",
      title: "Contact centre detects pattern",
      description:
        "Contact-centre supervisor notices 35 'payment failed but I tried again and it worked' calls in 30 minutes. Engineering metrics show 0.3% error rate — within SLO. Customer Ops Lead manually pulls failed-payment IDs and notices they cluster on a specific code path.",
      expectedActions: ["Cross-team correlation between CX and engineering signals"],
      objectives: ["Detect 'invisible' bugs via customer signal"],
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["CTO", "Sn.TPM"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "14:00",
      title: "Rollback decision under pressure",
      description:
        "Engineering confirms the deploy is the cause. Rollback is theoretically a single command but a schema migration ran alongside. Two options: (a) rollback both and manually reconcile 320 in-flight transactions; (b) forward-fix (push corrected config) in ~30 min, lower risk. Time is 14:00 on a Friday.",
      expectedActions: ["Decision recorded in decision log with named approver"],
      objectives: ["Test rollback-vs-forward-fix decision tree"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CRO"],
      ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 3,
      scheduledTime: "15:30",
      title: "Reconciliation surfaces unexpected case",
      description:
        "Reconciliation script identifies 8 transactions where the customer saw 'failed', retried, and the second attempt succeeded — but the first attempt also actually settled. 8 customers double-paid. Need to refund proactively.",
      expectedActions: ["Refund queue prepared", "Customer-comms tailored apology drafted"],
      objectives: ["Test proactive customer-remediation muscle"],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CCO", "CFO"],
      ccRoleTitles: ["CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "13:30",
      summary: "Internal Slack pile-on",
      description:
        "Senior leaders in #incidents start asking 'why is this taking so long?'. The on-call engineer feels rushed and considers shortcuts.",
      senderRoleTitle: "CEO",
      toRoleTitles: ["CTO"],
      ccRoleTitles: [],
    },
    {
      injectNo: 2,
      scheduledTime: "16:00",
      summary: "Friday evening fatigue",
      description:
        "Reconciliation isn't complete. The on-call shift ends in 90 minutes. Handover quality is the difference between Monday morning being calm or chaotic.",
      senderRoleTitle: "Sn.TPM",
      toRoleTitles: ["CTO"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "How do customer-experience signals reach engineering, and at what latency?" },
    { category: "Rollback", text: "When was your rollback procedure last exercised end-to-end?" },
    { category: "Culture", text: "Do you deploy on Fridays, and if so what's your safety net?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Could the bug have been caught in canary? What would have caught it?" },
    { category: "Customer impact", text: "Were customers proactively informed of double payments, or did they have to chase?" },
  ],
};
