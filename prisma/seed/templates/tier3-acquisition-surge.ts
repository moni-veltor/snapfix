import type { ScenarioTemplate } from "../types";

export const tier3AcquisitionSurge: ScenarioTemplate = {
  slug: "tier3-customer-acquisition-surge",
  title: "Customer-Acquisition Surge Overwhelms Systems",
  category: "Other",
  tier: "TIER_3",
  firmProfile: "New bank / small fintech",
  background:
    "A viral marketing moment (celebrity endorsement, regulatory shift, competitor failure) drives a 100x surge in new-customer signups over a few days. The firm's onboarding, KYC, support and core systems are not sized for this scale. Tests the rare 'good problem' that can still cripple a small firm.",
  agenda:
    "T+0 Marketing tweet goes viral\nT+1h Signup queue saturates\nT+4h KYC partner backlog\nT+24h Customer-trust at risk from delay\nT+72h Capacity-add or growth-pause decision",
  dDayDate: "2026-05-23T08:00:00Z",
  durationMin: 180,

  cause:
    "A widely-followed personal-finance influencer posts a tweet endorsing the firm. The post goes viral within hours. New-customer signup volume rises from baseline of ~500/day to ~50,000 over 24 hours. The firm's onboarding flow, automated KYC provider, customer-support function and underlying core systems are not sized for this.",
  impactNarrative:
    "Signup flow times out for many users. KYC partner reports a multi-day backlog. Customer support is buried under enquiries. App-store reviews crater with complaints about slow approval. Some customers have funded their accounts but cannot transact while KYC is pending; their funds are effectively trapped. Concurrent: an FCA Consumer Duty case is opened due to customer-detriment complaints. The board must decide between sustained growth-at-pain and a partial growth-pause to clear backlog.",
  characteristics: [
    "Rapid onset triggered by external viral moment.",
    "Counter-intuitive — 'good news' creates an operational crisis.",
    "Existential opportunity-cost — slow response loses the moment.",
    "Customer-trust at risk — slow approval drives complaints.",
  ],
  assumptions: [
    "The viral moment is largely positive (not crisis-driven).",
    "KYC provider has no fast-scale option.",
    "The firm's marketing team did not coordinate with operations on the moment.",
  ],
  compoundScenarioNotes:
    "Compounds with: a coincident systems-capacity event; regulator stepping in for Consumer Duty reasons; the celebrity withdrawing endorsement due to delay complaints.",
  takeaways:
    "Monzo (2017-2018): viral growth caused waitlist of 250,000+ before they could open new accounts. Highlighted that operational scaling for fintechs is harder than marketing scaling — and that hot-moments compete with operational hygiene.",
  caseStudy: {
    title: "Monzo Wait-list (2017-2018)",
    causation:
      "Monzo's transition from prepaid card to full bank licence created a queue of prospective customers far exceeding the firm's capacity to onboard them. Word-of-mouth and competitor mistakes accelerated demand.",
    impactScale:
      "Wait-list peaked at 250,000+. Many users waited weeks or months. Concurrent operational pressure on the support team. Eventually managed with phased Golden Ticket rollout.",
    duration:
      "Active wait-list issues persisted for months. Operational scaling continued through 2018.",
  },
  stressVariables: [
    { name: "Signup volume multiple", options: ["10x", "50x", "100x", "500x"] },
    { name: "KYC backlog duration", options: ["1 day", "3 days", "1 week", "2 weeks"] },
    { name: "Capacity-add lead time", options: ["1 week", "2-4 weeks", "1-3 months"] },
    { name: "Concurrent issue", options: ["None", "Support overload", "App outage", "Consumer Duty"] },
  ],
  riskCoverage: {
    people: true,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer Onboarding & KYC", description: "Account opening and Know-Your-Customer verification.", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_02", name: "Customer Support", description: "Chat, email and phone support for new and existing customers.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_03", name: "Funded-Account Activation", description: "Customers who have funded their accounts but await KYC clearance.", impactToleranceMin: 240, criticality: "CRITICAL" },
    { code: "IBS_04", name: "App Performance", description: "App responsiveness under unexpected load.", impactToleranceMin: 60, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "08:00",
      title: "Viral tweet drives signup surge",
      description:
        "An influencer's tweet endorsing the firm goes viral. Marketing team is excited; signup volume rises to 6x baseline in the first hour and 20x within 4 hours. KYC partner's response time creeps from 5 minutes to 25 minutes. Support backlog grows visibly. App performance is starting to degrade.",
      expectedActions: [
        "Activate Major Operational Surge protocol",
        "Engage KYC partner for capacity escalation",
        "Scale support staffing (overtime, partner overflow)",
        "Brief CEO on the opportunity and risks",
      ],
      objectives: [
        "Test rapid surge-response activation",
        "Validate vendor-capacity escalation",
        "Assess balancing of opportunity vs. operational risk",
      ],
      senderRoleTitle: "Head of Operations",
      toRoleTitles: ["CEO", "CTO", "CMO"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
    {
      eventNo: 2,
      scheduledTime: "14:00",
      title: "Funded-but-unverified customers in growing queue",
      description:
        "Customers who have funded their accounts (sometimes thousands of pounds) are sitting in a KYC queue with no ETA. The firm has 8,400 customers in this state. Some have been waiting >12 hours. Complaints are escalating; one customer has tweeted the FCA. The team must decide on customer comms, manual KYC fast-tracking, or temporary auto-approval (with controls) for low-risk customers.",
      expectedActions: [
        "Issue customer-status communication",
        "Authorise manual KYC fast-track for clear-cut cases",
        "Consider conditional auto-approval with monitoring",
        "Brief FCA Supervision Lead proactively",
      ],
      objectives: [
        "Test customer-comms during high-pressure period",
        "Validate KYC-fast-track playbook",
        "Assess regulator-proactive engagement",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO", "Head of Operations"],
      ccRoleTitles: ["Comms Lead"],
    },
    {
      eventNo: 3,
      scheduledTime: "10:00",
      isScheduled: false,
      title: "Day 2 — board capacity decision",
      description:
        "Total signups in 24h: 47,000 (vs ~500 baseline). Backlog: ~38,000 customers awaiting KYC. Support queue: 14,000 open tickets. App-store reviews dropping. CEO must decide whether to: pause new signups to clear backlog (and lose viral momentum), raise prices for KYC partner to push capacity faster, or run customers through a tiered onboarding flow (instant-approval for low-risk, deferred for higher-risk).",
      expectedActions: [
        "Decide on tiered onboarding approach",
        "Approve partner price escalation if needed",
        "Authorise workforce surge plan (temp hires, partner overflow)",
        "Brief board on financial implications",
      ],
      objectives: [
        "Test growth-vs-quality decision-making",
        "Validate workforce-surge capacity",
        "Assess board-level engagement",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CFO", "CRO", "Head of Operations", "CTO"],
      ccRoleTitles: ["CMO"],
    },
    {
      eventNo: 4,
      scheduledTime: "10:00",
      isScheduled: false,
      title: "Day 3 — Consumer Duty inquiry",
      description:
        "FCA opens an informal Consumer Duty inquiry based on customer complaints about delayed access to funded accounts. The firm must produce evidence within 48 hours of: customer-impact assessment, controls to prevent recurrence, and remediation framework. Concurrent: backlog is clearing slowly but support queue remains heavy. Some customers are demanding to close accounts.",
      expectedActions: [
        "Respond to FCA Consumer Duty inquiry",
        "Approve customer redress for delayed access",
        "Plan sustainable customer-acquisition pace",
        "Capture lessons-learned",
      ],
      objectives: [
        "Test Consumer Duty response capability",
        "Validate customer-redress at scale",
        "Assess sustainable-growth planning",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "Head of Operations"],
      ccRoleTitles: ["CFO", "Comms Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "12:30",
      summary: "Reddit thread compiling complaints",
      description:
        "A subreddit thread compiles complaints from frustrated funded-but-unverified customers. The thread is gaining upvotes rapidly and is being shared on the personal-finance side of social media.",
      relation:
        "Compounds Event #2. Tests reactive comms and community management.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CMO"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
    {
      injectNo: 2,
      scheduledTime: "16:00",
      summary: "Celebrity who started it asks 'is it working?'",
      description:
        "The original celebrity endorser tweets asking 'has anyone tried [BankName] yet? Hearing mixed things.' If the answer to the influencer is the wrong one, the moment may turn against the firm.",
      relation:
        "Tests proactive influencer-relationship management.",
      senderRoleTitle: "CMO",
      toRoleTitles: ["CEO"],
      ccRoleTitles: ["Comms Lead"],
    },
  ],

  facilitatorQuestions: [
    { category: "Operational Scaling", text: "What is your capacity headroom for unexpected signup surges? When were you last surge-tested?" },
    { category: "KYC", text: "Does your KYC partner contract include surge SLAs? At what cost?" },
    { category: "Customer Comms", text: "How do you communicate with funded-but-unverified customers? What is the right cadence?" },
    { category: "Growth Decisions", text: "What is your appetite for pausing growth to preserve quality? Who decides?" },
    { category: "Consumer Duty", text: "What does Consumer Duty require for delayed account activation?" },
    { category: "Lessons", text: "How would you better coordinate marketing and operations next time?" },
  ],
  debriefQuestions: [
    { category: "Operational", text: "Did the firm handle the surge with operational integrity?" },
    { category: "Customer", text: "Did funded-but-unverified customers feel supported?" },
    { category: "Strategic", text: "Was the right balance struck between opportunity and quality?" },
    { category: "Lessons", text: "What is the top investment to prepare for the next surge?" },
  ],
};
