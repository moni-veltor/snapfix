import Link from "next/link";
import { ArrowLeft, Download, FileSignature } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import Pagination from "@/components/ui/Pagination";
import ListUrlControls from "@/components/ui/ListUrlControls";
import { MTP_SUBMISSION_TYPE_LABEL } from "@/lib/mtp-taxonomy";

export const metadata = { title: "MTP notification history — SnapFix" };

const PAGE_SIZE = 25;

const STATUS_TONE: Record<string, string> = {
  DRAFT: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  SUBMITTED: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
  ACKNOWLEDGED: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200",
};

type Status = "all" | "DRAFT" | "SUBMITTED" | "ACKNOWLEDGED";

export default async function VendorNotificationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const me = await requireOrgUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const rawStatus = (params.status ?? "all") as Status;
  const status: Status = (["all", "DRAFT", "SUBMITTED", "ACKNOWLEDGED"] as const).includes(
    rawStatus,
  )
    ? rawStatus
    : "all";
  const page = Math.max(1, Number.parseInt(params.page ?? "1", 10) || 1);

  const where = {
    vendor: { orgId: me.orgId },
    ...(status !== "all" ? { status } : {}),
    ...(q
      ? {
          OR: [
            { vendor: { name: { contains: q, mode: "insensitive" as const } } },
            { ackReference: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  // Totals (across all filters cleared) for the tile + chip badges.
  const [totalAll, totalDraft, totalSubmitted, totalAck, totalMatched, notifications] =
    await Promise.all([
      prisma.vendorMtpNotification.count({ where: { vendor: { orgId: me.orgId } } }),
      prisma.vendorMtpNotification.count({
        where: { vendor: { orgId: me.orgId }, status: "DRAFT" },
      }),
      prisma.vendorMtpNotification.count({
        where: { vendor: { orgId: me.orgId }, status: "SUBMITTED" },
      }),
      prisma.vendorMtpNotification.count({
        where: { vendor: { orgId: me.orgId }, status: "ACKNOWLEDGED" },
      }),
      prisma.vendorMtpNotification.count({ where }),
      prisma.vendorMtpNotification.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE,
        include: {
          vendor: { select: { id: true, name: true } },
          createdByUser: { select: { name: true, email: true } },
        },
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(totalMatched / PAGE_SIZE));

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
        <Tile label="Total filed" value={String(totalAll)} />
        <Tile
          label="Drafts"
          value={String(totalDraft)}
          tone={totalDraft > 0 ? "warn" : "neutral"}
          sub="not yet filed"
        />
        <Tile label="Submitted" value={String(totalSubmitted)} sub="awaiting ack" />
        <Tile label="Acknowledged" value={String(totalAck)} tone="ok" sub="closed" />
      </section>

      <section className="space-y-2">
        <ListUrlControls
          searchPlaceholder="Search by vendor name or ack reference…"
          filters={[
            {
              key: "status",
              label: "Status",
              defaultValue: "all",
              options: [
                { value: "all", label: "All", count: totalAll },
                { value: "DRAFT", label: "Drafts", count: totalDraft, tone: "bg-amber-600 text-white" },
                {
                  value: "SUBMITTED",
                  label: "Submitted",
                  count: totalSubmitted,
                  tone: "bg-cyan-600 text-white",
                },
                {
                  value: "ACKNOWLEDGED",
                  label: "Acknowledged",
                  count: totalAck,
                  tone: "bg-emerald-600 text-white",
                },
              ],
            },
          ]}
        />

        <div className="overflow-hidden rounded-xl border border-line bg-surface-1">
          {notifications.length === 0 ? (
            <p className="p-5 text-sm text-muted">
              No notifications match this view. Open a Material Third Party vendor and click
              &ldquo;File a notification&rdquo;.
            </p>
          ) : (
            <>
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
              <Pagination
                basePath="/vendors/notifications"
                currentPage={page}
                totalPages={totalPages}
                total={totalMatched}
                pageSize={PAGE_SIZE}
                itemLabel="notifications"
                otherParams={{
                  q: q || undefined,
                  status: status !== "all" ? status : undefined,
                }}
              />
            </>
          )}
        </div>
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
