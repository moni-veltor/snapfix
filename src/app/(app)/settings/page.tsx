import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrgSettingsAction } from "@/app/actions/settings";

export const metadata = { title: "Settings — SnapFix" };

export default async function SettingsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: me.orgId } });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Organisation settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organisation's name and tier. The URL slug is fixed.
        </p>
      </header>

      <form
        action={updateOrgSettingsAction}
        className="space-y-4 rounded-md border border-slate-200 bg-white p-5"
      >
        <label className="block text-sm">
          <span className="text-slate-700">Organisation name</span>
          <input
            name="name"
            required
            maxLength={120}
            defaultValue={org.name}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          <span className="text-slate-700">Tier</span>
          <select
            name="tier"
            defaultValue={org.tier ?? ""}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
          >
            <option value="">Not set / Other</option>
            <option value="TIER_1">Tier 1 — Global universal / G-SIB</option>
            <option value="TIER_2">Tier 2 — Digital challenger</option>
            <option value="TIER_3">Tier 3 — New bank, neobank, EMI, fintech</option>
          </select>
          <span className="mt-1 block text-xs text-slate-500">
            Determines the recommended scenarios shown in the library.
          </span>
        </label>
        <div className="text-xs text-slate-500">
          Slug: <span className="font-mono">{org.slug}</span> (cannot be changed)
        </div>
        <div className="flex justify-end">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
            Save changes
          </button>
        </div>
      </form>
    </div>
  );
}
