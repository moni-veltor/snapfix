import type { ScenarioTemplate } from "../types";

export const lossOfCsp: ScenarioTemplate = {
  slug: "loss-of-csp",
  title: "Loss of Cloud Service Provider (CSP)",
  category: "Third Party",
  srrRef: "5.1, 7.1",
  background:
    "This scenario explores the unavailability of a major Cloud Service Provider supporting multiple firms across Financial Services, resulting in business, operational and consumer impacts. A poorly executed change / software bug / cyber attack leads to a high-profile CSP being unable to deliver services across multiple availability zones within a region for a prolonged period.",
  agenda:
    "09:00 Initial CSP region outage\n09:00–10:30 Triage & vendor liaison\n10:30–12:00 Cross-region failover attempts\n12:00–14:00 Manual processing & customer comms\n14:00–17:00 Recovery & reconciliation",
  dDayDate: "2026-07-08T09:00:00Z",
  durationMin: 180,

  cause:
    "A poorly executed change / software bug / cyber attack leads to a high-profile CSP being unable to deliver services across multiple availability zones within a region for a prolonged period. Recovery from a cold back-up arrangement to another region has not been possible, although it is unclear whether this is the same or unconnected issue.",
  impactNarrative:
    "The outage has impacted firms that rely on the CSP for the hosting of a range of critical services supporting IBS including infrastructure supporting firms' core banking/insurance platform(s). The CSP struggles to identify the root cause and is therefore unable to estimate when services will be resumed. Services remain unavailable at the end of day. Impacted firms are unable to carry out key end-of-day activities (payments, reporting). Eventually the underlying issue is identified and recovery commenced. The recovery is only partially successful as firms cannot fully reconcile balances; full recovery slips by up to 24 hours. All IBSs reliant on the CSP including the core banking platform are impacted; all digital channels disrupted. The high-profile CSP results in extensive media coverage of the difficulties caused to clients, which dominates regional and international news cycles.",
  characteristics: [
    "Rapid onset — no- or minimal-notice event with little to no time to put additional mitigations in place.",
    "Low predictability / highly changeable due to uncertainty as to cause.",
    "Uncertain duration — investigation, containment and technical-recovery time makes estimating business recovery times difficult.",
    "Higher scrutiny and potential to undermine stakeholder trust — through perceived or actual lack of action/transparency due to nature of incident.",
    "Elevated market/regulator concern due to potential for market-wide impact.",
  ],
  assumptions: [
    "Incident happens on a peak and/or significant trading day with above-average volume (in line with the worst-case scenario used for setting impact tolerance).",
    "The CSP's failover and multi-region capabilities themselves are degraded.",
    "Firms have not finished migrating off the affected CSP region; cold-back-up restoration is the only viable path.",
  ],
  compoundScenarioNotes:
    "CSP loss commonly compounds with: a cyber attack on the CSP (Solorigate-style supply-chain), a National Power Outage that affects the CSP's data centres, or a Third-Party SaaS dependency simultaneously impacted (e.g. authentication providers).",
  takeaways:
    "Reliance on a single CSP region exposes firms to concentrated risk that vendors' own multi-region capabilities may not fully mitigate. Cold-back-up recovery is rarely exercised at full scale; firms over-estimate how quickly they can recover. Manual processing capability needs to be regularly drilled to remain credible.",
  stressVariables: [
    { name: "Duration of CSP outage", options: ["24hrs / NBD", "36–48 hours", "48–72 hours", "72–96 hours", ">1 week"] },
    { name: "Affected availability zones", options: ["Single AZ", "Multi-AZ", "Single region", "Multi-region"] },
    { name: "Cold back-up viable", options: ["Yes", "Partial", "No"] },
    { name: "Other firms impacted simultaneously", options: ["None", "Some", "Most", "All UK FS"] },
  ],
  caseStudy: {
    title: "AWS us-east-1 outage (December 2021)",
    causation:
      "An automated process triggered unexpected behaviour from a large number of clients inside the network, leading to a surge in connection activity that overwhelmed the networking devices between the internal network and the main AWS network.",
    impactScale:
      "Disruption affected dozens of major customer-facing services worldwide including Amazon's own services (Ring, Alexa), Netflix, Disney+, Slack, and significant portions of the financial-services SaaS ecosystem.",
    duration:
      "Initial impact began around 10:30 ET. Most services were materially restored within 6 hours, though customer reconciliation continued for over 24 hours.",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: true,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer Authentication & Onboarding", description: "Login, KYC and account opening through digital channels.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Payments — Inbound & Outbound", description: "Faster Payments, Bacs, CHAPS routing through core payment stack.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Core Banking Ledger", description: "Customer balances, transactions, end-of-day reconciliation.", impactToleranceMin: 120, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Mobile & Online Banking", description: "Customer-facing mobile and web channels.", impactToleranceMin: 120, criticality: "HIGH" },
    { code: "IBS_05", name: "Card Authorisation", description: "Real-time card transaction authorisation.", impactToleranceMin: 30, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:00",
      title: "CSP region declared impaired",
      description:
        "The CSP status page reports increased error rates and latency across multiple availability zones in the primary region. Internal monitoring confirms degraded service for the bank's core banking ledger and authentication services. CSP support cannot yet estimate time to recovery. Customer-facing mobile app shows intermittent failures.",
      expectedActions: [
        "Activate Major Incident process",
        "Engage CSP technical account manager",
        "Begin IBS impact assessment",
        "Notify CRO and exec sponsor",
      ],
      objectives: [
        "Validate vendor-side incident detection",
        "Test vendor liaison playbook",
        "Confirm executive escalation paths",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Sn. DA/E"],
      ccRoleTitles: ["CEO", "CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "10:30",
      title: "Failover to secondary region attempted",
      description:
        "The team initiates the documented failover runbook to the secondary CSP region. The DNS cutover completes but the cold-restore of the customer-balance datastore fails to converge — partial data is replicated but transactions in the last 90 minutes appear inconsistent. Card authorisation IBS is restored at 80% throughput. The mobile app remains unreachable.",
      expectedActions: [
        "Decide whether to continue failover or revert",
        "Activate manual card authorisation procedures",
        "Engage core banking vendor for emergency support",
        "Begin pre-incident customer communications",
      ],
      objectives: [
        "Test cold-restore runbook end-to-end",
        "Validate manual processing capability",
        "Assess data-consistency tolerance for the IBS",
      ],
      senderRoleTitle: "Sn.TPM",
      toRoleTitles: ["CTO", "Sn. DA/E"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "12:00",
      title: "Cross-sector impact confirmed",
      description:
        "Industry channels confirm at least four other major UK firms are impacted by the same CSP region failure. The Bank of England operational resilience desk requests an initial impact assessment within 60 minutes. Sector media outlets are running headlines. Customer call volumes are up 6x against baseline; the contact-centre IVR is queueing customers beyond SLA.",
      expectedActions: [
        "File initial regulator notification (PRA / FCA)",
        "Coordinate sector-wide messaging via CMORG channel",
        "Surge contact-centre staffing",
        "Issue first customer status update",
      ],
      objectives: [
        "Test sector-wide coordination",
        "Validate regulator notification within tolerance",
        "Assess crisis-communication readiness",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "CTO", "Comms Lead"],
      ccRoleTitles: ["Customer Ops Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "14:30",
      title: "CSP confirms root cause; recovery timeline given",
      description:
        "The CSP confirms the underlying networking-control-plane failure and reports a phased recovery beginning within the next hour. Services in the primary region are expected to be back to 80% within 3 hours. The team must decide whether to fail back, continue on the partially-restored secondary region, or stay on manual procedures until end-of-day cutover.",
      expectedActions: [
        "Decide failback strategy (primary, secondary, manual)",
        "Plan reconciliation between channels",
        "Brief customer-facing teams on expected restoration",
        "Update regulator with confirmed timeline",
      ],
      objectives: [
        "Test decision-making under partial information",
        "Validate communication cadence",
        "Assess reconciliation processes",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Comms Lead"],
      ccRoleTitles: ["CRO", "CEO"],
    },
    {
      eventNo: 5,
      scheduledTime: "17:00",
      isScheduled: false,
      title: "End-of-day reconciliation",
      description:
        "All customer-facing IBS are restored, but the firm cannot complete end-of-day payment cycles cleanly. Approximately 12,000 customer transactions are in an indeterminate state — paid, queued, or duplicated. The Settlement team has 90 minutes to either complete reconciliation manually or miss the CHAPS cut-off and require an exceptional sector waiver.",
      expectedActions: [
        "Execute payment reconciliation",
        "Decide CHAPS cut-off request",
        "Prepare customer-impact statement for next morning",
        "Capture lessons for D+1 review",
      ],
      objectives: [
        "Test end-of-day exception handling",
        "Validate payment-scheme escalation paths",
        "Assess data-integrity sign-off process",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["Sn.TPM", "TPM"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "09:42",
      summary: "CSP status page: multi-region warning",
      description:
        "The CSP status page updates to warn of latency 'in additional regions'. Internal traffic to the secondary region begins showing elevated p99 latency. There is no confirmation yet whether this is the same root cause or a separate issue, but the secondary failover plan assumes the secondary region is healthy.",
      relation:
        "Forces re-evaluation of the runbook between Events #1 and #2. Tests how teams respond to conflicting partial information.",
      senderRoleTitle: "ISM",
      toRoleTitles: ["Sn.TPM", "Sn. DA/E"],
      ccRoleTitles: ["CTO"],
    },
    {
      injectNo: 2,
      scheduledTime: "11:15",
      summary: "Twitter thread goes viral",
      description:
        "A Twitter thread from a well-known UK fintech commentator goes viral, naming your firm alongside three competitors as 'down', with screenshots of failed payments. The thread is being picked up by mainstream press. A retail investor relations team flags an unusual price move.",
      relation:
        "Tests media monitoring and the speed of comms response. Cuts across Event #3.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CRO"],
      ccRoleTitles: ["CTO"],
    },
    {
      injectNo: 3,
      scheduledTime: "13:20",
      isScheduled: false,
      summary: "Compromised CSP IAM credentials suspected",
      description:
        "The CSP issues an out-of-band advisory: there is an active investigation into whether IAM credentials may have been compromised during the outage. They cannot confirm whether the bank's tenant is affected and recommend rotating all programmatic credentials as a precaution. Rotating credentials will require a 30-minute service interruption while applications re-bind.",
      relation:
        "Forces a security/availability tradeoff between Event #4 and #5.",
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "Sn.TPM"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Vendor Management", text: "What is your single point of contact at the CSP during a major incident, and is that contact-tested?" },
    { category: "Failover Capability", text: "When was your cold-restore runbook last exercised end-to-end? What was the actual time?" },
    { category: "Failover Capability", text: "If the secondary region is also impaired, what is the manual fallback for your highest-priority IBS?" },
    { category: "Customer Communications", text: "At what point do you proactively inform customers vs. wait for clarity?" },
    { category: "Regulator Engagement", text: "Walk through the notification timeline for the PRA and FCA. Who signs off?" },
    { category: "Sector Coordination", text: "Are you aware of CMORG's sector-wide coordination channels? Have you exercised them?" },
    { category: "End-of-Day Processes", text: "If you miss CHAPS cut-off, what is the impact and what's the recovery path?" },
    { category: "Concentration Risk", text: "What proportion of your IBS rely on this single CSP? Is that level acceptable to your board?" },
  ],
  debriefQuestions: [
    { category: "General Feedback", text: "Did the scenario realistically reflect a major CSP outage your firm could face?" },
    { category: "Effectiveness of the Plan", text: "What recovery procedures worked well? Which broke down?" },
    { category: "Communication", text: "How effective was internal coordination during the multi-hour incident?" },
    { category: "Communication", text: "Was the customer/regulator communication strategy clear and timely?" },
    { category: "Lessons Learned", text: "What is the top change you would make to your cold-recovery process?" },
    { category: "Lessons Learned", text: "Did the impact-tolerance assumptions for your IBS hold up under this scenario?" },
  ],
};
