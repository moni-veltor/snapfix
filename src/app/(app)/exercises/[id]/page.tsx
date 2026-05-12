import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { startExerciseAction, transitionToReadyAction } from "@/app/actions/exercises";
import ArtefactList from "@/components/ArtefactList";
import ArtefactUpload from "@/components/ArtefactUpload";

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

  return (
    <div className="space-y-10">
      <header className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">
            {exercise.scenario.title}
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          {exercise.description && (
            <p className="mt-2 max-w-2xl text-sm text-slate-600">{exercise.description}</p>
          )}
          <p className="mt-3 text-xs text-slate-500">
            <span className="rounded-full bg-slate-100 px-2 py-0.5">{exercise.status}</span>
            {exercise.plannedDate && (
              <> · Planned {exercise.plannedDate.toISOString().slice(0, 16).replace("T", " ")}</>
            )}
            {exercise.location && <> · {exercise.location}</>}
            {" · "}Facilitator: {exercise.facilitator?.name ?? exercise.facilitator?.email ?? "—"}
          </p>
        </div>
        {canManage && (
          <div className="flex flex-col items-end gap-2">
            <Link
              href={`/exercises/${exercise.id}/team`}
              className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-white"
            >
              Manage teams & people
            </Link>
            {exercise.status === "PLANNING" && (
              <form action={transitionToReadyAction}>
                <input type="hidden" name="id" value={exercise.id} />
                <button
                  disabled={!canMarkReady}
                  className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white disabled:bg-slate-300"
                >
                  Mark as Ready
                </button>
              </form>
            )}
            {exercise.status === "READY" && (
              <form action={startExerciseAction} className="flex items-center gap-2">
                <input type="hidden" name="id" value={exercise.id} />
                <select name="speed" defaultValue="1" className="rounded border border-slate-300 px-2 py-1 text-sm">
                  <option value="1">×1 real-time</option>
                  <option value="5">×5</option>
                  <option value="15">×15</option>
                  <option value="60">×60 (1 min = 1 D-Day hr)</option>
                </select>
                <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white hover:bg-slate-700">
                  Start exercise
                </button>
              </form>
            )}
          </div>
        )}
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        <Stat label="Important Business Services" value={exercise.scenario._count.ibsList} />
        <Stat label="Scenario events" value={exercise.scenario._count.events} />
        <Stat label="Injects" value={exercise.scenario._count.injects} />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Documents</h2>
        {exercise.scenario.artefacts.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs uppercase tracking-wide text-slate-500">From the scenario</p>
            <ArtefactList
              artefacts={exercise.scenario.artefacts}
              canManage={false}
              empty="No scenario-level documents."
            />
            <p className="text-xs text-slate-500">
              Manage scenario documents on the{" "}
              <Link href={`/scenarios/${exercise.scenario.id}`} className="underline">
                scenario page
              </Link>
              .
            </p>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wide text-slate-500">For this exercise</p>
          <ArtefactList
            artefacts={exercise.artefacts}
            canManage={canManage}
            empty="No exercise-specific documents yet."
          />
          {canManage && <ArtefactUpload target="EXERCISE" targetId={exercise.id} />}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Readiness checklist</h2>
        <ul className="grid gap-2 sm:grid-cols-2">
          {readyChecks.map((c) => (
            <li
              key={c.label}
              className="flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm"
            >
              <span
                className={`inline-block h-3 w-3 rounded-full ${c.ok ? "bg-emerald-500" : "bg-slate-300"}`}
              />
              {c.label}
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teams</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {exercise.teams.map((t) => (
            <div key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="font-medium">{t.name}</div>
              {t.description && <p className="mt-1 text-xs text-slate-500">{t.description}</p>}
              <ul className="mt-3 space-y-1 text-sm">
                {t.members.length === 0 && (
                  <li className="text-xs text-slate-400">No members yet.</li>
                )}
                {t.members.map((m) => (
                  <li key={m.id} className="flex items-center justify-between">
                    <span>
                      <span className="font-medium">{m.user.name ?? m.user.email}</span>
                      <span className="ml-2 text-xs text-slate-500">{m.roleTitle}</span>
                    </span>
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">
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
    <div className="rounded-md border border-slate-200 bg-white p-4">
      <div className="text-xs uppercase tracking-wide text-slate-500">{label}</div>
      <div className="mt-1 text-2xl font-semibold">{value}</div>
    </div>
  );
}
