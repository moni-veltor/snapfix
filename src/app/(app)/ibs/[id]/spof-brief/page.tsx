import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Printer, ShieldAlert } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "SPOF brief — SnapFix" };

const CRIT_RANK: Record<string, number> = { CRITICAL: 3, IMPORTANT: 2, SUPPORTING: 1 };

export default async function SpofBriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const ibs = await prisma.organizationIBS.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      resources: {
        include: {
          vendor: { select: { name: true } },
          techSystem: { select: { name: true } },
          department: { select: { name: true } },
        },
      },
    },
  });
  if (!ibs) notFound();

  const peerResources = await prisma.iBSResource.findMany({
    where: { ibs: { orgId: me.orgId, id: { not: ibs.id } } },
    select: {
      label: true,
      ibs: { select: { id: true, code: true, name: true } },
    },
  });
  const sharedBy = new Map<string, { id: string; code: string; name: string }[]>();
  for (const pr of peerResources) {
    const key = pr.label.toLowerCase();
    const arr = sharedBy.get(key) ?? [];
    if (!arr.some((x) => x.id === pr.ibs.id)) arr.push(pr.ibs);
    sharedBy.set(key, arr);
  }

  // Aggregate per-label SPOF rows
  const byLabel = new Map<
    string,
    { label: string; criticality: string; peers: { id: string; code: string; name: string }[]; kinds: Set<string> }
  >();
  for (const r of ibs.resources) {
    const peers = sharedBy.get(r.label.toLowerCase()) ?? [];
    if (peers.length === 0) continue;
    const existing = byLabel.get(r.label.toLowerCase());
    if (existing) {
      if (CRIT_RANK[r.criticality] > CRIT_RANK[existing.criticality]) existing.criticality = r.criticality;
      existing.kinds.add(r.kind);
    } else {
      byLabel.set(r.label.toLowerCase(), {
        label: r.label,
        criticality: r.criticality,
        peers,
        kinds: new Set([r.kind]),
      });
    }
  }
  const rows = Array.from(byLabel.values()).sort((a, b) => {
    const c = CRIT_RANK[b.criticality] - CRIT_RANK[a.criticality];
    return c !== 0 ? c : b.peers.length - a.peers.length;
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-2 py-6 print:px-0 print:py-0">
      {/* Print toolbar — hidden when printing */}
      <div className="flex items-center justify-between rounded-md border border-line bg-surface-1 p-3 print:hidden">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
            SPOF brief
          </p>
          <p className="text-sm text-muted">
            Single-point-of-failure analysis for {ibs.code}. Use Print → Save as PDF to export.
          </p>
        </div>
        <Link
          href={`/ibs/${ibs.id}`}
          className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-1.5 text-xs font-medium text-ink hover:border-line-strong"
        >
          <ArrowLeft size={11} />
          Back to IBS
        </Link>
      </div>

      <header className="space-y-2 border-b border-line pb-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-indigo-700 dark:text-indigo-300">
          <ShieldAlert size={11} className="mr-1 inline" />
          Concentration / SPOF brief
        </p>
        <h1 className="font-display text-2xl font-semibold text-ink">
          <span className="font-mono text-muted">{ibs.code}</span> · {ibs.name}
        </h1>
        <p className="text-sm text-muted">
          Dependencies shared with other Important Business Services in this org. If any of these
          fail, the blast radius is multi-IBS. Reviewed at every annual self-attestation.
        </p>
      </header>

      {rows.length === 0 ? (
        <section className="rounded-md border border-emerald-300 bg-emerald-50 p-5 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          No shared dependencies detected. This IBS&apos;s resource map is currently unique within the
          org register. (This may change as other IBSs are mapped — re-run this brief annually.)
        </section>
      ) : (
        <section className="space-y-3">
          <p className="text-sm text-ink">
            <strong>{rows.length}</strong> shared dependenc{rows.length === 1 ? "y" : "ies"}{" "}
            identified across the resource map. Rows are ordered by criticality, then blast radius
            (number of IBSs affected).
          </p>
          <table className="w-full text-xs">
            <thead className="bg-surface-2 text-[10px] uppercase tracking-wider text-muted">
              <tr>
                <th className="px-3 py-2 text-left">Dependency</th>
                <th className="px-3 py-2 text-left">Criticality</th>
                <th className="px-3 py-2 text-left">Kinds</th>
                <th className="px-3 py-2 text-left">Blast radius (IBSs affected)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.label} className="page-break-inside-avoid">
                  <td className="px-3 py-2 font-medium text-ink">{r.label}</td>
                  <td className="px-3 py-2">
                    <span
                      className={`rounded-full px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                        r.criticality === "CRITICAL"
                          ? "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-200"
                          : r.criticality === "IMPORTANT"
                            ? "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200"
                            : "bg-surface-2 text-muted"
                      }`}
                    >
                      {r.criticality}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-muted">{Array.from(r.kinds).join(", ").replace(/_/g, " ").toLowerCase()}</td>
                  <td className="px-3 py-2">
                    <strong>{r.peers.length + 1}</strong> IBS{r.peers.length === 0 ? "" : "s"} —{" "}
                    <span className="text-muted">{ibs.code}</span>
                    {r.peers.length > 0 && (
                      <span>
                        ,{" "}
                        {r.peers
                          .map((p) => p.code)
                          .join(", ")}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <footer className="border-t border-line pt-4 text-[10px] text-soft">
        <p className="flex items-center gap-1.5">
          <Printer size={10} />
          Generated by SnapFix for {me.email} · {new Date().toISOString().slice(0, 10)}
        </p>
        <p className="mt-1 print:hidden">
          Use your browser&apos;s Print to save this brief as a PDF for the CRO / Board pack.
        </p>
      </footer>
    </div>
  );
}
