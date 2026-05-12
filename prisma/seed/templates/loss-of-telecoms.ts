import type { ScenarioTemplate } from "../types";

export const lossOfTelecoms: ScenarioTemplate = {
  slug: "loss-of-telecoms",
  title: "Loss of Telecoms / Network Infrastructure",
  category: "Critical National Infrastructure",
  srrRef: "1.1",
  background:
    "This scenario explores a major outage affecting fixed-line and mobile telecommunications services across one or more regions. Impacts internal staff communication, contact-centre operation, customer messaging, and inter-firm settlement.",
  agenda:
    "T+0:00 Outage onset\nT+0:30 Comms posture re-assessment\nT+1:30 Customer impact peaks\nT+4:00 Restoration begins\nT+24:00 Reconciliation",
  dDayDate: "2026-03-04T09:00:00Z",
  durationMin: 150,

  cause:
    "A major telecoms provider experiences a network-control-plane failure (BGP misconfiguration, mass cell-site outage, or undersea fibre cut) causing widespread voice and data degradation for both fixed-line and mobile customers.",
  impactNarrative:
    "Contact-centre inbound telephony degraded to 15% of capacity; outbound dialler stops. Customer-facing SMS notifications and 2FA challenges fail. Internal staff communication via VoIP, Teams and conference bridges degraded. Branch backhaul partially affected. Mobile-app push notifications fail intermittently. Some customers' 2FA fails causing increased fraud and lockout cases.",
  characteristics: [
    "Rapid onset — telecoms outages typically have no notice.",
    "Disrupted communication — both internal and customer comms are the direct victim.",
    "Information asymmetry — root cause may be unclear for hours.",
    "Higher scrutiny — direct customer-facing impact draws media attention quickly.",
  ],
  assumptions: [
    "Incident happens on a peak trading or transaction day.",
    "Provider does not provide a fast root-cause confirmation.",
    "Alternate provider failover may be partial or capacity-limited.",
  ],
  compoundScenarioNotes:
    "Compounds with cyber attacks (telecoms infrastructure is a target), severe weather (physical damage), national power outage. Multi-provider failover often shares the same physical infrastructure.",
  takeaways:
    "Voice and SMS are critical for customer authentication and authorisation flows that quietly underpin many IBS. The Optus/Australia 2023 outage (9.7m customers) showed that even brief telecoms loss can cause significant societal impact. Plan for fully-out-of-band fallbacks for the highest-priority customer journeys.",
  stressVariables: [
    { name: "Affected service", options: ["Mobile only", "Fixed-line only", "Both", "Internet backhaul only"] },
    { name: "Duration", options: ["1h", "4h", "12h", "24h", ">24h"] },
    { name: "Geography", options: ["Single city", "Region", "Country-wide"] },
  ],
  caseStudy: {
    title: "Optus Outage (Australia, 8 November 2023)",
    causation:
      "Optus experienced an unexpected change in network routing parameters from an international peering network. The change triggered a cascade of internet-routing failures, causing widespread service disruption.",
    impactScale:
      "Approximately 9.7 million Optus customers were affected, including emergency-call services. Banking customers using Optus mobile for 2FA were locked out of digital banking. Public transport across multiple cities affected; small businesses unable to process card payments.",
    duration:
      "Disruption lasted approximately 14 hours. Customer-trust impact persisted for weeks; CEO resigned 11 days later.",
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
    { code: "IBS_01", name: "Contact Centre Telephony", description: "Inbound customer telephony.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Customer Authentication (2FA)", description: "SMS-based and voice-based authentication.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Mobile & Online Banking", description: "Digital channels requiring 2FA.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_04", name: "Fraud Detection & Customer Verification", description: "Outbound call verification for high-value transactions.", impactToleranceMin: 120, criticality: "HIGH" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:00",
      title: "Telecoms provider declares major outage",
      description:
        "The bank's primary telecoms provider declares a major service disruption affecting both fixed-line and mobile services across the UK. The provider cannot confirm a recovery timeline. The contact centre's inbound queue drops to ~15% of normal capacity within minutes. SMS-based 2FA challenges begin failing, locking customers out of digital banking. Conference bridges and Teams calls disconnect intermittently.",
      expectedActions: [
        "Activate Major Incident process",
        "Failover authentication to voice/app-based methods where possible",
        "Direct customers to alternative channels via app and web",
        "Engage telecoms provider's major-incident desk",
      ],
      objectives: [
        "Validate authentication failover",
        "Test customer-channel redirection",
        "Assess vendor liaison",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Customer Ops Lead"],
      ccRoleTitles: ["Comms Lead", "CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "10:30",
      title: "Customer impact peaks",
      description:
        "Customer impact reaches its peak. Mobile-app login failures running at ~40%; customers cannot complete payments above the unauthenticated limit; fraud-verification outbound calls fail. Social media is full of customer complaints. The contact centre is at full chat-channel capacity and overflow to a back-up partner is being explored.",
      expectedActions: [
        "Issue customer status update via web, app and social",
        "Activate partner overflow for contact centre",
        "Raise unauthenticated payment limit temporarily (with appropriate controls)",
        "Brief regulator on customer impact",
      ],
      objectives: [
        "Test multi-channel customer communications",
        "Validate emergency-policy changes (limit changes)",
        "Assess regulator-engagement",
      ],
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["CEO", "CTO", "Comms Lead"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 3,
      scheduledTime: "13:00",
      title: "Restoration begins, but reconciliation needed",
      description:
        "Telecoms provider confirms a phased restoration over the next 90 minutes. Authentication systems will need to revalidate before customer flows can fully resume. The firm has accumulated a backlog of fraud-verification queues, customer complaints and missed payments. Coordination with the telecoms provider's restoration sequence is required.",
      expectedActions: [
        "Plan staged restoration of customer-facing services",
        "Process fraud-verification backlog",
        "Issue customer apology with redress framework",
        "Initiate post-incident review",
      ],
      objectives: [
        "Test staged-restoration sequencing",
        "Validate backlog-processing capacity",
        "Assess redress decisioning",
      ],
      senderRoleTitle: "CTO",
      toRoleTitles: ["Sn.TPM", "TPM", "Customer Ops Lead"],
      ccRoleTitles: ["CRO", "Comms Lead"],
    },
    {
      eventNo: 4,
      scheduledTime: "16:00",
      isScheduled: false,
      title: "Post-event regulator and board update",
      description:
        "The board requests a clear assessment of customer impact and any breaches of impact tolerance. The regulator asks for a written 24-hour incident summary. Internal data shows IBS_02 (2FA) exceeded its 30-minute impact tolerance for 4 hours and IBS_01 (contact centre) for 3 hours. The firm must clearly articulate cause, response, and the plan to prevent recurrence.",
      expectedActions: [
        "Produce board impact-tolerance breach report",
        "Submit 24-hour regulator update",
        "Confirm customer redress process",
        "Begin lessons-learned exercise",
      ],
      objectives: [
        "Test breach-reporting accuracy",
        "Validate regulator-engagement timeliness",
        "Assess lessons-learned discipline",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "CTO"],
      ccRoleTitles: ["Comms Lead", "Customer Ops Lead"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "10:00",
      summary: "Authentication-bypass attempt spike",
      description:
        "The fraud team detects a spike in attempted account-takeover activity, with attackers exploiting the inability of customers to reach the bank for verification. Several high-value transactions have been authorised by customers who later report not recognising them.",
      relation:
        "Compounds Event #2. Tests fraud-controls under degraded auth.",
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "Customer Ops Lead"],
      ccRoleTitles: ["CRO"],
    },
    {
      injectNo: 2,
      scheduledTime: "11:45",
      summary: "Sector-wide telecoms impact",
      description:
        "The telecoms provider confirms major banks A, B and C are also affected. CMORG's sector-coordination channel proposes a joint customer-communications statement to manage expectations and reduce fraud risk. The firm has 30 minutes to decide whether to participate.",
      relation:
        "Tests sector-coordination decision-making.",
      senderRoleTitle: "Comms Lead",
      toRoleTitles: ["CEO", "CTO"],
      ccRoleTitles: ["CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Authentication", text: "What is your fallback for SMS-based 2FA? Is it documented and exercised?" },
    { category: "Customer Comms", text: "How quickly can you issue a status banner across web, app, social and IVR?" },
    { category: "Vendor Management", text: "Who is your major-incident contact at your primary telecoms provider? Tested?" },
    { category: "Fraud Risk", text: "How do you adjust fraud thresholds when authentication is degraded?" },
    { category: "Impact Tolerance", text: "What is the impact-tolerance for each of your customer-comms channels?" },
  ],
  debriefQuestions: [
    { category: "General", text: "Were the customer-authentication failure modes realistic?" },
    { category: "Customer Comms", text: "Did your status-update cadence meet board and customer expectations?" },
    { category: "Lessons Learned", text: "What is the highest-priority telecoms-resilience investment from this exercise?" },
  ],
};
