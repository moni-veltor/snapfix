import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Target, TestTube2 } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startExerciseAction } from "@/app/actions/exercises";
import { promoteDryRunToProductionAction } from "@/app/actions/exercise-wizard";
import ArtefactList from "@/components/ArtefactList";
import ArtefactUpload from "@/components/ArtefactUpload";
import PageHero from "@/components/ui/PageHero";
import RoleBriefingPreview from "@/components/exercises/RoleBriefingPreview";
import { DryRunBanner } from "@/components/exercises/DryRunBadge";
import PlanningWorkspace from "@/components/exercises/PlanningWorkspace";
import { evaluateReadiness } from "@/lib/exercise-readiness";
import { loadAggregatedInjects } from "@/lib/exercise-injects";

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
          background: true,
          artefacts: {
            orderBy: { createdAt: "asc" },
            include: { uploadedBy: { select: { name: true, email: true } } },
          },
        },
      },
      participants: {
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
      artefacts: {
        orderBy: { createdAt: "asc" },
        include: { uploadedBy: { select: { name: true, email: true } } },
      },
      ibsLinks: { select: { ibsId: true } },
    },
  });
  if (!exercise) notFound();

  // Stakeholders go to the exec view.
  const myEnrolment = exercise.participants.find((p) => p.userId === me.id);
  const isStakeholder = myEnrolment?.isStakeholder ?? false;
  const canManage = me.orgRole === "OWNER" || me.orgRole === "ADMIN";
  if (isStakeholder && !canManage) {
    redirect(`/exercises/${exercise.id}/exec`);
  }

  // Live → facilitator / live; Done → debrief.
  if (exercise.status === "IN_PROGRESS" || exercise.status === "PAUSED") {
    if (canManage) redirect(`/exercises/${exercise.id}/facilitator`);
    redirect(`/exercises/${exercise.id}/live`);
  }
  if (exercise.status === "COMPLETED" || exercise.status === "ABANDONED") {
    redirect(`/exercises/${exercise.id}/debrief`);
  }

  // Pre-live role briefing preview.
  const myParticipant = exercise.participants.find((p) => p.userId === me.id);
  const myRole = myParticipant?.roleTitle
    ? await prisma.organizationRole.findFirst({
        where: { orgId: me.orgId, abbreviation: myParticipant.roleTitle },
        select: { responsibility: true, isSMF: true, deputyOfRoleId: true },
      })
    : null;

  // Real readiness data (12 checks, single source of truth).
  const readiness = canManage ? await evaluateReadiness(exercise.id) : null;

  // Org-wide data needed by the interactive workspace.
  const [orgUsers, orgRoles, orgIBSs, injects] = canManage
    ? await Promise.all([
        prisma.user.findMany({
          where: { orgId: me.orgId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, email: true },
        }),
        prisma.organizationRole.findMany({
          where: { orgId: me.orgId },
          orderBy: [{ isSMF: "desc" }, { orderIdx: "asc" }, { abbreviation: "asc" }],
          select: { id: true, abbreviation: true, title: true, isSMF: true, defaultHolderId: true },
        }),
        prisma.organizationIBS.findMany({
          where: { orgId: me.orgId },
          orderBy: { name: "asc" },
          select: { id: true, name: true, criticality: true },
        }),
        loadAggregatedInjects(exercise.id),
      ])
    : [[], [], [], []];

  const visibleInjects = injects.filter((i) => !i.hidden).length;

  const heroMeta = (
    <>
      <span className="rounded-full bg-surface-2 px-2 py-0.5 font-medium text-ink">
        {exercise.status}
      </span>
      {exercise.plannedDate && (
        <> · {exercise.plannedDate.toISOString().slice(0, 16).replace("T", " ")}</>
      )}
      {exercise.location && <> · {exercise.location}</>}
      {exercise.regulatorMode && (
        <span className="ml-2 rounded-full bg-violet-600 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-white">
          Regulator evidence
        </span>
      )}
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
            {exercise.description && <span className="block">{exercise.description}</span>}
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
              {exercise.status === "READY" && (
                <form action={startExerciseAction} className="flex items-center gap-2">
                  <input type="hidden" name="id" value={exercise.id} />
                  <select
                    name="speed"
                    defaultValue={String(exercise.speedMultiplier)}
                    className="rounded-md border border-line-strong bg-surface-0 px-2 py-1.5 text-xs"
                  >
                    <option value="1">×1 real-time</option>
                    <option value="5">×5</option>
                    <option value="15">×15</option>
                    <option value="60">×60</option>
                  </select>
                  <button className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-3 py-2 text-sm font-semibold text-white shadow-[var(--shadow-card)] hover:-translate-y-px hover:bg-slate-700 dark:bg-indigo-500 dark:hover:bg-indigo-400">
                    <Target size={14} />
                    Start exercise
                  </button>
                </form>
              )}
              <Link
                href="/exercises"
                className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
              >
                All exercises
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

      {canManage && readiness ? (
        <PlanningWorkspace
          exercise={{
            id: exercise.id,
            title: exercise.title,
            status: exercise.status,
            plannedDate: exercise.plannedDate,
            durationMin: exercise.durationMin,
            timeZone: exercise.timeZone,
            speedMultiplier: exercise.speedMultiplier,
            location: exercise.location,
            classification: exercise.classification,
            regulatorMode: exercise.regulatorMode,
            regulatorAudience: exercise.regulatorAudience,
            objectives: exercise.objectives,
            facilitatorId: exercise.facilitatorId,
            coFacilitatorId: exercise.coFacilitatorId,
            briefingSentAt: exercise.briefingSentAt,
            briefingSkippedReason: exercise.briefingSkippedReason,
            ibsIds: exercise.ibsLinks.map((l) => l.ibsId),
            scenarioId: exercise.scenario.id,
            scenarioTitle: exercise.scenario.title,
            totalInjects: injects.length,
            visibleInjects,
          }}
          readiness={readiness}
          participants={exercise.participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            userName: p.user.name ?? p.user.email,
            userEmail: p.user.email,
            roleTitle: p.roleTitle,
            exerciseRole: p.exerciseRole,
            deputyParticipantId: p.deputyParticipantId,
          }))}
          orgUsers={orgUsers}
          orgRoles={orgRoles}
          orgIBSs={orgIBSs.map((i) => ({
            id: i.id,
            name: i.name,
            criticality: i.criticality ?? null,
          }))}
          canEdit
        />
      ) : (
        <section className="rounded-xl border border-line bg-surface-1 p-5 text-sm text-muted">
          You&apos;re on the roster for this exercise. The facilitator is finalising the plan;
          you&apos;ll get a pre-read notification when it&apos;s ready.
        </section>
      )}

      {/* Documents */}
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
    </div>
  );
}
