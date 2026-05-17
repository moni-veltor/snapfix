import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WizardShell from "@/components/exercises/wizard/WizardShell";
import StepBasics from "./StepBasics";
import StepScenarios, { type ScenarioOption } from "./StepScenarios";
import StepTeam from "./StepTeam";
import StepInjects from "./StepInjects";
import {
  findCoverageGaps,
  findDensityHotspots,
  loadAggregatedInjects,
} from "@/lib/exercise-injects";
import { computeDifficulty, recentTeamDifficulty } from "@/lib/scenario-difficulty";
import { doraApplies as doraAppliesFn, previewDoraForScenario } from "@/lib/dora-thresholds";
import type { Jurisdiction } from "@/lib/dora-thresholds";

export const metadata = { title: "Plan an exercise — SnapFix" };

export default async function NewExerciseWizardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const sp = await searchParams;
  const stepRaw = Array.isArray(sp.step) ? sp.step[0] : sp.step;
  const step = Math.max(1, Math.min(5, parseInt(stepRaw ?? "1", 10) || 1));

  // Flatten search params into a plain string record for the children that
  // need to read the in-flight Basics state (Steps 2+).
  const carry: Record<string, string> = {};
  for (const [k, v] of Object.entries(sp)) {
    if (typeof v === "string") carry[k] = v;
  }

  // ─── Step 1: Basics ─────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <WizardShell currentStep={1} carryParams={carry}>
        <StepBasics defaults={carry} />
      </WizardShell>
    );
  }

  // ─── Step 2: Scenarios (primary + chained + IBS + objectives + DORA) ──
  if (step === 2) {
    if (!carry.title) redirect("/exercises/new?step=1");

    const [rawScenarios, teamMaturity] = await Promise.all([
      prisma.scenario.findMany({
        where: { OR: [{ orgId: user.orgId }, { orgId: null, isTemplate: true }] },
        orderBy: [{ isTemplate: "asc" }, { createdAt: "desc" }],
        select: {
          id: true,
          title: true,
          category: true,
          durationMin: true,
          isTemplate: true,
          difficultyCognitive: true,
          difficultyTimePressure: true,
          difficultyAmbiguity: true,
          difficultyStakeholders: true,
          coversTechnology: true,
          coversDataAvailability: true,
          coversDataIntegrity: true,
          coversThirdParty: true,
          _count: { select: { events: true, injects: true, ibsList: true } },
          ibsList: {
            select: {
              id: true,
              name: true,
              criticality: true,
            },
          },
        },
      }),
      recentTeamDifficulty(user.orgId),
    ]);

    const scenarios: ScenarioOption[] = rawScenarios.map((s) => ({
      id: s.id,
      title: s.title,
      category: s.category,
      durationMin: s.durationMin,
      isTemplate: s.isTemplate,
      injectCount: s._count.injects,
      eventCount: s._count.events,
      ibsCount: s._count.ibsList,
      difficulty: computeDifficulty(s),
      doraPreview: previewDoraForScenario({
        coversTechnology: s.coversTechnology,
        coversDataAvailability: s.coversDataAvailability,
        coversDataIntegrity: s.coversDataIntegrity,
        coversThirdParty: s.coversThirdParty,
        durationMin: s.durationMin,
      }),
      ibsList: s.ibsList.map((i) => ({
        id: i.id,
        name: i.name,
        tierLabel: i.criticality ?? null,
      })),
    }));

    const backParams = new URLSearchParams();
    backParams.set("step", "1");
    for (const [k, v] of Object.entries(carry)) {
      if (k === "step") continue;
      if (v) backParams.set(k, v);
    }

    const jurisdiction = (carry.jurisdiction as Jurisdiction | undefined) ?? "UK";

    return (
      <WizardShell currentStep={2} carryParams={carry} draftTitle={carry.title}>
        <StepScenarios
          scenarios={scenarios}
          basics={carry}
          backHref={`/exercises/new?${backParams.toString()}`}
          teamMaturity={teamMaturity}
          doraApplies={doraAppliesFn(jurisdiction)}
        />
      </WizardShell>
    );
  }

  // ─── Steps 3-5: require an existing draft Exercise ─────────────────────
  const idRaw = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  if (!idRaw) redirect("/exercises/new?step=1");
  const exercise = await prisma.exercise.findFirst({
    where: { id: idRaw, orgId: user.orgId },
    select: {
      id: true,
      title: true,
      status: true,
      facilitatorId: true,
      coFacilitatorId: true,
      plannedDate: true,
    },
  });
  if (!exercise) redirect("/exercises/new?step=1");

  // ─── Step 3: Team (seat map + co-facilitator + vendors + CSV import) ──
  if (step === 3) {
    const [orgUsers, orgRoles, orgVendors, participants, vendorParticipants] = await Promise.all([
      prisma.user.findMany({
        where: { orgId: user.orgId },
        orderBy: { name: "asc" },
        select: { id: true, name: true, email: true },
      }),
      prisma.organizationRole.findMany({
        where: { orgId: user.orgId },
        orderBy: [{ isSMF: "desc" }, { orderIdx: "asc" }, { abbreviation: "asc" }],
        select: {
          id: true,
          abbreviation: true,
          title: true,
          isSMF: true,
          defaultHolderId: true,
        },
      }),
      prisma.vendor.findMany({
        where: { orgId: user.orgId },
        orderBy: [{ isDoraCritical: "desc" }, { name: "asc" }],
        select: {
          id: true,
          name: true,
          tier: true,
          isDoraCritical: true,
          contactName: true,
          contactEmail: true,
        },
      }),
      prisma.exerciseParticipant.findMany({
        where: { exerciseId: exercise.id },
        orderBy: { joinedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      }),
      prisma.exerciseVendorParticipant.findMany({
        where: { exerciseId: exercise.id },
        orderBy: { invitedAt: "asc" },
        include: { vendor: { select: { name: true } } },
      }),
    ]);

    // Conflict warning: participants on another exercise within ±7 days.
    const conflictWindow = exercise.plannedDate
      ? {
          gte: new Date(exercise.plannedDate.getTime() - 7 * 24 * 60 * 60 * 1000),
          lte: new Date(exercise.plannedDate.getTime() + 7 * 24 * 60 * 60 * 1000),
        }
      : null;
    let conflictUserIds = new Set<string>();
    if (conflictWindow) {
      const userIdsOnRoster = participants.map((p) => p.userId);
      if (userIdsOnRoster.length > 0) {
        const otherExercises = await prisma.exerciseParticipant.findMany({
          where: {
            userId: { in: userIdsOnRoster },
            exerciseId: { not: exercise.id },
            exercise: {
              orgId: user.orgId,
              plannedDate: conflictWindow,
              status: { in: ["PLANNING", "READY", "IN_PROGRESS"] },
            },
          },
          select: { userId: true },
        });
        conflictUserIds = new Set(otherExercises.map((o) => o.userId));
      }
    }

    return (
      <WizardShell currentStep={3} carryParams={carry} draftTitle={exercise.title}>
        <StepTeam
          exerciseId={exercise.id}
          orgUsers={orgUsers}
          orgRoles={orgRoles}
          orgVendors={orgVendors}
          participants={participants.map((p) => ({
            id: p.id,
            userId: p.userId,
            userName: p.user.name ?? p.user.email,
            userEmail: p.user.email,
            roleTitle: p.roleTitle,
            exerciseRole: p.exerciseRole,
            deputyParticipantId: p.deputyParticipantId,
          }))}
          vendorParticipants={vendorParticipants.map((vp) => ({
            id: vp.id,
            vendorName: vp.vendor.name,
            contactName: vp.contactName,
            contactEmail: vp.contactEmail,
            scope: vp.scope,
          }))}
          facilitatorId={exercise.facilitatorId}
          coFacilitatorId={exercise.coFacilitatorId}
          conflictUserIds={conflictUserIds}
        />
      </WizardShell>
    );
  }

  // ─── Step 4: Injects timeline + coverage + custom-inject CRUD + pre-read ─
  if (step === 4) {
    const [injects, participants] = await Promise.all([
      loadAggregatedInjects(exercise.id),
      prisma.exerciseParticipant.findMany({
        where: { exerciseId: exercise.id },
        select: { roleTitle: true, preReadAckedAt: true },
      }),
    ]);
    const rosterRoleTitles = new Set(participants.map((p) => p.roleTitle));
    const coverageGaps = findCoverageGaps(injects, rosterRoleTitles);
    const densityHotspots = findDensityHotspots(injects);
    const preReadAckedCount = participants.filter((p) => p.preReadAckedAt !== null).length;

    return (
      <WizardShell currentStep={4} carryParams={carry} draftTitle={exercise.title}>
        <StepInjects
          exerciseId={exercise.id}
          injects={injects}
          coverageGaps={coverageGaps}
          densityHotspots={densityHotspots}
          rosterRoleTitles={Array.from(rosterRoleTitles).sort()}
          totalParticipants={participants.length}
          preReadAckedCount={preReadAckedCount}
        />
      </WizardShell>
    );
  }

  // ─── Step 5: still placeholder until Commit G ───────────────────────────
  return (
    <WizardShell currentStep={step} carryParams={carry} draftTitle={exercise.title}>
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-6 text-sm">
        <p className="font-semibold text-ink">Step 5 arrives in Commit G</p>
        <p className="mt-1 text-muted">
          Pre-flight summary, readiness gate, briefing email draft and .ics generator land in
          Commit G of the Plan-an-Exercise rollout.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/exercises/new?step=4&id=${exercise.id}`}
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            Back to Injects
          </Link>
          <Link
            href={`/exercises/${exercise.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open this draft &rarr;
          </Link>
        </div>
      </section>
    </WizardShell>
  );
}
