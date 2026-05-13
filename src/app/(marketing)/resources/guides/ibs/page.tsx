import GuideLayout from "@/components/marketing/GuideLayout";

export const metadata = {
  title: "Important Business Services — a methodology — SnapFix Resources",
  description:
    "The six-dimension importance assessment, mapping resource dependencies, setting impact tolerances that won't embarrass you in a regulatory visit.",
};

export default function IBSGuide() {
  return (
    <GuideLayout
      readingTime="7 min"
      title="Important Business Services — a methodology"
      pitch="The IBS register is the spine of an operational-resilience programme. Get it wrong and every downstream artefact — impact tolerances, scenario tests, BC plans — is built on sand."
    >
      <h2>What an IBS actually is</h2>
      <p>
        From PRA SS1/21: an Important Business Service is a service provided by a firm to an{" "}
        <strong>external customer</strong> where, if disrupted, the firm could cause:
      </p>
      <ul>
        <li>Intolerable harm to customers</li>
        <li>Risk to the firm's safety and soundness</li>
        <li>Risk to UK financial stability or market integrity</li>
      </ul>
      <p>
        The "external customer" framing is load-bearing — internal processes like HR onboarding
        or accounts-payable runs are not IBSs even if they're business-critical. The same
        process can be in scope as an IBS at one firm and out of scope at another, depending on
        whether it's a customer-facing service.
      </p>

      <h2>The six-dimension importance assessment</h2>
      <p>
        Every candidate IBS gets scored on six dimensions. The thresholds map to the firm's
        materiality framework — a Tier 1 universal bank's "high" is two orders of magnitude
        bigger than a Tier 3 fintech's.
      </p>
      <ul>
        <li>
          <strong>Customer financial impact.</strong> Cumulative loss to customers if the service
          is disrupted.
        </li>
        <li>
          <strong>Vulnerable customer impact.</strong> Disproportionate impact on customers in
          vulnerable circumstances. Consumer Duty makes this load-bearing.
        </li>
        <li>
          <strong>Loss of licence risk.</strong> Could this disruption lead to regulatory
          enforcement, permission variation, or licence revocation?
        </li>
        <li>
          <strong>Regulatory fine risk.</strong> Likely range of fines under PRA / FCA / ICO if
          the disruption materialises.
        </li>
        <li>
          <strong>Reputational impact.</strong> Probable media coverage, social-media velocity,
          peer commentary.
        </li>
        <li>
          <strong>Loss of capital risk.</strong> Capital impact and proximity to regulatory
          minimum.
        </li>
      </ul>

      <h2>Mapping resource dependencies</h2>
      <p>
        Once an IBS is identified, you map what it depends on. SnapFix calls this the IBS{" "}
        <em>resource map</em>:
      </p>
      <ul>
        <li>
          <strong>Technology.</strong> Systems, applications, infrastructure tier — Tier 1
          mission-critical, Tier 2 business-critical, Tier 3 operational.
        </li>
        <li>
          <strong>People.</strong> Roles required, named SMFs, deputy chain, minimum team size.
        </li>
        <li>
          <strong>Facilities.</strong> Premises, alternative work locations, hot/warm sites.
        </li>
        <li>
          <strong>Third parties.</strong> Vendors, payment rails, cloud providers, intermediaries.
        </li>
        <li>
          <strong>Information.</strong> Data sources, golden records, regulatory reporting feeds.
        </li>
        <li>
          <strong>Processes.</strong> The end-to-end customer journey that delivers the service.
        </li>
      </ul>

      <h2>Setting an impact tolerance that survives a regulatory visit</h2>
      <p>
        Tolerances must be challenging. A 4-hour tolerance on a payments service that historically
        runs at 99.99% uptime is plausible; a 7-day tolerance probably isn't. The regulator's test
        is whether your tolerance reflects the harm threshold for your customers, not the
        comfort threshold for your operations team.
      </p>
      <p>
        Document the <strong>rationale</strong>. Why this number? What customer-harm model
        produced it? What sensitivity analysis did you run? The tolerance value is less
        interesting to a supervisor than the reasoning behind it.
      </p>

      <h2>Testing IBSs against severe-but-plausible scenarios</h2>
      <p>
        Every IBS should be exercised against at least one severe-but-plausible scenario
        annually. The exercise must demonstrate that you can stay within tolerance — or, if you
        can't, that you've identified the controls or investment needed to close the gap.
      </p>
      <p>
        Run-once-and-forget is not enough. Tolerances should be re-tested when material change
        happens — new vendor, system migration, M&A integration, business-model pivot.
      </p>

      <h2>How SnapFix encodes this</h2>
      <p>
        Each Organization carries an IBS register at the org level. Per-IBS, you capture the
        six-dimension importance assessment, the impact tolerance (primary, FCA, PRA), the
        rationale, the resource map across all six dimensions, and an explicit risk-coverage
        flag matrix. Exercises link to the IBSs they're testing so coverage is queryable —{" "}
        "which IBSs haven't been exercised in the last 12 months?" is one query.
      </p>
    </GuideLayout>
  );
}
