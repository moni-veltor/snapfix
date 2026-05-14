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
import PageHero from "@/components/ui/PageHero";
import DORAInsights from "@/components/vendors/DORAInsights";
import type { VendorLite } from "@/lib/dora";

export default async function VendorsPage() {
  const me = await requireOrgUser();
  const [vendors, ibsList] = await Promise.all([
    prisma.vendor.findMany({
      where: { orgId: me.orgId },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      include: {
        ibsLinks: { include: { ibs: { select: { id: true, code: true, name: true } } } },
        _count: { select: { ibsLinks: true } },
      },
    }),
    prisma.organizationIBS.findMany({
      where: { orgId: me.orgId },
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true },
    }),
  ]);
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const vendorsLite: VendorLite[] = vendors.map((v) => ({
    id: v.id,
    name: v.name,
    tier: v.tier,
    isDoraCritical: v.isDoraCritical,
    doraIctTier: v.doraIctTier,
    hyperscaler: v.hyperscaler,
    region: v.region,
    contractStartAt: v.contractStartAt,
    contractEndAt: v.contractEndAt,
    contractRenewalNoticeDays: v.contractRenewalNoticeDays,
    contractAnnualValueGBP: v.contractAnnualValueGBP,
    assuranceKind: v.assuranceKind,
    assuranceExpiryAt: v.assuranceExpiryAt,
    exitPlanReviewedAt: v.exitPlanReviewedAt,
    exitPlanRTOMin: v.exitPlanRTOMin,
    exitPlanNotes: v.exitPlanNotes,
    fourthParties: v.fourthParties,
    ibsLinkCount: v._count.ibsLinks,
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Dependencies"
        title="Critical third parties"
        pitch="Vendors that support your IBSs. Link each to the services it underpins so a vendor outage instantly surfaces the affected IBSs — and capture DORA fields below so the Register of Information stays current."
      />

      <DORAInsights vendors={vendorsLite} />

      <ul className="space-y-3">
        {vendors.length === 0 && (
          <li className="rounded-md border border-dashed border-line-strong bg-surface-1 p-6 text-center text-sm text-muted">
            No vendors yet. {canManage ? "Add one below — start with your Tier 1 core providers." : "Ask an admin to add the firm's critical third parties."}
          </li>
        )}
        {vendors.map((v) => (
          <li key={v.id} className="rounded-md border border-line bg-surface-1 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-semibold text-slate-900">{v.name}</h2>
                  <TierPill tier={v.tier} />
                  {v.serviceKind && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] text-slate-700">
                      {v.serviceKind}
                    </span>
                  )}
                </div>
                {v.description && (
                  <p className="mt-1 text-sm text-slate-600">{v.description}</p>
                )}
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
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
                  <p className="text-[10px] font-semibold uppercase tracking-wide text-muted">
                    Supports IBSs
                  </p>
                  {v.ibsLinks.length === 0 ? (
                    <p className="text-xs text-soft">No IBS links yet.</p>
                  ) : (
                    <ul className="mt-1 flex flex-wrap gap-1">
                      {v.ibsLinks.map((l) => (
                        <li
                          key={l.ibsId}
                          className="flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5 text-xs"
                        >
                          <span className="font-mono">{l.ibs.code}</span>
                          <span className="text-slate-600">{l.ibs.name}</span>
                          {canManage && (
                            <form action={unlinkVendorFromIBSAction} className="inline">
                              <input type="hidden" name="vendorId" value={v.id} />
                              <input type="hidden" name="ibsId" value={l.ibsId} />
                              <button className="ml-1 text-soft hover:text-rose-600">×</button>
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
                        className="rounded border border-line-strong px-2 py-0.5 text-xs"
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
                      <button className="rounded border border-line-strong px-2 py-0.5 text-[11px]">
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
  const cls = TIER_CLASS[tier] ?? "bg-surface-2 text-slate-700";
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
  TIER_3: "bg-surface-2 text-slate-700",
};

function VendorForm() {
  return (
    <details className="rounded-md border border-line bg-surface-1 p-4">
      <summary className="cursor-pointer text-sm font-semibold">Add a vendor</summary>
      <form
        action={upsertVendorAction}
        className="mt-4 space-y-5 text-sm"
      >
        <fieldset className="space-y-3">
          <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Basics
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <input
              name="name"
              required
              placeholder="Vendor name (e.g. Thought Machine)"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
            <select
              name="tier"
              required
              defaultValue="TIER_2"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            >
              <option value="TIER_1">Tier 1 — mission-critical</option>
              <option value="TIER_2">Tier 2 — business-critical</option>
              <option value="TIER_3">Tier 3 — business-operational</option>
            </select>
            <input
              name="serviceKind"
              placeholder="Service (e.g. Core banking)"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
            <input
              name="statusUrl"
              placeholder="Status URL"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
            <input
              name="contactName"
              placeholder="Contact name"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
            <input
              name="contactEmail"
              placeholder="Contact email"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
          </div>
          <textarea
            name="description"
            rows={2}
            placeholder="Short description"
            className="w-full rounded border border-line-strong bg-surface-0 px-3 py-2"
          />
        </fieldset>

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            DORA / ICT-third-party
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="isDoraCritical" className="rounded border-line" />
              <span>Tag as DORA-critical third party</span>
            </label>
            <select
              name="doraIctTier"
              defaultValue="none"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            >
              <option value="none">DORA ICT tier — same as commercial</option>
              <option value="TIER_1">DORA · Tier 1</option>
              <option value="TIER_2">DORA · Tier 2</option>
              <option value="TIER_3">DORA · Tier 3</option>
            </select>
            <input
              name="hyperscaler"
              placeholder="Hyperscaler (AWS / GCP / Azure / …)"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
            <input
              name="region"
              placeholder="Region (e.g. eu-west-2)"
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            />
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Contract
          </legend>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <label className="text-xs">
              <span className="text-soft">Start date</span>
              <input
                type="date"
                name="contractStartAt"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">End date</span>
              <input
                type="date"
                name="contractEndAt"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Notice days</span>
              <input
                type="number"
                name="contractRenewalNoticeDays"
                min={0}
                placeholder="90"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Annual value (£)</span>
              <input
                type="number"
                name="contractAnnualValueGBP"
                min={0}
                placeholder="250000"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Assurance
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <select
              name="assuranceKind"
              defaultValue=""
              className="rounded border border-line-strong bg-surface-0 px-3 py-2"
            >
              <option value="">— Assurance kind —</option>
              <option value="SOC2_TYPE_2">SOC 2 Type 2</option>
              <option value="SOC2_TYPE_1">SOC 2 Type 1</option>
              <option value="ISAE3402">ISAE 3402</option>
              <option value="ISO27001">ISO 27001</option>
              <option value="NONE">None / pending</option>
            </select>
            <label className="text-xs">
              <span className="text-soft">Expiry date</span>
              <input
                type="date"
                name="assuranceExpiryAt"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="space-y-3 border-t border-line pt-4">
          <legend className="text-[10px] font-semibold uppercase tracking-wider text-muted">
            Exit plan
          </legend>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-soft">Last reviewed</span>
              <input
                type="date"
                name="exitPlanReviewedAt"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
            <label className="text-xs">
              <span className="text-soft">Exit RTO (minutes)</span>
              <input
                type="number"
                name="exitPlanRTOMin"
                min={0}
                placeholder="2880"
                className="mt-1 w-full rounded border border-line-strong bg-surface-0 px-2 py-1.5"
              />
            </label>
          </div>
          <textarea
            name="exitPlanNotes"
            rows={3}
            placeholder="Exit-plan summary — trigger conditions, target alternative provider, switching steps, data extraction approach."
            className="w-full rounded border border-line-strong bg-surface-0 px-3 py-2"
          />
        </fieldset>

        <button className="w-full rounded-md bg-slate-900 px-3 py-2 text-white hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
          Save vendor
        </button>
      </form>
    </details>
  );
}
