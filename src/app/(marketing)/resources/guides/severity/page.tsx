import GuideLayout from "@/components/marketing/GuideLayout";
import SeverityCalculator from "@/components/marketing/SeverityCalculator";

export const metadata = {
  title: "Classify incident severity in 60 seconds — SnapFix Resources",
  description:
    "Walk through the five-dimension severity matrix with Consumer Duty and cyber overrides. Live calculator embedded.",
};

export default function SeverityGuide() {
  return (
    <GuideLayout
      badge="Interactive guide"
      readingTime="4 min"
      title="Classify incident severity in 60 seconds"
      pitch="Severity classification is the moment the rest of your incident response unlocks. Get it right and the regulator clocks, the team mobilisation, and the comms cascade all flow correctly. Get it wrong — under-call it — and you'll be explaining the timeline to the PRA."
    >
      <h2>The five dimensions</h2>
      <p>
        Every UK firm we've worked with grades an incident on the same five axes. Each one is a
        High / Medium / Low scale; the overall severity is whichever dimension scored highest.
      </p>
      <ul>
        <li>
          <strong>Financial.</strong> Direct loss, fines, capital impact, cost-to-recover.
        </li>
        <li>
          <strong>Customer.</strong> Percentage of customers affected — but not just count, also{" "}
          the depth of harm.
        </li>
        <li>
          <strong>Data.</strong> Confidentiality / integrity / availability of personal or
          commercially sensitive data.
        </li>
        <li>
          <strong>Systems.</strong> Tier of the systems impacted. Tier 1 means mission-critical
          (core banking, payments) — anything Tier 1 down or unstable is automatically a High.
        </li>
        <li>
          <strong>Reputational.</strong> Coverage, social-media velocity, regulator attention,
          peer commentary.
        </li>
      </ul>

      <SeverityCalculator />

      <h2>Two overrides everyone misses</h2>
      <h3>Consumer Duty</h3>
      <p>
        The FCA's Consumer Duty (PS22/3) requires firms to deliver good outcomes to retail
        customers. In an incident, the Duty acts as an <strong>aggravating factor</strong>: if the
        event affects customers' ability to access their funds, complete a mortgage transaction,
        receive customer support or exercise their rights, severity is promoted to{" "}
        <strong>High</strong> regardless of the financial threshold.
      </p>
      <blockquote>
        best practice: "This [Consumer Duty trigger] applies regardless of the financial
        threshold reached."
      </blockquote>

      <h3>Cyber default-to-High</h3>
      <p>
        Ransomware and data-exfiltration events default to <strong>High severity</strong> unless
        explicitly assessed otherwise by the IMT. The reasoning is that you almost never have
        enough information in the first hours of a cyber event to judge it safely down to
        Medium — and being wrong is expensive.
      </p>

      <h2>What changes once you've classified</h2>
      <ul>
        <li>
          <strong>High</strong> triggers FCA + PRA notification clocks — 4 hours from IMT
          invocation, owned by the CRO, approved by the CEO.
        </li>
        <li>
          <strong>High</strong> with personal data involvement adds the ICO 72-hour clock.
        </li>
        <li>
          The standing IMT meeting cadence tightens (often hourly during a High, easing once
          severity is reassessed).
        </li>
        <li>
          Continuity activation becomes more likely — the dual-approval conversation
          (typically CEO + CRO under the standard separation-of-roles model) usually happens at
          the first IMT meeting after a High classification.
        </li>
      </ul>

      <h2>The under-call problem</h2>
      <p>
        The most common pattern we see in tabletop exercises: an organisation classifies an
        incident as Medium because the financial threshold isn't met, missing the Consumer Duty
        promotion. They miss the FCA notification window. They learn the rule the hard way at the
        next supervisory visit.
      </p>
      <p>
        The standard coaching tip is direct:
      </p>
      <blockquote>
        "It is better to stand it up and back down than to fail to stand it up." — best practice
      </blockquote>
      <p>
        Severity classification works the same way. Erring on the High side costs you a regulator
        notification you can withdraw; erring on the Medium side costs you the regulator's trust.
      </p>
    </GuideLayout>
  );
}
