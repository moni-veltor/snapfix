import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { CheckCircle2, Target, XCircle } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startExerciseAction, transitionToReadyAction } from "@/app/actions/exercises";
import ArtefactList from "@/components/ArtefactList";
import ArtefactUpload from "@/components/ArtefactUpload";
import PageHero from "@/components/ui/PageHero";
import RoleBriefingPreview from "@/components/exercises/RoleBriefingPreview";
import { DryRunBanner } from "@/components/exercises/DryRunBadge";
import { promoteDryRunToProductionAction } from "@/app/actions/exercise-wizard";
import { TestTube2 } from "lucide-react";

export default async function ExerciseOverviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgUser();
  const { id } = await params;
  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    include: {
      scenario: {
        select: {
          id: true,
          title: true,
          dDayDate: true,
          durationMin: true,
          background: true,
          _count: { select: { events: true, injects: true, ibsList: true } },
          artefacts: {
            orderBy: { createdAt: "asc" },
            include: { uploadedBy: { select: { name: true, email: true } } },
          },
        },
      },
      facilitator: { select: { name: true, email: true } },
      teams: {
        orderBy: { orderIdx: "asc" },
        include: {
          members: {
            include: { user: { select: { name: true, email: true } } },
          },
        },
      },
      participants: {
        include: { user: { select: { name: true, email: true } } },
      },
      artefacts: {
        orderBy: { createdAt: "asc" },
        include: { uploadedBy: { select: { name: true, email: true } } },
      },
    },
  });
  if (!exercise) notFound();

  // Stakeholders see only the executive summary view, regardless of status.
  // Owners / admins always see the full operational view.
  const myEnrolment = exercise.participants.find((p) => p.userId === me.id);
  const isStakeholder = myEnrolment?.isStakeholder ?? false;
  const canManageScope = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  if (isStakeholder && !canManageScope) {
    redirect(`/exercises/${exercise.id}/exec`);
  }

  // Redirect to live pages when IN_PROGRESS
  if (exercise.status === "IN_PROGRESS" || exercise.status === "PAUSED") {
    if (me.orgRole === "OWNER" || me.orgRole === "ADMIN") {
      redirect(`/exercises/${exercise.id}/facilitator`);
    }
    redirect(`/exercises/${exercise.id}/live`);
  }
  if (exercise.status === "COMPLETED" || exercise.status === "ABANDONED") {
    redirect(`/exercises/${exercise.id}/debrief`);
  }

  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  const unassigned = exercise.participants.filter((p) => !p.teamId);

  // Pre-live role briefing preview — let the participant prepare for the
  // role they'll be playing before the clock starts.
  const myParticipant = exercise.participants.find((p) => p.user && p.userId === me.id);
  const myRole = myParticipant?.roleTitle
    ? await prisma.organizationRole.findFirst({
        where: { orgId: me.orgId, abbreviation: myParticipant.roleTitle },
        select: { responsibility: true, isSMF: true, deputyOfRoleId: true },
      })
    : null;
  const facilitatorCount = exercise.participants.filter((p) => p.exerciseRole === "FACILITATOR").length;
  const readyChecks = [
    {
      ok: !!exercise.plannedDate,
      label: "Planned date set",
    },
    {
      ok: facilitatorCount >= 1,
      label: "At least one facilitator assigned",
    },
    {
      ok: exercise.participants.length >= 2,
      label: "At least 2 people on the roster",
    },
    {
      ok: exercise.teams.some((t) => t.members.length > 0),
      label: "At least one team has members",
    },
  ];
  const canMarkReady = readyChecks.every((c) => c.ok) && exercise.status === "PLANNING";

  const readyCompleted = readyChecks.filter((c) => c.ok).length;
  const readyTotal = readyChecks.length;

  const heroMeta = (
    <>
      <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink">
        {exercise.status}
      </span>
      {exercise.plannedDate && (
        <> · Planned {exercise.plannedDate.toISOString().slice(0, 16).replace("T", " ")}</>
      )}
      {exercise.location && <> · {exercise.location}</>}
      {" · "}Facilitator: {exercise.facilitator?.name ?? exercise.facilitator?.email ?? "—"}
    </>
  );

  return (
    <div className="space-y-6">
      {exercise.mode === "DRY_RUN" && <DryRunBanner />}
      <PageHero
        eyebrow={exercise.scenario.title}
        icon={Target}
        title={exercise.title}
        pitch={
          <>
            {exercise.description && (
              <span className="block">{exercise.description}</span>
            )}
            <span className={`mt-1 block text-[11px] text-soft ${exercise.description ? "" : "mt-0"}`}>
              {heroMeta}
            </span>
          </>
        }
        actions={
          canManage ? (
            <div className="flex flex-wrap items-center gap-2">
              {exercise.mode === "DRY_RUN" && (
                <form action={promoteDryRunToProductionAction}>
                  <input type="hidden" name="sourceExerciseId" value={exercise.id} />
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-2 text-sm font-semibold text-white hover:bg-amber-500">
                    <TestTube2 size={14} />
                    Promote to production
                  </button>
                </form>
              )}
              <Link
                href={`/exercises/${exercise.id}/team`}
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                Manage teams & people
              </Link>
            </div>
          ) : undefined
        }
      />

      {myParticipant && (
        <RoleBriefingPreview
          roleTitle={myParticipant.roleTitle}
          isSMF={myRole?.isSMF ?? false}
          isDeputy={!!myRole?.deputyOfRoleId}
          responsibility={myRole?.responsibility ?? null}
        />
      )}

      {/* Sticky transition bar — visible only when a transition is available */}
      {canManage && (exercise.status === "PLANNING" || exercise.status === "READY") && (
        <div className="sticky top-0 z-20 -mx-2 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-surface-elev/95 p-3 px-3 shadow-[var(--shadow-card)] backdrop-blur supports-[backdrop-filter]:bg-surface-elev/85">
          <div className="flex items-center gap-3 text-xs">
            <span className="rounded-full bg-surface-2 px-2 py-0.5 font-semibold uppercase tracking-wider text-muted">
              {exercise.status}
            </span>
            {exercise.status === "PLANNING" && (
              <span className="text-muted">
                <span className="font-medium text-ink">
                  {readyCompleted} of {readyTotal}
                </span>{" "}
                readiness checks complete
              </span>
            )}
            {exercise.status === "READY" && (
              <span className="text-muted">All readiness checks passed — ready to go live.</span>
            )}
          </div>
          {exercise.status === "PLANNING" && (
            <form action={transitionToReadyAction}>
              <input type="hidden" name="id" value={exercise.id} />
              <button
                disabled={!canMarkReady}
                className="inline-flex items-center gap-1.5 rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:bg-emerald-500 disabled:bg-surface-2 disabled:text-soft disabled:shadow-none"
              >
                <CheckCircle2 size={14} />
                Mark as Ready
              </button>
            </form>
          )}
          {exercise.status === "READY" && (
            <form action={startExerciseAction} className="flex items-center gap-2">
              <input type="hidden" name="id" value={exercise.id} />
              <select
                name="speed"
                defaultValue="1"
                className="rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-xs"
              >
                <option value="1">×1 real-time</option>
                <option value="5">×5</option>
                <option value="15">×15</option>
                <option value="60">×60 (1 min = 1 D-Day hr)</option>
              </select>
              <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                <Target size={14} />
                Start exercise
              </button>
            </form>
          )}
        </div>
      )}

      <section className="grid gap-6 md:grid-cols-3">
        <Stat label="Important Business Services" value={exercise.scenario._count.ibsList} />
        <Stat label="Scenario events" value={exercise.scenario._count.events} />
        <Stat label="Injects" value={exercise.scenario._count.injects} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Documents</h2>
        {exercise.scenario.artefacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-muted">From the scenario</p>
            <ArtefactList
              artefacts={exercise.scenario.artefacts}
              canManage={false}
              empty="No scenario-level documents."
            />
            <p className="text-xs text-muted">
              Manage scenario documents on the{" "}
              <Link href={`/scenarios/${exercise.scenario.id}`} className="underline">
                scenario page
              </Link>
              .
            </p>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-muted">For this exercise</p>
          <ArtefactList
            artefacts={exercise.artefacts}
            canManage={canManage}
            empty="No exercise-specific documents yet."
          />
          {canManage && <ArtefactUpload target="EXERCISE" targetId={exercise.id} />}
        </div>
      </section>

      <section className="space-y-3">
        <header className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">Readiness checklist</h2>
          <span className="text-xs text-muted">
            <span className="font-medium text-ink">
              {readyCompleted} of {readyTotal}
            </span>{" "}
            complete
          </span>
        </header>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readyChecks.map((c) => (
            <li
              key={c.label}
              className={`flex items-center gap-2 rounded-md border px-3 py-2 text-sm ${
                c.ok
                  ? "border-emerald-200 bg-emerald-50 dark:border-emerald-800/60 dark:bg-emerald-950/30"
                  : "border-line bg-surface-1"
              }`}
            >
              {c.ok ? (
                <CheckCircle2 size={14} className="shrink-0 text-emerald-600 dark:text-emerald-300" />
              ) : (
                <XCircle size={14} className="shrink-0 text-soft" />
              )}
              <span className={c.ok ? "text-ink" : "text-muted"}>{c.label}</span>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teams</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {exercise.teams.map((t) => (
            <div key={t.id} className="rounded-md border border-line bg-surface-1 p-4">
              <div className="font-medium">{t.name}</div>
              {t.description && <p className="mt-1 text-xs text-muted">{t.description}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {t.members.length === 0 && (
                  <li className="text-xs text-soft">No members yet.</li>
                )}
                {t.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>
                      <span className="font-medium">{m.user.name ?? m.user.email}</span>
                      <span className="ml-2 text-xs text-muted">{m.roleTitle}</span>
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                      {m.exerciseRole}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {unassigned.length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
            {unassigned.length} {unassigned.length === 1 ? "person is" : "people are"} on the roster
            without a team assignment.
          </div>
        )}
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-md border border-line bg-surface-1 p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
