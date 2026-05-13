import PricingTable from "@/components/marketing/PricingTable";

export const metadata = {
  title: "Pricing — SnapFix",
  description:
    "Free to start. Annual billing saves 20%. Free → Starter (£99/mo) → Growth (£299/mo) → Enterprise. Compare every feature side by side.",
};

export default function PricingPage() {
  return (
    <div className="text-slate-200">
      <section className="bg-night-hero">
        <div className="mx-auto max-w-3xl px-6 py-20 text-center">
          <h1 className="text-balance text-4xl font-semibold tracking-tight text-white sm:text-5xl">
            Pricing
          </h1>
          <p className="mt-4 text-slate-300">
            Free to start. Scales as your operational-resilience programme matures.
          </p>
        </div>
      </section>

      <section className="bg-night-dots">
        <div className="mx-auto max-w-6xl px-6 py-16">
          <PricingTable />

          <section className="mx-auto mt-20 max-w-3xl space-y-6 text-center">
            <h2 className="text-2xl font-semibold tracking-tight text-white">Common questions</h2>
            <div className="space-y-3 text-left">
              <FAQ
                q="Can I trial paid plans without a card?"
                a="Yes. Get in touch and we'll provision a 14-day trial with no card on file. Annual plans have no minimum term."
              />
              <FAQ
                q="What's the difference between Growth and Enterprise?"
                a="Growth gives you the full platform with priority support and onboarding. Enterprise adds SSO, a bespoke DPA + security review, dedicated Customer Success, an SLA, and bundles in SnapFix consulting (annual programme review, scenario design, exercise facilitation)."
              />
              <FAQ
                q="Do you support SSO / SAML?"
                a="SSO via SAML and OIDC is available on Enterprise. NextAuth credential authentication is included on every plan."
              />
              <FAQ
                q="Is my data hosted in the UK?"
                a="Yes. Production data is hosted in eu-west-2 (London) by default. EU and US hosting available for Enterprise on request. See /security for the full posture."
              />
              <FAQ
                q="How does the annual discount work?"
                a="Annual plans are 20% cheaper per month, billed once at the start of the term. You can upgrade or add seats at any time and we prorate. Downgrades take effect at the next renewal."
              />
              <FAQ
                q="Do you provide consulting?"
                a="Yes. See the /services page. Consulting is a co-equal part of the business — annual scenario design, exercise facilitation, IBS register coaching, regulator-ready reporting, and bespoke playbook builds."
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
