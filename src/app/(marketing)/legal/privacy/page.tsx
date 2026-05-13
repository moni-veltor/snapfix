import LegalLayout from "@/components/marketing/LegalLayout";

export const metadata = {
  title: "Privacy notice — SnapFix",
  description: "How SnapFix collects, uses and protects personal data.",
};

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy notice"
      effective="May 2026"
      intro="SnapFix is provided by SnapFix Ltd. This notice describes what personal data we collect, why we collect it, and what rights you have under UK GDPR."
    >
      <h2>1. What we collect</h2>
      <p>
        Account data — name, work email, password hash, organisation membership, role. Exercise
        participation data — your role title in an exercise, your responses to injects, your
        log entries, your communication drafts.
      </p>
      <p>
        We do not collect data about your firm's customers. Exercises run with synthetic
        scenarios; the platform does not need (or want) access to your real customer records.
      </p>

      <h2>2. Why we collect it</h2>
      <ul>
        <li>To authenticate you and authorise access to your organisation's data</li>
        <li>To deliver the platform's features (run exercises, log decisions, produce reports)</li>
        <li>To send transactional emails (invitations, notifications) — operationally necessary</li>
        <li>To improve the service (aggregated, non-identifying usage analytics)</li>
        <li>To meet legal and regulatory obligations</li>
      </ul>

      <h2>3. Legal basis</h2>
      <p>
        Contract (delivering the service you signed up for), legitimate interests (security,
        product improvement), and consent for any optional analytics or marketing emails.
      </p>

      <h2>4. Sharing your data</h2>
      <p>
        Your data is shared only with sub-processors operationally required to deliver the
        service (cloud hosting, email delivery, observability). The full sub-processor list is
        on the <a href="/security">security page</a> and updated when it changes.
      </p>

      <h2>5. Where we store it</h2>
      <p>
        Production data is hosted in eu-west-2 (London) by default. Enterprise plans may opt to
        host in EU or US regions. Backups are encrypted at rest.
      </p>

      <h2>6. How long we keep it</h2>
      <p>
        For the life of your account, plus 90 days after closure for backup retention. Audit-log
        entries and incident records are retained for 7 years to meet financial-services
        record-keeping norms.
      </p>

      <h2>7. Your rights</h2>
      <ul>
        <li>Access — request a copy of the data we hold about you</li>
        <li>Correction — ask us to fix anything inaccurate</li>
        <li>Deletion — ask us to remove your data (subject to legal retention)</li>
        <li>Portability — receive your data in a machine-readable format</li>
        <li>Objection — object to certain processing activities</li>
        <li>Complaint — to the ICO at <a href="https://ico.org.uk">ico.org.uk</a></li>
      </ul>

      <h2>8. Contact us</h2>
      <p>
        For privacy questions or to exercise any of the above rights, email{" "}
        <a href="mailto:privacy@snapfix.app">privacy@snapfix.app</a>.
      </p>
    </LegalLayout>
  );
}
