import GuideLayout from "@/components/marketing/GuideLayout";
import InvocationWalker from "@/components/marketing/InvocationWalker";

export const metadata = {
  title: "Should I invoke the IMT? — SnapFix Resources",
  description:
    "The hardest call in a real incident: stand up the IMT or wait. Step through the five trigger questions the IMP uses and get a recommendation.",
};

export default function InvocationGuide() {
  return (
    <GuideLayout
      badge="Interactive guide"
      readingTime="4 min"
      title="Should I invoke the IMT? A decision walker"
      pitch="Standing up the Incident Management Team is the most consequential call in the first hour of an incident. Wait too long and the regulator's reading your timeline back to you. Invoke too eagerly and you cry wolf. Here's the standard playbook."
    >
      <h2>The principle</h2>
      <blockquote>
        "It is better to stand it up and back down than to fail to stand it up." — best practice
      </blockquote>
      <p>
        Standing up the IMT is reversible — the platform records a "stood down" decision and the
        incident closes cleanly. <em>Not</em> standing up an IMT is also reversible, but at the
        cost of a timeline the regulator will eventually read.
      </p>

      <h2>Five questions, any single Yes recommends invocation</h2>
      <p>
        These aren't a formal checklist — they're the questions a CEO runs through when their CRO
        calls. We&apos;ve codified them below.
      </p>

      <InvocationWalker />

      <h2>What happens on invocation</h2>
      <ul>
        <li>
          The IMT is convened — CEO leads, CRO is Incident Manager. (These are separate roles,
          per best practice
        </li>
        <li>
          Severity classification on the five-dimension matrix (see the{" "}
          <a href="/resources/guides/severity">severity guide</a>).
        </li>
        <li>
          The Incident Response Team (IRT) splits into Technology Response and Customer Response
          if the event spans both.
        </li>
        <li>The Communications Team is mobilised under the Head of External Affairs.</li>
        <li>
          IMT decides whether to convene the Board Action Committee (if Board approval may be
          needed in-flight).
        </li>
        <li>
          The standing IMT meeting cadence is set — typically every 30–60 minutes during a High.
        </li>
      </ul>

      <h2>Common mistakes</h2>
      <ul>
        <li>
          <strong>Asking the wrong question.</strong> "Is this big enough to invoke?" is not the
          test. "Is this <em>plausibly</em> big enough that we'd regret waiting?" is.
        </li>
        <li>
          <strong>Conflating Incident Manager with Incident Leader.</strong> The CRO manages the
          process. The CEO leads. If one person tries to do both, the response degrades fast.
        </li>
        <li>
          <strong>Waiting for completeness.</strong> First-hour information is always partial.
          Invoke, then refine.
        </li>
        <li>
          <strong>Not standing down.</strong> If the trigger turned out to be a false alarm,
          stand the IMT down formally — record the decision, document the rationale. Don't just
          let the meeting peter out.
        </li>
      </ul>

      <h2>The platform side</h2>
      <p>
        In SnapFix, invoking the IMT is a single action that captures the invoker, the rationale
        and the D-Day time. Stand-down is symmetric. Both write to the audit log so the
        timeline reconstructs exactly the way a regulator wants to read it.
      </p>
    </GuideLayout>
  );
}
