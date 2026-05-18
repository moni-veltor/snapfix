import Link from "next/link";
import { ArrowLeft, CheckCircle2, Download, FileSpreadsheet, ShieldCheck } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import { evaluateVendorReadiness } from "@/lib/vendor-mtp-readiness";
import { generateAnnualRegisterAction } from "@/app/actions/vendor-register";

export const metadata = { title: "MTP register — SnapFix" };

export default async function VendorRegisterPage() {
  const me = await requireOrgUser();
  const canGenerate = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const [vendors, snapshots] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId: me.orgId, isMaterialThirdParty: true },
      orderBy: { name: "asc" },
      include: { assessments: { orderBy: { assessedAt: "desc" } } },
    }),
    prisma.vendorRegisterSnapshot.findMany({
      where: { orgId: me.orgId },
      orderBy: { reportingDate: "desc" },
      take: 10,
      include: { createdByUser: { select: { name: true, email: true } } },
    }),
  ]);

  const rows = vendors.map((v) => {
    const r = evaluateVendorReadiness(v);
    return {
      id: v.id,
      name: v.name,
      legalName: v.legalName ?? v.name,
      contractRef: v.contractRef,
      serviceType: v.serviceTypeTaxonomy,
      annualValue: v.contractAnnualValueGBP,
      country: v.countryServiceDeliveredFrom,
      passed: r.passed,
      total: r.total,
      ready: r.isRegisterReady,
    };
  });
  const readyCount = rows.filter((r) => r.ready).length;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="PS26/2 Annex 3"
        icon={ShieldCheck}
        title="Material Third Party register"
        pitch="Annual MTP register submission. Each vendor flagged Material Third Party feeds this snapshot. Generate at the reporting date and the XLSX matches the official PS26/2 Annex 3 template."
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

      {/* ─── Coverage summary ─────────────────────────────────────────── */}
      <section className="grid gap-3 sm:grid-cols-4">
        <Tile label="Material Third Parties" value={String(vendors.length)} />
        <Tile
          label="Register-ready"
          value={`${readyCount}/${vendors.length}`}
          tone={readyCount === vendors.length ? "ok" : readyCount >= vendors.length / 2 ? "warn" : "critical"}
          sub={vendors.length === 0 ? "no MTPs yet" : `${Math.round((readyCount / vendors.length) * 100)}%`}
        />
        <Tile
          label="Snapshots filed"
          value={String(snapshots.length)}
          sub={snapshots[0]?.reportingDate.toISOString().slice(0, 10) ?? "—"}
        />
        <Tile
          label="Next reporting date"
          value={today}
          sub="default — change before generating"
        />
      </section>

      {/* ─── Generate ─────────────────────────────────────────────────── */}
      {canGenerate && (
        <section className="rounded-xl border border-line bg-surface-1 p-5">
          <h2 className="flex items-center gap-1.5 text-sm font-semibold text-ink">
            <FileSpreadsheet size={14} className="text-indigo-600 dark:text-indigo-300" />
            Generate annual register XLSX
          </h2>
          <p className="mt-1 text-[11px] text-soft">
            Takes a snapshot of every Material Third Party at the chosen reporting date.
            The XLSX matches the PS26/2 Annex 3 Formatted-data column layout so the regulator&apos;s
            loader accepts it. Past snapshots are immutable.
          </p>
          <form action={generateAnnualRegisterAction} className="mt-3 flex flex-wrap items-end gap-2">
            <label className="text-[11px]">
              <span className="text-muted">Reporting date (§1.01)</span>
              <input
                type="date"
                name="reportingDate"
                defaultValue={today}
                className="mt-1 block rounded-md border border-line-strong bg-surface-1 px-2 py-1.5 text-sm"
              />
            </label>
            <button
              disabled={vendors.length === 0}
              className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-indigo-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none disabled:hover:translate-y-0"
            >
              <FileSpreadsheet size={13} />
              Generate snapshot
            </button>
            {vendors.length === 0 && (
              <p className="w-full text-[11px] text-rose-700 dark:text-rose-300">
                Mark at least one vendor as Material Third Party first.
              </p>
            )}
          </form>
        </section>
      )}

      {/* ─── MTP roll-call ────────────────────────────────────────────── */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Material Third Parties ({vendors.length})</h2>
        {rows.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 p-4 text-sm text-muted">
            No vendors flagged as Material Third Party.{" "}
            <Link href="/vendors" className="font-medium text-indigo-600 underline">
              Open a vendor
            </Link>{" "}
            to flip the switch.
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
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2">
                      <div className="font-medium text-ink">{r.name}</div>
                      <div className="text-[10px] text-soft">{r.legalName}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.contractRef ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted">{r.serviceType ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted">{r.country ?? "—"}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">
                      {r.annualValue ? `£${r.annualValue.toLocaleString()}` : "—"}
                    </td>
                    <td className="px-3 py-2 text-right">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-semibold ${
                          r.ready
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                        }`}
                      >
                        {r.ready ? <CheckCircle2 size={9} /> : null}
                        {r.passed}/{r.total}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right">
                      <Link
                        href={`/vendors/${r.id}`}
                        className="text-[11px] text-indigo-600 hover:underline dark:text-indigo-300"
                      >
                        Open →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* ─── Past snapshots ──────────────────────────────────────────── */}
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
                    Generated{" "}
                    {s.createdAt.toISOString().slice(0, 16).replace("T", " ")} by{" "}
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
