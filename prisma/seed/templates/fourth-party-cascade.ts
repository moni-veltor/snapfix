import type { ScenarioTemplate } from "../types";

export const fourthPartyCascade: ScenarioTemplate = {
  slug: "fourth-party-cascade",
  title: "Fourth-Party Cascade — Hyperscaler Outage Across Vendors",
  category: "Third Party",
  srrRef: "3.4, 3.5",
  background:
    "Azure UK South suffers a regional outage. The firm itself runs on AWS — but six of the firm's tier-1 and tier-2 vendors run on Azure UK South. KYC, document signing, SMS delivery, fraud screening, customer-service chat and the status-page provider all fail simultaneously. The firm's own technology is up; everything it depends on is down. The concentration was on the page in last year's DORA register — but never tested.",
  agenda: "11:00 Azure outage begins\n11:10 Multiple vendor failures\n11:30 IMT convenes\n12:00 Decide degraded modes\n14:30 Vendor reconnaissance complete\n17:00 Azure partial recovery",
  dDayDate: "2026-11-19T11:00:00Z",
  durationMin: 240,
  cause:
    "An Azure UK South regional outage takes out compute, storage and network across multiple availability zones. AWS workloads are unaffected. The firm's vendor ecosystem, however, is heavily concentrated on Azure UK South — a fact that the DORA Register of Information has noted but the firm has never stress-tested.",
  impactNarrative:
    "Customer onboarding halts (no KYC). Existing customers can do most things but document-signing journeys stall mid-flow. SMS notifications stop (vendor is on Azure). Status page is also on Azure so the firm can't communicate. Fraud screening falls back to a rules-only mode that approves some transactions a model would have flagged. The IMT must rapidly map which vendors share the hyperscaler and which have failover capacity.",
  characteristics: [
    "Your tech is healthy — the world around you is not.",
    "4th-party concentration was visible on paper but never exercised.",
    "Cascading vendor failures look unrelated at first glance.",
    "Status page itself fails — bootstrap problem for crisis comms.",
  ],
  assumptions: [
    "Tier-1 and tier-2 vendors have been tagged with hyperscaler / region in the DORA register.",
    "Some vendors have multi-region failover; some don't.",
    "Status-page vendor is single-region (industry-typical).",
  ],
  takeaways:
    "DORA's Register of Information exists for this exact scenario. Concentration that's only known on paper isn't known. Exit plans for individual vendors are necessary but not sufficient — concentration across vendors is its own risk.",
  stressVariables: [
    { name: "Vendors affected", options: ["2-3", "5-6", "10+", "All Azure-hosted"] },
    { name: "Vendor failover readiness", options: ["Multi-region active/active", "Cold standby", "None"] },
    { name: "Recovery duration", options: ["2 hours", "8 hours", "24+ hours"] },
  ],
  caseStudy: {
    title: "Crowdstrike Falcon — global outage (19 July 2024)",
    causation:
      "A faulty Crowdstrike Falcon update bricked millions of Windows machines globally. Airlines, hospitals, banks, retailers — anyone with Crowdstrike on Windows was affected.",
    impactScale:
      "Estimated 8.5 million Windows devices affected. Airlines grounded, hospitals delayed procedures, retailers couldn't process payments. The single-vendor concentration was the news.",
    duration: "Hours to days depending on industry; some impact lingered for weeks.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: false,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer onboarding (KYC)", description: "New customer signup including identity verification.", impactToleranceMin: 720, criticality: "MEDIUM" },
    { code: "IBS_02", name: "Document signing", description: "E-signature for mortgage / loan / regulatory documents.", impactToleranceMin: 480, criticality: "HIGH" },
    { code: "IBS_03", name: "Customer notifications (SMS)", description: "Outbound SMS for OTP, transaction alerts, urgent comms.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_04", name: "Fraud screening", description: "Real-time fraud model on outbound payments.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_05", name: "Customer support chat", description: "In-app and web chat.", impactToleranceMin: 240, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "11:10",
      title: "Multi-vendor failures",
      description:
        "KYC, document-signing and SMS pager alerts fire within 5 minutes of each other. Initial triage assumes each is its own incident. Vendor-management team spots the pattern: all three are on Azure UK South.",
      expectedActions: ["Pull DORA register for Azure-hosted vendors", "Enumerate which vendors are affected"],
      objectives: ["Test pattern recognition across vendor failures"],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CRO", "Head of Compliance"],
      ccRoleTitles: ["CEO"],
    },
    {
      eventNo: 2,
      scheduledTime: "12:00",
      title: "Degraded-mode decisions",
      description:
        "IMT decides degraded modes for each affected vendor. Manual KYC for tier-1 customers (regulatory cover OK). Pause non-urgent document signing. Switch SMS to fallback vendor (with 30-min lead time). Fraud screening drops to rules-only — accept the risk, but increase post-hoc review.",
      expectedActions: ["Each degraded-mode decision logged", "Compliance sign-off on KYC manual mode"],
      objectives: ["Test the firm's library of degraded modes"],
      senderRoleTitle: "CEO",
      toRoleTitles: ["CRO", "Head of Compliance"],
      ccRoleTitles: ["CCO"],
    },
    {
      eventNo: 3,
      scheduledTime: "14:30",
      title: "Status page bootstrap",
      description:
        "Status page is also on Azure. Customer-facing comms stuck on yesterday's status. Comms Lead has to push via mobile app banner + email + Twitter, none of which use the affected vendors.",
      expectedActions: ["Switch comms to alternate channels", "Document the bootstrap problem for follow-up"],
      objectives: ["Notice the status-page-shares-hyperscaler problem"],
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CCO"],
      ccRoleTitles: ["CRO"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "13:00",
      summary: "Insurer asks about concentration risk",
      description:
        "The firm's cyber-insurance broker emails noting that the Azure incident is a 'concentration event' under the policy. They want a documented impact assessment within 5 business days to support a future claim.",
      senderRoleTitle: "CFO",
      toRoleTitles: ["CRO"],
      ccRoleTitles: [],
    },
    {
      injectNo: 2,
      scheduledTime: "15:30",
      summary: "Board wants assurance",
      description:
        "A non-exec director emails asking whether 'this is the kind of thing DORA was supposed to prevent'. Wants a verbal briefing in 24 hours and a written board paper in a week.",
      senderRoleTitle: "CEO",
      toRoleTitles: ["CRO", "Head of Compliance"],
      ccRoleTitles: [],
    },
  ],

  facilitatorQuestions: [
    { category: "Concentration", text: "What % of your tier-1 and tier-2 vendors are on the same hyperscaler region?" },
    { category: "DORA", text: "Is your DORA Register of Information used for resilience reasoning, or just for ticking the audit box?" },
    { category: "Comms", text: "When your status page is on the same hyperscaler that's down, what's your fallback?" },
  ],
  debriefQuestions: [
    { category: "Vendor", text: "Which vendor relationships need an exit-plan refresh after this?" },
    { category: "Architecture", text: "What's the case for selecting vendors with explicit multi-hyperscaler footprint?" },
  ],
};
