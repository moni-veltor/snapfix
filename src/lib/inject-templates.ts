// Common inject patterns. Used by the scenario builder's "use a template"
// quick-fill so authors don't start every inject from scratch.

export type InjectTemplate = {
  slug: string;
  label: string;
  category: "Customer" | "Regulator" | "Vendor" | "Media" | "Internal" | "Cyber";
  senderRoleTitle: string;
  toRoleTitles: string[];
  ccRoleTitles: string[];
  summary: string;
  description: string;
};

export const INJECT_TEMPLATES: InjectTemplate[] = [
  {
    slug: "vendor-outage",
    label: "Vendor outage alert",
    category: "Vendor",
    senderRoleTitle: "Sn.TPM",
    toRoleTitles: ["CTO", "ISM"],
    ccRoleTitles: ["CRO"],
    summary: "Critical vendor status page reports incident",
    description:
      "Vendor status page just flipped to RED — they're reporting a P1 affecting customer-facing services. ETA to resolution not yet provided. Our payments rail is impacted; first customer complaints already in the queue.",
  },
  {
    slug: "customer-surge",
    label: "Customer complaint surge",
    category: "Customer",
    senderRoleTitle: "Customer Ops Lead",
    toRoleTitles: ["COO", "Comms Lead"],
    ccRoleTitles: ["CCO"],
    summary: "Contact-centre volume up 4× in 15 minutes",
    description:
      "Inbound contact volume has gone from baseline ~120/hr to ~480/hr in the last 15 minutes. Customers reporting they can't log in / can't see balances / payments declining. Current average wait time 18 minutes and rising.",
  },
  {
    slug: "regulator-call",
    label: "Regulator phone call",
    category: "Regulator",
    senderRoleTitle: "CRO",
    toRoleTitles: ["CEO"],
    ccRoleTitles: ["CCO", "Head of Compliance"],
    summary: "FCA supervisor on the phone",
    description:
      "Just took a call from our FCA supervisor. They've seen the same complaints on social media — they want a verbal briefing in 30 minutes and a written notification within the 4-hour window. They specifically asked whether Consumer Duty is triggered.",
  },
  {
    slug: "media-query",
    label: "Media query",
    category: "Media",
    senderRoleTitle: "Head of External Affairs",
    toRoleTitles: ["CEO", "Comms Lead"],
    ccRoleTitles: ["CRO"],
    summary: "FT / BBC asking for comment",
    description:
      "A journalist from the FT (and a separate one from BBC business) has called the press line asking about reports of payment failures at the bank. They've given us a 90-minute window to respond before they run the story.",
  },
  {
    slug: "ransom-note",
    label: "Ransom note received",
    category: "Cyber",
    senderRoleTitle: "ISM",
    toRoleTitles: ["CTO", "CRO"],
    ccRoleTitles: ["CEO"],
    summary: "Ransomware note found on encrypted server",
    description:
      "Forensics team has found a ransom note on the encrypted file server. Demanding 50 BTC within 48 hours, threatening to release exfiltrated customer data if not paid. Note includes a sample of stolen records to prove they have access.",
  },
  {
    slug: "social-media-spike",
    label: "Social media spike",
    category: "Media",
    senderRoleTitle: "Comms Lead",
    toRoleTitles: ["CEO", "Head of External Affairs"],
    ccRoleTitles: ["CCO"],
    summary: "Twitter / X mentions up 30× in 20 minutes",
    description:
      "Social listening is showing mentions of our brand up 30× from baseline. Sentiment is rapidly negative. The hashtag #SnapFixDown is starting to trend in London. Three customer-influencer accounts (combined ~400k followers) have posted complaints in the last 10 minutes.",
  },
  {
    slug: "internal-question",
    label: "Senior internal question",
    category: "Internal",
    senderRoleTitle: "CFO",
    toRoleTitles: ["CRO"],
    ccRoleTitles: ["CEO"],
    summary: "CFO asks about capital impact",
    description:
      "I need an early read on potential capital impact. If we end up paying out for unauthorised transactions while systems are down, we need to be clear on what hits the P&L this quarter. Can your team prepare a top-of-head estimate within the hour?",
  },
  {
    slug: "data-breach-suspected",
    label: "Suspected data breach",
    category: "Cyber",
    senderRoleTitle: "ISM",
    toRoleTitles: ["CRO", "Head of Compliance"],
    ccRoleTitles: ["CTO", "CEO"],
    summary: "Possible personal data exfiltration detected",
    description:
      "DLP triggered on outbound traffic to an unknown destination. Volume suggests ~50k customer records may have left the network in the past hour. Confirming via SIEM logs now. If confirmed, ICO 72-hour clock starts immediately.",
  },
  {
    slug: "intermediary-escalation",
    label: "Intermediary escalation",
    category: "Customer",
    senderRoleTitle: "Sales Director",
    toRoleTitles: ["COO", "CCO"],
    ccRoleTitles: ["CEO"],
    summary: "Mortgage intermediaries asking for status",
    description:
      "Top-10 mortgage broker just emailed: 'We've got 30 cases waiting on completion confirmations and clients are getting nervous. We need a status update we can share with our clients within 30 minutes — anything beyond that and we're calling competitors.'",
  },
  {
    slug: "exec-coordination",
    label: "ExCo coordination",
    category: "Internal",
    senderRoleTitle: "CEO",
    toRoleTitles: ["CRO", "CTO", "CCO", "CFO", "COO"],
    ccRoleTitles: [],
    summary: "CEO calls 30-minute IMT meeting",
    description:
      "Convening the IMT in 30 minutes. Each function — be ready with: (1) current status of your area, (2) decisions you need from this meeting, (3) what you're going to commit to before the next standing meeting.",
  },
];
