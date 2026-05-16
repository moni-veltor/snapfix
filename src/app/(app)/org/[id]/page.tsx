import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Building,
  CheckSquare,
  Mail,
  MapPin,
  Phone,
  PhoneCall,
  Target,
  User as UserIcon,
} from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import MemberProfileEditButton from "./MemberProfileEditButton";

export const metadata = { title: "Member profile — SnapFix" };

export default async function MemberProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;

  const user = await prisma.user.findFirst({
    where: { id, orgId: me.orgId },
    select: {
      id: true,
      name: true,
      email: true,
      orgRole: true,
      jobTitle: true,
      location: true,
      phone: true,
      altEmail: true,
      outOfHoursPhone: true,
      bio: true,
      createdAt: true,
      _count: {
        select: {
          exerciseParticipations: true,
          ownedActionItems: true,
          createdIBS: true,
          ownedIBS: true,
          facilitatedExercises: true,
        },
      },
    },
  });
  if (!user) notFound();

  const canEdit =
    me.orgRole === "OWNER" || me.orgRole === "ADMIN" || me.id === user.id;

  const isMe = me.id === user.id;
  const displayName = user.name ?? user.email;

  const [recentParticipations, openActionItems, defaultRoles] = await Promise.all([
    prisma.exerciseParticipant.findMany({
      where: { userId: user.id, exercise: { orgId: me.orgId } },
      orderBy: { joinedAt: "desc" },
      take: 8,
      include: {
        exercise: {
          select: { id: true, title: true, status: true, plannedDate: true },
        },
      },
    }),
    prisma.exerciseActionItem.findMany({
      where: {
        orgId: me.orgId,
        ownerUserId: user.id,
        status: { notIn: ["DONE", "WONT_FIX"] },
      },
      orderBy: { dueAt: "asc" },
      take: 8,
      include: { exercise: { select: { id: true, title: true } } },
    }),
    prisma.organizationRole.findMany({
      where: { orgId: me.orgId, defaultHolderId: user.id },
      orderBy: { orderIdx: "asc" },
      select: { id: true, abbreviation: true, title: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <Link
        href="/org"
        className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
      >
        <ArrowLeft size={12} />
        Back to members
      </Link>

      <PageHero
        eyebrow={isMe ? "Your profile" : "Member"}
        icon={UserIcon}
        title={displayName}
        pitch={
          <>
            <span className="block">
              {user.jobTitle && (
                <span className="text-ink">
                  <Briefcase size={11} className="mr-1 inline" />
                  {user.jobTitle}
                </span>
              )}
              {user.jobTitle && user.location && <span className="mx-2">·</span>}
              {user.location && (
                <span>
                  <MapPin size={11} className="mr-1 inline" />
                  {user.location}
                </span>
              )}
            </span>
            <span className="mt-0.5 block text-[11px] text-soft">
              <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-muted">
                {user.orgRole ?? "—"}
              </span>{" "}
              · joined {user.createdAt.toISOString().slice(0, 10)}
            </span>
          </>
        }
        actions={canEdit && <MemberProfileEditButton user={user} isMe={isMe} />}
      />

      <section className="grid gap-4 lg:grid-cols-3">
        {/* Contact card */}
        <div className="lg:col-span-1 space-y-3 rounded-xl border border-line bg-surface-1 p-4">
          <h2 className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
            <Phone size={11} />
            Contact
          </h2>
          <div className="space-y-2 text-sm">
            <ContactRow
              icon={<Mail size={12} />}
              label="Primary email"
              value={user.email}
              copyable
            />
            {user.altEmail && (
              <ContactRow
                icon={<Mail size={12} />}
                label="Alternate email"
                value={user.altEmail}
                copyable
              />
            )}
            {user.phone && (
              <ContactRow
                icon={<Phone size={12} />}
                label="Primary phone"
                value={user.phone}
                copyable
              />
            )}
            {user.outOfHoursPhone && (
              <ContactRow
                icon={<PhoneCall size={12} />}
                label="Out of hours"
                value={user.outOfHoursPhone}
                copyable
                tone="critical"
              />
            )}
            {!user.altEmail && !user.phone && !user.outOfHoursPhone && (
              <p className="text-xs text-soft">
                No additional contact details captured.{" "}
                {canEdit && (
                  <span className="text-muted">
                    Use the edit button to add a primary phone and out-of-hours number — vital
                    for real-incident response.
                  </span>
                )}
              </p>
            )}
          </div>

          {user.bio && (
            <div className="space-y-1">
              <h3 className="text-[10px] font-semibold uppercase tracking-[0.18em] text-soft">
                Skills & certifications
              </h3>
              <p className="whitespace-pre-line text-xs text-muted">{user.bio}</p>
            </div>
          )}
        </div>

        {/* Activity stats */}
        <div className="lg:col-span-2 grid gap-3 sm:grid-cols-2">
          <StatTile
            icon={<Target size={12} />}
            label="Exercises participated"
            value={user._count.exerciseParticipations}
            sub={`${user._count.facilitatedExercises} as facilitator`}
          />
          <StatTile
            icon={<CheckSquare size={12} />}
            label="Open action items owned"
            value={openActionItems.length}
            tone={openActionItems.length > 0 ? "warn" : "ok"}
          />
          <StatTile
            icon={<Building size={12} />}
            label="IBSs created"
            value={user._count.createdIBS}
            sub={`${user._count.ownedIBS} where named owner`}
          />
          <StatTile
            icon={<UserIcon size={12} />}
            label="Default-holder of"
            value={defaultRoles.length}
            sub={
              defaultRoles.length > 0
                ? defaultRoles.map((r) => r.abbreviation).join(" · ")
                : undefined
            }
          />
        </div>
      </section>

      {/* Default-roles list */}
      {defaultRoles.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-ink">Standing seats</h2>
          <p className="text-xs text-muted">
            IMT roles where this person is the named default holder. Pre-fills when claiming
            seats during a live exercise.
          </p>
          <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {defaultRoles.map((r) => (
              <li
                key={r.id}
                className="rounded-md border border-line bg-surface-1 p-3 text-sm"
              >
                <div className="flex items-center gap-2">
                  <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-indigo-700 dark:text-indigo-200">
                    {r.abbreviation}
                  </span>
                  <span className="truncate text-ink">{r.title}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Open action items */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Open action items</h2>
        {openActionItems.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 px-3 py-2 text-xs text-soft">
            Nothing open right now.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {openActionItems.map((a) => (
              <li
                key={a.id}
                className="flex items-center justify-between rounded-md border border-line bg-surface-1 p-2.5 text-sm"
              >
                <div className="min-w-0">
                  <div className="truncate text-ink">{a.title}</div>
                  <div className="truncate text-[11px] text-soft">
                    {a.exercise.title}
                    {a.dueAt && ` · due ${a.dueAt.toISOString().slice(0, 10)}`}
                  </div>
                </div>
                <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  {a.priority}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* Exercise history */}
      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-ink">Recent exercise participation</h2>
        {recentParticipations.length === 0 ? (
          <p className="rounded-md border border-dashed border-line bg-surface-1 px-3 py-2 text-xs text-soft">
            Hasn&apos;t taken part in an exercise yet.
          </p>
        ) : (
          <ul className="space-y-1.5">
            {recentParticipations.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/exercises/${p.exercise.id}`}
                  className="flex items-center justify-between rounded-md border border-line bg-surface-1 p-2.5 text-sm hover:border-line-strong hover:bg-surface-2"
                >
                  <div className="min-w-0">
                    <div className="truncate text-ink">{p.exercise.title}</div>
                    <div className="truncate text-[11px] text-soft">
                      {p.roleTitle && <>as {p.roleTitle} · </>}
                      {p.exerciseRole}
                      {p.exercise.plannedDate &&
                        ` · ${p.exercise.plannedDate.toISOString().slice(0, 10)}`}
                    </div>
                  </div>
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                    {p.exercise.status}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {!isMe && (
        <Link
          href="/org"
          className="inline-flex items-center gap-1 text-xs text-muted hover:text-ink"
        >
          <ArrowLeft size={12} />
          Back to members
        </Link>
      )}
    </div>
  );
}

function ContactRow({
  icon,
  label,
  value,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
  tone?: "critical";
}) {
  const labelCls =
    tone === "critical" ? "text-rose-600 dark:text-rose-300" : "text-soft";
  return (
    <div className="flex items-start gap-2">
      <span className="mt-0.5 text-soft">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className={`text-[10px] uppercase tracking-wider ${labelCls}`}>{label}</div>
        <div className="truncate font-mono text-[12px] text-ink">{value}</div>
      </div>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
  sub,
  tone = "neutral",
}: {
  icon?: React.ReactNode;
  label: string;
  value: number | string;
  sub?: string;
  tone?: "ok" | "warn" | "critical" | "neutral";
}) {
  const cls =
    tone === "critical"
      ? "border-rose-200 bg-rose-50 dark:border-rose-800/60 dark:bg-rose-950/30"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50 dark:border-amber-800/60 dark:bg-amber-950/30"
        : tone === "ok"
          ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
          : "border-line bg-surface-1";
  return (
    <div className={`rounded-lg border p-3 ${cls}`}>
      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-soft">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-2xl font-semibold text-ink">{value}</div>
      {sub && <div className="text-[10px] text-soft">{sub}</div>}
    </div>
  );
}
