import { Building2, Flame, Server } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import IBSRegisterGrid from "@/components/ibs/IBSRegisterGrid";
import IBSAddButton from "@/components/ibs/IBSAddButton";
import LibraryBrowserButton from "@/components/library/LibraryBrowserButton";
import { IBS_LIBRARY_CONFIG } from "@/components/library/configs/ibs";
import { IBS_LIBRARY } from "@/lib/ibs-library";

export const metadata = { title: "IBS Register — SnapFix" };

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

export default async function IBSListPage() {
  const me = await requireOrgUser();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [items, systems, vendors] = await Promise.all([
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ status: "asc" }, { code: "asc" }],
      include: {
        _count: { select: { exerciseLinks: true } },
        processOwnerUser: { select: { name: true, email: true } },
      },
    }),
    canManage
      ? prisma.techSystem.findMany({
          where: { orgId: me.orgId },
          orderBy: { name: "asc" },
          select: { name: true },
        })
      : Promise.resolve([]),
    canManage
      ? prisma.vendor.findMany({
          where: { orgId: me.orgId },
          orderBy: { name: "asc" },
          select: { name: true },
        })
      : Promise.resolve([]),
  ]);

  const techSuggestions = systems.map((s) => ({ value: s.name, source: "system" as const }));
  const vendorSuggestions = vendors.map((v) => ({ value: v.name, source: "vendor" as const }));
  const informationSuggestions = COMMON_INFORMATION.map((value) => ({
    value,
    source: "library" as const,
  }));
  const processSuggestions = COMMON_PROCESSES.map((value) => ({
    value,
    source: "library" as const,
  }));

  const rows = items.map((i) => ({
    id: i.id,
    code: i.code,
    name: i.name,
    outcome: i.outcome,
    status: i.status,
    criticality: i.criticality,
    impactToleranceMin: i.impactToleranceMin,
    fcaToleranceMin: i.fcaToleranceMin,
    praToleranceMin: i.praToleranceMin,
    processOwner: i.processOwner,
    processOwnerUserId: i.processOwnerUserId,
    exerciseCount: i._count.exerciseLinks,
    coversPeople: i.coversPeople,
    coversProperty: i.coversProperty,
    coversTechnology: i.coversTechnology,
    coversDataAvailability: i.coversDataAvailability,
    coversDataIntegrity: i.coversDataIntegrity,
    coversThirdParty: i.coversThirdParty,
  }));

  const counts = {
    total: rows.length,
    critical: rows.filter((r) => r.criticality === "CRITICAL").length,
    untested: rows.filter((r) => r.exerciseCount === 0).length,
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Register"
        icon={Building2}
        title="Important Business Services"
        pitch={`${counts.total} ${counts.total === 1 ? "service" : "services"} · tolerances + resource map`}
        actions={
          canManage && (
            <div className="flex items-center gap-2">
              <LibraryBrowserButton
                config={IBS_LIBRARY_CONFIG}
                items={IBS_LIBRARY}
                existingKeys={rows.map((r) => r.name)}
                canAdd={canManage}
              />
              <IBSAddButton
                techSuggestions={techSuggestions}
                vendorSuggestions={vendorSuggestions}
                informationSuggestions={informationSuggestions}
                processSuggestions={processSuggestions}
              />
            </div>
          )
        }
      />

      {rows.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-10 text-center">
          <Server size={28} className="mx-auto text-indigo-500 dark:text-indigo-300" />
          <p className="mt-3 text-sm font-medium text-ink">
            No IBS in the register yet
          </p>
          <p className="mx-auto mt-1 max-w-md text-xs text-muted">
            {canManage
              ? "Use the wizard to capture your first Important Business Service — five steps and you're done."
              : "Ask an admin to start the register."}
          </p>
          {canManage && (
            <div className="mt-4 inline-flex">
              <IBSAddButton
                techSuggestions={techSuggestions}
                vendorSuggestions={vendorSuggestions}
                informationSuggestions={informationSuggestions}
                processSuggestions={processSuggestions}
                variant="ghost"
                label="Start the wizard"
              />
            </div>
          )}
        </div>
      ) : (
        <>
          <section className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatTile label="Total" value={counts.total} icon={<Building2 size={12} />} />
            <StatTile
              label="Critical"
              value={counts.critical}
              icon={<Flame size={12} />}
              tone="critical"
            />
            <StatTile
              label="Never tested"
              value={counts.untested}
              tone={counts.untested > 0 ? "warn" : "ok"}
            />
            <StatTile
              label="Total exercises"
              value={rows.reduce((acc, r) => acc + r.exerciseCount, 0)}
              tone="ok"
            />
          </section>

          <IBSRegisterGrid rows={rows} canEdit={canManage} currentUserId={me.id} />
        </>
      )}
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
  tone?: "ok" | "warn" | "critical" | "neutral";
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
