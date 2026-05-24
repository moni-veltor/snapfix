import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateOrgSettingsAction } from "@/app/actions/settings";

export const metadata = { title: "Profile — Settings — SnapFix" };

export default async function SettingsProfilePage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: me.orgId },
    select: { id: true, name: true, slug: true, tier: true, accentHex: true },
  });

  return (
    <form
      action={updateOrgSettingsAction}
      className="space-y-4 rounded-xl border border-line bg-surface-1 p-5"
    >
      <header>
        <h2 className="text-sm font-semibold text-ink">Profile</h2>
        <p className="mt-0.5 text-[11px] text-soft">
          The name and tier admins see at the top of every page.
        </p>
      </header>

      <label className="block text-sm">
        <span className="text-ink">Organisation name</span>
        <input
          name="name"
          required
          maxLength={120}
          defaultValue={org.name}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
        />
      </label>

      <label className="block text-sm">
        <span className="text-ink">Tier</span>
        <select
          name="tier"
          defaultValue={org.tier ?? ""}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
        >
          <option value="">Not set / Other</option>
          <option value="TIER_1">Tier 1 — Global universal / G-SIB</option>
          <option value="TIER_2">Tier 2 — Digital challenger</option>
          <option value="TIER_3">Tier 3 — New bank, neobank, EMI, fintech</option>
        </select>
        <p className="mt-1 text-[11px] text-soft">
          Tier drives tier-aware filters in the library + runbooks + IBS register.
        </p>
      </label>

      {/* Accent is set on the brand page; keep it round-tripping so
          updateOrgSettingsAction doesn't wipe it. */}
      <input type="hidden" name="accentHex" value={org.accentHex ?? ""} />

      <div className="text-xs text-muted">
        Slug: <span className="font-mono">{org.slug}</span> (cannot be changed)
      </div>

      <div className="flex justify-end">
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
          Save changes
        </button>
      </div>
    </form>
  );
}
