import type { LibraryScenario } from "./types";

/**
 * Healthcare-provider scenarios — NHS trusts, ICBs, private hospitals,
 * GP networks, community health. Pharmaceuticals deliberately excluded
 * from SnapFix scope.
 */
export const HEALTHCARE_SCENARIOS: LibraryScenario[] = [
  {
    slug: "ransomware-hospital",
    title: "Ransomware encrypts patient-administration system across a hospital trust",
    sectors: ["healthcare"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "Overnight, ransomware encrypts the trust's PAS, EPR and pathology-results systems. A&E reverts to paper. Elective surgery postponed. ICU vitals-monitoring is unaffected but lab-result delays threaten patient safety. NHS England EPRR, NCSC and ICO are all on the bridge. Mutual-aid from neighbouring trusts is being arranged.",
    characteristics: [
      "Patient-safety-impact incident with multi-day recovery",
      "Mass-clinical-workflow disruption",
      "Multi-agency coordination at scale",
    ],
    assumptions: [
      "Restoration from backups feasible in 5-10 days",
      "Manual / paper workflow is degraded but practiced",
      "Neighbouring trusts can absorb some elective demand",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
    caseStudy: {
      title: "Synnovis pathology cyber attack (June 2024)",
      causation: "Qilin ransomware against NHS pathology provider",
      impactScale: "King's, Guy's, St Thomas' surgeries cancelled for weeks",
    },
  },
  {
    slug: "epr-vendor-cloud-outage",
    title: "Electronic Patient Record vendor cloud outage during clinic hours",
    sectors: ["healthcare"],
    category: "Third Party",
    tier: "TIER_2",
    background:
      "The trust's EPR vendor (Epic / Cerner-style) suffers a cloud-platform outage starting at 09:15. Outpatient clinics can't access patient records. Clinicians fall back to paper. Some clinics cancel; others see patients with limited information. The vendor's status page is opaque. Multiple trusts are affected.",
    characteristics: [
      "Concentrated SaaS-vendor outage across multiple trusts",
      "Clinical-workflow degradation, not failure",
      "Vendor-comms slow during a multi-customer incident",
    ],
    assumptions: [
      "Vendor recovery ETA unclear — historically 2-8 hours",
      "Paper fallback is documented, partly practiced",
      "Press will cover the multi-trust angle",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "patient-record-breach-staff-snoop",
    title: "Staff-curiosity browsing breaches celebrity patient's records",
    sectors: ["healthcare"],
    category: "People",
    background:
      "Audit logs reveal multiple staff accessed a celebrity patient's record without clinical justification. The patient discovers it via media leak. ICO and Caldicott Guardian involvement. Disciplinary processes against staff in scope. Public trust impact. Internal-controls deficiency in role-based access becomes the substantive issue.",
    characteristics: [
      "Insider-curiosity privacy breach",
      "High-profile patient amplifies impact",
      "Disciplinary + ICO + Caldicott parallel processes",
    ],
    assumptions: [
      "Audit logs are reliable and admissible",
      "ICO will treat as Tier-2 minimum",
      "Staff misconduct under nursing/medical professional standards",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "pathology-courier-network-collapse",
    title: "Pathology-courier provider enters administration overnight",
    sectors: ["healthcare"],
    category: "Third Party",
    background:
      "The principal pathology-sample courier network collapses into administration. Lab samples from 14 hospital sites are stranded. Critical-result turnaround times slip. Cancer-pathway 2-week-wait targets at risk. Alternative couriers can be onboarded but take 5-10 days; ad-hoc taxi-based collection is being arranged in the meantime.",
    characteristics: [
      "Critical-pathway third-party failure",
      "Multi-trust impact (shared service)",
      "Patient-pathway-target breach risk",
    ],
    assumptions: [
      "Ad-hoc transport is feasible but expensive and error-prone",
      "Alternative couriers take 5-10 working days to onboard",
      "NHSE will track 2-week-wait breach against this incident",
    ],
    coversPeople: true,
    coversThirdParty: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "wintertime-flu-pressure",
    title: "Severe flu season pressure forces trust into OPEL 4",
    sectors: ["healthcare"],
    category: "Climate & Environment",
    background:
      "Mid-January, flu hospitalisations are double last winter's peak. The trust enters OPEL 4 (highest pressure). A&E waits past 12 hours. Elective surgery routinely cancelled. Staff are exhausted; sickness rates are climbing. Decisions on diverting ambulances, opening escalation beds, and mutual-aid all in play. Press cycle is intense and political.",
    characteristics: [
      "System-pressure event, not single-failure",
      "Staff-welfare and patient-safety compounding",
      "Political and media attention at high intensity",
    ],
    assumptions: [
      "Mutual-aid options are limited (other trusts equally pressed)",
      "Discharge-to-assess pathways are fully utilised",
      "Workforce / agency-staff cost spikes",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "medical-device-recall",
    title: "Mass medical-device recall identifies units in clinical use",
    sectors: ["healthcare"],
    category: "Third Party",
    background:
      "MHRA issues a Class-II recall on a specific infusion pump model. The trust has ~340 units in clinical use. Some are mid-infusion on patients (chemotherapy, anaesthesia). Replacement stock is not immediately available. Clinical-engineering and procurement teams need to coordinate phased removal with patient-safety review.",
    characteristics: [
      "Regulator-driven recall with safety-critical timing",
      "Clinical-decisioning per-patient",
      "Procurement and supply-chain stress",
    ],
    assumptions: [
      "Vendor will provide replacement at no charge but slowly",
      "Borrowing from neighbouring trusts feasible for some sites",
      "MHRA expects evidence of phased remediation",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "nhs-mail-phishing",
    title: "Targeted phishing campaign harvests NHS Mail credentials trust-wide",
    sectors: ["healthcare"],
    category: "Technology & Data (Cyber)",
    background:
      "A phishing campaign claiming to be from NHS Digital tricks ~340 staff into surrendering credentials. Multiple sessions logged from foreign IPs. Sensitive emails — referrals, safeguarding cases, internal HR — are exposed. NHS-Mail-shared tenancy means impact ripples across multiple trusts. NHSE Cyber and ICO involved.",
    characteristics: [
      "Cross-trust shared-tenancy compromise risk",
      "Special-category data exposure",
      "Multi-organisation incident response",
    ],
    assumptions: [
      "Password resets feasible at speed",
      "MFA enforcement was patchy",
      "Affected-data inventory takes weeks to complete",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "icu-vitals-monitoring-fail",
    title: "ICU vitals-monitoring network goes down for 90 minutes",
    sectors: ["healthcare"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_1",
    background:
      "The ICU bedside-monitoring network drops out at 03:00 — a network switch firmware bug. Alarm cascades to the nurses' station fail. Bedside monitoring continues but no centralised view. Nurse-to-bed ratio is reset to manual intensive observation. 90-minute fix; no patient harm but very close call. Patient-safety review and Datix reports forthcoming.",
    characteristics: [
      "Patient-safety near-miss",
      "Single-point-of-failure in critical infrastructure",
      "Vendor-firmware regression",
    ],
    assumptions: [
      "Manual nursing observation feasible at 1:1 ratio",
      "Vendor will issue a patch + post-mortem",
      "Datix reporting + CQC notification expected",
    ],
    coversPeople: true,
    coversTechnology: true,
    coversDataAvailability: true,
    durationMin: 120,
  },
  {
    slug: "supply-chain-medical-consumables",
    title: "PPE / consumable supplier failure during a respiratory-virus surge",
    sectors: ["healthcare"],
    category: "Third Party",
    background:
      "The trust's principal PPE and clinical-consumable supplier fails to deliver during a respiratory-virus surge. Stock-on-hand is 5-7 days. Demand is climbing. Alternative suppliers exist but at premium pricing and uncertain quantity. Procurement and clinical-leadership decisions on rationing and safe-care thresholds become the principal threads.",
    characteristics: [
      "Supply-chain shock during clinical-demand spike",
      "Procurement-led but clinical-impact",
      "Cost vs. safety trade-off explicit",
    ],
    assumptions: [
      "Stock-on-hand 5-7 days",
      "Alternative suppliers willing but more expensive",
      "Trust-board financial-controls require sign-off",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "appointment-system-mass-cancellation",
    title: "Appointment-booking platform mass-cancels future appointments",
    sectors: ["healthcare"],
    category: "Technology & Data (Cyber)",
    background:
      "A bug in the appointment-management system mass-cancels ~12,000 future outpatient appointments. Patients receive automated cancellation SMS. Some are cancer-pathway, some are post-surgical follow-up. Call-centre lines saturate. Restoration of correct appointments takes 24-48 hours of manual reconstruction.",
    characteristics: [
      "Mass-customer-comms incident — wrong-comms-sent",
      "Care-pathway-disruption with safety implications",
      "Manual remediation at scale",
    ],
    assumptions: [
      "Source-of-truth scheduling data is recoverable from yesterday's snapshot",
      "Call-centre staffing can be surged",
      "Cancer-pathway team prioritises affected patients",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "data-centre-cooling-failure",
    title: "Hospital data-centre cooling failure on a hot summer day",
    sectors: ["healthcare"],
    category: "Property",
    background:
      "The on-site data centre's CRAC units fail during a 34°C summer day. Internal temperatures rise; servers begin shutting down. Clinical systems start failing one by one. Emergency mobile cooling is mobilised. Critical-system migration to cloud is partial. The trust faces a clinical-impact-imminent moment.",
    characteristics: [
      "Physical-environmental failure cascading to digital",
      "Hot-weather climate compounding",
      "Partial-cloud-migration leaves exposed legacy systems",
    ],
    assumptions: [
      "Mobile cooling can be sourced within hours",
      "Cloud-migrated systems unaffected",
      "Press cycle is 'NHS IT not fit for heatwaves'",
    ],
    coversProperty: true,
    coversTechnology: true,
    durationMin: 150,
  },
  {
    slug: "gp-network-outage",
    title: "Federated GP-IT supplier outage across an ICB",
    sectors: ["healthcare"],
    category: "Third Party",
    background:
      "The GP-IT system supplier (EMIS / TPP-class) suffers a regional outage. ~600 GP practices in the ICB are affected. Appointments, prescribing and pathology-ordering all degraded. 111 / out-of-hours services see surge as practices direct patients there. Patient-safety risks are real but diffuse. NHSE digital and the supplier coordinate.",
    characteristics: [
      "Wide-area primary-care disruption",
      "Cascading demand on urgent care",
      "Supplier-managed recovery with limited NHS control",
    ],
    assumptions: [
      "Supplier recovery ETA loose: hours to a day",
      "Practices have local paper-fallback but variable readiness",
      "ICB convenes the regional response cell",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 150,
  },
];
