import type { LibraryScenario } from "./types";

/**
 * Media & broadcasting scenarios — broadcasters, streamers, news,
 * production, OOH advertising. Calibrated to Ofcom Broadcasting Code,
 * online safety regulation and copyright/IP frameworks.
 */
export const MEDIA_BROADCASTING_SCENARIOS: LibraryScenario[] = [
  {
    slug: "playout-system-failure",
    title: "Playout-system failure takes a broadcast channel off-air during prime-time",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "The master-control playout system fails at 19:30, taking the channel off-air for ~25 minutes. Ofcom Broadcasting Code mandates emergency-fill protocols. Advertising-revenue rebates triggered. Press picks it up immediately. Sports / live-event commitments may be voided. Backup playout exists but failover wasn't fully rehearsed.",
    characteristics: [
      "Live-broadcast outage with Ofcom obligations",
      "Advertising-revenue and licensee impact",
      "Public visibility instantaneous",
    ],
    assumptions: [
      "Failover to backup is feasible in 10-20 minutes",
      "Ofcom expects explanation within 24 hours",
      "Audience-share metrics will be down for the night",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "streaming-platform-outage",
    title: "Streaming platform outage during a tentpole launch",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    tier: "TIER_2",
    background:
      "The streaming platform's video-delivery stack fails during the global launch of a tentpole drama series. Millions of subscribers see error screens. CDN partners, regional infrastructure and identity-service all under simultaneous stress. PR and customer-support overwhelmed. Subscription cancellations spike.",
    characteristics: [
      "Foreseeable-peak demand under-provisioned",
      "Multi-region / multi-CDN coordination",
      "Subscriber-cancellation-risk window",
    ],
    assumptions: [
      "Capacity bump within 2-4 hours feasible",
      "CDN cache-warming was done but volumes exceeded model",
      "Subscriber-trust impact persists for weeks",
    ],
    coversTechnology: true,
    coversDataAvailability: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "newsroom-cms-compromise",
    title: "Newsroom CMS compromised — fake stories published live",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "An attacker compromises a journalist's CMS account and publishes three fake stories about a politician. Social media amplifies before retraction. Editor-in-chief, legal team and security team coordinate. Defamation exposure is real. Press standards body (IPSO) interest is automatic. Trust-recovery is the long pole.",
    characteristics: [
      "Editorial-integrity compromise via internal-controls weakness",
      "Defamation and press-standards exposure",
      "Trust and brand long-tail damage",
    ],
    assumptions: [
      "Retraction can be published within 60 minutes",
      "Affected party will demand correction and apology",
      "Internal investigation will need transparency",
    ],
    coversDataIntegrity: true,
    coversPeople: true,
    durationMin: 150,
  },
  {
    slug: "deepfake-impersonation",
    title: "Deepfake video of broadcaster's anchor goes viral",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "A high-quality deepfake video showing the broadcaster's lead news anchor making fabricated political statements goes viral on TikTok and X. The broadcaster's official channels haven't seen the video pre-publication; many viewers think it's real. Trust impact, defamation risk and platform-takedown coordination all in play.",
    characteristics: [
      "GenAI-enabled reputation attack",
      "Platform-takedown coordination across providers",
      "Counter-comms strategy with watermarking / authenticity",
    ],
    assumptions: [
      "Takedowns are platform-by-platform with variable speed",
      "Watermarking / provenance can support takedown requests",
      "Press cycle compares to known deepfake events",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "live-sports-rights-stream-down",
    title: "Live sports-rights stream collapses during the championship final",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "During the final of a major sporting event, the rights-holder stream collapses to ~30% of subscribers. Social media explodes; competitors offer free passes. Rights-fee renegotiation is at risk; sponsor-payback obligations triggered. Recovery within minutes is the only acceptable outcome; engineering is in war-room mode.",
    characteristics: [
      "Once-a-year peak event — no second chance",
      "Sponsor and rights-holder financial obligations",
      "Competitive-poaching opportunity for rivals",
    ],
    assumptions: [
      "Engineering recovery within 30 minutes is critical",
      "Sponsor-payback clauses are contractually severe",
      "Press cycle is multi-day",
    ],
    coversTechnology: true,
    coversThirdParty: true,
    durationMin: 90,
  },
  {
    slug: "production-data-ransomware",
    title: "Production-house ransomware encrypts unreleased show masters",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "A production house holding unreleased master files for a high-budget drama is hit by ransomware. Masters are encrypted; attacker threatens to leak unreleased episodes publicly. Insurance, IP-protection and broadcast-schedule decisions run simultaneously. Sanctions check on the ransom-wallet is a hard constraint.",
    characteristics: [
      "Pre-release IP exposure with commercial consequence",
      "Ransom-with-leak-threat dynamic",
      "Insurance, IP and editorial response in parallel",
    ],
    assumptions: [
      "Offline-archive copies exist (some)",
      "Sanctions-check on wallet is multi-day",
      "Leak threat is real and time-bound",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 180,
  },
  {
    slug: "online-safety-compliance-incident",
    title: "Ofcom Online Safety Act notice for failure to remove harmful content",
    sectors: ["media-broadcasting"],
    category: "Geopolitical & Macro",
    background:
      "Ofcom issues an enforcement notice citing the platform's failure to remove harmful content within statutory windows. Specific examples include child-safety, suicide-and-self-harm content. Compliance gap is real but contested. Fine of up to 10% of global turnover possible. Comms, legal, and platform-trust strategies are all engaged.",
    characteristics: [
      "Online Safety Act regulator enforcement",
      "Existential-fine exposure",
      "Trust-and-safety operating-model overhaul",
    ],
    assumptions: [
      "Compliance gap is structural, not isolated",
      "Remediation plan requires multi-quarter investment",
      "Press and politician scrutiny is sustained",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 150,
  },
  {
    slug: "adtech-pipeline-fraud",
    title: "Programmatic-adtech pipeline compromised by impression-fraud at scale",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "Anomaly-detection identifies ~£8M of fraudulent impressions across the past quarter via a compromised ad-exchange partner. Advertisers will demand make-good campaigns or refunds. The compromised partner is mid-table not top-tier; relationship-management complex. IAB-style industry-coordination needed.",
    characteristics: [
      "Quarter-long fraud accumulated silently",
      "Multi-advertiser financial exposure",
      "Industry-wide coordination beneficial",
    ],
    assumptions: [
      "Refund / make-good models can be applied",
      "Industry coordination via IAB / TAG",
      "Partner-contract termination is operationally feasible",
    ],
    coversTechnology: true,
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "subtitling-vendor-failure",
    title: "Captioning / subtitling vendor failure breaches Ofcom accessibility quota",
    sectors: ["media-broadcasting"],
    category: "Third Party",
    background:
      "The firm's captioning / subtitling vendor — used to meet Ofcom's accessibility quotas — suffers a multi-day systems failure. Compliance with statutory quotas at risk if recovery isn't fast. Alternative vendors exist but onboarding takes 5-7 days. Press / disability-advocacy attention significant.",
    characteristics: [
      "Statutory-accessibility quota at risk",
      "Vendor-dependency without quick fallback",
      "Disability-advocacy press dimension",
    ],
    assumptions: [
      "Ofcom will accept a credible remediation plan",
      "Alternative vendors at premium-cost emergency rates",
      "Some live programming can't be captioned manually at scale",
    ],
    coversPeople: true,
    coversThirdParty: true,
    durationMin: 120,
  },
  {
    slug: "election-coverage-misinformation",
    title: "Election-night coverage broadcasts incorrect projection on-air",
    sectors: ["media-broadcasting"],
    category: "People",
    background:
      "On a UK general election night, the firm's broadcast operation incorrectly calls a constituency seat 90 minutes before counting finishes — and the call is wrong. Social media amplifies before retraction. Ofcom Broadcasting Code engaged. Election Commission interest. Public-trust hit during a moment of national focus.",
    characteristics: [
      "Editorial-integrity failure at maximum visibility",
      "Statutory broadcaster-impartiality obligation",
      "Multi-stakeholder accountability",
    ],
    assumptions: [
      "On-air retraction can happen within 15 minutes",
      "Ofcom investigation will follow",
      "Press coverage and Parliamentary scrutiny sustained",
    ],
    coversPeople: true,
    coversDataIntegrity: true,
    durationMin: 120,
  },
  {
    slug: "rights-management-breach",
    title: "Rights-management metadata breach during peak-season",
    sectors: ["media-broadcasting"],
    category: "Technology & Data (Cyber)",
    background:
      "A misconfiguration in the rights-management metadata service incorrectly grants the firm's streaming platform broadcast rights for titles it doesn't actually license. Hundreds of episodes go live to subscribers for ~14 hours before discovery. Rights-holders escalate; some demand financial settlement. Reputation damage in the rights-acquisition market.",
    characteristics: [
      "Rights-management integrity failure",
      "Multi-rights-holder commercial fallout",
      "Long-term commercial-relationship damage",
    ],
    assumptions: [
      "Episodes can be unpublished within an hour",
      "Settlement negotiations vary by rights-holder",
      "Insurance covers some but not all of the cost",
    ],
    coversDataIntegrity: true,
    coversThirdParty: true,
    durationMin: 150,
  },
];
