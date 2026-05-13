// UK operational-resilience regulators and the obligations they impose.
// Plain-English summaries with deep links into the original guidance.

export type RegulatorEntry = {
  slug: string;
  name: string;
  fullName: string;
  scope: string; // who it applies to
  framework: string; // headline doc
  url: string;
  expects: { title: string; detail: string }[];
  notifications: {
    trigger: string;
    sla: string; // e.g. "Within 4 hours of IMT invocation"
    owner: string;
  }[];
};

export const REGULATORS: RegulatorEntry[] = [
  {
    slug: "pra",
    name: "PRA",
    fullName: "Prudential Regulation Authority",
    scope: "Dual-regulated banks, building societies, large investment firms, insurers",
    framework: "SS1/21 — Operational resilience: impact tolerances for important business services",
    url: "https://www.bankofengland.co.uk/prudential-regulation/publication/2018/building-the-uk-financial-sectors-operational-resilience-discussion-paper",
    expects: [
      {
        title: "Identify your IBSs",
        detail:
          "Every dual-regulated firm must maintain a register of Important Business Services and document the rationale for each.",
      },
      {
        title: "Set impact tolerances",
        detail:
          "Define and defend the maximum tolerable disruption per IBS. Tolerances must be challenging and reviewed at least annually.",
      },
      {
        title: "Test severe-but-plausible scenarios",
        detail:
          "Demonstrate that you can stay within tolerances under defensible bad-day scenarios. Cyber, third-party, severe weather, premises loss are baseline.",
      },
      {
        title: "Self-assessment",
        detail:
          "Submit a self-assessment to the PRA. Materials should evidence your IBS mapping, tolerances, scenario test results and remediation plans.",
      },
    ],
    notifications: [
      {
        trigger: "High-severity incident affecting operational resilience or regulatory capital",
        sla: "Within 4 hours of IMT invocation",
        owner: "CRO (approved by CEO)",
      },
      {
        trigger: "Closure of any high-severity incident",
        sla: "Within 2 business days of closure",
        owner: "CRO",
      },
    ],
  },
  {
    slug: "fca",
    name: "FCA",
    fullName: "Financial Conduct Authority",
    scope: "All UK regulated firms — solo-regulated firms have FCA only",
    framework: "SYSC 15A — Operational resilience",
    url: "https://www.handbook.fca.org.uk/handbook/SYSC/15A/",
    expects: [
      {
        title: "Same IBS / tolerance / testing framework",
        detail:
          "FCA SYSC 15A mirrors PRA SS1/21 for solo-regulated firms. The same evidence base supports both.",
      },
      {
        title: "Consumer Duty alignment",
        detail:
          "Consumer Duty (PS22/3) requires good outcomes for retail customers. In an incident, the Duty acts as an aggravating factor — an issue affecting customers' ability to access funds, complete transactions or exercise rights is treated as High severity regardless of financial threshold.",
      },
    ],
    notifications: [
      {
        trigger: "High-severity incident with actual/potential material customer impact",
        sla: "Within 4 hours of IMT invocation",
        owner: "CRO (approved by CEO)",
      },
      {
        trigger: "Closure of any high-severity incident",
        sla: "Within 2 business days of closure",
        owner: "CRO",
      },
    ],
  },
  {
    slug: "boe",
    name: "BoE",
    fullName: "Bank of England",
    scope:
      "Financial Market Infrastructures (CCPs, CSDs, payment systems) and systemic banks via the PRA",
    framework: "Cross-Market Operational Resilience (with CMORG)",
    url: "https://www.bankofengland.co.uk/financial-stability/operational-resilience-of-the-financial-sector",
    expects: [
      {
        title: "Participate in cross-market exercises",
        detail:
          "Systemic firms are expected to participate in the annual cross-market exercise programme.",
      },
      {
        title: "Use the CMORG Dynamic Scenario Library",
        detail:
          "CMORG publishes 14 reference scenarios covering cyber, third-party, market-wide and physical disruption events. Firms are expected to test against them.",
      },
    ],
    notifications: [
      {
        trigger: "FMI incident with potential market impact",
        sla: "Without undue delay",
        owner: "CRO / Head of Operations",
      },
    ],
  },
  {
    slug: "ico",
    name: "ICO",
    fullName: "Information Commissioner's Office",
    scope: "Any organisation processing personal data of UK residents",
    framework: "UK GDPR Art. 33 — Personal data breach notification",
    url: "https://ico.org.uk/for-organisations/report-a-breach/personal-data-breach/",
    expects: [
      {
        title: "Identify personal data breaches promptly",
        detail:
          "A 'breach' is any incident that compromises confidentiality, integrity or availability of personal data. Suspected breaches must be assessed within hours of awareness.",
      },
      {
        title: "Document everything",
        detail:
          "Maintain a register of all breaches (notified or not) with the assessment rationale. The ICO can ask to see it.",
      },
    ],
    notifications: [
      {
        trigger: "Suspected or confirmed personal data breach",
        sla: "Within 72 hours of becoming aware",
        owner: "Head of Compliance (approved by CRO)",
      },
      {
        trigger: "Breach likely to result in high risk to data subjects",
        sla: "Without undue delay to affected individuals",
        owner: "Head of Compliance",
      },
    ],
  },
];
