import Link from "next/link";

export const metadata = {
  title: "Pricing — SnapFix",
  description: "Simple, transparent pricing. Free to start, scales with your programme.",
};

type Plan = {
  name: string;
  price: string;
  cadence?: string;
  description: string;
  highlight?: boolean;
  features: string[];
  cta: string;
  href: string;
};

const PLANS: Plan[] = [
  {
    name: "Free",
    price: "£0",
    cadence: "forever",
    description: "Try the full Simulator with a small team.",
    features: [
      "Up to 5 members",
      "2 exercises per year",
      "5 custom scenarios",
      "Full CMORG Library access",
      "Inbox + addressed events",
    ],
    cta: "Get started free",
    href: "/sign-up",
  },
  {
    name: "Starter",
    price: "£99",
    cadence: "per month",
    description: "Run a quarterly resilience programme with the right team.",
    features: [
      "Up to 25 members",
      "12 exercises per year",
      "Unlimited custom scenarios",
      "Org IBS register",
      "Action-item tracker",
      "Audit log",
      "AAR export (PDF / DOCX)",
    ],
    cta: "Start 14-day trial",
    href: "/contact?plan=starter",
  },
  {
    name: "Growth",
    price: "£299",
    cadence: "per month",
    highlight: true,
    description: "For Tier 2 and ambitious Tier 3 firms — the full platform.",
    features: [
      "Up to 100 members",
      "Unlimited exercises",
      "Coverage analytics + heatmap",
      "Calendar view",
      "Priority email support",
      "Onboarding session",
      "Custom branding (logo)",
    ],
    cta: "Start 14-day trial",
    href: "/contact?plan=growth",
  },
  {
    name: "Enterprise",
    price: "Custom",
    description: "For Tier 1 banks and regulated FMIs. We work to your standards.",
    features: [
      "Unlimited members",
      "Unlimited everything",
      "SSO / SAML",
      "DPA + bespoke security review",
      "Dedicated Customer Success",
      "Consulting from SnapFix (annual review, scenario design)",
      "SLA-backed support",
    ],
    cta: "Talk to sales",
    href: "/contact?plan=enterprise",
  },
];

export default function PricingPage() {
  return (
    <div className="text-slate-200">
      <section className="bg-night-hero">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-4xl font-semibold tracking-tight text-white">Pricing</h1>
          <p className="mt-4 text-slate-300">
            Free to start. Scales as your operational-resilience programme matures.
          </p>
        </div>
      </section>

      <section className="bg-night-dots">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {PLANS.map((p) => (
              <div
                key={p.name}
                className={`relative flex flex-col rounded-xl border p-6 ${
                  p.highlight
                    ? "border-indigo-400/60 bg-[color:var(--night-surface-elev)] shadow-[0_0_48px_-12px_rgba(99,102,241,0.4)]"
                    : "border-white/[0.08] bg-[color:var(--night-surface)]"
                }`}
              >
                {p.highlight && (
                  <span className="absolute -top-3 left-6 rounded-full bg-indigo-500 px-2 py-0.5 text-xs font-medium text-white">
                    Most popular
                  </span>
                )}
                <div>
                  <h2 className="text-base font-semibold text-white">{p.name}</h2>
                  <p className="mt-1 min-h-[2.5rem] text-sm text-slate-400">{p.description}</p>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-3xl font-semibold text-white">{p.price}</span>
                    {p.cadence && <span className="text-sm text-slate-500">/ {p.cadence}</span>}
                  </div>
                </div>
                <ul className="mt-6 flex-1 space-y-2 text-sm">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg
                        className="mt-0.5 h-4 w-4 shrink-0 text-indigo-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.296a1 1 0 010 1.408l-7.5 7.5a1 1 0 01-1.408 0l-3.5-3.5a1 1 0 011.408-1.408L8.5 12.092l6.796-6.796a1 1 0 011.408 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span className="text-slate-300">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href={p.href}
                  className={`mt-6 block rounded-md px-4 py-2 text-center text-sm font-medium ${
                    p.highlight
                      ? "bg-indigo-500 text-white hover:bg-indigo-400"
                      : "border border-white/15 bg-white/[0.04] text-white hover:bg-white/[0.08]"
                  }`}
                >
                  {p.cta}
                </Link>
              </div>
            ))}
          </div>

          <section className="mx-auto mt-20 max-w-3xl space-y-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Common questions</h2>
            <div className="space-y-3 text-left">
              <FAQ
                q="Can I trial paid plans without a card?"
                a="Yes. Get in touch and we'll provision a 14-day trial with no card on file. Paid plans are billed monthly with no minimum term."
              />
              <FAQ
                q="Do you support SSO / SAML?"
                a="SSO via SAML and OIDC is available on Enterprise. We also support credential authentication out of the box on every plan."
              />
              <FAQ
                q="Is my data hosted in the UK?"
                a="Yes. Production data is hosted in eu-west-2 (London) by default. EU and US hosting available for Enterprise on request."
              />
              <FAQ
                q="Do you provide consulting?"
                a="Yes. SnapFix is operational-resilience consulting in technology — the platform is one part of what we do. Annual programme reviews, bespoke scenario design and exercise facilitation are available."
              />
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}

function FAQ({ q, a }: { q: string; a: string }) {
  return (
    <details className="rounded-md border border-white/[0.08] bg-[color:var(--night-surface)] p-4 text-sm">
      <summary className="cursor-pointer font-medium text-white">{q}</summary>
      <p className="mt-2 text-slate-400">{a}</p>
    </details>
  );
}
