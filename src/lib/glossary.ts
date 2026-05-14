// Operational-resilience glossary. Definitions are short and practitioner-facing,
// not academic. Cross-references use the `slug` of related terms.

export type GlossaryEntry = {
  slug: string;
  term: string;
  acronymOf?: string;
  category: "Governance" | "Risk" | "Technical" | "Regulator" | "Process" | "Time";
  short: string;
  longer?: string;
  related?: string[];
  source?: string;
};

export const GLOSSARY: GlossaryEntry[] = [
  {
    slug: "ibs",
    term: "IBS",
    acronymOf: "Important Business Service",
    category: "Governance",
    short:
      "A service the firm provides to external customers that, if disrupted, would harm them, the firm or market integrity.",
    longer:
      "Identified by every UK regulated firm under PRA SS1/21. Each IBS gets an impact tolerance — the maximum duration of disruption tolerable before harm becomes intolerable.",
    related: ["impact-tolerance", "pra-ss121", "fca-sysc15a"],
  },
  {
    slug: "impact-tolerance",
    term: "Impact tolerance",
    category: "Governance",
    short:
      "The maximum tolerable disruption to an IBS, expressed in time. If you breach it, you've materially harmed customers.",
    longer:
      "Firms must set their own tolerances, defend them under regulatory scrutiny, and test scenarios that would breach them. Tolerances are usually in hours or days.",
    related: ["ibs", "severe-but-plausible", "rto"],
  },
  {
    slug: "severe-but-plausible",
    term: "Severe-but-plausible",
    category: "Process",
    short:
      "The threshold a scenario must hit to count under PRA / FCA operational-resilience rules. Not the worst case, not the everyday — a defensible bad day.",
    related: ["impact-tolerance", "scenario-testing"],
  },
  {
    slug: "imt",
    term: "IMT",
    acronymOf: "Incident Management Team",
    category: "Governance",
    short:
      "The strategic team that runs a major incident. CEO-led; CRO is typically the Incident Manager. Distinct from the IRT (tactical).",
    longer:
      "Per industry best practice, the IMT decides invocation, severity, regulator notification, BCP activation and crisis communications. It does not do the hands-on recovery work.",
    related: ["irt", "incident-manager", "imp"],
    source: "best practice",
  },
  {
    slug: "irt",
    term: "IRT",
    acronymOf: "Incident Response Team",
    category: "Governance",
    short:
      "The tactical team that does the actual response work — usually split into a Technology Response Team and a Customer Response Team.",
    related: ["imt", "brt"],
    source: "best practice",
  },
  {
    slug: "brt",
    term: "BRT",
    acronymOf: "Business Recovery Team",
    category: "Governance",
    short:
      "A team mobilised under the Business Continuity Plan to recover a specific area (Finance, Buildings, Technology, Communications).",
    related: ["bcp", "imt"],
    source: "best practice",
  },
  {
    slug: "incident-manager",
    term: "Incident Manager",
    category: "Governance",
    short:
      "The person managing the response process — typically the CRO. Distinct from the Incident Leader (the CEO).",
    longer:
      "best practice is explicit: 'the incident manager should not be the individual leading the incident team.' Separation is mandatory.",
    related: ["imt"],
    source: "best practice",
  },
  {
    slug: "imp",
    term: "IMP",
    acronymOf: "Incident Management Plan",
    category: "Governance",
    short:
      "The firm's master incident-response doctrine. Covers invocation, severity classification, comms cascade, regulator notification, closure and lessons-learned.",
    related: ["bcp", "imt"],
  },
  {
    slug: "bcp",
    term: "BCP",
    acronymOf: "Business Continuity Plan",
    category: "Governance",
    short:
      "The plan invoked when a disruptive event will interrupt one or more IBSs. Sub-flow of the IMP — activation is a joint CEO + CRO decision.",
    related: ["brt", "imp"],
    source: "best practice",
  },
  {
    slug: "rto",
    term: "RTO",
    acronymOf: "Recovery Time Objective",
    category: "Time",
    short:
      "The time within which a process or system must be restored after a disruption. Set per service, used in BC planning.",
    related: ["rpo", "mtpd", "impact-tolerance"],
  },
  {
    slug: "rpo",
    term: "RPO",
    acronymOf: "Recovery Point Objective",
    category: "Time",
    short: "The maximum tolerable data loss, expressed as the time between the last good backup and the disruption.",
    related: ["rto", "mtpd"],
  },
  {
    slug: "mtpd",
    term: "MTPD",
    acronymOf: "Maximum Tolerable Period of Disruption",
    category: "Time",
    short:
      "The longest time a process can be unavailable before unacceptable consequences. Usually longer than RTO.",
    related: ["rto", "rpo", "impact-tolerance"],
  },
  {
    slug: "msel",
    term: "MSEL",
    acronymOf: "Master Scenario Events List",
    category: "Process",
    short:
      "The timeline of events and injects that drive a scenario exercise — what gets released, to whom, at what time on the D-Day clock.",
    related: ["d-day", "scenario-testing"],
  },
  {
    slug: "d-day",
    term: "D-Day clock",
    category: "Time",
    short:
      "The exercise's relative clock — `00:00` is the moment of disruption. Events and injects are scheduled in HH:MM relative to D-Day.",
    related: ["msel"],
  },
  {
    slug: "cmorg",
    term: "CMORG",
    acronymOf: "Cross Market Operational Resilience Group",
    category: "Regulator",
    short:
      "The Bank-of-England-chaired UK industry group that publishes the Dynamic Scenario Library — 14 reference scenarios for sector-wide exercises.",
    related: ["scenario-testing"],
  },
  {
    slug: "scenario-testing",
    term: "Scenario testing",
    category: "Process",
    short:
      "The activity of putting your IBSs through a severe-but-plausible disruption to see whether your response holds together. Required by PRA SS1/21.",
    related: ["msel", "severe-but-plausible", "pra-ss121"],
  },
  {
    slug: "sitrep",
    term: "Sitrep",
    acronymOf: "Situation Report",
    category: "Process",
    short:
      "A structured update from a business unit during an incident: status (GREEN / AMBER / RED), issues, asks, next-update time.",
    source: "best practice",
  },
  {
    slug: "aar",
    term: "AAR",
    acronymOf: "After-Action Report",
    category: "Process",
    short:
      "Post-exercise (or post-incident) write-up. Covers what worked, what didn't, root cause and remediation commitments.",
    related: ["pir"],
  },
  {
    slug: "pir",
    term: "PIR",
    acronymOf: "Post-Incident Report",
    category: "Process",
    short:
      "Formal report due within 10 business days of incident closure. Eight mandatory sections — summary, timeline, RCA, customer impact, regulatory impact, control failures, what worked, remediation.",
    related: ["aar"],
    source: "best practice",
  },
  {
    slug: "rca",
    term: "RCA",
    acronymOf: "Root Cause Analysis",
    category: "Process",
    short:
      "The technique of working backwards from the failure to the originating cause(s). Preliminary RCA is one of five closure criteria.",
    related: ["pir"],
  },
  {
    slug: "consumer-duty",
    term: "Consumer Duty",
    category: "Regulator",
    short:
      "FCA principle (PS22/3) requiring firms to deliver good outcomes for retail customers. In incident management, it's an aggravating factor that promotes severity to High regardless of financial threshold.",
    related: ["fca-sysc15a"],
    source: "FCA PS22/3",
  },
  {
    slug: "pra-ss121",
    term: "PRA SS1/21",
    category: "Regulator",
    short:
      "The Prudential Regulation Authority's supervisory statement on operational resilience. Mandates IBS identification, impact tolerances, scenario testing and self-assessment.",
    related: ["fca-sysc15a", "ibs"],
  },
  {
    slug: "fca-sysc15a",
    term: "FCA SYSC 15A",
    category: "Regulator",
    short:
      "The FCA's operational-resilience handbook chapter — parallel to PRA SS1/21 with the same core requirements for solo-regulated firms.",
    related: ["pra-ss121"],
  },
  {
    slug: "ico",
    term: "ICO",
    acronymOf: "Information Commissioner's Office",
    category: "Regulator",
    short:
      "The UK data-protection regulator. Notifications of personal data breaches must be made within 72 hours of awareness (UK GDPR Art. 33).",
    related: ["consumer-duty"],
  },
  {
    slug: "boe",
    term: "BoE",
    acronymOf: "Bank of England",
    category: "Regulator",
    short:
      "The UK central bank. Hosts CMORG and the Cross-Market Operational Resilience programme; receives notifications for FMI incidents.",
    related: ["cmorg"],
  },
  {
    slug: "smf",
    term: "SMF",
    acronymOf: "Senior Manager Function",
    category: "Governance",
    short:
      "A named regulated function under the Senior Managers Regime. CEO=SMF1, CFO=SMF2, CRO=SMF4, CTO=SMF24.",
  },
  {
    slug: "ercc",
    term: "ERCC",
    acronymOf: "Enterprise Risk Conduct Committee",
    category: "Governance",
    short:
      "Internal committee that reviews post-incident reports and material risk events. Reports up to the Board Risk Committee (BRCC).",
  },
  {
    slug: "war-room",
    term: "War room",
    category: "Process",
    short:
      "The (physical or virtual) location the IMT/IRT convenes in during an incident. Real war rooms have whiteboards, screens, fixed phones; virtual ones run on Teams / Zoom + a shared incident log.",
    related: ["imt", "irt"],
  },
  {
    slug: "tabletop",
    term: "Tabletop exercise",
    category: "Process",
    short:
      "A discussion-based exercise — participants talk through their response without touching real systems. Fastest way to validate playbooks; doesn't prove technical recovery works.",
  },
  {
    slug: "live-exercise",
    term: "Live exercise",
    category: "Process",
    short:
      "An exercise that touches real systems — switching to DR, testing failover, invoking actual playbooks. Higher risk, higher fidelity than a tabletop.",
  },
];

export const CATEGORIES = [
  "Governance",
  "Risk",
  "Technical",
  "Regulator",
  "Process",
  "Time",
] as const;
