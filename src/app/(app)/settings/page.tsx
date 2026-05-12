import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  removeOrgLogoAction,
  updateOrgSettingsAction,
  uploadOrgLogoAction,
} from "@/app/actions/settings";

export const metadata = { title: "Settings — SnapFix" };

export default async function SettingsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const org = await prisma.organization.findUniqueOrThrow({ where: { id: me.orgId } });

  return (
    <div className="mx-auto max-w-2xl space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Organisation settings</h1>
        <p className="mt-1 text-sm text-slate-500">
          Manage your organisation's name, tier and branding.
        </p>
      </header>

      <form
        action={updateOrgSettingsAction}
        className="space-y-4 rounded-md border border-slate-200 bg-white p-5"
      >
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Profile
        </h2>
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

      <section className="space-y-4 rounded-md border border-slate-200 bg-white p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">
          Branding
        </h2>
        <p className="text-xs text-slate-500">
          Upload your organisation's logo. PNG, JPG, SVG or WebP up to 1 MB.
          Square images work best — your logo appears in the sidebar.
        </p>
        {org.logoBlobUrl ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-slate-200 bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={org.logoBlobUrl}
                alt={`${org.name} logo`}
                className="max-h-14 max-w-14 object-contain"
              />
            </div>
            <form action={removeOrgLogoAction}>
              <button className="text-xs text-rose-600 hover:underline">
                Remove logo
              </button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-slate-500">No logo uploaded.</p>
        )}
        <form
          action={uploadOrgLogoAction}
          encType="multipart/form-data"
          className="space-y-3"
        >
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            required
            className="block text-sm"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700">
            Upload logo
          </button>
        </form>
      </section>
    </div>
  );
}
