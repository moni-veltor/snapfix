import type { ScenarioTemplate } from "../types";

export const tier3UnderwritingDrift: ScenarioTemplate = {
  slug: "tier3-underwriting-drift",
  title: "Underwriting Model Drift — Accepting Loss-Making Risks",
  category: "Technology & Data (Cyber)",
  tier: "TIER_3",
  srrRef: "3.3",
  firmProfile: "Small-mid insurer with ML-augmented pricing",
  background:
    "Your quote-and-bind pricing model uses an in-house ML model retrained quarterly. The latest retraining used a new third-party data source for postcode-level claim frequency. The source's recent data has a labelling change that effectively reset many postcodes' risk scores to baseline. The new model is pricing high-risk postcodes 30-40% below technical price. Over 18 days, the firm has bound 8,200 policies that are projected to be loss-making in aggregate by £2.4m.",
  agenda: "Day 0 New model deployed\nDay 18 Pricing-anomaly alert\nDay 18 PM Decision: pause or hot-fix\nDay 19 Communications\nDay 30 Portfolio remediation\nDay 60 Full PIR",
  dDayDate: "2026-05-20T10:00:00Z",
  durationMin: 180,
  cause:
    "The vendor providing postcode-level claim frequency data quietly changed their methodology — they now exclude certain claim types from their frequency calculations and didn't flag the change to consumers. The training pipeline ingested the new data as if it were the same. The model 'learned' that high-risk postcodes had become safer; the live model started under-pricing them.",
  impactNarrative:
    "8,200 new policies bound in 18 days. Expected loss ratio for the affected book is 132% (vs 78% target). £2.4m expected loss. Reserving needs to be increased. The firm has a duty to honour the contracts already issued. Reinsurance recovery may apply but the dispute exposure is real. The board will need to be briefed before quarter-end.",
  characteristics: [
    "Silent — model is technically healthy, just deciding wrong.",
    "Long detection window — needs portfolio-level signal, not transactional.",
    "Vendor-driven, not internal.",
    "Honour-the-contract obligation creates real loss.",
  ],
  assumptions: [
    "Model is retrained quarterly with a 'champion-challenger' comparison but no fairness/drift gate.",
    "Vendor data feed has no contractual change-notification SLA.",
    "Policies once bound cannot be unilaterally voided.",
  ],
  takeaways:
    "Vendor data drift is invisible until it hits the books. Model-governance frameworks need a 'data-source-stability' check, not just model-output checks. Champion-challenger comparison should include test-set sourced from a different vendor.",
  stressVariables: [
    { name: "Expected loss", options: ["£200k", "£2.4m", "£15m"] },
    { name: "Detection lag", options: ["1 week", "3 weeks", "Quarter-end"] },
  ],
  caseStudy: {
    title: "UK motor insurance — postcode pricing controversies (2020-2023)",
    causation:
      "Multiple UK motor insurers have faced regulatory scrutiny over postcode-pricing methodologies. Several have publicly disclosed material adjustments to pricing models after detecting unintended demographic effects.",
    impactScale: "Multi-million pound reserving adjustments; sustained regulatory engagement on fair-value.",
    duration: "Months to fully remediate; lasting changes to model-governance practice.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Quote and bind", impactToleranceMin: 720, criticality: "HIGH" },
    { code: "IBS_02", name: "Pricing model governance", impactToleranceMin: 1440, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "10:00",
      title: "Pricing-anomaly alert from the actuarial team",
      description:
        "Monthly actuarial review notices the quote-acceptance rate has jumped 14% in the affected postcode tier — a quiet but significant signal. Investigation reveals technical-price-to-quoted-price ratio has shifted materially.",
      expectedActions: ["Quantify the affected book", "Pause new bindings in affected postcodes pending review"],
      objectives: ["Test portfolio-signal escalation"],
      senderRoleTitle: "Head of Underwriting", toRoleTitles: ["CRO", "CFO"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 2, scheduledTime: "15:00",
      title: "Model rollback + new-business pause",
      description:
        "IMT decides to roll back to the previous-quarter model and pause new business in affected postcodes for 48 hours. Pricing team works overnight to manually re-price quotes in flight.",
      expectedActions: ["Pause approved", "Customer comms drafted for in-flight quotes"],
      objectives: ["Test the 'stop-the-line' muscle on a non-emergency business problem"],
      senderRoleTitle: "CRO", toRoleTitles: ["CEO", "Head of Underwriting"], ccRoleTitles: [],
    },
    {
      eventNo: 3, scheduledTime: "Day 14",
      title: "Reserving adjustment + board paper",
      description:
        "After 2 weeks of detailed analysis, the team confirms £2.4m additional reserving required. Board paper goes out. Reinsurance recovery being pursued separately. New control framework being designed.",
      expectedActions: ["Board chair pre-briefed", "PRA written notification"],
      objectives: ["Test substantial-financial-impact governance"],
      senderRoleTitle: "CFO", toRoleTitles: ["CEO", "CRO"], ccRoleTitles: [],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "10:30", kind: "TECHNICAL",
      summary: "MLflow: model serving metrics healthy",
      description:
        "Your MLflow + Grafana dashboard shows the model is technically perfectly healthy: inference latency normal, throughput normal, no exceptions. The drift detector (KL divergence on input features) is below threshold because feature distributions look similar — only the labels have shifted.",
      relation: "Highlights the model-ops vs model-outcome gap.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "11:30", kind: "TECHNICAL",
      summary: "Vendor data feed: no change reported",
      description:
        "Querying the vendor's change-log API returns no change events for the affected period. The methodology change was a 'silent rebaseline' that they consider routine. Their support email response cites a vague 'methodology refresh' from a quarterly update note buried in their portal.",
      relation: "Tests vendor-change-notification SLA.",
      senderRoleTitle: "Head of Underwriting", toRoleTitles: ["CRO"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 3, scheduledTime: "14:00", kind: "BUSINESS",
      summary: "Reinsurer informal warning",
      description:
        "Your reinsurer's relationship manager calls. They've noticed unusual policy-mix in your last bordereau and are 'concerned'. They want a verbal explanation before formalising anything.",
      relation: "Tests reinsurer-relationship management during model failure.",
      senderRoleTitle: "CFO", toRoleTitles: ["CEO", "CRO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Day 4", kind: "BUSINESS",
      summary: "FCA Consumer Duty angle",
      description:
        "FCA emails noting that customers in the affected postcodes were getting a 'good deal' that's now being withdrawn. They want to understand the firm's stance under Consumer Duty fair-value rules. The dispute is now also: are existing policyholders worse off if we re-price them at renewal?",
      relation: "Adds a Consumer Duty layer to a pricing-failure scenario.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "Day 7", kind: "TECHNICAL",
      summary: "Champion-challenger pipeline failure",
      description:
        "When investigating the model, the team discovers that the champion-challenger comparison pipeline that's supposed to catch this hasn't been running for 6 weeks — silently failed when the data team migrated to a new orchestrator. No one noticed.",
      relation: "Reveals an unrelated control failure that contributed.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO", "CRO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Model risk", text: "Does your model-governance framework cover data-source stability, not just model-output stability?" },
    { category: "Vendor", text: "Which of your data vendors have a contractual change-notification SLA, and how do you test it?" },
    { category: "Recovery", text: "When you pause new business, how do you communicate to brokers / customers and what's the customer-impact?" },
  ],
  debriefQuestions: [
    { category: "Lessons", text: "What additional control would have caught this 17 days earlier?" },
    { category: "Pricing", text: "How does the firm explain a pricing change to existing customers without admitting 'we got it wrong'?" },
  ],
};
