import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  removeOrgLogoAction,
  updateOrgSettingsAction,
  uploadOrgLogoAction,
} from "@/app/actions/settings";

export const metadata = { title: "Brand — Settings — SnapFix" };

const ACCENT_PRESETS = [
  { hex: "#4f46e5", label: "SnapFix indigo" },
  { hex: "#0ea5e9", label: "Sky" },
  { hex: "#10b981", label: "Emerald" },
  { hex: "#f59e0b", label: "Amber" },
  { hex: "#ef4444", label: "Rose" },
  { hex: "#a855f7", label: "Violet" },
];

export default async function SettingsBrandPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const org = await prisma.organization.findUniqueOrThrow({
    where: { id: me.orgId },
    select: {
      id: true,
      name: true,
      tier: true,
      logoBlobUrl: true,
      accentHex: true,
    },
  });

  return (
    <div className="space-y-6">
      <form
        action={updateOrgSettingsAction}
        className="space-y-4 rounded-xl border border-line bg-surface-1 p-5"
      >
        <header>
          <h2 className="text-sm font-semibold text-ink">Accent colour</h2>
          <p className="mt-0.5 text-[11px] text-soft">
            Retints the brand --accent token across the app shell. Pick a preset or use the
            colour-well.
          </p>
        </header>

        {/* Keep profile fields round-tripping so this form doesn't wipe them. */}
        <input type="hidden" name="name" value={org.name} />
        <input type="hidden" name="tier" value={org.tier ?? ""} />

        <fieldset className="space-y-2">
          <legend className="sr-only">Brand accent</legend>
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="color"
              name="accentHex"
              id="accentHex"
              defaultValue={org.accentHex ?? "#4f46e5"}
              className="h-10 w-12 cursor-pointer rounded-md border border-line-strong bg-surface-1"
              aria-label="Brand accent colour"
            />
            {ACCENT_PRESETS.map((p) => (
              <button
                key={p.hex}
                type="button"
                aria-label={p.label}
                title={p.label}
                className="h-7 w-7 rounded-md border border-line-strong"
                style={{ background: p.hex }}
                data-accent={p.hex}
              />
            ))}
          </div>
        </fieldset>

        <div className="flex justify-end">
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Save accent
          </button>
        </div>
      </form>

      <section className="space-y-4 rounded-xl border border-line bg-surface-1 p-5">
        <header>
          <h2 className="text-sm font-semibold text-ink">Logo</h2>
          <p className="mt-0.5 text-[11px] text-soft">
            PNG, JPG, SVG or WebP up to 1 MB. Square images work best — appears in the sidebar.
          </p>
        </header>

        {org.logoBlobUrl ? (
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-line bg-surface-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={org.logoBlobUrl}
                alt={`${org.name} logo`}
                className="max-h-14 max-w-14 object-contain"
              />
            </div>
            <form action={removeOrgLogoAction}>
              <button className="text-xs text-rose-600 hover:underline">Remove logo</button>
            </form>
          </div>
        ) : (
          <p className="text-xs text-muted">No logo uploaded.</p>
        )}

        <form action={uploadOrgLogoAction} encType="multipart/form-data" className="space-y-3">
          <input
            type="file"
            name="logo"
            accept="image/png,image/jpeg,image/svg+xml,image/webp"
            required
            aria-label="Logo file"
            className="block text-sm"
          />
          <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
            Upload logo
          </button>
        </form>
      </section>
    </div>
  );
}
