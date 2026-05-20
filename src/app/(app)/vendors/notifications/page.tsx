import Link from "next/link";
import { ArrowLeft, Download, FileSignature } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import { MTP_SUBMISSION_TYPE_LABEL } from "@/lib/mtp-taxonomy";

export const metadata = { title: "MTP notification history — SnapFix" };

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  SUBMITTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

export default async function VendorNotificationsPage() {
  const me = await requireOrgUser();

  const notifications = await prisma.vendorMtpNotification.findMany({
    where: { vendor: { orgId: me.orgId } },
    orderBy: { createdAt: "desc" },
    include: {
      vendor: { select: { id: true, name: true } },
      createdByUser: { select: { name: true, email: true } },
    },
  });

  const byStatus = {
    DRAFT: notifications.filter((n) => n.status === "DRAFT").length,
    SUBMITTED: notifications.filter((n) => n.status === "SUBMITTED").length,
    ACKNOWLEDGED: notifications.filter((n) => n.status === "ACKNOWLEDGED").length,
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Annex 3"
        icon={FileSignature}
        title="Notification history"
        pitch="All MTP notifications · drafts → acknowledged"
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
        <Tile label="Total filed" value={String(notifications.length)} />
        <Tile label="Drafts" value={String(byStatus.DRAFT)} tone={byStatus.DRAFT > 0 ? "warn" : "neutral"} sub="not yet filed" />
        <Tile label="Submitted" value={String(byStatus.SUBMITTED)} sub="awaiting ack" />
        <Tile label="Acknowledged" value={String(byStatus.ACKNOWLEDGED)} tone="ok" sub="closed" />
      </section>

      <section className="rounded-xl border border-line bg-surface-1">
        {notifications.length === 0 ? (
          <p className="p-5 text-sm text-muted">
            No notifications filed yet. Open a Material Third Party vendor and click &ldquo;File a
            notification&rdquo;.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-2 text-xs uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Vendor</th>
                <th className="px-3 py-2 text-left">Type</th>
                <th className="px-3 py-2 text-left">Reporting</th>
                <th className="px-3 py-2 text-left">Status</th>
                <th className="px-3 py-2 text-left">By</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {notifications.map((n) => (
                <tr key={n.id}>
                  <td className="px-3 py-2">
                    <Link
                      href={`/vendors/${n.vendor.id}`}
                      className="font-medium text-indigo-600 hover:underline dark:text-indigo-300"
                    >
                      {n.vendor.name}
                    </Link>
                    <div className="text-[10px] text-soft">#{n.submissionId}</div>
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {MTP_SUBMISSION_TYPE_LABEL[n.submissionType] ?? n.submissionType}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {n.reportingDate.toISOString().slice(0, 10)}
                  </td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${STATUS_TONE[n.status]}`}
                    >
                      {n.status}
                    </span>
                    {n.ackReference && (
                      <div className="mt-0.5 text-[10px] text-soft">Ref: {n.ackReference}</div>
                    )}
                  </td>
                  <td className="px-3 py-2 text-xs text-muted">
                    {n.createdByUser?.name ?? n.createdByUser?.email ?? "—"}
                    <div className="text-[10px] text-soft">
                      {n.createdAt.toISOString().slice(0, 10)}
                    </div>
                  </td>
                  <td className="px-3 py-2 text-right">
                    {n.xlsxBlobUrl && (
                      <a
                        href={n.xlsxBlobUrl}
                        className="inline-flex items-center gap-1 rounded-md border border-line bg-surface-0 px-2 py-1 text-[11px] font-medium text-ink hover:border-line-strong"
                      >
                        <Download size={11} />
                        XLSX
                      </a>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
