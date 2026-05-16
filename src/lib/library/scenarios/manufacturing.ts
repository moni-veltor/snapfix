import type { LibraryScenario } from "./types";

/**
 * Manufacturing scenarios — discrete and process manufacturing,
 * automotive, food, aerospace components, electronics, FMCG.
 */
export const MANUFACTURING_SCENARIOS: LibraryScenario[] = [
  {
    slug: "ot-ransomware-plant",
    title: "Ransomware crosses IT-OT boundary, halts production at a flagship plant",
    sectors: ["manufacturing"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "Ransomware encrypts office IT and propagates to the OT segment via an engineering laptop with dual-homed access. Production lines halt. ICS / SCADA systems are isolated as a precaution. Estimated production loss £6M/day. NCSC, NCSU and HSE engaged. Recovery 7-14 days.",
    characteristics: [
      "IT-OT-boundary-breach with production-halt impact",
      "Multi-day revenue impact",
      "Multi-agency response",
    ],
    assumptions: [
      "OT-side restoration requires careful integrity validation",
      "Some lines can run in manual / paper mode at 20% throughput",
      "Cyber-insurance covers most of the recovery",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "raw-material-supply-disruption",
    title: "Critical raw-material supplier failure during peak production",
    sectors: ["manufacturing"],
    category: "Third Party",
    background:
      "The sole-supplier for a critical component fails (factory fire / financial collapse). Production-line stoppage in 5-7 days when current stock depletes. Alternative suppliers exist but qualification takes 8-12 weeks. Customer-delivery commitments at risk; some are automotive OEMs with severe LD clauses.",
    characteristics: [
      "Single-source-supplier-risk realised",
      "Multi-week production stoppage potential",
      "Customer-contract LD exposure",
    ],
    assumptions: [
      "Alternative supplier qualification is slow",
      "Customer renegotiation possible but unfavourable",
      "Inventory bridging is partial",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "product-recall-safety",
    title: "Product safety defect requires global recall",
    sectors: ["manufacturing", "retail-ecommerce"],
    category: "Property",
    background:
      "A safety-critical defect is identified in a product shipped to ~280,000 units globally. Recall cost estimated £40M. OPSS / OSHA / EU regulators involved depending on jurisdiction. Customer-comms, replacement-logistics and brand-recovery in parallel. Press cycle is severe.",
    characteristics: [
      "Multi-jurisdictional recall coordination",
      "Customer-safety primacy",
      "Brand-recovery long-tail",
    ],
    assumptions: [
      "Replacement-unit supply is feasible but slow",
      "Some units are difficult to trace to end-users",
      "Insurance covers recall cost",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "automotive-cyber-recall",
    title: "Connected-vehicle cyber vulnerability requires OTA-patch and recall",
    sectors: ["manufacturing", "aviation-transport"],
    category: "Technology & Data (Cyber)",
    background:
      "A security researcher discloses a vulnerability allowing remote control of certain vehicle functions in ~140,000 vehicles. Coordinated-disclosure timeline allows OTA-patch deployment but some legacy units require dealer-visit. DVLA, ICO and DfT engaged. Press attention is severe.",
    characteristics: [
      "Cybersecurity incident with safety implications",
      "OTA-vs-dealer-visit hybrid remediation",
      "Multi-agency coordination",
    ],
    assumptions: [
      "OTA-patch covers 80% of affected fleet",
      "Dealer-visit programme takes 12-18 weeks",
      "Researcher cooperated on disclosure timing",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "factory-fire",
    title: "Factory fire destroys production line, force-majeure to customers",
    sectors: ["manufacturing"],
    category: "Property",
    background:
      "A fire destroys the main production line at the flagship factory. Repair / rebuild estimated 6-9 months. Production-shift to alternative sites is partial (qualification + capacity). Force-majeure clauses invoked to customers. Insurance-recovery, customer-relationship and workforce-support all in parallel.",
    characteristics: [
      "Multi-quarter physical-recovery",
      "Customer-relationship preservation",
      "Workforce welfare and retention",
    ],
    assumptions: [
      "Insurance covers building and inventory but not all lost-margin",
      "Alternative sites can ramp to 50% capacity in 8 weeks",
      "Force-majeure invocation is contractually defensible",
    ],
    coversProperty: true,
    coversTechnology: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "industrial-espionage-ip-theft",
    title: "Industrial-espionage theft of next-gen product design",
    sectors: ["manufacturing"],
    category: "People",
    background:
      "An insider exfiltrates CAD files and supply-chain blueprints for the next-generation product. The data appears on a competitor's product 8 months later. Civil litigation, criminal proceedings and trade-secret enforcement in parallel. Damages claim into nine figures.",
    characteristics: [
      "Long-dwell-time insider exfiltration",
      "Multi-jurisdictional litigation",
      "Long-tail commercial impact",
    ],
    assumptions: [
      "Forensic audit identifies the exfiltration window",
      "Litigation will be multi-year",
      "Trade-secret protections vary by jurisdiction",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 180,
  },
];
