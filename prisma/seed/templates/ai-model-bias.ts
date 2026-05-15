import type { ScenarioTemplate } from "../types";

export const aiModelBias: ScenarioTemplate = {
  slug: "ai-model-bias",
  title: "AI Model Bias Discovered — Lending Decisions Skewed",
  category: "AI & Algorithmic Risk",
  srrRef: "3.3, 3.6",
  background:
    "A third-party fairness-monitoring vendor that you piloted 6 months ago flags significant disparate-impact in your AI-augmented unsecured-lending decisions. Approval rates differ materially across a protected characteristic in ways that aren't fully explained by legitimate underwriting factors. The vendor's report is statistically robust. They've shared it with you in advance of a press article they're publishing in 5 days as part of their public 'AI accountability index'. The clock is now ticking on three fronts: FCA Consumer Duty + EU AI Act + media.",
  agenda: "Day 0 Vendor pre-disclosure\nDay 1 Internal validation\nDay 2 Decision: pause + remediate\nDay 3 Regulator engagement\nDay 5 Media\nDay 30 Model rebuild + retro",
  dDayDate: "2026-10-09T11:00:00Z",
  durationMin: 240,
  cause:
    "Your in-house lending model uses ~80 features, some of which are correlated with a protected characteristic through legitimate-seeming intermediate variables (postcode, employment-sector, debit-card spend patterns). Your model has been treated as 'compliant by construction' because no protected characteristic is a direct input. The vendor's analysis shows clear disparate impact at the decision-rate level.",
  impactNarrative:
    "Approximately 12,000 affected applicants over 9 months. Of those, ~1,800 customers were declined for reasons that fairness analysis suggests are demographically correlated. Several have complained over the period. Internal review confirms the vendor's analysis is robust. Pausing the AI augment requires reverting to a slower human-led decisioning path with significantly lower volume capacity.",
  characteristics: [
    "Pre-disclosure clock from external researcher.",
    "Triple regulatory exposure (FCA Consumer Duty, EU AI Act, equality legislation).",
    "Model is technically working — the failure is ethical / regulatory.",
    "Pause has operational consequences (manual decisioning).",
  ],
  assumptions: [
    "Lending model is the firm's primary route to consumer credit decisions.",
    "Manual decisioning capacity is ~30% of current automated throughput.",
    "Model has no protected-characteristic feature as direct input.",
  ],
  takeaways:
    "Fairness in AI is not 'no protected-characteristic feature' — it's 'no disparate-impact in outcome'. Fairness-monitoring needs to be a first-class capability, not a one-off audit. Customer remediation for past decisions is a real cost.",
  stressVariables: [
    { name: "Disparate-impact ratio", options: ["1.2× (borderline)", "1.5×", "2.0×+ (clear)"] },
    { name: "Affected applicants", options: ["1,000", "12,000", "50,000"] },
    { name: "Manual fallback capacity", options: ["80% of volume", "30%", "10%"] },
  ],
  caseStudy: {
    title: "Apple Card credit-limit bias (2019)",
    causation:
      "Goldman Sachs's Apple Card was publicly accused of giving lower credit limits to women than to similar-situation men. Goldman's response was that the algorithm didn't consider gender, which became part of the problem — they couldn't explain individual outcomes.",
    impactScale: "NY DFS opened investigation. Sustained reputational impact. Industry-wide rethinking of model-explainability and fair-lending controls.",
    duration: "Months of regulatory engagement; multi-year impact on model-governance practice.",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Unsecured lending originations", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_02", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_03", name: "Model governance", impactToleranceMin: 4320, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "11:00",
      title: "Vendor pre-disclosure",
      description:
        "Email from the fairness-monitoring vendor: '5 days from now we will publish our 2026 AI Accountability Index. Your lending model scores in our 'red zone' on disparate-impact. Attached: the methodology and your specific findings. We are happy to talk before publication'.",
      expectedActions: ["Internal validation team activated", "CEO + CRO briefed within 1 hour"],
      objectives: ["Test pre-disclosure response speed"],
      senderRoleTitle: "CRO", toRoleTitles: ["CEO", "Head of Compliance"], ccRoleTitles: ["CTO"],
    },
    {
      eventNo: 2, scheduledTime: "Day 2 14:00",
      title: "Decision: pause + remediate",
      description:
        "Internal model-governance team confirms vendor analysis is methodologically sound. The IMT decides to pause the AI augment on lending decisions for 30 days, revert to a hybrid human-led process with reduced capacity, and engage the FCA proactively.",
      expectedActions: ["Pause approved", "Reduced-capacity comms to brokers + customers", "Regulator pre-notification"],
      objectives: ["Test the 'stop the line' muscle on a non-emergency"],
      senderRoleTitle: "CEO", toRoleTitles: ["CRO", "Head of Compliance"], ccRoleTitles: ["CCO"],
    },
    {
      eventNo: 3, scheduledTime: "Day 5 09:00",
      title: "Article publishes",
      description:
        "Vendor's index publishes naming your firm. The Guardian picks it up at 11:00. Your firm's pre-emptive statement, prepared on Day 4, goes out the same morning ahead of the news cycle. Tone is 'we've already paused, we're remediating, here's the plan'.",
      expectedActions: ["Press response", "Brokers / customers reassured", "Board pre-briefed"],
      objectives: ["Test pre-emptive comms approach"],
      senderRoleTitle: "CCO", toRoleTitles: ["CEO", "Head of External Affairs"], ccRoleTitles: ["CRO"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "Day 1 09:00", kind: "TECHNICAL",
      summary: "MLflow: model serving healthy throughout the affected window",
      description:
        "Your MLflow + Datadog dashboard shows the lending model has been technically perfectly healthy for the entire 9-month period. No alerts. The internal fairness-check job that runs nightly outputs metrics within configured thresholds — but the thresholds were tuned to a less-strict definition than the external vendor uses.",
      relation: "Tests gap between internal and external fairness definitions.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO"], ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2, scheduledTime: "Day 1 16:00", kind: "TECHNICAL",
      summary: "Feature audit reveals indirect proxies",
      description:
        "ML team's feature audit shows that ~14 of the model's 80 features are statistically correlated with the protected characteristic with r > 0.4. The model has learned to use them as a proxy without ever seeing the characteristic directly.",
      relation: "Shows the 'no direct feature' argument is insufficient.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CRO", "Head of Compliance"], ccRoleTitles: ["CEO"],
    },
    {
      injectNo: 3, scheduledTime: "Day 3 11:00", kind: "BUSINESS",
      summary: "FCA Op Resilience email",
      description:
        "FCA emails noting they're aware of the vendor's upcoming publication and would appreciate a verbal briefing within 24 hours. They want to understand your model-governance arrangements and Consumer Duty fair-value response.",
      relation: "Tests regulator-facing comms on a model-fairness issue.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Day 3 14:00", kind: "BUSINESS",
      summary: "Affected-customer body asks for retrospective review",
      description:
        "A consumer-rights organisation contacts, asking whether you will retrospectively review the 1,800 decisions identified by the vendor's analysis. The right answer is 'yes' but the cost is real.",
      relation: "Tests retroactive-remediation policy.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CCO"], ccRoleTitles: ["CFO", "CEO"],
    },
    {
      injectNo: 5, scheduledTime: "Day 4 10:00", kind: "BUSINESS",
      summary: "Board pre-brief",
      description:
        "Non-exec director pulls the CEO aside ahead of the planned full board briefing. They've seen the draft press statement and want to know — privately — whether the model should ever have been deployed without an external fairness audit. The CEO needs an answer that's honest without scapegoating.",
      relation: "Tests board-relationship management during an ethical event.",
      senderRoleTitle: "CEO", toRoleTitles: ["CRO"], ccRoleTitles: [],
    },
    {
      injectNo: 6, scheduledTime: "Day 6", kind: "TECHNICAL",
      summary: "Manual-decisioning queue depth alert",
      description:
        "With the AI augment paused, the manual-decisioning queue is filling at 3× drain rate. Broker complaints are rising. Engineering proposes a 'lite' AI augment that handles only obvious-approvals (no decline-decisioning) — risk team has reservations.",
      relation: "Tests degraded-mode design under pressure.",
      senderRoleTitle: "Head of Underwriting", toRoleTitles: ["CRO", "CTO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Governance", text: "How are protected-characteristic proxies identified in your model features?" },
    { category: "Fairness", text: "Is fairness-monitoring a continuous capability or a one-off audit?" },
    { category: "Customer", text: "What's your policy on retroactively reviewing AI-driven decisions when bias is found?" },
  ],
  debriefQuestions: [
    { category: "Lessons", text: "Should the firm have an internal red team that does adversarial fairness probing?" },
    { category: "Strategy", text: "If AI augmentation can't be fairness-proved, should the firm walk away from it entirely?" },
  ],
};
