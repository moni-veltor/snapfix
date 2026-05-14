// The canonical Afin-IMP-aligned IMT seat catalogue. Used to seed an org's
// OrganizationRole table with sensible defaults. Each entry's `deputyOf`
// references another role's abbreviation, building the deputy chain.

export type DefaultRole = {
  abbreviation: string;
  title: string;
  responsibility: string;
  isSMF: boolean;
  isExecutive: boolean;
  deputyOf?: string;
  orderIdx: number;
};

/**
 * Default IMT + IRT + Comms roles. Order matches the visual stacking on the
 * seat-board: IMT first, then tactical (IRT-tech, IRT-customer), then comms,
 * then specialised seats.
 */
export const DEFAULT_ROLES: DefaultRole[] = [
  // Incident Management Team — strategic
  {
    abbreviation: "CEO",
    title: "Chief Executive Officer",
    responsibility: "Incident Leader. Chairs the IMT. Final approver on regulator notifications and crisis comms.",
    isSMF: true,
    isExecutive: true,
    orderIdx: 1,
  },
  {
    abbreviation: "CRO",
    title: "Chief Risk Officer",
    responsibility: "Incident Manager. Runs the process. Deputy Incident Leader. Owns regulator-facing notifications.",
    isSMF: true,
    isExecutive: true,
    deputyOf: "CEO",
    orderIdx: 2,
  },
  {
    abbreviation: "CTO",
    title: "Chief Technology Officer",
    responsibility: "Technology lead in the IMT. Authorises infrastructure / system decisions. Liaises with critical third-party vendors.",
    isSMF: true,
    isExecutive: true,
    orderIdx: 3,
  },
  {
    abbreviation: "COO",
    title: "Chief Operating Officer",
    responsibility: "People and operational continuity. Coordinates customer ops, BCP activation, premises.",
    isSMF: true,
    isExecutive: true,
    orderIdx: 4,
  },
  {
    abbreviation: "CCO",
    title: "Chief Customer Officer",
    responsibility: "Customer-facing harm assessment. Approves customer comms. Consumer Duty owner.",
    isSMF: false,
    isExecutive: true,
    orderIdx: 5,
  },
  {
    abbreviation: "CFO",
    title: "Chief Financial Officer",
    responsibility: "Financial impact, liquidity, regulatory capital. Approves emergency spend up to £100k cap (BCP §6.5.1.1).",
    isSMF: true,
    isExecutive: true,
    orderIdx: 6,
  },
  {
    abbreviation: "CPO",
    title: "Chief People Officer",
    responsibility: "Staff welfare, evacuation protocols, insider-threat coordination (HR side).",
    isSMF: false,
    isExecutive: true,
    orderIdx: 7,
  },

  // Compliance & comms
  {
    abbreviation: "Head of Compliance",
    title: "Head of Compliance",
    responsibility: "ICO data-breach notifications. UK GDPR Art. 33 assessments. Regulator-facing compliance posture.",
    isSMF: false,
    isExecutive: false,
    deputyOf: "CRO",
    orderIdx: 8,
  },
  {
    abbreviation: "Head of External Affairs",
    title: "Head of External Affairs",
    responsibility: "Media management. Drafts public statements. Engages press lines and social listening.",
    isSMF: false,
    isExecutive: false,
    orderIdx: 9,
  },
  {
    abbreviation: "Comms Lead",
    title: "Communications Lead",
    responsibility: "Drafts and orchestrates the cascade (employee → customer → third party → media).",
    isSMF: false,
    isExecutive: false,
    deputyOf: "Head of External Affairs",
    orderIdx: 10,
  },

  // Tactical — Technology Response Team
  {
    abbreviation: "ISM",
    title: "Information Security Manager",
    responsibility: "Cyber forensics lead. Containment and evidence-preservation decisions in cyber incidents.",
    isSMF: false,
    isExecutive: false,
    orderIdx: 11,
  },
  {
    abbreviation: "Sn.TPM",
    title: "Senior Technical Product Manager",
    responsibility: "Tech Recovery Lead. Coordinates engineering response, DR failover, vendor escalations.",
    isSMF: false,
    isExecutive: false,
    deputyOf: "CTO",
    orderIdx: 12,
  },
  {
    abbreviation: "TPM",
    title: "Technical Product Manager",
    responsibility: "Tech Recovery hands-on. Owns specific system recovery streams during an incident.",
    isSMF: false,
    isExecutive: false,
    deputyOf: "Sn.TPM",
    orderIdx: 13,
  },
  {
    abbreviation: "Sn. DA/E",
    title: "Senior Data Architect / Engineer",
    responsibility: "Data-integrity and data-availability decisions. Owns rebuild / recovery for affected datasets.",
    isSMF: false,
    isExecutive: false,
    orderIdx: 14,
  },

  // Tactical — Customer Response Team
  {
    abbreviation: "Customer Ops Lead",
    title: "Customer Operations Lead",
    responsibility: "Customer Response Team lead. Manages contact centre, complaints, customer-facing comms execution.",
    isSMF: false,
    isExecutive: false,
    deputyOf: "COO",
    orderIdx: 15,
  },
];
