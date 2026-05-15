import type { ScenarioTemplate } from "../types";

export const tier3ReinsurerDispute: ScenarioTemplate = {
  slug: "tier3-reinsurer-dispute",
  title: "Reinsurer Dispute — Claims Settlement Blocked",
  category: "Third Party",
  tier: "TIER_3",
  srrRef: "3.4, 3.7",
  firmProfile: "Small-mid insurer",
  background:
    "Following a major weather event that generated 4,200 claims in 72 hours, your reinsurer disputes the aggregation methodology you've used to allocate the loss. They refuse to confirm the recoverable share until their actuaries have reviewed — estimated 10-15 business days. Meanwhile, your claims team needs to pay £14m of customer settlements this week and Treasury can't release the cash without reinsurer confirmation. Affected customers are calling daily.",
  agenda: "Day 1 Reinsurer reply received\nDay 1 PM IMT convenes\nDay 2 Decide: pay now, recover later (or wait)\nDay 3 Customer comms\nDay 7 Reinsurer interim agreement\nDay 14 Full reconciliation",
  dDayDate: "2026-03-09T09:00:00Z",
  durationMin: 240,
  cause:
    "A category-1 storm caused widespread but moderate damage across the south-east. Your aggregation rules treated the storm as a single loss event for reinsurance purposes. The reinsurer's contract language is ambiguous about 'event' definition; their actuaries are interpreting it as multiple events, each below the recoverable threshold. The dispute is genuine, not bad-faith.",
  impactNarrative:
    "4,200 customer claims are open. Claims-payments process is paused on validated claims worth £14m total. Customer Ops Lead reports rising complaint volumes — many customers were uninsured for months waiting on this; some are now in genuine hardship. Treasury can technically advance the funds from working capital but only for ~10 business days before liquidity ratios get uncomfortable.",
  characteristics: [
    "Slow-burn — develops over days, not minutes.",
    "Vendor / counterparty dispute with no clean technical resolution.",
    "Liquidity pressure layered on top of operational impact.",
    "Vulnerable-customer dimension (Consumer Duty).",
  ],
  assumptions: [
    "Reinsurer relationship is multi-year and otherwise healthy.",
    "Working-capital buffer can support ~10 business days of advance payment.",
    "FCA + PRA monitoring of claims-handling SLAs is active.",
  ],
  takeaways:
    "Operational resilience extends to financial-counterparty disputes. Pre-incident clarity on aggregation language saves real money. The right answer is often to pay customers and dispute reimbursement separately — but only firms with a clear policy can do this fast.",
  stressVariables: [
    { name: "Recoverable in dispute", options: ["£2m", "£14m", "£50m"] },
    { name: "Working-capital headroom", options: ["Comfortable", "Tight", "Stressed", "None"] },
  ],
  caseStudy: {
    title: "Lloyd's market — Hurricane Ian disputes (2022)",
    causation:
      "Hurricane Ian generated complex multi-party reinsurance recovery scenarios. Multiple operators experienced disputes over event aggregation, attachment-point calculations and timing of recoveries.",
    impactScale:
      "Multi-month delays in recovery confirmation across several treaties. Some insurers had to advance significant payments from their own working capital.",
    duration: "Months of dispute resolution, with material liquidity impact for smaller insurers.",
  },
  riskCoverage: { people: false, property: false, technology: false, dataAvailability: false, dataIntegrity: false, thirdParty: true },

  ibsList: [
    { code: "IBS_01", name: "Claims payment", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_02", name: "Customer support contact centre", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_03", name: "Intraday liquidity management", impactToleranceMin: 60, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1, scheduledTime: "09:00",
      title: "Reinsurer formal response",
      description:
        "Reinsurer's letter arrives via the broker. Confirms the dispute, names their actuarial team, gives a 10-15 business day estimate for review. Tone is professional but firm. Includes a clause-by-clause counter-interpretation.",
      expectedActions: ["Legal / broker review", "Convene Head of Claims, CFO, CEO"],
      objectives: ["Test counterparty-dispute response speed"],
      senderRoleTitle: "Head of Claims", toRoleTitles: ["CFO", "CEO"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2, scheduledTime: "14:00",
      title: "IMT decides: advance from working capital",
      description:
        "After weighing options, the IMT decides to pay validated claims from working capital and pursue the reinsurance recovery separately. CFO confirms ~10 business days of headroom. Decision is recorded with a 'review weekly' rule.",
      expectedActions: ["Decision recorded with named approver", "Treasury arranges the cash"],
      objectives: ["Test the 'pay customers, fight separately' decision"],
      senderRoleTitle: "CEO", toRoleTitles: ["CFO", "Head of Claims"], ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3, scheduledTime: "Day 7",
      title: "Reinsurer interim partial agreement",
      description:
        "After a week of broker-mediated discussion, the reinsurer agrees to a partial interim recovery (50%) pending full review. £7m flows back. Working-capital headroom is now comfortable.",
      expectedActions: ["Adjust treasury position", "Brief board on dispute trajectory"],
      objectives: ["Test sustained counterparty-relationship management"],
      senderRoleTitle: "CFO", toRoleTitles: ["CEO", "Head of Claims"], ccRoleTitles: [],
    },
  ],

  injects: [
    {
      injectNo: 1, scheduledTime: "Day 1 16:00", kind: "BUSINESS",
      summary: "Vulnerable-customer complaint",
      description:
        "A widow's claim has been waiting 5 weeks for payment. She's been moved between three case-handlers and is now in genuine hardship. Her MP has written. A regional newspaper is following the story.",
      relation: "Tests Consumer Duty / vulnerable-customer triage under sustained pressure.",
      senderRoleTitle: "Customer Ops Lead", toRoleTitles: ["Head of Claims", "CCO"], ccRoleTitles: ["CEO", "Head of Compliance"],
    },
    {
      injectNo: 2, scheduledTime: "Day 2 10:00", kind: "BUSINESS",
      summary: "Broker pressure",
      description:
        "Your broker — who placed the reinsurance — is being asked the same questions by your CFO and the reinsurer. They're caught in the middle and offer to mediate but flag they need clear authority from both sides.",
      relation: "Tests broker-relationship management during dispute.",
      senderRoleTitle: "CFO", toRoleTitles: ["CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 3, scheduledTime: "Day 3 09:00", kind: "BUSINESS",
      summary: "FCA inbound on claims-SLA",
      description:
        "FCA emails noting customer complaints about claims-handling delays. Wants an explanation of what's happening, plain language. Asks specifically whether vulnerable customers are being prioritised.",
      relation: "Tests regulator-facing comms under multi-stakeholder pressure.",
      senderRoleTitle: "Head of Compliance", toRoleTitles: ["CRO", "CEO"], ccRoleTitles: [],
    },
    {
      injectNo: 4, scheduledTime: "Day 5 14:00", kind: "TECHNICAL",
      summary: "Claims-system queue depth alert",
      description:
        "Your claims-management system raises an alert: queue of 'pending payment' claims has crossed 4,500 and is starting to affect database performance for other workflows. Performance team flags a need to bulk-archive or migrate.",
      relation: "Operational system fault layered onto the business dispute.",
      senderRoleTitle: "Sn.TPM", toRoleTitles: ["CTO"], ccRoleTitles: ["Head of Claims"],
    },
    {
      injectNo: 5, scheduledTime: "Day 6 11:00", kind: "BUSINESS",
      summary: "Board chair phone call",
      description:
        "The board chair calls the CEO directly, having heard about the dispute from a non-exec. Wants a 10-minute briefing today and a written paper by Friday. Worried about reputational impact.",
      relation: "Tests board-engagement quality during sustained pressure.",
      senderRoleTitle: "CEO", toRoleTitles: ["CRO", "CFO"], ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Counterparty", text: "How clear is your 'event definition' in reinsurance contracts, and who reviews it annually?" },
    { category: "Liquidity", text: "How many days of working-capital advance can you sustain for claims payments?" },
    { category: "Customer", text: "When a dispute is happening behind the scenes, what do affected customers hear?" },
  ],
  debriefQuestions: [
    { category: "Process", text: "Did the firm pay customers and fight separately, or wait and damage trust?" },
    { category: "Lessons", text: "What contract-language change would have prevented this dispute?" },
  ],
};
