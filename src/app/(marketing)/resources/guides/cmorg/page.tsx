import GuideLayout from "@/components/marketing/GuideLayout";

export const metadata = {
  title: "CMORG Dynamic Scenario Library, decoded — SnapFix Resources",
  description:
    "What the 14 CMORG scenarios are, what their MSEL events look like, and how to clone one into a usable in-house exercise.",
};

export default function CMORGGuide() {
  return (
    <GuideLayout
      readingTime="6 min"
      title="CMORG Dynamic Scenario Library, decoded"
      pitch="The Cross Market Operational Resilience Group publishes 14 reference scenarios that UK firms are expected to test against. They're industry-grade — but they need translating before you can run them in your own firm."
    >
      <h2>What CMORG is</h2>
      <p>
        CMORG — the Cross Market Operational Resilience Group — is the Bank of England-chaired
        industry forum that brings together regulators (PRA, FCA), critical national
        infrastructure (BoE, FCA, Treasury), and the major UK financial firms. It exists to
        align the sector on operational resilience: shared assumptions, shared scenarios,
        shared playbooks.
      </p>
      <p>
        The CMORG Dynamic Scenario Library (DSL) is its most practical output. Each scenario is
        a few pages of background, characteristics, assumptions, a 6-box risk-coverage matrix
        (People · Property · Technology · Data availability · Data integrity · Third party), and
        an MSEL (Master Scenario Events List) of events and injects on a D-Day timeline.
      </p>

      <h2>The 14 scenarios, grouped</h2>
      <h3>Technology & Data (Cyber)</h3>
      <ul>
        <li>Ransomware attack on a Tier 1 system</li>
        <li>Data exfiltration via insider access</li>
        <li>DDoS against customer-facing channels</li>
        <li>Supply-chain cyber compromise</li>
      </ul>

      <h3>Third-party</h3>
      <ul>
        <li>Critical cloud provider outage</li>
        <li>Core banking vendor failure</li>
        <li>Payments rail disruption</li>
      </ul>

      <h3>CNI (Critical National Infrastructure)</h3>
      <ul>
        <li>Major power-grid disruption</li>
        <li>Telecoms / data-centre region loss</li>
        <li>Severe weather affecting key sites</li>
      </ul>

      <h3>People &amp; premises</h3>
      <ul>
        <li>Pandemic-style absenteeism</li>
        <li>Key-person event (CIO / CTO loss)</li>
        <li>Premises evacuation</li>
        <li>Industrial action</li>
      </ul>

      <h2>Why "translation" is needed</h2>
      <p>
        CMORG scenarios are intentionally generic. They have to be — they're written to apply
        across a universal bank, a digital challenger and a BaaS-dependent fintech alike. To
        run a CMORG scenario meaningfully in your firm you need to:
      </p>
      <ul>
        <li>
          <strong>Bind scenario roles to your real org chart.</strong> "CTO" might be one person
          in a Tier 3 fintech and a department in a Tier 1 bank.
        </li>
        <li>
          <strong>Substitute your real IBSs.</strong> The scenario will say "core deposit
          service"; you need to point that at your actual IBS register entry with its actual
          impact tolerance.
        </li>
        <li>
          <strong>Update the artefacts.</strong> Customer call-centre scripts, regulator
          notification templates, vendor escalation paths — all firm-specific.
        </li>
        <li>
          <strong>Re-time the MSEL to your D-Day window.</strong> CMORG scenarios are usually
          written for 2-hour or 4-hour exercise blocks; your facilitator may want 90 minutes for
          a tabletop or 8 hours for a full live test.
        </li>
      </ul>

      <h2>The simulator side</h2>
      <p>
        SnapFix ships with all 14 CMORG scenarios pre-loaded as cloneable templates. Cloning
        deep-copies the MSEL events, injects, debrief questions and the 6-box risk-coverage
        matrix into your org, preserving the lineage back to the original template (so when CMORG
        updates the library, you'll see which of your scenarios are out of date).
      </p>
      <p>
        Above the CMORG 14, we ship 12 additional tier-specific scenarios (Tier 1 / Tier 2 / Tier
        3) covering edge cases CMORG doesn't address — BaaS dependency loss, embedded-finance
        partner failure, neobank licence event, and so on.
      </p>
    </GuideLayout>
  );
}
