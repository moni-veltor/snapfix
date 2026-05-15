import type { ScenarioTemplate } from "../types";

export const tier2AiFraudFalsePositive: ScenarioTemplate = {
  slug: "tier2-ai-fraud-false-positive",
  title: "AI Fraud Model False-Positive Surge",
  category: "Technology & Data (Cyber)",
  tier: "TIER_2",
  srrRef: "3.3",
  firmProfile: "Digital challenger / fintech with in-house ML",
  background:
    "A scheduled retraining of your fraud-detection model ships at 02:00. The model is auto-deployed via your standard pipeline. By 09:00, 40% of legitimate customer logins are being challenged with a step-up, and 4% are being blocked outright as 'high risk'. The training data accidentally included a synthetic-fraud dataset that taught the model to flag normal patterns as anomalous.",
  agenda: "02:00 Model retrained\n07:00 First customer reports\n09:30 Engineering correlates with model deploy\n10:30 Decide rollback vs override\n12:00 Old model restored\n15:00 Audit + remediation",
  dDayDate: "2026-11-04T07:00:00Z",
  durationMin: 180,
  cause:
    "A nightly retraining job included a new synthetic-fraud augmentation dataset for the first time. The augmentation set was poorly labelled — many legitimate-but-unusual patterns were tagged as fraud. The model learned to flag standard customer behaviour (e.g. logging in from a different city on holiday) as anomalous. Auto-deployment promoted the model to production without a fairness or drift check.",
  impactNarrative:
    "Legitimate customers are blocked or step-up-challenged en masse. The contact centre is overwhelmed. Several thousand customers are unable to access their accounts. Twitter spreads. The model is deployed as a hot-path service — rolling back requires careful coordination with the fraud-operations team to make sure unrolled-back decisions are reviewed.",
  characteristics: [
    "AI/ML failure — opaque to traditional debugging.",
    "Asymmetric harm — disproportionately affects customers who travel or have unusual schedules.",
    "Auto-deploy pipeline removed human-in-the-loop.",
    "Detection lag — model didn't 'fail', it just decided differently.",
  ],
  assumptions: [
    "Model is deployed via a CI/CD pipeline that includes no automated fairness or drift gate.",
    "Previous-version model is still available in model registry for rollback.",
    "Customer-facing UI doesn't tell the customer why they were blocked.",
  ],
  takeaways:
    "AI/ML in customer-facing decisions needs the same kind of canary + rollback discipline as any other production system, plus model-specific gates (fairness, drift, bias). Synthetic data is powerful and dangerous. Deploy reviews must include the data scientist who trained the model, not just the engineer who packaged it.",
  stressVariables: [
    { name: "False-positive rate", options: ["5%", "15%", "40%", "60%"] },
    { name: "Rollback path", options: ["Tested, <30 min", "Documented, ~2h", "Never exercised"] },
  ],
  caseStudy: {
    title: "Apple Card credit limit bias (2019)",
    causation:
      "Apple Card's credit-limit decisioning algorithm was publicly accused of gender bias. The model's actual decision logic was opaque, and Goldman Sachs (the issuer) struggled to explain individual outcomes.",
    impactScale:
      "Sustained reputational and regulatory pressure. New York Department of Financial Services opened an investigation.",
    duration: "Months of pressure; lasting changes to how credit decisions are explained.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: false },

  ibsList: [
    { code: "IBS_01", name: "Customer authentication", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Fraud screening", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "07:00",
      title: "Contact centre overwhelmed",
      description:
        "Call volume is 5× normal. Common complaint: 'I can't log in / I'm being asked for ID / my transaction was blocked'. Initial engineering triage says infrastructure is healthy. CX teams correlate the spike to a specific 02:00 deploy of the fraud model.",
      expectedActions: ["Cross-correlate CX signal with deploy timeline", "Page the ML team's on-call"],
      objectives: ["Test the ML-team escalation muscle"],
      senderRoleTitle: "Customer Ops Lead", toRoleTitles: ["CTO", "ISM"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2, scheduledTime: "09:30",
      title: "Model identified as cause",
      description:
        "ML team confirms the new model is rejecting at a much higher rate than the previous version. Data-science forensics traces it to the synthetic dataset. They can roll back to the previous model. The pipeline supports it but it hasn't been exercised in production.",
      expectedActions: ["Decide: rollback vs override threshold", "Communicate plan to comms team"],
      objectives: ["Test rollback discipline on an ML asset"],
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO", "CRO"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 3, scheduledTime: "12:00",
      title: "Old model restored",
      description:
        "Rollback completes. New logins no longer over-blocked. But the customers blocked during the 5-hour window now need their decisions reviewed and many need their accounts unlocked. Fraud-operations queue is 8,000 items deep.",
      expectedActions: ["Plan the unlock queue", "Customer-comms apology"],
      objectives: ["Test post-event remediation workflow"],
      senderRoleTitle: "CRO", toRoleTitles: ["CEO", "CCO"], ccRoleTitles: ["Head of Compliance"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "07:30", kind: "TECHNICAL",
      summary: "MLflow: model serving p50 inference time normal",
      description:
        "MLflow + your model-serving dashboard show no operational anomalies: latency is normal, error rate is normal, request volume is normal. By every standard ML-ops measure, the model is healthy.",
      relation: "Highlights the gap between ops-health and decision-quality.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "08:15", kind: "TECHNICAL",
      summary: "Datadog: 'login_blocked_count' metric 8× baseline",
      description:
        "Custom Datadog metric you added six months ago — 'fraud_block_rate_per_login' — is firing as an outlier. It was a tier-3 alert (Slack only). Now obviously a P1 signal in retrospect.",
      relation: "Tests whether business-outcome metrics get the priority they deserve.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: ["ISM"],
    },
    {
      injectNo: 3, scheduledTime: "10:00", kind: "BUSINESS",
      summary: "Customer complaint with disability angle",
      description:
        "A vocal customer complaint on social media: their wheelchair-using parent was locked out and couldn't access funds for transport. The story is being picked up by a consumer-rights journalist. Consumer Duty implications surface.",
      relation: "Tests vulnerable-customer + Consumer Duty response.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "Head of Compliance"], ccRoleTitles: ["CRO", "CEO"],
    },
    {
      injectNo: 4, scheduledTime: "11:00", kind: "TECHNICAL",
      summary: "Model-serving pipeline: rollback hits stale cache",
      description:
        "The rollback completes the model swap but a Redis cache of recent customer 'risk profile' values is still serving high-risk scores for ~40 minutes. Customers still see step-ups even though the new (old) model is live.",
      relation: "Layer of recovery complexity — caching makes rollback non-atomic.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO", "Sn. DA/E"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "14:00", kind: "BUSINESS",
      summary: "FCA wants a written explanation",
      description:
        "FCA emails noting they're aware of the customer-impact reports and want a written summary of root cause, customer-impact assessment, and remediation plan by end of next business day. They're also asking about model governance.",
      relation: "Tests model-risk-management answerability.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Governance", text: "Do you have a fairness / drift gate in your ML deployment pipeline?" },
    { category: "Recovery", text: "When was your ML rollback path last exercised?" },
    { category: "Consumer Duty", text: "If your model blocks a vulnerable customer, who reviews the decision and at what SLA?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Could you have caught this in canary, and what would the canary metric have been?" },
    { category: "Governance", text: "What model-risk-management gap would have prevented this?" },
  ],
};
