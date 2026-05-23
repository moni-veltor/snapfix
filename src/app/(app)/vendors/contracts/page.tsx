import Link from "next/link";
import { ArrowLeft, CalendarClock, Clock, ExternalLink } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import ListUrlControls from "@/components/ui/ListUrlControls";

export const metadata = { title: "Vendor contracts — SnapFix" };

const TIER_TONE: Record<string, string> = {
  TIER_1: "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200",
  TIER_2: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
  TIER_3: "bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-200",
};

type Bucket = {
  id: string;
  label: string;
  description: string;
  /** Days from today, inclusive lower bound. */
  fromDay: number;
  /** Days from today, exclusive upper bound. null = open-ended. */
  toDay: number | null;
  tone: "critical" | "warn" | "info" | "ok";
};

const BUCKETS: Bucket[] = [
  {
    id: "expired",
    label: "Expired or expiring this week",
    description: "Past end-date or within the next 7 days. Action now.",
    fromDay: -36500,
    toDay: 8,
    tone: "critical",
  },
  {
    id: "30d",
    label: "Renewal in 30 days",
    description: "Day 8 to day 30. Typical notice-period window for most vendor contracts.",
    fromDay: 8,
    toDay: 31,
    tone: "warn",
  },
  {
    id: "90d",
    label: "Renewal in 90 days",
    description: "Day 31 to day 90. Begin renewal negotiation or exit-plan walk-through.",
    fromDay: 31,
    toDay: 91,
    tone: "info",
  },
  {
    id: "later",
    label: "Renewal later than 90 days",
    description: "More than 90 days out. No immediate action.",
    fromDay: 91,
    toDay: null,
    tone: "ok",
  },
];

export default async function VendorContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tier?: string }>;
}) {
  const me = await requireOrgUser();
  const params = await searchParams;
  const q = (params.q ?? "").trim().toLowerCase();
  const rawTier = (params.tier ?? "all") as "all" | "TIER_1" | "TIER_2" | "TIER_3";
  const tier: typeof rawTier = (["all", "TIER_1", "TIER_2", "TIER_3"] as const).includes(rawTier)
    ? rawTier
    : "all";

  const vendors = await prisma.vendor.findMany({
    where: {
      orgId: me.orgId,
      contractEndAt: { not: null },
      ...(tier !== "all" ? { tier } : {}),
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { serviceKind: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    },
    orderBy: { contractEndAt: "asc" },
    select: {
      id: true,
      name: true,
      serviceKind: true,
      tier: true,
      isDoraCritical: true,
      contractEndAt: true,
      contractRenewalNoticeDays: true,
      contractAnnualValueGBP: true,
      assuranceKind: true,
      assuranceExpiryAt: true,
    },
  });

  // Tile / chip totals are computed across the whole register, not the
  // filtered view, so the chip badges keep their meaning.
  const tierTotals = await prisma.vendor.groupBy({
    by: ["tier"],
    where: { orgId: me.orgId, contractEndAt: { not: null } },
    _count: { _all: true },
  });
  const tierCount = (k: string) =>
    tierTotals.find((t) => t.tier === k)?._count._all ?? 0;
  const totalCount = tierTotals.reduce((acc, t) => acc + t._count._all, 0);

  // Server component — Date.now() is stable per request. Lint rule is
  // conservative; this is the canonical "now" for the rendered page.
  // eslint-disable-next-line react-hooks/purity
  const now = Date.now();

  function daysUntil(d: Date): number {
    return Math.floor((d.getTime() - now) / 86_400_000);
  }

  const bucketed = BUCKETS.map((b) => ({
    bucket: b,
    rows: vendors.filter((v) => {
      const days = daysUntil(v.contractEndAt!);
      if (days < b.fromDay) return false;
      if (b.toDay !== null && days >= b.toDay) return false;
      return true;
    }),
  }));

  const totalAnnualValue = vendors.reduce(
    (acc, v) => acc + (v.contractAnnualValueGBP ?? 0),
    0,
  );

  return (
    <div className="space-y-6">
      <Link
        href="/vendors"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to vendors
      </Link>

      <PageHero
        eyebrow="Renewals"
        icon={CalendarClock}
        title="Vendor contract calendar"
        pitch={`${vendors.length} on a schedule · £${(totalAnnualValue / 1000).toLocaleString("en-GB", { maximumFractionDigits: 0 })}k combined`}
      />

      <ListUrlControls
        searchPlaceholder="Search by vendor or service…"
        filters={[
          {
            key: "tier",
            label: "Tier",
            defaultValue: "all",
            options: [
              { value: "all", label: "All tiers", count: totalCount },
              {
                value: "TIER_1",
                label: "Tier 1",
                count: tierCount("TIER_1"),
                tone: "bg-rose-600 text-white",
              },
              {
                value: "TIER_2",
                label: "Tier 2",
                count: tierCount("TIER_2"),
                tone: "bg-amber-600 text-white",
              },
              {
                value: "TIER_3",
                label: "Tier 3",
                count: tierCount("TIER_3"),
                tone: "bg-cyan-600 text-white",
              },
            ],
          },
        ]}
      />

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface-1 p-10 text-center text-sm text-muted">
          No vendors have a recorded contract end-date yet. Add dates via the vendor wizard
          to populate the renewal calendar.
        </div>
      ) : (
        <div className="space-y-6">
          {bucketed.map(({ bucket, rows }) => (
            <section key={bucket.id} className="space-y-2">
              <header className="flex items-baseline justify-between gap-2">
                <div>
                  <h2 className="flex items-center gap-2 text-sm font-semibold text-ink">
                    <BucketDot tone={bucket.tone} />
                    {bucket.label}
                    <span className="text-xs font-normal text-soft">
                      {rows.length} vendor{rows.length === 1 ? "" : "s"}
                    </span>
                  </h2>
                  <p className="mt-0.5 text-[11px] text-soft">{bucket.description}</p>
                </div>
              </header>

              {rows.length === 0 ? (
                <p className="rounded-md border border-dashed border-line bg-surface-1 px-3 py-2 text-xs text-soft">
                  Nothing in this window.
                </p>
              ) : (
                <ul className="space-y-1.5">
                  {rows.map((v) => {
                    const days = daysUntil(v.contractEndAt!);
                    const noticeBy =
                      v.contractRenewalNoticeDays != null && v.contractEndAt
                        ? new Date(
                            v.contractEndAt.getTime() -
                              v.contractRenewalNoticeDays * 86_400_000,
                          )
                        : null;
                    return (
                      <li key={v.id}>
                        <Link
                          href={`/vendors/${v.id}`}
                          className="flex flex-wrap items-center gap-3 rounded-md border border-line bg-surface-1 p-3 text-sm transition-all hover:-translate-y-px hover:border-line-strong hover:bg-surface-2"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="truncate font-medium text-ink">{v.name}</span>
                              <span
                                className={`rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${TIER_TONE[v.tier] ?? "bg-surface-2 text-muted"}`}
                              >
                                {v.tier.replace("TIER_", "T")}
                              </span>
                              {v.isDoraCritical && (
                                <span className="rounded-full bg-rose-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                                  DORA
                                </span>
                              )}
                              {v.serviceKind && (
                                <span className="text-[11px] text-muted">· {v.serviceKind}</span>
                              )}
                            </div>
                            <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-soft">
                              <span>
                                <Clock size={9} className="mr-0.5 inline" />
                                Ends{" "}
                                <span className="text-muted">
                                  {v.contractEndAt!.toISOString().slice(0, 10)}
                                </span>{" "}
                                · {days < 0 ? `${Math.abs(days)}d ago` : `${days}d away`}
                              </span>
                              {noticeBy && (
                                <span>
                                  Notice by{" "}
                                  <span className="text-muted">
                                    {noticeBy.toISOString().slice(0, 10)}
                                  </span>
                                </span>
                              )}
                              {v.contractAnnualValueGBP != null && (
                                <span>
                                  £{v.contractAnnualValueGBP.toLocaleString("en-GB")}/yr
                                </span>
                              )}
                            </div>
                          </div>
                          <ExternalLink size={11} className="shrink-0 text-soft" />
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function BucketDot({ tone }: { tone: Bucket["tone"] }) {
  const cls =
    tone === "critical"
      ? "bg-rose-500"
      : tone === "warn"
        ? "bg-amber-500"
        : tone === "info"
          ? "bg-cyan-500"
          : "bg-emerald-500";
  return <span className={`inline-block h-2 w-2 rounded-full ${cls}`} />;
}
