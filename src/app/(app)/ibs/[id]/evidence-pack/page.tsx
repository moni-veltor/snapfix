import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Building,
  CheckCircle2,
  Database,
  ExternalLink,
  FileSignature,
  Server,
  Users,
  Wifi,
  XCircle,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PrintButton from "./PrintButton";

export const metadata = { title: "Evidence pack — SnapFix" };

/**
 * Regulator-ready evidence pack for a single IBS. Pulls every relevant
 * artefact across the platform into one printable page:
 *
 *  - IBS identity + tolerance + criticality
 *  - Owner department + named process owner
 *  - Resource map (technology, vendors, information, processes, people, facilities)
 *  - Harm coverage matrix
 *  - 6-dimension importance assessment
 *  - Linked vendors with DORA / assurance metadata
 *  - Linked exercises with status + dates + ImpactBreaches
 *  - Approval / review history
 *
 * Designed to print to PDF via browser print (no extra dependency). The
 * pack is the kind of evidence pack you'd hand a regulator or auditor
 * who asks: "show me everything you have on IBS_05".
 */
export default async function IBSEvidencePackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      processOwnerUser: { select: { name: true, email: true } },
      createdBy: { select: { name: true, email: true } },
      ownerDepartment: { select: { id: true, name: true, abbreviation: true } },
      exerciseLinks: {
        include: {
          exercise: {
            select: {
              id: true,
              title: true,
              status: true,
              plannedDate: true,
              startedAt: true,
              completedAt: true,
            },
          },
        },
      },
    },
  });
  if (!ibs) notFound();

  // Find vendors that link to this IBS
  const linkedVendors = await prisma.vendor.findMany({
    where: {
      orgId: me.orgId,
      ibsLinks: { some: { ibsId: ibs.id } },
    },
    orderBy: [{ tier: "asc" }, { name: "asc" }],
    select: {
      id: true,
      name: true,
      serviceKind: true,
      tier: true,
      isDoraCritical: true,
      hyperscaler: true,
      region: true,
      assuranceKind: true,
      assuranceExpiryAt: true,
      contractEndAt: true,
      exitPlanReviewedAt: true,
      exitPlanRTOMin: true,
    },
  });

  const org = await prisma.organization.findUnique({
    where: { id: me.orgId },
    select: { name: true, tier: true },
  });

  const generatedAt = new Date();

  function fmtMin(n: number | null | undefined): string {
    if (n == null) return "—";
    if (n < 60) return `${n} min`;
    if (n < 1440) {
      const h = Math.floor(n / 60);
      const m = n % 60;
      return m === 0 ? `${h}h` : `${h}h ${m}m`;
    }
    const d = Math.floor(n / 1440);
    const h = Math.floor((n % 1440) / 60);
    return h === 0 ? `${d}d` : `${d}d ${h}h`;
  }

  function fmtDate(d: Date | null | undefined): string {
    return d ? d.toISOString().slice(0, 10) : "—";
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none print:px-0">
      {/* Toolbar — hidden on print */}
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <Link
          href={`/ibs/${ibs.id}`}
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back to IBS detail
        </Link>
        <PrintButton />
      </div>

      <article className="space-y-8 rounded-xl border border-line bg-surface-1 p-6 print:border-0 print:bg-transparent print:p-0">
        {/* Cover */}
        <header className="space-y-2 border-b border-line pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-soft">
            Evidence pack
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-ink">
            <span className="font-mono text-muted">{ibs.code}</span> · {ibs.name}
          </h1>
          {ibs.outcome && <p className="text-sm text-ink">{ibs.outcome}</p>}
          <dl className="mt-3 grid grid-cols-2 gap-x-6 gap-y-1 text-xs sm:grid-cols-4">
            <Meta label="Organisation" value={org?.name ?? "—"} />
            <Meta label="Firm tier" value={org?.tier?.replace("TIER_", "Tier ") ?? "—"} />
            <Meta label="IBS status" value={ibs.status} />
            <Meta label="Criticality" value={ibs.criticality} />
            <Meta label="Generated" value={generatedAt.toISOString().slice(0, 16).replace("T", " ")} />
            <Meta label="By" value={me.name ?? me.email} />
            <Meta label="Approved on" value={fmtDate(ibs.approvedAt)} />
            <Meta label="Next review due" value={fmtDate(ibs.reviewDueAt)} />
          </dl>
        </header>

        {/* Description */}
        {ibs.description && (
          <Section title="Description">
            <p className="whitespace-pre-line text-sm text-ink">{ibs.description}</p>
          </Section>
        )}

        {/* Tolerance */}
        <Section title="Impact tolerance">
          <dl className="grid grid-cols-3 gap-3 text-sm">
            <DataPanel
              label="Internal tolerance"
              value={fmtMin(ibs.impactToleranceMin)}
              tone="primary"
            />
            <DataPanel
              label="FCA tolerance"
              value={fmtMin(ibs.fcaToleranceMin)}
              tone="muted"
            />
            <DataPanel
              label="PRA tolerance"
              value={fmtMin(ibs.praToleranceMin)}
              tone="muted"
            />
          </dl>
          {ibs.toleranceRationale && (
            <div className="mt-3 rounded-md border border-line bg-surface-0 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-soft">
                Rationale
              </p>
              <p className="mt-1 whitespace-pre-line text-xs text-ink">{ibs.toleranceRationale}</p>
            </div>
          )}
        </Section>

        {/* Ownership */}
        <Section title="Ownership & governance">
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <Meta
              label="Owner department"
              value={
                ibs.ownerDepartment
                  ? `${ibs.ownerDepartment.name}${ibs.ownerDepartment.abbreviation ? ` (${ibs.ownerDepartment.abbreviation})` : ""}`
                  : "—"
              }
            />
            <Meta
              label="Process owner"
              value={
                ibs.processOwnerUser?.name ??
                ibs.processOwnerUser?.email ??
                ibs.processOwner ??
                "—"
              }
            />
            <Meta label="Second-line reviewer" value={ibs.secondLineReviewer ?? "—"} />
            <Meta label="Process type" value={ibs.processType ?? "—"} />
            <Meta
              label="Created by"
              value={ibs.createdBy?.name ?? ibs.createdBy?.email ?? "—"}
            />
            <Meta
              label="Created at"
              value={ibs.createdAt.toISOString().slice(0, 10)}
            />
          </dl>
        </Section>

        {/* Resource map */}
        <Section title="Resource map">
          <div className="grid gap-3 sm:grid-cols-2">
            <ResourceList label="Technology" items={ibs.technology} />
            <ResourceList label="Third parties" items={ibs.thirdParties} />
            <ResourceList label="Information" items={ibs.information} />
            <ResourceList label="Processes" items={ibs.processes} />
            <ResourceList label="Customer journeys" items={ibs.customerJourneys} />
            <ResourceList label="Products covered" items={ibs.productsCovered} />
          </div>
          {(ibs.peopleNotes || ibs.facilities) && (
            <div className="grid gap-3 sm:grid-cols-2">
              {ibs.peopleNotes && (
                <NotesBlock label="People notes" body={ibs.peopleNotes} />
              )}
              {ibs.facilities && (
                <NotesBlock label="Facilities" body={ibs.facilities} />
              )}
            </div>
          )}
        </Section>

        {/* Harm coverage */}
        <Section title="6-box risk coverage (CMORG)">
          <ul className="grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <CoverageRow label="People" Icon={Users} on={ibs.coversPeople} />
            <CoverageRow label="Property" Icon={Building} on={ibs.coversProperty} />
            <CoverageRow label="Technology" Icon={Server} on={ibs.coversTechnology} />
            <CoverageRow label="Data availability" Icon={Wifi} on={ibs.coversDataAvailability} />
            <CoverageRow label="Data integrity" Icon={Database} on={ibs.coversDataIntegrity} />
            <CoverageRow label="Third party" Icon={ExternalLink} on={ibs.coversThirdParty} />
          </ul>
        </Section>

        {/* Importance assessment */}
        <Section title="Importance assessment (6 dimensions)">
          <dl className="grid gap-2 text-sm sm:grid-cols-2">
            <ImpactRow label="Customer financial" value={ibs.impactCustomerFinancial} />
            <ImpactRow label="Vulnerable customer" value={ibs.impactVulnerableCustomer} />
            <ImpactRow label="Loss of licence" value={ibs.impactLossOfLicense} />
            <ImpactRow label="Regulatory fine" value={ibs.impactRegulatoryFine} />
            <ImpactRow label="Reputational" value={ibs.impactReputational} />
            <ImpactRow label="Loss of capital" value={ibs.impactLossOfCapital} />
          </dl>
          {ibs.importanceAssessmentNotes && (
            <NotesBlock label="Notes" body={ibs.importanceAssessmentNotes} />
          )}
        </Section>

        {/* Vulnerabilities and testing notes */}
        {(ibs.vulnerabilitiesNotes || ibs.testingNotes) && (
          <Section title="Vulnerabilities & testing">
            {ibs.vulnerabilitiesNotes && (
              <NotesBlock label="Known vulnerabilities" body={ibs.vulnerabilitiesNotes} />
            )}
            {ibs.testingNotes && (
              <NotesBlock label="Testing notes" body={ibs.testingNotes} />
            )}
          </Section>
        )}

        {/* Linked vendors */}
        <Section title={`Critical third parties (${linkedVendors.length})`}>
          {linkedVendors.length === 0 ? (
            <p className="text-xs text-soft">No vendors linked to this IBS yet.</p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-soft">
                  <th className="py-2 pr-2">Vendor</th>
                  <th className="py-2 pr-2">Service</th>
                  <th className="py-2 pr-2">Tier</th>
                  <th className="py-2 pr-2">DORA</th>
                  <th className="py-2 pr-2">Hyperscaler</th>
                  <th className="py-2 pr-2">Assurance</th>
                  <th className="py-2 pr-2">Contract ends</th>
                  <th className="py-2 pr-2">Exit RTO</th>
                </tr>
              </thead>
              <tbody>
                {linkedVendors.map((v) => (
                  <tr key={v.id} className="border-b border-line align-top">
                    <td className="py-2 pr-2 font-medium text-ink">{v.name}</td>
                    <td className="py-2 pr-2 text-muted">{v.serviceKind ?? "—"}</td>
                    <td className="py-2 pr-2 font-mono text-muted">
                      {v.tier.replace("TIER_", "T")}
                    </td>
                    <td className="py-2 pr-2 text-muted">{v.isDoraCritical ? "Y" : "N"}</td>
                    <td className="py-2 pr-2 text-muted">{v.hyperscaler ?? "—"}</td>
                    <td className="py-2 pr-2 text-muted">
                      {v.assuranceKind ?? "—"}
                      {v.assuranceExpiryAt && (
                        <span className="ml-1 text-soft">
                          (exp {fmtDate(v.assuranceExpiryAt)})
                        </span>
                      )}
                    </td>
                    <td className="py-2 pr-2 text-muted">{fmtDate(v.contractEndAt)}</td>
                    <td className="py-2 pr-2 text-muted">{fmtMin(v.exitPlanRTOMin)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Exercise & test history */}
        <Section title={`Exercise & test history (${ibs.exerciseLinks.length})`}>
          {ibs.exerciseLinks.length === 0 ? (
            <p className="text-xs text-soft">
              This IBS has not been exercise-tested yet — a regulator-relevant gap.
            </p>
          ) : (
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-line text-left text-[10px] uppercase tracking-wider text-soft">
                  <th className="py-2 pr-2">Exercise</th>
                  <th className="py-2 pr-2">Status</th>
                  <th className="py-2 pr-2">Planned</th>
                  <th className="py-2 pr-2">Started</th>
                  <th className="py-2 pr-2">Completed</th>
                </tr>
              </thead>
              <tbody>
                {ibs.exerciseLinks.map((l) => (
                  <tr key={l.ibsId + "-" + l.exerciseId} className="border-b border-line">
                    <td className="py-2 pr-2 font-medium text-ink">{l.exercise.title}</td>
                    <td className="py-2 pr-2 text-muted">{l.exercise.status}</td>
                    <td className="py-2 pr-2 text-muted">{fmtDate(l.exercise.plannedDate)}</td>
                    <td className="py-2 pr-2 text-muted">{fmtDate(l.exercise.startedAt)}</td>
                    <td className="py-2 pr-2 text-muted">{fmtDate(l.exercise.completedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Section>

        {/* Footer */}
        <footer className="space-y-1 border-t border-line pt-4 text-[10px] text-soft">
          <p>
            <FileSignature size={9} className="mr-1 inline" />
            Pack generated by SnapFix on {generatedAt.toISOString().slice(0, 10)} at{" "}
            {generatedAt.toISOString().slice(11, 16)} UTC by{" "}
            {me.name ?? me.email}.
          </p>
          <p>
            Source: SnapFix IBS register entry {ibs.code} ({ibs.id}). All data extracted
            live at generation time. To regenerate, visit /ibs/{ibs.id}/evidence-pack.
          </p>
        </footer>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3 break-inside-avoid">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-soft">
        {title}
      </h2>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Meta({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[10px] uppercase tracking-wider text-soft">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{value}</dd>
    </div>
  );
}

function DataPanel({
  label,
  value,
  tone = "primary",
}: {
  label: string;
  value: string;
  tone?: "primary" | "muted";
}) {
  const cls = tone === "primary" ? "border-line-strong bg-accent-soft" : "border-line bg-surface-0";
  return (
    <div className={`rounded-md border p-3 ${cls}`}>
      <div className="text-[10px] uppercase tracking-wider text-soft">{label}</div>
      <div className="mt-1 font-mono text-lg font-semibold text-ink">{value}</div>
    </div>
  );
}

function ResourceList({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <p className="text-[10px] uppercase tracking-wider text-soft">{label}</p>
      {items.length === 0 ? (
        <p className="mt-1 text-xs text-soft">—</p>
      ) : (
        <ul className="mt-1 space-y-0.5 text-xs text-ink">
          {items.map((i) => (
            <li key={i}>· {i}</li>
          ))}
        </ul>
      )}
    </div>
  );
}

function NotesBlock({ label, body }: { label: string; body: string }) {
  return (
    <div className="rounded-md border border-line bg-surface-0 p-3">
      <p className="text-[10px] uppercase tracking-wider text-soft">{label}</p>
      <p className="mt-1 whitespace-pre-line text-xs text-ink">{body}</p>
    </div>
  );
}

function CoverageRow({
  label,
  Icon,
  on,
}: {
  label: string;
  Icon: React.ComponentType<{ size?: number }>;
  on: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-2 rounded-md border px-3 py-2 ${
        on
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-0"
      }`}
    >
      {on ? (
        <CheckCircle2 size={14} className="text-emerald-600 dark:text-emerald-300" />
      ) : (
        <XCircle size={14} className="text-soft" />
      )}
      <Icon size={12} />
      <span className={on ? "text-ink" : "text-muted"}>{label}</span>
    </li>
  );
}

const IMPACT_TONE: Record<string, string> = {
  CRITICAL: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  HIGH: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  MEDIUM: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  LOW: "bg-surface-2 text-muted",
};

function ImpactRow({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border border-line bg-surface-0 p-2.5">
      <span className="text-xs text-muted">{label}</span>
      {value ? (
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
            IMPACT_TONE[value] ?? "bg-surface-2 text-muted"
          }`}
        >
          {value}
        </span>
      ) : (
        <span className="text-[11px] text-soft">Not assessed</span>
      )}
    </div>
  );
}

