import type { ScenarioTemplate } from "../types";

export const tier3BaasFailure: ScenarioTemplate = {
  slug: "tier3-baas-partner-failure",
  title: "Banking-as-a-Service Partner Failure",
  category: "Third Party",
  tier: "TIER_3",
  firmProfile: "BaaS-dependent fintech / new bank",
  background:
    "A new bank, EMI, or BaaS-dependent fintech relies on a sponsor bank or BaaS platform for its core banking infrastructure, card issuing, and/or payment-scheme connectivity. The sponsor partner experiences a critical operational issue — outage, regulatory enforcement, or sudden contract termination — that the firm cannot quickly replace. Tests existential third-party dependency risk for small firms.",
  agenda:
    "T+0 Sponsor notification of issue\nT+1h Initial customer impact assessment\nT+4h Comms to customers + regulator\nDay 1 Contingency activation / migration planning\nDay 7 Customer migration or alternative arrangement",
  dDayDate: "2026-08-12T10:00:00Z",
  durationMin: 240,

  cause:
    "The BaaS provider gives 24-hour notice of a critical operational issue (e.g. a regulatory restriction limiting their card-issuing capability, or a partner bank revoking sponsorship). The firm's customers retain account access through the BaaS provider but new transactions, card payments, or onboarding are restricted.",
  impactNarrative:
    "All customer-facing services that depend on the BaaS partner are degraded or halted. Existing customers cannot use cards, ATMs may not work, new customer onboarding stops. The firm has no in-house core banking — it cannot rebuild functionality quickly. Migration to an alternative BaaS partner takes weeks at minimum; some functions (e.g. UK Faster Payments) require lengthy sponsor onboarding. Customer trust collapses rapidly. The firm faces existential pressure.",
  characteristics: [
    "Rapid onset — typically <24h notice from BaaS partner.",
    "Complete service loss — firm has no in-house alternative.",
    "Existential — firm cannot operate without the BaaS partner.",
    "Long restoration — alternative partners require weeks of integration.",
    "Customer-trust crisis — small firms have less goodwill capital.",
  ],
  assumptions: [
    "The firm has no fully-wired alternative BaaS partner.",
    "Customer balances are safe (held at sponsor bank or ringfenced), but inaccessible until resolved.",
    "Regulator and customers have limited tolerance for repeated incidents.",
  ],
  compoundScenarioNotes:
    "Compounds with: a coincident regulatory inquiry into the firm itself; a competitor BaaS partner being acquired; a sector-wide news story about BaaS risk; the partner becoming insolvent.",
  takeaways:
    "Synapse / Evolve Bank (2024): Synapse, a BaaS middleware provider, collapsed, leaving 100k+ customers of fintechs (Yotta, Juno, etc.) locked out of their accounts for months. Several fintechs effectively shut down. Highlighted that BaaS-dependent fintechs carry existential third-party concentration risk that regulators are only now starting to address.",
  caseStudy: {
    title: "Synapse / Evolve Bank Collapse (2024)",
    causation:
      "Synapse, a BaaS middleware provider connecting fintech-app firms to FDIC-insured banks, filed for bankruptcy in April 2024. The collapse exposed reconciliation discrepancies between Synapse's records and the underlying banks (including Evolve Bank).",
    impactScale:
      "100,000+ customers of fintechs including Yotta, Juno, and Copper lost access to $85M+ in deposits. Multiple fintechs (Synapse customers) effectively ceased operations. Customer access remained partial for many months.",
    duration:
      "Initial disruption immediate. Court-ordered reconciliation continued for months. Many customers still missing funds 6+ months later.",
  },
  stressVariables: [
    { name: "Notice period", options: ["<24h", "24-48h", "1 week", "1 month"] },
    { name: "Type of issue", options: ["Operational outage", "Regulatory restriction", "Contract termination", "Insolvency"] },
    { name: "Customer balance safety", options: ["Fully ringfenced", "Partial", "At risk"] },
    { name: "Alternative provider available", options: ["Yes — wired", "Yes — paper agreement", "No"] },
  ],
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer Account Access", description: "Ability for customers to see and access balances.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Card Payments", description: "Card issuing and transaction processing via BaaS partner.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "New Customer Onboarding", description: "Acquisition pipeline — paused during incident.", impactToleranceMin: 1440, criticality: "MEDIUM" },
    { code: "IBS_04", name: "Customer Support", description: "Ability to support customers with issues during the event.", impactToleranceMin: 60, criticality: "HIGH" },
    { code: "IBS_05", name: "Regulator Engagement", description: "Real-time engagement with FCA and any partner-bank regulator.", impactToleranceMin: 240, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "10:00",
      title: "Sponsor partner notice — service restriction in 24h",
      description:
        "The firm's BaaS partner sends a formal notice: due to a regulatory restriction, they will be unable to support card-issuing or payment-scheme activity from this firm's BIN starting in 24 hours. Existing customer balances are safe and will remain accessible read-only, but transactions will stop. The notice is on the partner's headed paper and signed by their CEO.",
      expectedActions: [
        "Activate Major Incident — Existential Third-Party Risk",
        "Convene full executive team",
        "Engage partner immediately to confirm scope and ask for extension",
        "Begin customer impact and disclosure planning",
      ],
      objectives: [
        "Test rapid response to existential third-party event",
        "Validate executive convening speed",
        "Assess partner-engagement playbook",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CTO", "Head of Operations", "CRO"],
      ccRoleTitles: ["General Counsel", "Comms Lead"],
    },
    {
      eventNo: 2,
      scheduledTime: "14:00",
      title: "Initial customer disclosure decision",
      description:
        "The firm must decide what to tell customers and when. Options: pre-empt the partner cut-off with proactive communication (customer trust, but possible scaring), wait for the partner's own communication (consistent messaging but loss of control), or stay silent until restoration is planned (avoid panic but legal/Consumer Duty risk). Regulatory engagement is mandatory and timing-critical.",
      expectedActions: [
        "Decide customer-disclosure timing and content",
        "Engage FCA Supervision Lead",
        "Coordinate joint statement with BaaS partner",
        "Brief staff with consistent talking points",
      ],
      objectives: [
        "Test customer-disclosure decisioning",
        "Validate regulator-engagement timing",
        "Assess joint-comms with partner",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["Comms Lead", "CRO", "General Counsel"],
      ccRoleTitles: ["CTO"],
    },
    {
      eventNo: 3,
      scheduledTime: "10:00",
      isScheduled: false,
      title: "Day 2 — cut-off effective; alternative-partner outreach",
      description:
        "BaaS partner cuts off the firm at the scheduled time. Cards stop working; new customer signups halted; the app shows a banner explaining the situation. Customer support is overwhelmed. The firm urgently needs an alternative BaaS partner. Multiple potential partners exist but none can integrate within weeks. CEO must decide between: rapidly migrate to a less-favoured partner who can move fast, attempt a partial in-house build, or pursue acquisition.",
      expectedActions: [
        "Launch alternative-partner outreach",
        "Decide on partial in-house alternatives",
        "Maintain customer trust through frequent comms",
        "Plan workforce continuity if revenue stops",
      ],
      objectives: [
        "Test alternative-vendor engagement speed",
        "Validate strategic-decision process under existential pressure",
        "Assess workforce-continuity planning",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CTO", "CFO", "Head of Operations"],
      ccRoleTitles: ["Comms Lead", "General Counsel"],
    },
    {
      eventNo: 4,
      scheduledTime: "10:00",
      isScheduled: false,
      title: "Day 7 — customer-migration plan",
      description:
        "An alternative BaaS partner has tentatively agreed in principle, but integration will take 6-10 weeks. In the meantime, the firm must offer customers a credible path: either wait, switch to another bank entirely with the firm's help (and likely lose them), or accept paused service. The board must approve a plan that is honest with customers and viable for the firm.",
      expectedActions: [
        "Approve customer-migration plan",
        "Communicate clearly to customers",
        "Negotiate alternative-partner contract",
        "Maintain workforce continuity through the gap",
      ],
      objectives: [
        "Test long-tail recovery planning",
        "Validate honest customer communication",
        "Assess workforce resilience",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CFO", "Head of Operations"],
      ccRoleTitles: ["Comms Lead", "CTO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "11:30",
      summary: "Partner contact unreachable",
      description:
        "The firm's named partner contact is in a meeting and unreachable. The next-named contact has left the partner firm. The escalation playbook is out of date. The CEO must improvise direct outreach to the partner's CEO via LinkedIn or board-level introduction.",
      relation:
        "Compounds Event #1. Tests contact-resilience and senior-level networks.",
      senderRoleTitle: "Head of Operations",
      toRoleTitles: ["CEO"],
      ccRoleTitles: ["CTO"],
    },
    {
      injectNo: 2,
      scheduledTime: "16:00",
      summary: "Press picks up the story",
      description:
        "TechCrunch and Sifted are running articles within hours of the partner cut-off, naming the firm and noting potential customer impact. Customers begin tweeting concerns. App-store ratings start dropping. The CEO is asked for comment by multiple journalists.",
      relation:
        "Cuts across Event #2. Tests crisis-comms for small firms.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Vendor Concentration", text: "How quickly could you survive without your current BaaS partner? What is the existential timeline?" },
    { category: "Alternatives", text: "Have you pre-positioned a relationship (even paper-thin) with a second BaaS provider?" },
    { category: "Partner Failure Modes", text: "Have you mapped the different ways your partner could fail (outage, regulator, contract, insolvency)?" },
    { category: "Customer Care", text: "Under Consumer Duty, what proactive duty do you owe customers if your service may end?" },
    { category: "Workforce", text: "How would you keep your team together through a 6-10 week revenue gap?" },
    { category: "Regulator", text: "What is your FCA Supervision Lead's expectation for a Tier 3 firm in this scenario?" },
  ],
  debriefQuestions: [
    { category: "Preparedness", text: "How exposed are you really to BaaS-partner concentration?" },
    { category: "Comms", text: "Did customer communications maintain trust?" },
    { category: "Continuity", text: "Could the firm survive 6-10 weeks of restricted service?" },
    { category: "Lessons", text: "What investment would most reduce your BaaS-concentration risk?" },
  ],
};
