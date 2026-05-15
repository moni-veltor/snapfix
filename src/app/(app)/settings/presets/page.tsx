import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PRESETS, presetById } from "@/lib/industry-presets";
import { applyIndustryPresetAction } from "@/app/actions/industry-presets";
import ToastForm from "@/components/ui/ToastForm";
import SubmitButton from "@/components/ui/SubmitButton";

type Search = { applied?: string };

export default async function PresetsPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const canManage = session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
  if (!canManage) redirect("/dashboard");

  const sp = await searchParams;
  const applied = sp.applied ? presetById(sp.applied) : null;

  const [rolesCount, ibsCount, vendorCount, systemsCount] = await Promise.all([
    prisma.organizationRole.count({ where: { orgId: session.user.orgId } }),
    prisma.organizationIBS.count({ where: { orgId: session.user.orgId } }),
    prisma.vendor.count({ where: { orgId: session.user.orgId } }),
    prisma.techSystem.count({ where: { orgId: session.user.orgId } }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to settings
      </Link>

      <header>
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-soft">
          Governance
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
          Industry presets
        </h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Opinionated starter packs for the three dominant firm profiles. Picking one
          adds a coherent role catalogue, IBS register, vendor list and technical recovery
          register in one go. Non-destructive — anything you&apos;ve already configured is
          left alone.
        </p>
      </header>

      {applied && (
        <div className="flex items-start gap-3 rounded-lg border border-emerald-300 bg-emerald-50 p-4 text-sm dark:border-emerald-700 dark:bg-emerald-950/40">
          <CheckCircle2 size={16} className="mt-0.5 text-emerald-600 dark:text-emerald-300" />
          <div>
            <p className="font-semibold text-emerald-900 dark:text-emerald-100">
              Applied the {applied.label} preset
            </p>
            <p className="mt-1 text-xs text-emerald-800 dark:text-emerald-200">
              New roles, IBSs, vendors and tech systems are now live. Existing items by
              name/abbreviation/code were preserved.
            </p>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-line bg-surface-0 p-3 text-xs text-muted">
        Current state — {rolesCount} role{rolesCount === 1 ? "" : "s"}, {ibsCount} IBS
        {ibsCount === 1 ? "" : "s"}, {vendorCount} vendor{vendorCount === 1 ? "" : "s"},{" "}
        {systemsCount} tech system{systemsCount === 1 ? "" : "s"}.
      </section>

      <ul className="grid gap-4 lg:grid-cols-3">
        {PRESETS.map((p) => (
          <li key={p.id}>
            <article className="flex h-full flex-col rounded-xl border border-line bg-surface-1 p-5 shadow-[var(--shadow-card)]">
              <div className="flex items-start justify-between">
                <span className="text-3xl leading-none">{p.iconEmoji}</span>
                <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
                  {p.firmTier.replace("_", "-").toLowerCase()}
                </span>
              </div>
              <h2 className="mt-3 text-lg font-semibold text-ink">{p.label}</h2>
              <p className="mt-1 text-xs text-muted">{p.pitch}</p>
              <ul className="mt-4 space-y-1 text-[11px] text-muted">
                <li>
                  <span className="font-semibold text-ink">{p.roles.length}</span> IMT roles
                </li>
                <li>
                  <span className="font-semibold text-ink">{p.ibs.length}</span> IBSs
                </li>
                <li>
                  <span className="font-semibold text-ink">{p.vendors.length}</span> vendors
                </li>
                <li>
                  <span className="font-semibold text-ink">{p.techSystems.length}</span>{" "}
                  tech systems
                </li>
              </ul>
              <details className="mt-3 text-[11px] text-muted">
                <summary className="cursor-pointer text-muted hover:text-ink">
                  What&apos;s inside
                </summary>
                <p className="mt-2">{p.description}</p>
                <div className="mt-2 space-y-1">
                  <div>
                    <span className="font-semibold text-ink">Sample roles:</span>{" "}
                    {p.roles
                      .slice(0, 6)
                      .map((r) => r.abbreviation)
                      .join(" · ")}
                    {p.roles.length > 6 ? ` +${p.roles.length - 6}` : ""}
                  </div>
                  <div>
                    <span className="font-semibold text-ink">Sample IBSs:</span>{" "}
                    {p.ibs
                      .slice(0, 3)
                      .map((i) => i.name)
                      .join(" · ")}
                    {p.ibs.length > 3 ? ` +${p.ibs.length - 3}` : ""}
                  </div>
                  <div>
                    <span className="font-semibold text-ink">Sample vendors:</span>{" "}
                    {p.vendors
                      .slice(0, 4)
                      .map((v) => v.name)
                      .join(" · ")}
                    {p.vendors.length > 4 ? ` +${p.vendors.length - 4}` : ""}
                  </div>
                </div>
              </details>
              <ToastForm
                action={applyIndustryPresetAction}
                toast={{
                  loading: `Applying ${p.label}…`,
                  success: `${p.label} preset applied`,
                  description: `${p.roles.length} roles · ${p.ibs.length} IBSs · ${p.vendors.length} vendors · ${p.techSystems.length} systems`,
                  error: "Couldn't apply this preset",
                }}
                className="mt-auto pt-4"
              >
                <input type="hidden" name="presetId" value={p.id} />
                <SubmitButton size="md" className="w-full">
                  Apply {p.label}
                </SubmitButton>
              </ToastForm>
            </article>
          </li>
        ))}
      </ul>

      <p className="text-[11px] text-soft">
        Tip: you can apply more than one preset to combine packs. Existing roles, IBSs,
        vendors and tech systems are never overwritten.
      </p>
    </div>
  );
}
