import type { ScenarioTemplate } from "../types";

export const aiTransparencyFailure: ScenarioTemplate = {
  slug: "ai-transparency-failure",
  title: "AI Decision Transparency Failure — Can't Explain a Decline",
  category: "AI & Algorithmic Risk",
  srrRef: "3.3, 3.6",
  background:
    "A customer is declined for a mortgage by your AI-augmented decisioning. They submit a Subject Access Request asking for a full explanation. Your model's explanation layer was supposed to give human-readable reasons; under scrutiny, the reasons it provides are clearly post-hoc rationalisation, not actual decision drivers. The customer escalates to the Financial Ombudsman. The Ombudsman asks: how did you decide, and can you prove fairness?",
  agenda: "Day 0 Customer SAR\nDay 7 Customer escalates to Ombudsman\nDay 8 Ombudsman first request\nDay 14 Internal forensic review\nDay 28 Ombudsman ruling timeline\n+90 days Model overhaul",
  dDayDate: "2026-11-25T10:00:00Z",
  durationMin: 240,
  cause:
    "Your decisioning model is a gradient-boosted ensemble (XGBoost). Its 'explanation' feature uses SHAP values rendered as 'top 3 reasons'. The customer's decline reasons say 'income volatility, employment-sector risk, recent address moves'. The customer is actually a long-tenured GP earning £160k with one address move because of a divorce. The SHAP values are mathematically correct but bear no resemblance to a human-readable account of why the decision was made.",
  impactNarrative:
    "The Ombudsman requests full disclosure of the decision pipeline. Internal forensic analysis reveals the model's stated reasons don't track what a human reviewer would identify. There's no audit trail of how the SHAP-to-reason translation works. The Ombudsman is going to rule, with a high likelihood of finding against the firm. There are estimated 14,000 similar declines over the past 12 months — all potentially needing review.",
  characteristics: [
    "Slow-burn — develops over weeks through Ombudsman process.",
    "Customer-rights driven, not technical failure.",
    "Industry-precedent risk — a bad ruling sets case law.",
    "Retroactive remediation is potentially huge in scope.",
  ],
  assumptions: [
    "Firm uses GBT model with SHAP-based explanation layer.",
    "No human-in-the-loop for typical lending decisions.",
    "Internal model documentation exists but is technical, not customer-facing.",
  ],
  takeaways:
    "Explainability for AI decisions has two audiences: model-risk-management (technical) and the customer / Ombudsman (plain-language). SHAP is not an explanation. The EU AI Act and FCA Consumer Duty both require something the customer can understand and act on.",
  stressVariables: [
    { name: "Similar decisions in last 12 months", options: ["100s", "1,000s", "10,000s"] },
    { name: "Ombudsman precedent risk", options: ["Low (case-specific)", "Medium (similar cases)", "High (industry precedent)"] },
  ],
  caseStudy: {
    title: "Dutch tax-authority childcare scandal (Toeslagenaffaire)",
    causation:
      "The Dutch tax authority used an algorithmic risk-scoring system to flag potential childcare-benefit fraud. The system disproportionately flagged people with dual nationality or non-Dutch surnames. Decisions were made with no explainable rationale; appeals were stymied because the model logic was opaque.",
    impactScale:
      "Over 26,000 families wrongly accused of fraud. Government resigned in 2021. Multi-year payout and reform process.",
    duration: "Originated 2013; full disclosure 2019-2021; reforms ongoing.",
    sourceUrl: "https://en.wikipedia.org/wiki/Dutch_childcare_benefits_scandal",
  },
  riskCoverage: { people: false, property: false, technology: true, dataAvailability: false, dataIntegrity: true, thirdParty: false },

  ibsList: [
    { code: "IBS_01", name: "Mortgage origination", impactToleranceMin: 480, criticality: "HIGH" },
    { code: "IBS_02", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_03", name: "Model governance", impactToleranceMin: 4320, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "Day 0 10:00",
      title: "Customer SAR received",
      description:
        "A customer who was declined for a mortgage submits an SAR: 'tell me exactly why I was declined, and what data was used'. The customer is a GP, articulate, persistent. Standard SAR response timeline applies (1 calendar month).",
      expectedActions: ["Assign SAR to data-team", "Flag as 'AI-explained decision' for additional review"],
      objectives: ["Test SAR-handling for AI decisions"],
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO"], ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 2, scheduledTime: "Day 8",
      title: "Ombudsman first request",
      description:
        "The Ombudsman writes formally: customer has escalated. The Ombudsman asks for the firm's full decision rationale, the data used, and evidence of fairness. The Ombudsman has 6 months to rule but typically draws conclusions within 3.",
      expectedActions: ["Engage external counsel", "Begin forensic review of the specific decision"],
      objectives: ["Test Ombudsman-engagement readiness"],
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      eventNo: 3, scheduledTime: "Day 14",
      title: "Forensic review concludes — explanation is post-hoc",
      description:
        "Internal forensic analysis (with the data-science team) concludes that the SHAP-generated 'reasons' provided to the customer don't track the actual decision drivers in a human-meaningful way. The CRO must decide: offer remediation now or fight through the Ombudsman process.",
      expectedActions: ["Decision recorded with rationale", "Brief board"],
      objectives: ["Test the 'admit and remediate' vs 'litigate' decision"],
      senderRoleTitle: "CRO", toRoleTitles: ["CEO", "Head of Compliance"], ccRoleTitles: ["CFO"],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "Day 3", kind: "TECHNICAL",
      summary: "Audit-log search: explanation layer self-test ran weekly",
      description:
        "ML-ops investigation finds that an automated explanation-quality self-test has been running weekly. It passes — the test measures faithfulness of the SHAP attribution to the model, not whether the rendered reasons resemble a human account.",
      relation: "Highlights that 'works as designed' isn't 'works for customers'.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CTO", "CRO"], ccRoleTitles: [],
    },
    {
      injectNo: 2, scheduledTime: "Day 5", kind: "BUSINESS",
      summary: "Customer goes public",
      description:
        "Frustrated with the SAR response (and the canned 'income volatility' explanation), the customer posts a detailed thread on Twitter. They have a modest following (12k) but the thread is well-written and gets 2,400 retweets within a day. The Money Saving Expert forum picks it up.",
      relation: "Tests handling of a credible, articulate customer in public.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "CEO"], ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 3, scheduledTime: "Day 8", kind: "BUSINESS",
      summary: "Journalist requests model-governance interview",
      description:
        "A FT financial-services correspondent emails: they're working on a 'AI in lending' feature and would like to interview the CTO + CRO. The customer's thread is referenced. Refusal will be reported. The CEO needs to decide whether to engage.",
      relation: "Tests press-engagement when the framing is unfavourable.",
      senderRoleTitle: "Head of External Affairs", toRoleTitles: ["CCO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Day 16", kind: "BUSINESS",
      summary: "FCA Op Resilience inbound",
      description:
        "FCA emails noting the customer's Twitter thread and the journalist's interest. They want a status update on the firm's model-governance arrangements and whether similar customers may be affected.",
      relation: "Tests dual-track Ombudsman + regulator response.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 5, scheduledTime: "Day 20", kind: "TECHNICAL",
      summary: "Scope-of-similar-cases query",
      description:
        "ML team runs a query: of the last 12 months of declines, 14,000 received the 'income volatility / employment-sector / address moves' template explanation. A statistically meaningful subset of those would, on human review, look like they should have been approved.",
      relation: "Tests retroactive-remediation scope-assessment.",
      senderRoleTitle: "Sn. DA/E", toRoleTitles: ["CRO"], ccRoleTitles: ["CFO", "CEO"],
    },
    {
      injectNo: 6, scheduledTime: "Day 28", kind: "BUSINESS",
      summary: "Ombudsman early indication",
      description:
        "The Ombudsman gives an informal early indication: 'Based on what we've seen, our ruling is likely to require the firm to review the decision substantively, not just procedurally'. This is significant because it implies a duty-of-explanation that goes beyond your firm's current capability.",
      relation: "Tests the firm's response to an Ombudsman-stretching ruling.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Explainability", text: "Could a customer service rep, given access to a declined-decision artefact, explain it to a customer? If not, what's the gap?" },
    { category: "Audit", text: "Do you have an audit trail of every decision your AI has made, with the data-snapshot and the reasoning at the time?" },
    { category: "Customer", text: "What's your policy for 'I want a human to review my decline'?" },
  ],
  debriefQuestions: [
    { category: "Explainability", text: "What would 'good' explainability look like for a mortgage decline?" },
    { category: "Process", text: "Should AI decisions on material customer matters always have a human-on-the-loop?" },
  ],
};
