import Link from "next/link";
import { ArrowLeft, Coins } from "lucide-react";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import RatesEditor from "./RatesEditor";
import { SECTOR_DEFAULT_RATES_GBP } from "@/lib/exercise-cost";

export const metadata = { title: "Exercise cost rates — Settings" };

export default async function ExerciseRatesPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");

  const [org, catalogueRoles] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: { defaultExerciseRates: true, exerciseCostCurrency: true },
    }),
    prisma.organizationRole.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ isSMF: "desc" }, { orderIdx: "asc" }, { abbreviation: "asc" }],
      select: { abbreviation: true, title: true },
    }),
  ]);

  const initialRates = (org.defaultExerciseRates ?? {}) as Record<string, number>;

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Admin"
        icon={Coins}
        title="Exercise cost rates"
        pitch="Per-role fully-loaded hourly rates used to estimate and report exercise cost. Snapshot at planning time, so rate changes don't retroactively alter past evidence."
      />

      <div className="mx-auto max-w-3xl space-y-4">
        <Link
          href="/settings"
          className="inline-flex items-center gap-1.5 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back to settings
        </Link>

        <section className="rounded-xl border border-line bg-surface-1 p-5">
          <RatesEditor
            initialRates={initialRates}
            initialCurrency={org.exerciseCostCurrency ?? "GBP"}
            catalogueRoles={catalogueRoles}
            sectorDefaults={SECTOR_DEFAULT_RATES_GBP}
          />
        </section>

        <div className="rounded-md border border-dashed border-line bg-surface-1 p-3 text-[11px] text-muted">
          <p className="font-semibold text-ink">How cost is computed</p>
          <p className="mt-1">
            <span className="font-mono">estimated = Σ(role-rate × duration)</span> at planning time.
            <span className="font-mono"> actual = Σ(role-rate × attended-minutes)</span> at closure.
            Both stored as snapshots on the exercise.
          </p>
        </div>
      </div>
    </div>
  );
}
