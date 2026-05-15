import type { ScenarioTemplate } from "../types";

export const tier2BaasSoftFail: ScenarioTemplate = {
  slug: "tier2-baas-soft-fail",
  title: "BaaS Partner Soft Fail — Intermittent Payment Drops",
  category: "Third Party",
  tier: "TIER_2",
  srrRef: "3.4",
  firmProfile: "Digital challenger / BaaS-dependent fintech",
  background:
    "Your sponsor bank (ClearBank) experiences a multi-hour degradation that doesn't break the service entirely — 1 in every 6 outbound payments silently fails with a 'temporary processing error'. Customers retry, half succeed, the others raise complaints. Your status page is green because the vendor's status page is green. Detection comes from the contact-centre noticing a complaint pattern, not from your own observability.",
  agenda:
    "10:00 Pattern emerges in contact centre\n10:30 Engineering correlates with sponsor bank\n11:30 Decide degraded-mode comms\n13:00 Sponsor bank stable\n14:00 Reconciliation + customer remediation",
  dDayDate: "2026-09-08T10:00:00Z",
  durationMin: 180,
  cause:
    "ClearBank's payments service is experiencing intermittent 502s on its outbound endpoint — affecting roughly 16% of requests. Their status page is GREEN because their alerting threshold is 25%. They are aware and working it but have not declared an incident. Your own SLO dashboard is happy because the failure rate is below your alert threshold.",
  impactNarrative:
    "Customers initiating outbound payments see a generic 'temporary error' on the 1-in-6 that fails. Most retry successfully on attempt 2. But every failure also generates a complaint. The contact centre receives 50+ calls in 30 minutes about 'payment didn't go through but then it did'. Treasury reconciliation later reveals 23 customers were double-charged (first attempt actually settled, retry settled too).",
  characteristics: [
    "Below-threshold failures — looks like noise on every dashboard.",
    "Customer-experience signal beats engineering signal.",
    "Vendor status page is misleading.",
    "Reconciliation tail is much bigger than the technical issue.",
  ],
  assumptions: [
    "Sponsor bank's status page is updated based on their thresholds, not yours.",
    "Customer-facing UI shows a generic error on failure, not a useful one.",
    "Retry logic is on the customer (manual), not built into the app.",
  ],
  takeaways:
    "Vendor status pages tell you about the vendor's experience, not yours. Customer-experience signals (contact-centre call volumes, app store reviews, social sentiment) often beat technical signals for sub-threshold issues. Below-threshold failures still generate reimbursement obligations.",
  stressVariables: [
    { name: "Failure rate", options: ["5%", "16%", "30%", "50%"] },
    { name: "Vendor responsiveness", options: ["Acknowledges immediately", "30-min lag", "Hours", "Denies issue"] },
  ],
  caseStudy: {
    title: "Various neobanks — sponsor bank degradations (2022-2024)",
    causation:
      "Several UK neobanks have publicly reported customer-visible payment failures triggered by intermittent sponsor-bank degradations that didn't meet the vendor's own incident threshold.",
    impactScale: "Tens of thousands of customers affected per event. Refund and goodwill costs typically £100k-£500k per incident.",
    duration: "Typically 2-6 hours from customer detection to vendor acknowledgement.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Domestic payments (Faster Payments)", impactToleranceMin: 90, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "10:00",
      title: "Complaint pattern noticed",
      description:
        "Contact-centre supervisor flags an unusual spike in 'my payment failed but then worked' calls. Engineering checks dashboards — all green. Customer Ops Lead manually pulls failed-payment IDs from the last 30 minutes and finds 38 failures clustered on the outbound payments path.",
      expectedActions: ["Cross-team escalation between CX and engineering", "Engage sponsor bank's on-call support"],
      objectives: ["Test the customer-signal → engineering loop"],
      senderRoleTitle: "Customer Ops Lead", toRoleTitles: ["CTO"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2, scheduledTime: "10:30",
      title: "Sponsor bank acknowledges privately",
      description:
        "Engineering opens a P2 with the sponsor bank. They confirm they're seeing a degradation internally and are working it — but their status page stays green because they're below their own threshold. They estimate 2-3 more hours.",
      expectedActions: ["Decide internal vs vendor-led comms", "Inform CCO of customer impact"],
      objectives: ["Test 'vendor says it's fine but it's not' decision-making"],
      senderRoleTitle: "CTO", toRoleTitles: ["CEO", "CRO", "CCO"], ccRoleTitles: [],
    },
    {
      eventNo: 3, scheduledTime: "13:00",
      title: "Vendor stable, reconciliation reveals double-charges",
      description:
        "Failure rate returns to baseline. Treasury runs a reconciliation and identifies 23 customers where the first attempt actually settled despite the error, and the customer's retry also settled. £18,400 of duplicate transfers.",
      expectedActions: ["Refund queue prepared", "Apology comms approved by CCO + CRO"],
      objectives: ["Test proactive customer-remediation"],
      senderRoleTitle: "CFO", toRoleTitles: ["CRO", "CCO"], ccRoleTitles: ["CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "10:10", kind: "TECHNICAL",
      summary: "Datadog: outbound-payment p99 latency anomaly",
      description:
        "Datadog raises an anomaly-detection alert on the outbound-payment endpoint p99 latency: 240ms baseline, currently 1.2s with high variance. Error rate is unchanged. Engineer initially dismisses as 'a weird blip'.",
      relation: "Precedes the team realising it's a sponsor-bank issue. Tests whether anomaly alerts get triaged.",
      senderRoleTitle: "ISM", toRoleTitles: ["Sn.TPM"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "10:25", kind: "TECHNICAL",
      summary: "PagerDuty: budget burn rate alert on payments SLO",
      description:
        "Your payments SLO error budget has burned 12% in the last 30 minutes — alert thresholds are tuned to fire only at 25% burn over 1 hour. Alert is INFO-level, not paging.",
      relation: "Highlights gap between SLO tuning and real customer-impact threshold.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "11:00", kind: "BUSINESS",
      summary: "Twitter complaint thread gaining traction",
      description:
        "A customer tweets 'Why does @yourbank keep failing my payments?' with a screenshot. 47 replies in 20 minutes from other customers saying 'same here'. A consumer-finance journalist with 80k followers retweets.",
      relation: "Tests social-media-aware comms playbook.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "Comms Lead"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 4, scheduledTime: "12:15", kind: "BUSINESS",
      summary: "FCA Op Resilience desk emails",
      description:
        "FCA emails noting they've seen the social-media thread and want a status update by end of day. Wording is light but it's clearly the regulator monitoring.",
      relation: "Tests regulator-facing comms quality under sub-threshold conditions.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "13:30", kind: "TECHNICAL",
      summary: "Reconciliation script flags 23 double-settlements",
      description:
        "Automated reconciliation surfaces 23 transactions where both the user's first (errored) attempt and their retry settled. Total £18,400. Each one needs a manual refund decision.",
      relation: "Tests reconciliation workflow under volume.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CFO", "CRO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "How do customer-experience signals reach engineering, at what latency?" },
    { category: "Vendor", text: "When your vendor's status page is green and yours is unhappy, who wins the argument?" },
    { category: "Comms", text: "What do customers hear in the first 30 minutes of a sub-threshold issue?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Did the team trust dashboards or customer signal first?" },
    { category: "Vendor", text: "Was sponsor-bank coordination friction the cause of recovery delay?" },
  ],
};
