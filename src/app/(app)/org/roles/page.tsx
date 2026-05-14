import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, ShieldCheck, Users } from "lucide-react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import RoleCatalogueEditor from "@/components/roles/RoleCatalogueEditor";

type Search = {
  error?: string;
};

export default async function OrgRolesPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const session = await auth();
  if (!session?.user?.orgId) redirect("/sign-in");
  const canManage = session.user.orgRole === "OWNER" || session.user.orgRole === "ADMIN";
  if (!canManage) redirect("/dashboard");

  const sp = await searchParams;

  const [roles, members] = await Promise.all([
    prisma.organizationRole.findMany({
      where: { orgId: session.user.orgId },
      orderBy: { orderIdx: "asc" },
      include: {
        deputyOf: { select: { id: true, abbreviation: true } },
        defaultHolder: { select: { id: true, name: true, email: true } },
        _count: { select: { seats: true } },
      },
    }),
    prisma.user.findMany({
      where: { orgId: session.user.orgId },
      orderBy: [{ name: "asc" }, { email: "asc" }],
      select: { id: true, name: true, email: true },
    }),
  ]);

  const smfCount = roles.filter((r) => r.isSMF).length;
  const execCount = roles.filter((r) => r.isExecutive).length;
  const withDeputy = roles.filter((r) => r.deputyOfRoleId).length;

  return (
    <div className="space-y-6">
      <Link
        href="/org"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to organisation
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-soft">
            Governance
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-ink">
            Role catalogue
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Define the seats your incident management team uses. Participants
            claim from this catalogue when an exercise starts. Each role can
            optionally name a default holder and a deputy.
          </p>
        </div>
      </header>

      {sp.error === "role-in-use" && (
        <div className="rounded-md border border-rose-300 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-700 dark:bg-rose-950/40 dark:text-rose-200">
          That role is in use by a live or completed exercise seat — vacate
          those seats first or archive the exercise.
        </div>
      )}

      <section className="grid gap-3 sm:grid-cols-4">
        <StatTile label="Total seats" value={roles.length} />
        <StatTile
          label="SMF-flagged"
          value={smfCount}
          icon={<ShieldCheck size={12} />}
        />
        <StatTile
          label="Executive"
          value={execCount}
          icon={<Users size={12} />}
        />
        <StatTile label="With deputy" value={withDeputy} />
      </section>

      <RoleCatalogueEditor
        roles={roles.map((r) => ({
          id: r.id,
          abbreviation: r.abbreviation,
          title: r.title,
          responsibility: r.responsibility,
          isSMF: r.isSMF,
          isExecutive: r.isExecutive,
          deputyOfRoleId: r.deputyOfRoleId,
          deputyOfAbbreviation: r.deputyOf?.abbreviation ?? null,
          defaultHolderId: r.defaultHolderId,
          defaultHolderName: r.defaultHolder?.name ?? null,
          defaultHolderEmail: r.defaultHolder?.email ?? null,
          seatCount: r._count.seats,
          orderIdx: r.orderIdx,
        }))}
        members={members}
      />
    </div>
  );
}

function StatTile({
  label,
  value,
  icon,
}: {
  label: string;
  value: number;
  icon?: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border border-line bg-surface-1 p-3">
      <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-soft">
        <span className="flex items-center gap-1">{icon}{label}</span>
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
    </div>
  );
}
