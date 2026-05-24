import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import Pagination from "@/components/ui/Pagination";
import ListUrlControls from "@/components/ui/ListUrlControls";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import { generateAnnualRegisterAction } from "@/app/actions/vendor-register";

export const metadata = { title: "MTP register — SnapFix" };

const PAGE_SIZE = 25;

type Filter = "all" | "ready" | "notready";

export default async function VendorRegisterPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const me = await requireOrgUser();
  const canGenerate = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const statusParam = (params.status ?? "all") as Filter;
  const status: Filter = ["all", "ready", "notready"].includes(statusParam)
    ? statusParam
    : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  // Snapshots are independent of the MTP filter set.
  const snapshots = await prisma.vendorRegisterSnapshot.findMany({
    where: { orgId: me.orgId },
    orderBy: { reportingDate: "desc" },
    take: 10,
    include: { createdByUser: { select: { name: true, email: true } } },
  });

  // Load every MTP first so we can compute the readiness-driven filter +
  // accurate counts (the ready/not-ready split lives in code, not in the
  // database). 100s of vendors is fine; the assessments include is
  // already what evaluateVendorReadiness needs.
  const allMtp = await prisma.vendor.findMany({
    where: {
      orgId: me.orgId,
      isMaterialThirdParty: true,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" } },
              { legalName: { contains: q, mode: "insensitive" } },
              { contractRef: { contains: q, mode: "insensitive" } },
            ],
          }
        : {}),
    },
    orderBy: { name: "asc" },
    include: { assessments: { orderBy: { assessedAt: "desc" } } },
  });

  const withReadiness = allMtp.map((v) => {
    const r = evaluateVendorReadiness(v);
    return { v, r };
  });

  const matchedAll = withReadiness.filter(({ r }) => {
    if (status === "ready") return r.isRegisterReady;
    if (status === "notready") return !r.isRegisterReady;
    return true;
  });
  const matched = matchedAll.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalMatched = matchedAll.length;
  const totalPages = Math.max(1, Math.ceil(totalMatched / PAGE_SIZE));

  // For tile counts we want totals across the whole MTP set, not the
  // current page or search.
  const totalMtp = await prisma.vendor.count({
    where: { orgId: me.orgId, isMaterialThirdParty: true },
  });
  const readyCount = withReadiness.filter(({ r }) => r.isRegisterReady).length;
  const notReadyCount = withReadiness.length - readyCount;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Annex 3"
        icon={ShieldCheck}
        title="Material Third Party register"
        pitch="Annual MTP snapshot · official XLSX"
        actions={
          <Link
            href="/vendors"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            <ArrowLeft size={14} />
            Back to vendors
          </Link>
        }
      />

      <section className="grid gap-3 sm:grid-cols-4">
        <Tile label="Material Third Parties" value={String(totalMtp)} />
        <Tile
          label="Register-ready"
          value={`${readyCount}/${totalMtp}`}
          tone={readyCount === totalMtp && totalMtp > 0 ? "ok" : readyCount >= totalMtp / 2 ? "warn" : "critical"}
          sub={totalMtp === 0 ? "no MTPs yet" : `${Math.round((readyCount / totalMtp) * 100)}%`}
        />
        <Tile
          label="Snapshots filed"
          value={String(snapshots.length)}
          sub={snapshots[0]?.reportingDate.toISOString().slice(0, 10) ?? "—"}
        />
        <Tile label="Next reporting date" value={today} sub="default — change before generating" />
      </section>

      {canGenerate && (
        <section className="rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <FileSpreadsheet size={14} className="text-indigo-600 dark:text-indigo-300" />
            Generate annual register XLSX
          </h2>
          <p className="mt-1 text-[11px] text-soft">
            Takes a snapshot of every Material Third Party at the chosen reporting date.
            The XLSX matches the Annex 3 Formatted-data column layout so the regulator&apos;s
            loader accepts it. Past snapshots are immutable.
          </p>
          <form action={generateAnnualRegisterAction} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-[11px]">
              <span className="text-muted">Reporting date</span>
              <input
                type="date"
                name="reportingDate"
                defaultValue={today}
                className="mt-1 block rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              disabled={totalMtp === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none disabled:hover:translate-y-0"
            >
              <FileSpreadsheet size={13} />
              Generate snapshot
            </button>
            {totalMtp === 0 && (
              <p className="w-full text-[11px] text-rose-700 dark:text-rose-300">
                Mark at least one vendor as Material Third Party first.
              </p>
            )}
          </form>
        </section>
      )}

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Material Third Parties</h2>
        <ListUrlControls
          searchPlaceholder="Search by name, legal name, contract ref…"
          filters={[
            {
              key: "status",
              label: "Readiness",
              defaultValue: "all",
              options: [
                { value: "all", label: "All", count: totalMtp },
                {
                  value: "ready",
                  label: "Ready",
                  count: readyCount,
                  tone: "bg-emerald-600 text-white",
                },
                {
                  value: "notready",
                  label: "Not ready",
                  count: notReadyCount,
                  tone: "bg-amber-600 text-white",
                },
              ],
            },
          ]}
        />

        {matched.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 p-4 text-sm text-muted">
            No vendors match this view.
            {totalMtp === 0 && (
              <>
                {" "}
                <Link href="/vendors" className="font-medium text-indigo-600 underline">
                  Open a vendor
                </Link>{" "}
                to flip the MTP switch.
              </>
            )}
          </p>
        ) : (
          <div className="overflow-hidden rounded-xl border border-line">
            <table className="w-full text-sm">
              <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
                <tr>
                  <th className="px-3 py-2 text-left">Vendor</th>
                  <th className="px-3 py-2 text-left">Contract ref</th>
                  <th className="px-3 py-2 text-left">Service type</th>
                  <th className="px-3 py-2 text-left">Country</th>
                  <th className="px-3 py-2 text-right">Annual £</th>
                  <th className="px-3 py-2 text-right">Readiness</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line bg-surface-1">
                {matched.map(({ v, r }) => (
                  <tr key={v.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">{v.name}</div>
                      <div className="text-[10px] text-soft">{v.legalName ?? v.name}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{v.contractRef ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted">{v.serviceTypeTaxonomy ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted">{v.countryServiceDeliveredFrom ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {v.contractAnnualValueGBP
                        ? `£${v.contractAnnualValueGBP.toLocaleString()}`
                        : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.isRegisterReady
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        }`}
                      >
                        {r.isRegisterReady ? <CheckCircle2 size={9} /> : null}
                        {r.passed}/{r.total}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/vendors/${v.id}`}
                        className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Pagination
              basePath="/vendors/register"
              currentPage={page}
              totalPages={totalPages}
              total={totalMatched}
              pageSize={PAGE_SIZE}
              itemLabel="vendors"
              otherParams={{
                q: q || undefined,
                status: status !== "all" ? status : undefined,
              }}
            />
          </div>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Past snapshots</h2>
        {snapshots.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 p-4 text-sm text-muted">
            No snapshots filed yet. Generate the first one above.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {snapshots.map((s) => (
              <li
                key={s.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm"
              >
                <div>
                  <p className="font-medium text-ink">
                    {s.reportingDate.toISOString().slice(0, 10)} · submission #{s.submissionId}
                  </p>
                  <p className="text-[10px] text-soft">
                    Generated {s.createdAt.toISOString().slice(0, 16).replace("T", " ")} by{" "}
                    {s.createdByUser?.name ?? s.createdByUser?.email ?? "—"}
                  </p>
                </div>
                {s.xlsxBlobUrl ? (
                  <a
                    href={s.xlsxBlobUrl}
                    className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] font-medium text-ink hover:border-line-strong hover:bg-surface-2"
                  >
                    <Download size={11} />
                    Download
                  </a>
                ) : (
                  <span className="text-[10px] text-soft">No file</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Tile({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "neutral" | "ok" | "warn" | "critical";
}) {
  const valueColor =
    tone === "ok"
      ? "text-emerald-700 dark:text-emerald-300"
      : tone === "warn"
        ? "text-amber-700 dark:text-amber-300"
        : tone === "critical"
          ? "text-rose-600 dark:text-rose-300"
          : "text-ink";
  return (
    <div className="rounded-xl border border-line bg-surface-1 p-3">
      <div className="text-[10px] font-semibold uppercase tracking-wider text-muted">{label}</div>
      <div className={`mt-1 font-display text-2xl font-semibold ${valueColor}`}>{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
