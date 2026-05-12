import type { ScenarioTemplate } from "../types";

export const tier1DataLeak: ScenarioTemplate = {
  slug: "tier1-major-customer-data-leak",
  title: "Major Customer Data Leak (10M+ records)",
  category: "Technology & Data (Cyber)",
  tier: "TIER_1",
  firmProfile: "Global Universal Bank",
  background:
    "Discovery of a large-scale customer data exfiltration affecting 10M+ retail and SME customers across multiple jurisdictions. Tests the firm's ability to respond to a multi-regulator, multi-jurisdiction breach with criminal-investigation overlay and significant customer-trust impact.",
  agenda:
    "T+0 Detection / external notification\nT+4h Initial regulator notifications (72h clock starts)\nDay 1 Customer notification plan\nDay 3 Regulator deep-dive engagement\nDay 7 Class-action and remediation",
  dDayDate: "2026-11-03T11:00:00Z",
  durationMin: 240,

  cause:
    "A sophisticated threat actor has exfiltrated customer records over a multi-week period via a compromised third-party data-analytics platform connected to the customer datawarehouse. The threat actor publishes a 10% sample on a leak site as proof.",
  impactNarrative:
    "Confirmed exfiltration of name, address, account number, sort code, mobile number, partial transaction history and (for ~30% of records) full date-of-birth, NI number and passport number. Multiple jurisdictions affected. GDPR / UK GDPR 72-hour clock starts on confirmation. Coverage in major media outlets within hours. Class-action law firms publicly state intent to sue. Customer call volume to contact centre is 10x baseline; significant elderly-and-vulnerable customer impact.",
  characteristics: [
    "Rapid onset (from external notification).",
    "Multi-jurisdiction — GDPR, CCPA, multiple national regulators.",
    "Reputational — affects core retail-banking trust franchise.",
    "Long-tail — class-action and customer-redress costs unknown for years.",
    "Concurrent criminal investigation limits public statements.",
  ],
  assumptions: [
    "Initial detection is via threat actor's leak-site post (not internal monitoring).",
    "Forensics will take weeks to confirm exact records affected.",
    "Some affected customers will be high-profile / political figures.",
  ],
  compoundScenarioNotes:
    "Compounds with a coincident cyber attack (ransomware), a third-party SaaS breach (the leak vector is often a fourth party), or a sanctions/regulatory enforcement.",
  takeaways:
    "Equifax (2017): 147M records compromised, $700M+ in fines and settlements, CEO resigned. Highlighted the importance of patch management, exec-level cyber accountability, and rapid victim notification.",
  caseStudy: {
    title: "Equifax Data Breach (2017)",
    causation:
      "Equifax failed to patch a known Apache Struts vulnerability for 2 months after disclosure. Attackers exploited the unpatched vulnerability to access sensitive consumer-credit data.",
    impactScale:
      "147 million US, UK and Canadian consumers affected. $1.4B in incident-response and remediation costs; ~$700M in fines and consumer settlements. CEO, CIO and CSO all resigned.",
    duration:
      "Initial intrusion mid-May 2017; detected end of July; public disclosure 7 September 2017. Class-action litigation continued for years.",
  },
  stressVariables: [
    { name: "Records affected", options: ["1M", "5M", "10M", "50M", ">100M"] },
    { name: "Data sensitivity", options: ["Contact only", "+ Account", "+ Identity", "+ Authentication credentials"] },
    { name: "Disclosure trigger", options: ["Internal monitoring", "Threat actor leak", "Regulator inquiry", "Media leak"] },
    { name: "Concurrent criminal investigation", options: ["No", "Yes — minor restriction", "Yes — major restriction"] },
  ],
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer Contact Centre", description: "Inbound customer support — call volumes 10x baseline expected.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Online & Mobile Banking", description: "Customer-facing channels — fraud risk elevated.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Fraud Detection & Customer Verification", description: "Heightened verification for high-risk customers.", impactToleranceMin: 120, criticality: "HIGH" },
    { code: "IBS_04", name: "Card Re-issuance Process", description: "Mass re-issuance capability for affected customers.", impactToleranceMin: 1440, criticality: "HIGH" },
    { code: "IBS_05", name: "Regulatory Reporting", description: "Multi-regulator coordinated notification process.", impactToleranceMin: 4320, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "11:00",
      title: "Threat-actor leak-site post discovered",
      description:
        "An OSINT vendor alerts the firm's CISO function: a known threat actor has posted a sample of what appears to be the firm's customer data on a Tor leak site, with claims of 10M+ records and demands of a multi-million-pound ransom to prevent publication. The post is publicly visible. Initial validation suggests the sample is genuine — formats and structure match internal data.",
      expectedActions: [
        "Activate Cyber Major Incident protocol",
        "Engage external incident-response firm",
        "Brief CEO, board chair and general counsel",
        "Begin forensic investigation of likely vector",
      ],
      objectives: [
        "Test breach-detection-via-external-source posture",
        "Validate executive escalation",
        "Assess external IR partner engagement",
      ],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CEO", "General Counsel", "CTO"],
      ccRoleTitles: ["CRO", "Comms Lead"],
    },
    {
      eventNo: 2,
      scheduledTime: "13:00",
      title: "Regulator 72-hour clock starts",
      description:
        "The firm formally confirms a 'personal data breach' has occurred. GDPR Article 33 72-hour clock starts. Equivalent clocks under UK GDPR, FCA Principle 11 and overseas regimes also start. Multiple regulators must receive initial notification within tight windows, with consistent language and material-fact disclosure.",
      expectedActions: [
        "File initial regulator notifications (ICO, FCA, BoE, overseas)",
        "Stand up dedicated incident response cell",
        "Brief board chair and key non-executives",
        "Begin coordinated comms with law enforcement",
      ],
      objectives: [
        "Test multi-regulator notification process",
        "Validate consistent disclosure language",
        "Assess law-enforcement coordination",
      ],
      senderRoleTitle: "General Counsel",
      toRoleTitles: ["CEO", "CRO", "ISM"],
      ccRoleTitles: ["Comms Lead"],
    },
    {
      eventNo: 3,
      scheduledTime: "16:00",
      title: "First media break and customer call surge",
      description:
        "BBC, FT and Reuters all run lead stories. Twitter trends. Customer call volumes to the contact centre are 12x baseline within an hour and rising. The IVR has not yet been updated with a dedicated message. Several MPs comment publicly. The class-action firm Slater & Gordon issues a press statement saying they're investigating. Customer-facing teams report distressed elderly and vulnerable customers.",
      expectedActions: [
        "Issue customer-facing statement on website, app and IVR",
        "Surge contact-centre capacity (partner overflow)",
        "Stand up vulnerable-customer support process",
        "Brief frontline staff with approved messaging",
      ],
      objectives: [
        "Test rapid customer-channel update capability",
        "Validate vulnerable-customer support",
        "Assess frontline-staff briefing",
      ],
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "Customer Ops Lead"],
      ccRoleTitles: ["CRO", "General Counsel"],
    },
    {
      eventNo: 4,
      scheduledTime: "11:00",
      isScheduled: false,
      title: "Day 2 — Affected-customer list confirmation",
      description:
        "Forensics confirms approximately 14M records were exfiltrated, including ~4.2M with full identity data (DOB, NI number, passport number). The firm must decide on: scope of customer notification, what to offer affected customers (credit monitoring, identity protection), how to handle joint-account customers, and how to handle deceased customers (estates).",
      expectedActions: [
        "Approve customer-notification scope and content",
        "Approve customer offer (credit monitoring, identity protection)",
        "Issue mass customer notification — staggered rollout",
        "Allocate provision in Q4 results",
      ],
      objectives: [
        "Test customer-notification decisioning",
        "Validate provision-and-disclosure process",
        "Assess customer-redress design",
      ],
      senderRoleTitle: "CEO",
      toRoleTitles: ["Customer Ops Lead", "Comms Lead", "CRO", "General Counsel"],
      ccRoleTitles: ["CFO"],
    },
    {
      eventNo: 5,
      scheduledTime: "11:00",
      isScheduled: false,
      title: "Day 7 — Regulator deep-dive and class-action",
      description:
        "ICO and FCA both request detailed written responses with control-failure root-cause analysis. Two class-action law firms have filed claims with combined claim values exceeding £500M. The board demands a 90-day remediation programme with weekly progress reports. CEO is summoned by the Treasury Select Committee.",
      expectedActions: [
        "Submit regulator deep-dive responses",
        "Defend class actions; estimate provision",
        "Approve 90-day remediation programme",
        "Prepare for Treasury Select Committee evidence",
      ],
      objectives: [
        "Test regulator deep-dive response quality",
        "Validate legal-defence coordination",
        "Assess long-tail remediation capacity",
      ],
      senderRoleTitle: "General Counsel",
      toRoleTitles: ["CEO", "CRO", "CFO"],
      ccRoleTitles: ["ISM", "Comms Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "14:30",
      summary: "Ransom communication received",
      description:
        "Threat actor contacts the firm directly via PGP-signed email demanding a $40M payment in cryptocurrency within 48 hours, threatening to release the full dataset otherwise. The firm faces a payment decision with legal, sanctions, ethical and operational dimensions.",
      relation:
        "Compounds Event #2. Tests ransom-decisioning under multi-jurisdiction sanctions regime.",
      senderRoleTitle: "ISM",
      toRoleTitles: ["CEO", "General Counsel"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "10:30",
      isScheduled: false,
      summary: "High-profile customer named",
      description:
        "A national newspaper reports that a senior cabinet minister's personal data was in the sample. The story dominates news cycles. Political pressure intensifies; the regulator requests an emergency briefing.",
      relation:
        "Cuts across Event #3. Tests crisis-comms under political scrutiny.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "General Counsel"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "How would you know your data was being exfiltrated for weeks? What controls would catch this?" },
    { category: "Regulator", text: "Walk through your simultaneous notifications across all relevant jurisdictions in the first 72 hours." },
    { category: "Customer", text: "What is your firm's policy on credit monitoring / identity protection offers? Documented?" },
    { category: "Ransom", text: "If a ransom demand arrives, what is the decision process? Who has authority? What are the sanctions implications?" },
    { category: "Board", text: "How would the board chair want to be involved on day 1 vs. day 7?" },
    { category: "Long-tail", text: "What's the financial-provision range? How do you avoid material under-disclosure?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "Were detection-via-external-source escalations realistic and timely?" },
    { category: "Multi-regulator", text: "Did the simultaneous-notification process hold up across jurisdictions?" },
    { category: "Customer Care", text: "Did vulnerable customers receive appropriate support?" },
    { category: "Lessons Learned", text: "What is the top control improvement from this scenario?" },
  ],
};
