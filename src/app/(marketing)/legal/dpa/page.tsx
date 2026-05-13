import LegalLayout from "@/components/marketing/LegalLayout";

export const metadata = {
  title: "Data Processing Agreement — SnapFix",
  description: "Summary of SnapFix's standard Data Processing Agreement.",
};

export default function DPAPage() {
  return (
    <LegalLayout
      title="Data Processing Agreement"
      effective="May 2026"
      intro="This page summarises the standard SnapFix DPA. For execution, request the formal document via the contact form — it will be returned with your customer details for signature."
    >
      <h2>1. Roles</h2>
      <p>
        You are the <strong>Controller</strong>. SnapFix is the <strong>Processor</strong>. We
        process personal data only on your documented instructions.
      </p>

      <h2>2. What we process</h2>
      <ul>
        <li>Account data of your employees who use the platform (name, work email, role)</li>
        <li>Exercise participation data (role title, decisions logged, comms drafted, responses captured)</li>
        <li>Audit log entries identifying user actions for accountability</li>
      </ul>
      <p>
        We do not process your firm's customer personal data. The platform is designed for
        exercises with synthetic data.
      </p>

      <h2>3. Sub-processors</h2>
      <p>
        We use the following sub-processors:
      </p>
      <ul>
        <li>Vercel (UK / EU hosting, CDN, blob storage)</li>
        <li>Neon (UK / EU database hosting)</li>
        <li>Resend (transactional email delivery)</li>
      </ul>
      <p>
        New sub-processors are notified at least 30 days before they go live. You may object,
        in which case we will work to resolve or offer termination rights.
      </p>

      <h2>4. International transfers</h2>
      <p>
        We default to UK hosting. Any transfer outside the UK / EEA is covered by standard
        contractual clauses with adequate safeguards.
      </p>

      <h2>5. Security</h2>
      <p>
        TLS 1.2+ in transit; AES-256 at rest. Role-based access; least-privilege principle for
        SnapFix staff. Audit logging. Vulnerability disclosure programme. Full security posture
        on the <a href="/security">security page</a>.
      </p>

      <h2>6. Subject rights support</h2>
      <p>
        We assist you with data subject access requests, deletion requests, and other rights
        exercises within reasonable timeframes. You remain the responder; we provide the data.
      </p>

      <h2>7. Breach notification</h2>
      <p>
        We will notify you of any personal data breach affecting your data without undue
        delay — and within 24 hours where the breach has likely impact, so you can meet your
        own 72-hour ICO notification window.
      </p>

      <h2>8. Audit rights</h2>
      <p>
        Once per year, you may audit our compliance via a written questionnaire. On-site audits
        are available on Enterprise plans subject to reasonable cost recovery.
      </p>

      <h2>9. Termination</h2>
      <p>
        On termination, we delete or return your data within 90 days (excluding audit-log
        entries retained for record-keeping).
      </p>
    </LegalLayout>
  );
}
