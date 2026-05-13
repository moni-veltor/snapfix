import Link from "next/link";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  upsertVendorAction,
  deleteVendorAction,
  linkVendorToIBSAction,
  unlinkVendorFromIBSAction,
} from "@/app/actions/vendors";
import ConfirmButton from "@/components/ConfirmButton";

export default async function VendorsPage() {
  const me = await requireOrgUser();
  const [vendors, ibsList] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: {
        ibsLinks: { include: { ibs: { select: { id: true, code: true, name: true } } } },
      },
    }),
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Critical third parties</h1>
        <p className="mt-1 text-sm text-slate-500">
          Vendors that support your IBSs (Afin BCPlans §6.3.6). Link each to the services it
          underpins so a vendor outage instantly surfaces the affected IBSs.
        </p>
      </header>

      <ul className="space-y-3">
        {vendors.length === 0 && (
          <li className="rounded-md border border-dashed border-slate-300 bg-white p-6 text-center text-sm text-slate-500">
            No vendors yet. {canManage ? "Add one below — start with your Tier 1 core providers." : "Ask an admin to add the firm's critical third parties."}
          </li>
        )}
        {vendors.map((v) => (
          <li key={v.id} className="rounded-md border border-slate-200 bg-white p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{v.name}</h2>
                  <TierPill tier={v.tier} />
                  {v.serviceKind && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-700">
                      {v.serviceKind}
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="mt-1 text-sm text-slate-600">{v.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                  {v.contactName && <span>👤 {v.contactName}</span>}
                  {v.contactEmail && <span>✉️ {v.contactEmail}</span>}
                  {v.contactPhone && <span>📞 {v.contactPhone}</span>}
                  {v.statusUrl && (
                    <a href={v.statusUrl} target="_blank" rel="noopener" className="underline">
                      🔍 status page
                    </a>
                  )}
                </div>
                <div className="mt-2">
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
                    Supports IBSs
                  </p>
                  {v.ibsLinks.length === 0 ? (
                    <p className="text-xs text-slate-400">No IBS links yet.</p>
                  ) : (
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {v.ibsLinks.map((l) => (
                        <li
                          key={l.ibsId}
                          className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-xs"
                        >
                          <span className="font-mono">{l.ibs.code}</span>
                          <span className="text-slate-600">{l.ibs.name}</span>
                          {canManage && (
                            <form action={unlinkVendorFromIBSAction} className="inline">
                              <input type="hidden" name="vendorId" value={v.id} />
                              <input type="hidden" name="ibsId" value={l.ibsId} />
                              <button className="ml-1 text-slate-400 hover:text-rose-600">×</button>
                            </form>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                  {canManage && ibsList.length > 0 && (
                    <form action={linkVendorToIBSAction} className="mt-1 flex items-center gap-1">
                      <input type="hidden" name="vendorId" value={v.id} />
                      <select
                        name="ibsId"
                        defaultValue=""
                        className="rounded border border-slate-300 px-2 py-0.5 text-xs"
                      >
                        <option value="" disabled>+ link IBS…</option>
                        {ibsList
                          .filter((i) => !v.ibsLinks.some((l) => l.ibsId === i.id))
                          .map((i) => (
                            <option key={i.id} value={i.id}>
                              {i.code} — {i.name}
                            </option>
                          ))}
                      </select>
                      <button className="rounded border border-slate-300 px-2 py-0.5 text-[11px]">
                        Link
                      </button>
                    </form>
                  )}
                </div>
              </div>
              {canManage && (
                <div className="flex flex-col gap-2">
                  <Link
                    href={`/vendors?edit=${v.id}`}
                    className="text-xs text-slate-600 hover:underline"
                  >
                    Edit
                  </Link>
                  <ConfirmButton
                    action={deleteVendorAction}
                    hidden={{ id: v.id }}
                    label="Delete"
                    title={`Delete ${v.name}?`}
                    body="This will remove the vendor and all its IBS links."
                    confirmLabel="Delete"
                    successMessage="Vendor deleted"
                  />
                </div>
              )}
            </div>
          </li>
        ))}
      </ul>

      {canManage && <VendorForm />}
    </div>
  );
}

function TierPill({ tier }: { tier: string }) {
  const cls = TIER_CLASS[tier] ?? "bg-slate-100 text-slate-700";
  return (
    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${cls}`}>
      {TIER_LABEL[tier] ?? tier}
    </span>
  );
}

const TIER_LABEL: Record<string, string> = {
  TIER_1: "Tier 1 · mission-critical",
  TIER_2: "Tier 2 · business-critical",
  TIER_3: "Tier 3 · operational",
};
const TIER_CLASS: Record<string, string> = {
  TIER_1: "bg-rose-100 text-rose-800",
  TIER_2: "bg-amber-100 text-amber-800",
  TIER_3: "bg-slate-100 text-slate-700",
};

function VendorForm() {
  return (
    <details className="rounded-md border border-slate-200 bg-white p-4">
      <summary className="cursor-pointer text-sm font-semibold">Add a vendor</summary>
      <form
        action={upsertVendorAction}
        className="mt-3 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2"
      >
        <input
          name="name"
          required
          placeholder="Vendor name (e.g. Thought Machine)"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <select
          name="tier"
          required
          defaultValue="TIER_2"
          className="rounded border border-slate-300 bg-white px-3 py-2"
        >
          <option value="TIER_1">Tier 1 — mission-critical</option>
          <option value="TIER_2">Tier 2 — business-critical</option>
          <option value="TIER_3">Tier 3 — business-operational</option>
        </select>
        <input
          name="serviceKind"
          placeholder="Service (e.g. Core banking)"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="statusUrl"
          placeholder="Status URL (e.g. status.thoughtmachine.io)"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="contactName"
          placeholder="Contact name"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="contactEmail"
          placeholder="Contact email"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <input
          name="contactPhone"
          placeholder="Contact phone"
          className="rounded border border-slate-300 px-3 py-2"
        />
        <textarea
          name="description"
          rows={2}
          placeholder="Short description"
          className="col-span-1 rounded border border-slate-300 px-3 py-2 sm:col-span-2"
        />
        <button className="col-span-1 rounded-md bg-slate-900 px-3 py-2 text-white sm:col-span-2">
          Save vendor
        </button>
      </form>
    </details>
  );
}
