import GuideLayout from "@/components/marketing/GuideLayout";
import CascadeVisualizer from "@/components/marketing/CascadeVisualizer";

export const metadata = {
  title: "The communications cascade, visualised — SnapFix Resources",
  description:
    "Employees BEFORE customers. Customers WITH third parties. Media WITH customers. See the order policy requires and why getting it wrong escalates an incident.",
};

export default function CommsCascadeGuide() {
  return (
    <GuideLayout
      badge="Interactive guide"
      readingTime="3 min"
      title="The communications cascade, visualised"
      pitch="During an incident, the order you communicate in is as important as what you say. Most operational-resilience policies — including the — codify a strict cascade. Try sending out of order below; the rule will stop you."
    >
      <h2>The rule</h2>
      <p>
        Three constraints, repeated verbatim across stakeholder cards in the doctrine:
      </p>
      <ul>
        <li>
          <strong>Employees BEFORE customers / third parties.</strong> Your own people learning
          about an incident from customers is the fastest route to chaos.
        </li>
        <li>
          <strong>Customers WITH third parties.</strong> Aligned messaging — your customers and
          your vendors hearing the same words at the same time.
        </li>
        <li>
          <strong>Media WITH customers.</strong> Media stories before customers know creates a
          permanent reputational scar.
        </li>
      </ul>

      <CascadeVisualizer />

      <h2>Why the order matters</h2>
      <p>
        The cascade isn't a politeness convention — it's the difference between an incident and a
        crisis. When employees hear about a system outage from a customer on a support line,
        three things happen in the next 15 minutes:
      </p>
      <ul>
        <li>Front-line staff improvise messaging because they have no script.</li>
        <li>Internal Slack/Teams fills with rumour the comms team can't catch up to.</li>
        <li>The improvised messaging diverges from what the comms team eventually publishes — and customers screenshot both.</li>
      </ul>
      <p>
        Regulators read the timeline. <strong>"Employees informed at 14:12. Customers
        informed at 14:30. Media briefing at 14:30."</strong> defends easily. <strong>"Customer
        contact centre received complaints at 13:40. Internal note sent 14:50."</strong> does not.
      </p>

      <h2>Where regulators and the ICO sit</h2>
      <p>
        Regulator and ICO notifications run on their <em>own</em> clocks (FCA / PRA: 4 hours from
        IMT invocation for a High; ICO: 72 hours from awareness of a personal data breach) and{" "}
        <strong>do not</strong> depend on the employee cascade being complete. In practice they
        often go first because the SLAs are short.
      </p>

      <h2>Who owns each step</h2>
      <p>
        Per the stakeholder matrix (best practice, every comms has an execution owner and an
        approver — usually the CEO. The simulator's <a href="/resources/regulators">regulator
        reference</a> lays out the owner/approver pairs in detail.
      </p>

      <blockquote>
        The cascade order is the rare policy rule that's easy to internalise and easy to fail
        under pressure. Practising it on a tabletop costs you an afternoon. Failing it on a real
        incident costs you a Section 166 review.
      </blockquote>
    </GuideLayout>
  );
}
