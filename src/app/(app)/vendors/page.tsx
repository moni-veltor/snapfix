import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertVendorAction } from "@/app/actions/vendors";
import PageHero from "@/components/ui/PageHero";
import DORAInsights from "@/components/vendors/DORAInsights";
import VendorGrid from "@/components/vendors/VendorGrid";
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

      {vendors.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line-strong bg-surface-1 p-8 text-center text-sm text-muted">
          No vendors yet.{" "}
          {canManage
            ? "Add one below — start with your Tier 1 core providers."
            : "Ask an admin to add the firm's critical third parties."}
        </div>
      ) : (
        <VendorGrid
          vendors={vendors.map((v) => ({
            id: v.id,
            name: v.name,
            description: v.description,
            serviceKind: v.serviceKind,
            tier: v.tier,
            contactName: v.contactName,
            contactEmail: v.contactEmail,
            contactPhone: v.contactPhone,
            statusUrl: v.statusUrl,
            isDoraCritical: v.isDoraCritical,
            hyperscaler: v.hyperscaler,
            region: v.region,
            assuranceKind: v.assuranceKind,
            assuranceExpiryAt: v.assuranceExpiryAt,
            exitPlanReviewedAt: v.exitPlanReviewedAt,
            ibsLinks: v.ibsLinks.map((l) => ({
              ibsId: l.ibsId,
              ibs: { id: l.ibs.id, code: l.ibs.code, name: l.ibs.name },
            })),
          }))}
          ibsList={ibsList}
          canManage={canManage}
        />
      )}

      {canManage && <VendorForm />}
    </div>
  );
}

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
