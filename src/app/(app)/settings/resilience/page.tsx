import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { updateResilienceSettingsAction } from "@/app/actions/resilience-attestation";

export const metadata = { title: "Resilience attestation — Settings — SnapFix" };

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function ResilienceSettingsPage() {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const [org, users] = await Promise.all([
    prisma.organization.findUniqueOrThrow({
      where: { id: me.orgId },
      select: {
        smfAccountableForResilienceUserId: true,
        boardCommitteeForResilienceName: true,
        attestationCycleStartMonth: true,
      },
    }),
    prisma.user.findMany({
      where: { orgId: me.orgId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  return (
    <form
      action={updateResilienceSettingsAction}
      className="space-y-5 rounded-xl border border-line bg-surface-1 p-5"
    >
      <header>
        <h2 className="text-sm font-semibold text-ink">Annual attestation</h2>
        <p className="mt-0.5 text-[11px] text-soft">
          Who signs, which committee ratifies, and when the annual cycle opens. The named SMF is the
          only person who can sign the executive line of the attestation.
        </p>
      </header>

      <label className="block text-sm">
        <span className="text-ink">SMF accountable for operational resilience</span>
        <select
          name="smfUserId"
          defaultValue={org.smfAccountableForResilienceUserId ?? ""}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
        >
          <option value="">— not set —</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.name ?? u.email}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-soft">
          Signs the executive line. The sign-off button is gated to this person.
        </p>
      </label>

      <label className="block text-sm">
        <span className="text-ink">Board committee</span>
        <input
          name="boardCommittee"
          maxLength={200}
          defaultValue={org.boardCommitteeForResilienceName ?? ""}
          placeholder="e.g. Board Risk Committee"
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-0 px-3 py-2"
        />
        <p className="mt-1 text-[11px] text-soft">
          Pre-fills the committee name when board ratification is recorded.
        </p>
      </label>

      <label className="block text-sm">
        <span className="text-ink">Cycle start month</span>
        <select
          name="cycleStartMonth"
          defaultValue={org.attestationCycleStartMonth ?? ""}
          className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
        >
          <option value="">January (default)</option>
          {MONTHS.map((m, i) => (
            <option key={m} value={i + 1}>
              {m}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11px] text-soft">
          The cycle opens at the start of this month; sign-off is due 90 days later.
        </p>
      </label>

      <div className="flex justify-end">
        <button className="rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400">
          Save changes
        </button>
      </div>
    </form>
  );
}
