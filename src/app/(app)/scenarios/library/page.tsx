import Link from "next/link";
import { ArrowLeft, Library } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import PageHero from "@/components/ui/PageHero";
import ScenarioLibraryGrid from "@/components/scenarios/ScenarioLibraryGrid";
import { LIBRARY_SCENARIOS } from "@/lib/library/scenarios";

export const metadata = { title: "Scenario library — SnapFix" };

export default async function ScenarioLibraryPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  return (
    <div className="space-y-6">
      <Link
        href="/scenarios"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to scenarios
      </Link>
      <PageHero
        eyebrow="Library"
        icon={Library}
        title="Sector scenario library"
        pitch={`${LIBRARY_SCENARIOS.length} pre-built scenarios across UK financial services, payments, retail and insurance — calibrated to real-world incidents. Clone one to your scenarios and author the MSEL events.`}
      />
      <ScenarioLibraryGrid library={LIBRARY_SCENARIOS} canManage={canManage} />
    </div>
  );
}
