import type { LibraryScenario } from "./types";

/**
 * Legal & professional-services scenarios — law firms, accountancy
 * practices, consultancies, audit firms. Distinctive risks around
 * client-confidentiality, regulator (SRA / FRC / ICAEW) oversight and
 * matter-data privilege.
 */
export const LEGAL_PROFESSIONAL_SCENARIOS: LibraryScenario[] = [
  {
    slug: "law-firm-ransomware",
    title: "Ransomware encrypts matter-management system at peak transaction-volume",
    sectors: ["legal-professional"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "A magic-circle / top-50 law firm is hit by ransomware mid-transaction-quarter. Matter-management, document-management and time-recording all encrypted. Live deals are at risk. Client-data confidentiality and privilege concerns intense. SRA notification mandatory; press cycle severe.",
    characteristics: [
      "Privilege-and-confidentiality breach risk",
      "Live-deal disruption with deal-value consequence",
      "SRA / regulator scrutiny",
    ],
    assumptions: [
      "Backups recoverable within 5-10 days",
      "Affected-client notification carefully sequenced",
      "Some clients will demand full forensic assurance",
    ],
    coversDataIntegrity: true,
    coversDataAvailability: true,
    coversTechnology: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "audit-firm-quality-incident",
    title: "FRC investigation triggered by audit-quality finding at major audit firm",
    sectors: ["legal-professional"],
    category: "Geopolitical & Macro",
    background:
      "FRC opens a formal investigation into the audit-quality of a high-profile listed-company audit signed off by the firm. The audit-partner is named in early findings. Media interest is severe. Civil-litigation risk from shareholders. Internal-controls and audit-methodology review in parallel.",
    characteristics: [
      "Regulator-investigation with reputational primacy",
      "Multi-year resolution timeline",
      "Audit-firm reputational long-tail",
    ],
    assumptions: [
      "Internal review precedes / mirrors FRC findings",
      "Civil litigation will follow",
      "Audit-partner careers affected regardless",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "consultancy-client-data-breach",
    title: "Consultancy laptop loss exposes client-strategy documents",
    sectors: ["legal-professional"],
    category: "Technology & Data (Cyber)",
    background:
      "A consultant's laptop is stolen from a coffee shop. Encryption was enabled but VPN was disconnected at the time of theft; cached files in unencrypted system temp directories include client M&A-strategy decks. ICO notification triggered. Client relationship at risk; partner accountability question.",
    characteristics: [
      "Mobile-asset loss with sensitive-data exposure",
      "Client-trust and contract-renewal risk",
      "ICO Tier-2 notification",
    ],
    assumptions: [
      "Cached files identifiable from device-management",
      "Customer-comms must be immediate and direct",
      "Insurance covers most of the costs",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "professional-misconduct-finding",
    title: "Senior partner faces professional-misconduct allegation",
    sectors: ["legal-professional"],
    category: "People",
    background:
      "A senior partner is the subject of a professional-misconduct complaint with media-leak risk. Internal investigation, professional-body (SRA / ICAEW) engagement, and external-counsel coordination all in parallel. Confidentiality vs. transparency tension at maximum. Client-relationship and staff-morale impact significant.",
    characteristics: [
      "Senior-accountability event with multi-channel response",
      "Confidentiality and natural-justice tension",
      "Staff-and-client confidence at stake",
    ],
    assumptions: [
      "Independent investigation is standard",
      "Press leak risk is real and unpredictable",
      "Outcome multi-month",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 150,
  },
];
