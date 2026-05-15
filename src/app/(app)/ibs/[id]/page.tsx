import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import IBSForm from "@/components/IBSForm";
import {
  approveIBSAction,
  deprecateIBSAction,
  deleteIBSAction,
} from "@/app/actions/ibs";
import DependencyMap from "@/components/ibs/DependencyMap";
import ToleranceTester from "@/components/ibs/ToleranceTester";
import HarmTypeLibrary from "@/components/ibs/HarmTypeLibrary";
import IBSDetailTabs from "@/components/ibs/IBSDetailTabs";
import ToastForm from "@/components/ui/ToastForm";
import SubmitButton from "@/components/ui/SubmitButton";

export default async function IBSDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;
  const sp = await searchParams;

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      exerciseLinks: {
        include: { exercise: { select: { id: true, title: true, status: true, plannedDate: true } } },
      },
      processOwnerUser: { select: { name: true, email: true } },
      createdBy: { select: { name: true, email: true } },
    },
  });
  if (!ibs) notFound();
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const editing = canManage && sp.edit === "1";

  // Compute shared-dependency map — for every dependency item this IBS uses,
  // find which OTHER IBSs in the org list the same item.
  const peers = await prisma.organizationIBS.findMany({
    where: { orgId: me.orgId, id: { not: ibs.id } },
    select: {
      id: true,
      code: true,
      name: true,
      technology: true,
      thirdParties: true,
      information: true,
      processes: true,
    },
  });
  const sharedBy: Record<string, { id: string; code: string; name: string }[]> = {};
  const allItems = [
    ...ibs.technology,
    ...ibs.thirdParties,
    ...ibs.information,
    ...ibs.processes,
  ];
  for (const item of allItems) {
    const list = peers
      .filter(
        (p) =>
          p.technology.includes(item) ||
          p.thirdParties.includes(item) ||
          p.information.includes(item) ||
          p.processes.includes(item),
      )
      .map((p) => ({ id: p.id, code: p.code, name: p.name }));
    sharedBy[item] = list;
  }

  if (editing) {
    // Suggestions for the resource picker — same shape as /ibs/new
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
    const commonInfo = [
      "Customer PII", "KYC documentation", "Account balances",
      "Transaction history", "Payment instructions", "Authentication credentials",
      "Risk-scoring features", "Regulatory reports",
    ];
    const commonProc = [
      "Identity verification", "AML screening", "Account creation",
      "Payment authorisation", "Fraud review", "Customer onboarding",
      "Application underwriting", "Customer-comms cascade",
    ];
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <header>
          <p className="text-xs uppercase tracking-wide text-muted">
            <Link href={`/ibs/${ibs.id}`} className="underline">
              ← Back
            </Link>
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Edit {ibs.code} — {ibs.name}
          </h1>
        </header>
        <IBSForm
          existing={ibs}
          techSuggestions={systems.map((s) => ({ value: s.name, source: "system" as const }))}
          vendorSuggestions={vendors.map((v) => ({ value: v.name, source: "vendor" as const }))}
          informationSuggestions={commonInfo.map((value) => ({ value, source: "library" as const }))}
          processSuggestions={commonProc.map((value) => ({ value, source: "library" as const }))}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-2">
        <div className="text-xs uppercase tracking-wide text-muted">
          <Link href="/ibs" className="underline">
            ← IBS register
          </Link>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-semibold tracking-tight">
                <span className="font-mono text-muted">{ibs.code}</span> · {ibs.name}
              </h1>
              <Pill kind={statusKind(ibs.status)}>{ibs.status}</Pill>
              <Pill>{ibs.criticality}</Pill>
            </div>
            {ibs.outcome && <p className="mt-2 text-ink">{ibs.outcome}</p>}
          </div>
          {canManage && (
            <div className="flex gap-2">
              <Link
                href={`/ibs/${ibs.id}?edit=1`}
                className="rounded-md border border-line-strong px-3 py-1.5 text-sm hover:bg-surface-1"
              >
                Edit
              </Link>
              {ibs.status === "DRAFT" && (
                <ToastForm
                  action={approveIBSAction}
                  toast={{
                    success: `${ibs.code} approved`,
                    error: "Couldn't approve this IBS",
                  }}
                >
                  <input type="hidden" name="id" value={ibs.id} />
                  <SubmitButton tone="ok" size="md">Approve</SubmitButton>
                </ToastForm>
              )}
              {ibs.status !== "DEPRECATED" && (
                <ToastForm
                  action={deprecateIBSAction}
                  toast={{
                    success: `${ibs.code} deprecated`,
                    error: "Couldn't deprecate this IBS",
                  }}
                >
                  <input type="hidden" name="id" value={ibs.id} />
                  <SubmitButton tone="outline" size="md">Deprecate</SubmitButton>
                </ToastForm>
              )}
              <ToastForm
                action={deleteIBSAction}
                toast={{
                  success: `${ibs.code} deleted`,
                  error: "Couldn't delete this IBS",
                }}
              >
                <input type="hidden" name="id" value={ibs.id} />
                <SubmitButton tone="danger" size="md">Delete</SubmitButton>
              </ToastForm>
            </div>
          )}
        </div>
      </header>

      <IBSDetailTabs
        ibsId={ibs.id}
        counts={{ history: ibs.exerciseLinks.length }}
        panels={{
          overview: (
            <div className="space-y-5">
              <DependencyMap
                ibsCode={ibs.code}
                ibsName={ibs.name}
                technology={ibs.technology}
                thirdParties={ibs.thirdParties}
                information={ibs.information}
                processes={ibs.processes}
                peopleNotes={ibs.peopleNotes}
                facilities={ibs.facilities}
                sharedBy={sharedBy}
              />
              <ToleranceTester
                ibsCode={ibs.code}
                primaryToleranceMin={ibs.impactToleranceMin}
                fcaToleranceMin={ibs.fcaToleranceMin}
                praToleranceMin={ibs.praToleranceMin}
              />
            </div>
          ),
          resources: (
            <div className="space-y-5">
              <Card title="Resource map">
                <Block label="Technology" list={ibs.technology} />
                <Block label="3rd parties" list={ibs.thirdParties} />
                <Block label="Information" list={ibs.information} />
                <Block label="Processes" list={ibs.processes} />
                {ibs.peopleNotes && <Block label="People" body={ibs.peopleNotes} />}
                {ibs.facilities && <KV k="Facilities" v={ibs.facilities} />}
              </Card>
              <Card title="Methodology">
                <Block label="Customer journeys" list={ibs.customerJourneys} />
                <Block label="Products covered" list={ibs.productsCovered} />
              </Card>
            </div>
          ),
          tolerance: (
            <div className="space-y-5">
              <Card title="Impact tolerance">
                <KV k="Primary" v={fmtMin(ibs.impactToleranceMin)} />
                <KV k="FCA" v={ibs.fcaToleranceMin ? fmtMin(ibs.fcaToleranceMin) : "—"} />
                <KV k="PRA" v={ibs.praToleranceMin ? fmtMin(ibs.praToleranceMin) : "—"} />
                <KV k="Criticality" v={ibs.criticality} />
                {ibs.toleranceRationale && (
                  <Block label="Rationale" body={ibs.toleranceRationale} />
                )}
              </Card>
              <Card title="Importance assessment">
                <ImpactGrid ibs={ibs} />
                {ibs.importanceAssessmentNotes && (
                  <Block label="Notes" body={ibs.importanceAssessmentNotes} />
                )}
              </Card>
              <Card title="Risk coverage (6-box)">
                <CoverageMatrix ibs={ibs} />
              </Card>
              <HarmTypeLibrary
                coverage={{
                  people: ibs.coversPeople,
                  property: ibs.coversProperty,
                  technology: ibs.coversTechnology,
                  dataAvailability: ibs.coversDataAvailability,
                  dataIntegrity: ibs.coversDataIntegrity,
                  thirdParty: ibs.coversThirdParty,
                }}
              />
            </div>
          ),
          governance: (
            <div className="space-y-5">
              <Card title="Governance & ownership">
                <KV k="Process type" v={ibs.processType ?? "—"} />
                <KV k="Process owner" v={ibs.processOwner ?? "—"} />
                <KV k="2nd-line reviewer" v={ibs.secondLineReviewer ?? "—"} />
                <KV
                  k="Review due"
                  v={ibs.reviewDueAt ? ibs.reviewDueAt.toISOString().slice(0, 10) : "—"}
                />
                <KV
                  k="Approved"
                  v={ibs.approvedAt ? ibs.approvedAt.toISOString().slice(0, 10) : "Not approved"}
                />
                <KV k="Created" v={ibs.createdAt.toISOString().slice(0, 10)} />
              </Card>
              {(ibs.vulnerabilitiesNotes || ibs.testingNotes) && (
                <Card title="Vulnerabilities & testing">
                  {ibs.vulnerabilitiesNotes && (
                    <Block label="Vulnerabilities" body={ibs.vulnerabilitiesNotes} />
                  )}
                  {ibs.testingNotes && (
                    <Block label="Testing notes" body={ibs.testingNotes} />
                  )}
                </Card>
              )}
            </div>
          ),
          history:
            ibs.exerciseLinks.length > 0 ? (
              <Card
                title={`Tested in ${ibs.exerciseLinks.length} exercise${ibs.exerciseLinks.length === 1 ? "" : "s"}`}
              >
                <ul className="space-y-1 text-sm sm:col-span-2">
                  {ibs.exerciseLinks.map((l) => (
                    <li key={l.exerciseId}>
                      <Link className="underline" href={`/exercises/${l.exercise.id}`}>
                        {l.exercise.title}
                      </Link>
                      {" · "}
                      <span className="text-xs text-muted">{l.exercise.status}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            ) : (
              <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
                This IBS has never been included in an exercise. Plan a scenario that
                covers it from the Scenarios library.
              </div>
            ),
        }}
      />
    </div>
  );
}

function fmtMin(n: number) {
  if (n < 60) return `${n}m`;
  if (n < 60 * 24) return `${Math.round(n / 60)}h`;
  return `${Math.round(n / 60 / 24)}d`;
}

function statusKind(s: string): "warn" | "ok" | "muted" {
  if (s === "DRAFT") return "warn";
  if (s === "APPROVED") return "ok";
  return "muted";
}

function Pill({
  kind,
  children,
}: {
  kind?: "warn" | "ok" | "muted";
  children: React.ReactNode;
}) {
  const cls =
    kind === "ok"
      ? "bg-emerald-100 text-emerald-800"
      : kind === "warn"
        ? "bg-amber-100 text-amber-800"
        : kind === "muted"
          ? "bg-surface-2 text-ink"
          : "bg-surface-2 text-ink";
  return <span className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{children}</span>;
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3 rounded-md border border-line bg-surface-1 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">{title}</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="text-sm">
      <div className="text-xs uppercase tracking-wide text-muted">{k}</div>
      <div className="mt-1 text-ink">{v}</div>
    </div>
  );
}

function Block({
  label,
  body,
  list,
}: {
  label: string;
  body?: string;
  list?: string[];
}) {
  if (!body && (!list || list.length === 0)) return null;
  return (
    <div className="sm:col-span-2">
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      {list ? (
        <ul className="mt-1 list-disc pl-5 text-sm text-ink">
          {list.map((x, i) => (
            <li key={i}>{x}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink">{body}</p>
      )}
    </div>
  );
}

function ImpactGrid({
  ibs,
}: {
  ibs: {
    impactCustomerFinancial: string | null;
    impactVulnerableCustomer: string | null;
    impactLossOfLicense: string | null;
    impactRegulatoryFine: string | null;
    impactReputational: string | null;
    impactLossOfCapital: string | null;
  };
}) {
  const items = [
    { label: "Customer financial loss", v: ibs.impactCustomerFinancial },
    { label: "Vulnerable customer", v: ibs.impactVulnerableCustomer },
    { label: "Loss of licence", v: ibs.impactLossOfLicense },
    { label: "Regulatory fine", v: ibs.impactRegulatoryFine },
    { label: "Reputational", v: ibs.impactReputational },
    { label: "Loss of capital", v: ibs.impactLossOfCapital },
  ];
  return (
    <div className="sm:col-span-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {items.map((i) => (
        <div
          key={i.label}
          className="rounded-md border border-line bg-surface-0 p-2 text-xs"
        >
          <div className="font-medium text-muted">{i.label}</div>
          <div className="mt-1">{i.v ? <Pill kind={impactKind(i.v)}>{i.v}</Pill> : "—"}</div>
        </div>
      ))}
    </div>
  );
}

function impactKind(s: string): "ok" | "warn" | "muted" {
  if (s === "HIGH" || s === "CRITICAL") return "warn";
  if (s === "MEDIUM") return "ok";
  return "muted";
}

function CoverageMatrix({
  ibs,
}: {
  ibs: {
    coversPeople: boolean;
    coversProperty: boolean;
    coversTechnology: boolean;
    coversDataAvailability: boolean;
    coversDataIntegrity: boolean;
    coversThirdParty: boolean;
  };
}) {
  const boxes = [
    { label: "People", on: ibs.coversPeople },
    { label: "Property", on: ibs.coversProperty },
    { label: "Technology", on: ibs.coversTechnology },
    { label: "Data availability", on: ibs.coversDataAvailability },
    { label: "Data integrity", on: ibs.coversDataIntegrity },
    { label: "Third party", on: ibs.coversThirdParty },
  ];
  return (
    <div className="sm:col-span-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
      {boxes.map((b) => (
        <div
          key={b.label}
          className={`rounded-md border p-2 text-center text-xs ${
            b.on
              ? "border-slate-900 bg-slate-900 text-white"
              : "border-line bg-surface-1 text-soft"
          }`}
        >
          {b.label}
        </div>
      ))}
    </div>
  );
}
