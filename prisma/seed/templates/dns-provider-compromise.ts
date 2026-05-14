import type { ScenarioTemplate } from "../types";

export const dnsProviderCompromise: ScenarioTemplate = {
  slug: "dns-provider-compromise",
  title: "DNS Provider Compromise (Cloudflare / Route53)",
  category: "Third Party",
  srrRef: "3.4",
  background:
    "Your managed DNS provider is compromised: an attacker successfully changes the DNS records of multiple customers including yours. Visitors to your domain are silently redirected to an attacker-controlled phishing replica of the mobile banking app. The replica is signed with a fraudulently obtained certificate. You detect via customer reports, not from your own monitoring.",
  agenda:
    "09:00 First customer reports\n09:30 Confirm DNS hijack\n10:00 Customer comms freeze + emergency record change\n11:00 Phishing replica takedown coordination\n13:00 Credentials at risk — forced session invalidation\n16:00 PIR + DNS provider review",
  dDayDate: "2026-08-04T09:00:00Z",
  durationMin: 180,

  cause:
    "An attacker social-engineers your DNS provider's support function and obtains write access to your zone. They quietly change MX, A and AAAA records for your customer-facing domain to point to attacker-controlled infrastructure. They also issue a TLS certificate via a publicly-trusted CA using domain-validation against the now-attacker-controlled DNS. Customers see a valid HTTPS lock and have no UI signal that anything is wrong.",
  impactNarrative:
    "Customers attempting to log in are silently redirected to a phishing replica that captures credentials and 2FA codes in real time, replaying them against the real bank. Within an hour, an estimated 800 customers have entered credentials into the replica. The attacker begins draining accounts via legitimate transfer flows. Twitter is the first signal: a security researcher posts a screenshot showing the bank's site loading from an unfamiliar IP. The firm's own DNS monitoring (a single email alert) was filtered into spam.",
  characteristics: [
    "Silent onset — no system errors, customers see a working app.",
    "Vendor breach, not your own — but the customer impact lands on you.",
    "Trust amplifier — a valid TLS cert and a familiar domain make detection harder.",
    "Real-money loss — every minute the redirect is live, customers lose funds.",
    "Coordination required — DNS provider, browser vendors, certificate authority, fraud team.",
  ],
  assumptions: [
    "Two-factor authentication is in place but is phishable (SMS / TOTP, not WebAuthn).",
    "Customer fraud-monitoring catches some but not all unauthorised transfers in real time.",
    "DNSSEC is not enabled on your zone (industry-typical).",
    "You have a documented 'emergency DNS records' runbook that has never been executed.",
  ],
  compoundScenarioNotes:
    "Combine with a concurrent customer-comms outage — if email is also affected (MX records compromised), you can't reach customers to warn them. Worst-case: the attacker also signs up to your status page service.",
  takeaways:
    "DNS is identity. A compromised registrar or DNS provider gives an attacker your front door. Mitigations are unglamorous: DNSSEC, registrar lock, CAA records, alerts on DNS changes that page humans, and a tabletop with the DNS provider on speed-dial.",
  stressVariables: [
    { name: "Hijack scope", options: ["Login subdomain only", "All subdomains", "MX records too", "Full zone including email"] },
    { name: "Detection lag", options: ["10 min", "1 hour", "4 hours", "12+ hours"] },
    { name: "Customer credential capture", options: ["100s", "1000s", "10,000s"] },
  ],
  caseStudy: {
    title: "Brazilian bank — DNS hijack (October 2016)",
    causation:
      "A major Brazilian bank lost control of its entire DNS zone for several hours. Attackers used social engineering against the registrar to point all 36 of the bank's domains to malicious infrastructure.",
    impactScale:
      "Customers across multiple channels (web banking, mobile, ATM lookups, email) were silently redirected to attacker infrastructure. Estimated thousands of credential sets and 2FA codes captured.",
    duration:
      "Approximately 5 hours of full DNS hijack; attacker had also issued matching TLS certificates so the redirect was invisible to typical customers.",
    sourceUrl: "https://www.kaspersky.com/blog/brazilian-bank-hack/14760/",
  },
  riskCoverage: {
    people: false,
    property: false,
    technology: true,
    dataAvailability: false,
    dataIntegrity: true,
    thirdParty: true,
  },

  ibsList: [
    { code: "IBS_01", name: "Customer authentication", description: "Login and 2FA for online / mobile.", impactToleranceMin: 30, criticality: "CRITICAL" },
    { code: "IBS_02", name: "Mobile and online banking", description: "Authenticated customer-facing channels.", impactToleranceMin: 60, criticality: "CRITICAL" },
    { code: "IBS_03", name: "Email (customer-facing)", description: "Transactional and urgent customer comms email.", impactToleranceMin: 240, criticality: "HIGH" },
    { code: "IBS_04", name: "Fraud detection", description: "Real-time fraud-monitoring and intervention.", impactToleranceMin: 30, criticality: "CRITICAL" },
  ],

  events: [
    {
      eventNo: 1,
      scheduledTime: "09:00",
      title: "Customer reports of 'strange login page'",
      description:
        "A handful of customers tweet that the login page 'looks different' — the colour shade is slightly off and a captcha they don't recognise appears. Contact-centre receives 20 calls in 15 minutes about failed logins. Your team's own laptops still see the real site (they've cached DNS resolutions). Initial triage stalls because internal tests pass.",
      expectedActions: [
        "Test resolution from off-network (mobile data) — your laptops are misleading you",
        "Query authoritative DNS directly from multiple resolvers",
        "Open a P1 — investigate non-system signal pattern",
      ],
      objectives: [
        "Test detection that doesn't rely on internal observability alone",
      ],
      senderRoleTitle: "Customer Ops Lead",
      toRoleTitles: ["ISM", "CTO"],
      ccRoleTitles: ["CRO"],
    },
    {
      eventNo: 2,
      scheduledTime: "09:30",
      title: "DNS hijack confirmed",
      description:
        "External DNS resolution shows your login subdomain pointing to a hosting provider in a foreign jurisdiction. The fraudulent site is a pixel-perfect replica with a valid TLS certificate. The certificate was issued 4 hours ago by a major CA via DNS validation. The firm has 'super-fast' takedown SLAs with a brand-protection vendor; they're notified.",
      expectedActions: [
        "Engage DNS provider's emergency support",
        "Contact the certificate authority for revocation",
        "Engage brand-protection vendor for takedown",
        "Begin forced session invalidation for the affected window",
      ],
      objectives: [
        "Test multi-vendor coordination at speed (DNS + CA + brand protection)",
      ],
      senderRoleTitle: "ISM",
      toRoleTitles: ["CTO", "CRO"],
      ccRoleTitles: ["Head of Compliance", "CEO"],
    },
    {
      eventNo: 3,
      scheduledTime: "11:00",
      title: "Customers losing real money",
      description:
        "Fraud team identifies 180 high-value outbound transfers initiated in the last hour from accounts that authenticated against the phishing replica. Several customers' transfers have already settled. Treasury and the COO must decide: pause all outbound payments, or maintain service but flag every transfer for manual review.",
      expectedActions: [
        "Outbound-payment pause decision recorded in decision log",
        "Reimbursement policy clarified (when, who decides)",
        "Customer comms briefing prepared",
      ],
      objectives: [
        "Test the customer-financial-loss decision tree under live pressure",
      ],
      senderRoleTitle: "CRO",
      toRoleTitles: ["CEO", "COO", "Treasury Lead"],
      ccRoleTitles: ["CCO", "Head of Compliance"],
    },
  ],

  injects: [
    {
      injectNo: 1,
      scheduledTime: "10:15",
      summary: "Email channel also compromised",
      description:
        "Customers report receiving 'security alert' emails from your domain asking them to confirm their card details. The attacker has also changed MX records, so legitimate-looking phishing emails are now coming from genuinely your-domain addresses. SPF / DKIM checks pass.",
      relation: "Adds an information-channel disruption to the asset-loss event. Tests IBS_03 communication contingency.",
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["Comms Lead", "ISM"],
      ccRoleTitles: ["CRO", "CEO"],
    },
    {
      injectNo: 2,
      scheduledTime: "12:00",
      summary: "Media call from BBC",
      description:
        "A BBC technology reporter calls the press line asking for comment on 'reports of customers being phished through your own site'. They have a 20-minute deadline for the 1pm bulletin and will run the story either way. Your CEO is on a flight; the CCO and Head of External Affairs must brief without senior sign-off.",
      relation: "Tests media playbook and delegated press authority.",
      senderRoleTitle: "Head of External Affairs",
      toRoleTitles: ["CCO", "Comms Lead"],
      ccRoleTitles: ["CEO", "CRO"],
    },
  ],

  facilitatorQuestions: [
    { category: "Detection", text: "How would you detect a DNS change in your own zone — and how quickly would the alert reach the right human?" },
    { category: "Vendor", text: "Who has the DNS provider's emergency support number, and is it tested?" },
    { category: "Customer", text: "What's your standing customer-comms position for 'don't log in for the next hour' — and how do you reach them when your own email is hijacked?" },
    { category: "Reimbursement", text: "When customers lose money to a phishing replica of your site, what's your reimbursement stance?" },
  ],
  debriefQuestions: [
    { category: "Detection", text: "What was the gap between attacker access and your detection — and could it be closed?" },
    { category: "Identity hygiene", text: "Are DNSSEC, registrar lock and CAA records in place, and would they have helped?" },
    { category: "Coordination", text: "Did multi-vendor coordination (DNS / CA / brand protection) work, or was it a who-knows-the-number scramble?" },
  ],
};
