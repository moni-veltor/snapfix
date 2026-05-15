import type { ScenarioTemplate } from "../types";

export const tier3BordereauFailure: ScenarioTemplate = {
  slug: "tier3-bordereau-failure",
  title: "Bordereau Pipeline Failure — Broker Data Feed Corrupted",
  category: "Cloud & Infrastructure",
  tier: "TIER_3",
  srrRef: "3.3, 3.4",
  firmProfile: "Small-mid insurer with delegated-authority brokers",
  background:
    "Monthly bordereau files from your top 3 delegated-authority brokers arrive in a malformed format. A silent upgrade in one broker's reporting system has changed the column order and dropped two fields. Your automated ingestion pipeline accepts the file, parses what it can, and updates the policy/premium register with incomplete data. The issue is undetected for 11 days, during which 14,000 policies have been booked with incorrect commission allocations and 38 high-value risks are missing key data fields.",
  agenda: "Day 0 Bad bordereau ingested\nDay 11 Discrepancy detected\nDay 11 PM Stop the line\nDay 12 Reconciliation begins\nDay 18 Full data corrected\nDay 25 PIR + control redesign",
  dDayDate: "2026-04-15T11:00:00Z",
  durationMin: 180,
  cause:
    "One of your top brokers upgraded their internal bordereau-generation system. The new format technically validates against your old schema (no breaking-change error) but reorders columns. Your ingest pipeline uses positional parsing for 'compatibility'. The result is silent data corruption.",
  impactNarrative:
    "14,000 policies booked over the 11-day window have incorrect commission splits — total commission misallocation £180k. 38 policies are missing required regulatory data fields. Premium reconciliation is off by £42k. Your treasury reports to the broker are incorrect. The data quality has cascaded into MI and the CFO's monthly board pack. The CFO finds the discrepancy when a number doesn't match a side-channel check.",
  characteristics: [
    "Silent — system says 'ok' for 11 days.",
    "Cascades into MI, regulatory returns, broker reconciliations.",
    "Data-integrity not availability — system is up, data is wrong.",
    "Vendor change with no inbound notification.",
  ],
  assumptions: [
    "Bordereau is the primary mechanism for delegated-authority business data flow.",
    "Ingestion pipeline uses positional parsing for legacy reasons.",
    "Regulatory returns are due monthly; quarter-end is approaching.",
  ],
  takeaways:
    "Positional parsing of vendor-supplied data is a long-lived footgun. Schema-validation gates should fail loudly, not silently fill in defaults. Vendor change-notification SLAs in contracts get tested only when they fail.",
  stressVariables: [
    { name: "Detection lag", options: ["Same day", "5 days", "11 days", "Quarter-end"] },
    { name: "Policies affected", options: ["100s", "1000s", "10,000s"] },
  ],
  caseStudy: {
    title: "Various Lloyd's syndicates — bordereau quality incidents (2019-2023)",
    causation:
      "Multiple Lloyd's syndicates have reported persistent data-quality issues with bordereau from delegated-authority brokers. PRA has highlighted this as a sector-wide control gap.",
    impactScale: "Range from £100k commission misallocations to multi-million pound exposure-data corrections requiring formal regulator engagement.",
    duration: "Typically detected weeks to months after the underlying corruption.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Underwriting & policy admin", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_02", name: "Regulatory reporting", impactToleranceMin: 4320, criticality: "HIGH" },
    { code: "IBS_03", name: "Broker reconciliation", impactToleranceMin: 2880, criticality: "MEDIUM" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "11:00",
      title: "CFO finds the discrepancy",
      description:
        "CFO running standard month-end checks notices the commission-payable total doesn't match the policy-by-policy commission sum by £180k. She traces it back to specific bordereau files; sampling reveals consistent column-shift errors.",
      expectedActions: ["Stop the ingestion pipeline for the affected broker", "Notify head of broker relationships"],
      objectives: ["Test the data-quality finding → containment loop"],
      senderRoleTitle: "CFO", toRoleTitles: ["CTO", "CRO"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 2, scheduledTime: "16:00",
      title: "Scope assessment",
      description:
        "Engineering and data-science team have replayed the bordereau files. 14,000 affected policies; 38 with missing required fields. Regulatory return for the quarter is incorrect. Broker has been notified and is investigating their own side.",
      expectedActions: ["Decide whether to delay regulatory return submission", "Begin policy-by-policy correction"],
      objectives: ["Test scope-quantification under uncertainty"],
      senderRoleTitle: "CRO", toRoleTitles: ["Head of Compliance", "CFO"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 3, scheduledTime: "Day 18 15:00",
      title: "Full reconciliation complete",
      description:
        "Policy data corrected. Broker has reissued bordereau in the original format. Commission settlements adjusted. Regulator pre-notification sent. The team is exhausted but the books match again.",
      expectedActions: ["Schedule PIR", "Design schema-validation gate"],
      objectives: ["Test 10-business-day PIR readiness"],
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO"], ccRoleTitles: ["CEO"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "12:30", kind: "TECHNICAL",
      summary: "Airflow job: bordereau-ingest success rate 100%",
      description:
        "Your Airflow / dbt pipeline reports the bordereau-ingest job as 100% success rate over the last 11 days. No errors logged. The 'data-quality' monitor is binary (file processes or doesn't) and doesn't check column semantics.",
      relation: "Highlights the gap between 'system says OK' and 'data is OK'.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "13:00", kind: "TECHNICAL",
      summary: "Sentry: zero exceptions on ingestion path",
      description:
        "Sentry shows zero exceptions on the ingestion code path for the affected window. The code didn't throw — it cheerfully wrote bad data. Existing tests don't have a positional-vs-named-column case.",
      relation: "Reinforces that defensive parsing > monitoring.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO", "Sn. DA/E"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "Day 12 10:00", kind: "BUSINESS",
      summary: "PRA Op Resilience inbound",
      description:
        "PRA emails: 'We understand your firm has identified data-quality issues affecting policy data. Please confirm whether this affects regulatory returns and on what timeline you'll be in a position to resubmit'.",
      relation: "Tests PRA-facing comms quality on a data-integrity event.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Day 13 09:30", kind: "BUSINESS",
      summary: "Broker pushes back on responsibility",
      description:
        "The broker's COO emails. They acknowledge the column-shift but argue your contract assigns 'reasonable validation' to you. They're willing to help but won't accept the £180k commission impact.",
      relation: "Tests contractual-counterparty negotiation.",
      senderRoleTitle: "CFO", toRoleTitles: ["CEO"], ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 5, scheduledTime: "Day 14 15:00", kind: "TECHNICAL",
      summary: "Data-warehouse cascade",
      description:
        "The corrupted policy data has fed into your data warehouse. Last week's exposure-report (presented to the board) used bad numbers. Re-running the report requires backfilling 11 days of DBT pipelines.",
      relation: "Layer of cascade-into-MI.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CFO", "CTO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Schema discipline", text: "Where in your pipeline do you validate vendor-supplied data semantically, not just structurally?" },
    { category: "Vendor change", text: "What's your vendor change-notification SLA, and is it tested?" },
    { category: "Recovery", text: "How fast can you backfill a corrupted data-warehouse window?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Could anything other than a human cross-check have caught this faster?" },
    { category: "Cost", text: "Where did the cost actually land — broker, customer, or balance sheet?" },
  ],
};
