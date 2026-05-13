import { requireOrgRole } from "@/lib/auth";
import IBSForm from "@/components/IBSForm";

export const metadata = { title: "Add IBS — SnapFix" };

export default async function NewIBSPage() {
  await requireOrgRole("OWNER", "ADMIN");
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Add an Important Business Service</h1>
        <p className="mt-1 text-sm text-muted">
          Capture the methodology, impact tolerance, mapping and importance assessment for this IBS.
        </p>
      </header>
      <IBSForm />
    </div>
  );
}
