import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IBSForm from "@/components/IBSForm";

export const metadata = { title: "Add IBS — SnapFix" };

const COMMON_INFORMATION = [
  "Customer PII",
  "KYC documentation",
  "Account balances",
  "Transaction history",
  "Payment instructions",
  "Authentication credentials",
  "Risk-scoring features",
  "Regulatory reports",
];

const COMMON_PROCESSES = [
  "Identity verification",
  "AML screening",
  "Account creation",
  "Payment authorisation",
  "Fraud review",
  "Customer onboarding",
  "Application underwriting",
  "Customer-comms cascade",
];

export default async function NewIBSPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");

  // Pull suggestions from the org's existing registers so the resource map
  // is a chip-picker, not a "type one per line" textarea.
  const [systems, vendors] = await Promise.all([
    prisma.techSystem.findMany({
      where: { orgId: me.orgId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
    prisma.vendor.findMany({
      where: { orgId: me.orgId },
      orderBy: { name: "asc" },
      select: { name: true },
    }),
  ]);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">
          Add an Important Business Service
        </h1>
        <p className="mt-1 text-sm text-muted">
          Capture the methodology, impact tolerance, mapping and importance assessment for
          this IBS.
        </p>
      </header>
      <IBSForm
        techSuggestions={systems.map((s) => ({ value: s.name, source: "system" as const }))}
        vendorSuggestions={vendors.map((v) => ({ value: v.name, source: "vendor" as const }))}
        informationSuggestions={COMMON_INFORMATION.map((value) => ({ value, source: "library" as const }))}
        processSuggestions={COMMON_PROCESSES.map((value) => ({ value, source: "library" as const }))}
      />
    </div>
  );
}
