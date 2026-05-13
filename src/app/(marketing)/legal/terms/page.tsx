import LegalLayout from "@/components/marketing/LegalLayout";

export const metadata = {
  title: "Terms of service — SnapFix",
  description: "The rules of using the SnapFix platform.",
};

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of service"
      effective="May 2026"
      intro="By using SnapFix you agree to these terms. They cover your account, what you can and can't do, our service commitments, and how disputes are handled."
    >
      <h2>1. Your account</h2>
      <p>
        You are responsible for keeping your credentials secure and for the actions taken under
        your account. Notify us immediately if you suspect unauthorised access.
      </p>

      <h2>2. Acceptable use</h2>
      <p>
        You may not use SnapFix to break the law, send unsolicited bulk email, host malicious
        content, attempt to compromise our infrastructure, or reverse-engineer the service. You
        may not use SnapFix to host or process real customer personal data in any volume — the
        platform is for exercises with synthetic data.
      </p>

      <h2>3. Plans and billing</h2>
      <p>
        Paid plans are billed in advance, monthly or annually. We do not auto-renew without
        notice; you'll receive renewal reminders 30 days before the term ends. Annual plans are
        non-refundable but unused months can be applied to plan upgrades.
      </p>

      <h2>4. Your data</h2>
      <p>
        Your data remains yours. We process it to deliver the service. You can export it at any
        time from the app. If you close your account we delete your data within 90 days
        (excluding audit-log entries retained for record-keeping, see the privacy notice).
      </p>

      <h2>5. Service availability</h2>
      <p>
        We target 99.5% uptime on Free, Starter and Growth plans, measured monthly. Enterprise
        plans have a contractually agreed SLA. Maintenance windows are announced 48 hours in
        advance where practicable.
      </p>

      <h2>6. Intellectual property</h2>
      <p>
        SnapFix retains all rights to the platform code, scenarios authored by SnapFix, and
        templates we ship. You retain rights to scenarios you author, your IBS register, your
        exercise outputs and your organisation's content.
      </p>

      <h2>7. Limitation of liability</h2>
      <p>
        SnapFix is a simulator. It does not replace your firm's incident management plan,
        regulatory obligations, or operational controls. Our liability is capped at the amount
        you paid us in the 12 months preceding any claim. We are not liable for indirect or
        consequential loss.
      </p>

      <h2>8. Termination</h2>
      <p>
        You can cancel at any time. We can terminate accounts that violate these terms with
        reasonable notice (immediately if necessary to protect the service or other customers).
      </p>

      <h2>9. Changes</h2>
      <p>
        We may update these terms. Material changes will be notified by email at least 30 days
        before they take effect.
      </p>

      <h2>10. Governing law</h2>
      <p>
        These terms are governed by the laws of England and Wales. Disputes are subject to the
        exclusive jurisdiction of the English courts.
      </p>
    </LegalLayout>
  );
}
