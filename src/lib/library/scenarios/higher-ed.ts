import type { LibraryScenario } from "./types";

/**
 * Higher-education scenarios — UK universities, FE colleges, research
 * institutes. Distinctive risks around student-services, research-data,
 * international-student visa-related compliance, OfS oversight.
 */
export const HIGHER_ED_SCENARIOS: LibraryScenario[] = [
  {
    slug: "vle-outage-exam-week",
    title: "VLE / online-exam platform fails during exam week",
    sectors: ["higher-ed"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "The virtual learning environment (Moodle / Canvas / Blackboard) supporting timed online assessments fails at 09:30 on exam day. Several thousand students are mid-paper; submissions are at risk. Academic-policy on extensions, fairness and special-circumstances kicks in. Examiners, IT and registry coordinate. OfS interest if pattern repeats.",
    characteristics: [
      "Academic-credibility event with student-equity dimension",
      "Fairness across cohorts test",
      "Recovery vs. retake decision",
    ],
    assumptions: [
      "Submissions in flight are partially recoverable",
      "Retake or extension is academically sustainable",
      "Vendor recovery is hours not days",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 120,
  },
  {
    slug: "ransomware-university",
    title: "Ransomware encrypts university research and admin systems",
    sectors: ["higher-ed"],
    category: "Technology & Data (Cyber)",
    background:
      "Ransomware encrypts admin systems including student-records, finance and several research-group servers. Some research-group data appears not to be backed up adequately. Student-services degraded for weeks. Research-output and PhD-students disrupted. ICO, NCSC and OfS engaged. International-student visa-compliance reporting at risk.",
    characteristics: [
      "Diffuse-IT-estate cyber attack",
      "Research-data special-loss risk",
      "International-student compliance dimension",
    ],
    assumptions: [
      "Backups variable across research groups",
      "Recovery 4-8 weeks",
      "International student visa compliance reporting can be paused for short period",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    coversPeople: true,
    durationMin: 180,
  },
  {
    slug: "student-records-breach",
    title: "Student-records breach exposes 40,000 student PII records",
    sectors: ["higher-ed"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfigured Power BI dashboard exposes 40,000 student records including names, addresses, course-of-study, fee-status. ICO 72-hour clock starts. Some records relate to safeguarding cases. OfS Condition E expectations re student-trust apply. Mass-student-comms required.",
    characteristics: [
      "Mass-student PII exposure",
      "Safeguarding-overlap sensitivity",
      "OfS / ICO regulatory response",
    ],
    assumptions: [
      "Dashboard can be retracted within hours",
      "Affected-student notification at scale takes 2-3 days",
      "Press coverage is local plus higher-education sector trade press",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "industrial-action-strike",
    title: "Industrial-action strike disrupts the academic year start",
    sectors: ["higher-ed"],
    category: "People",
    background:
      "UCU industrial action coincides with the start of the academic year. Some lectures and seminars cancelled. International students newly arrived have a poor first impression. Tuition-fee value-for-money debate flares. Senior management balances goodwill with the union, student-experience and budget.",
    characteristics: [
      "Industrial-action with multi-week timeline",
      "International-student / domestic-student differential impact",
      "Press and politician scrutiny",
    ],
    assumptions: [
      "Strike length is 2-4 weeks based on precedent",
      "Online-delivery partly mitigates",
      "Student satisfaction survey impact persists",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "international-payment-fraud",
    title: "International-student fee-payment fraud scheme",
    sectors: ["higher-ed"],
    category: "People",
    background:
      "A money-laundering fraud scheme uses fake international-student admissions to launder funds through the university's overseas-fee-payment channel. Compliance team identifies pattern; police involvement. International-student-trust impact during a key recruitment cycle. Reviews of agent / partner relationships triggered.",
    characteristics: [
      "Financial-crime in education-sector context",
      "International-recruitment trust dimension",
      "Agent / partner review",
    ],
    assumptions: [
      "Police investigation is multi-month",
      "Agent-network involvement varies",
      "OfS expects governance review",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "campus-safeguarding-incident",
    title: "On-campus safeguarding incident under intense public scrutiny",
    sectors: ["higher-ed"],
    category: "People",
    background:
      "A serious safeguarding incident on campus attracts immediate national press attention. Police, OfS, student-union and parents all in the conversation. Internal disciplinary, criminal-process and PR-response need careful sequencing. Recent OfS conditions on student-safety apply.",
    characteristics: [
      "Safeguarding incident with regulatory & criminal overlap",
      "National press scrutiny",
      "Multi-stakeholder communication",
    ],
    assumptions: [
      "Police lead criminal aspects",
      "Internal disciplinary process must not prejudice criminal",
      "Press / parent engagement is highly sensitive",
    ],
    coversPeople: true,
    coversProperty: true,
    durationMin: 150,
  },
  {
    slug: "research-grant-funder-data-incident",
    title: "Research data lost from a major UKRI-funded project",
    sectors: ["higher-ed"],
    category: "Technology & Data (Cyber)",
    background:
      "A ransomware infection on a research-group's local file-share encrypts 4 months of un-backed-up experimental data from a £2.4M UKRI-funded clinical-trial-adjacent project. Funder may withhold next tranche pending integrity assurance. PI is named on the grant; reputational cost is personal. Research-ethics committee involvement.",
    characteristics: [
      "Research-group data-loss with funder-relationship impact",
      "Personal-PI accountability dimension",
      "Research-ethics review",
    ],
    assumptions: [
      "Some data recoverable from collaborator copies (~30%)",
      "Funder will pause not cancel",
      "Backups would have prevented this; central-IT vs research-IT tension renewed",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversDataAvailability: true,
    durationMin: 150,
  },
  {
    slug: "halls-of-residence-fire-safety",
    title: "Fire safety defect found across multiple halls of residence",
    sectors: ["higher-ed"],
    category: "Property",
    background:
      "A routine inspection identifies a fire-safety cladding defect across three halls of residence housing ~2,400 students. Local Fire Authority issues an enforcement notice. Re-housing thousands of students mid-term while remediation is underway is the practical challenge. Parent-and-press response is intense.",
    characteristics: [
      "Mass student re-housing under regulator-enforced deadline",
      "Multi-week / multi-month remediation",
      "Parent / press / regulator multi-stakeholder coordination",
    ],
    assumptions: [
      "Hotel accommodation can be sourced at premium cost",
      "Some students refuse to move; legal and welfare cases follow",
      "Insurance covers most of the remediation",
    ],
    coversPeople: true,
    coversProperty: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "international-student-visa-pause",
    title: "Home Office pauses sponsor licence for international-student visas",
    sectors: ["higher-ed", "government"],
    category: "Geopolitical & Macro",
    background:
      "Following a routine audit, the Home Office places the university's Tier-4 sponsor licence under suspension pending review. New CAS issuance halts. ~4,000 prospective international students for the autumn cohort are in limbo. Comms, legal, and admissions-replanning all in parallel. Revenue exposure £40-90M.",
    characteristics: [
      "Regulator-imposed pause with autumn-recruitment cliff",
      "Multi-tens-of-millions revenue exposure",
      "International-applicant trust crisis",
    ],
    assumptions: [
      "Suspension typically 4-12 weeks",
      "Some applicants will accept offers elsewhere",
      "Internal compliance gap is real and remediable",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 180,
  },
];
