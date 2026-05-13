import UseCaseLayout from "@/components/marketing/UseCaseLayout";

export const metadata = {
  title: "Severe weather & premises — SnapFix Use Cases",
  description:
    "Storm closes your London office. Data centre region loss. Power-grid disruption. The non-cyber scenarios that still take you down.",
};

export default function SevereWeatherUseCase() {
  return (
    <UseCaseLayout
      badge="Use case"
      title="Severe weather & premises"
      pitch="The most common operational-resilience exercises are still cyber, but the most likely real incidents are weather, power and people. The scenarios that test physical contingency and the human side of continuity."
      pains={[
        "Premises closure on short notice — can your team work fully remote within hours?",
        "Power-grid disruption — your data centre's on UPS, but for how long?",
        "Severe weather affecting a critical office — call centre, dealing floor, regulatory reporting team",
        "Compounded events — flood + power outage + telecoms degradation all at once",
        "Industrial action or pandemic-style absenteeism — what's your minimum viable team?",
      ]}
      outcomes={[
        "BCP activation tested with joint CEO + CRO decision in the live exercise",
        "Alternative work locations validated — not just listed in a document",
        "Staff welfare protocol exercised, with HR + CPO playing their actual roles",
        "Damage assessment report (per BCPlans §6.3.3) produced as a real deliverable",
        "Comms cascade for premises events — different stakeholders than cyber, similar discipline",
      ]}
      exercises={[
        {
          title: "CMORG-10 · Major power-grid disruption",
          description:
            "Multi-hour grid outage affecting Tier 1 data centre region. Tests UPS-to-DR failover, comms with vendor, regulator notification.",
        },
        {
          title: "CMORG-11 · Severe weather affecting key sites",
          description:
            "Storm closes the London office. Operations relocate to DR site. Tests remote-work capacity, staff welfare protocols, and customer service continuity.",
        },
        {
          title: "CMORG-12 · Pandemic-style absenteeism",
          description:
            "30% workforce out for 2 weeks. Slow-burn scenario testing minimum viable team, cross-training gaps, and senior cover.",
        },
        {
          title: "CMORG-14 · Premises evacuation",
          description:
            "Fire alarm at the head office, building closed for 48 hours. Tests CPO-led evacuation protocol, comms cascade, and BC activation.",
        },
      ]}
    >
      <h2>Why physical exercises matter again</h2>
      <p>
        For about a decade, cyber dominated resilience-exercise budgets to the exclusion of
        almost everything else. That tide is shifting. Severe weather is moving outside the
        historical envelope, the energy transition is creating new grid-stability risks, and the
        Cross-Market Operational Resilience programme is explicitly broadening the scope of
        cross-firm exercises to physical events.
      </p>
      <p>
        Firms that have run nothing but cyber tabletops for five years are discovering that
        their physical-event playbooks haven't been touched since 2020 — and the assumptions
        they encode (post-pandemic remote capacity, post-Brexit staffing, post-renewables grid)
        are stale.
      </p>

      <h2>The BCP-activation angle</h2>
      <p>
        Physical events are where the Business Continuity Plan moves from a sub-clause of the
        IMP to a primary instrument. The joint CEO + CRO activation decision is real here:
        which BRTs do we mobilise? What's the financial continuity protocol? Daily liquidity
        monitoring kicks in if the BC remains active beyond 24 hours.
      </p>
      <p>
        SnapFix's BCP activation surface (the joint-approval flow, BRT mobilisation, daily
        liquidity gate, insurance-invocation decision) is built for this — but it only earns its
        value through exercises that actually invoke it. Cyber events sometimes touch BCP;
        physical events almost always do.
      </p>

      <h2>What SnapFix gives you</h2>
      <ul>
        <li>Pre-built CMORG scenarios covering grid, weather, premises, and absenteeism</li>
        <li>BCP activation as a joint CEO + CRO decision distinct from IMT invocation</li>
        <li>BRT mobilisation tracking — Finance, Buildings, Tech, Comms</li>
        <li>Damage assessment report template (per BCPlans §6.3.3)</li>
        <li>
          Staff welfare protocol references built into the after-action retrospective (BCPlans
          §6.6.1 R-4)
        </li>
      </ul>
    </UseCaseLayout>
  );
}
