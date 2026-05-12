import { notFound } from "next/navigation";
import Link from "next/link";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  addTeamAction,
  assignMemberAction,
  removeExerciseMemberAction,
  removeTeamAction,
} from "@/app/actions/exercises";

export default async function ExerciseTeamPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const { id } = await params;
  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    include: {
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
    },
  });
  if (!exercise) notFound();

  const orgUsers = await prisma.user.findMany({
    where: { orgId: me.orgId },
    orderBy: { name: "asc" },
    select: { id: true, name: true, email: true },
  });

  const participantByUserId = new Map(exercise.participants.map((p) => [p.userId, p]));

  return (
    <div className="space-y-10">
      <header className="flex items-baseline justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{exercise.title}</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Teams & people</h1>
        </div>
        <Link href={`/exercises/${exercise.id}`} className="text-sm underline">
          Back to overview
        </Link>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Teams</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {exercise.teams.map((t) => (
            <li key={t.id} className="rounded-md border border-slate-200 bg-white p-4">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="font-medium">{t.name}</div>
                  {t.description && (
                    <p className="mt-1 text-xs text-slate-500">{t.description}</p>
                  )}
                  <p className="mt-2 text-xs text-slate-500">
                    {t.members.length} {t.members.length === 1 ? "member" : "members"}
                  </p>
                </div>
                <form action={removeTeamAction}>
                  <input type="hidden" name="teamId" value={t.id} />
                  <input type="hidden" name="exerciseId" value={exercise.id} />
                  <button className="text-xs text-rose-600 hover:underline">Delete</button>
                </form>
              </div>
            </li>
          ))}
        </ul>
        <form
          action={addTeamAction}
          className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-slate-300 bg-white p-3 sm:grid-cols-[1fr_2fr_auto]"
        >
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input
            name="name"
            required
            placeholder="Team name"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <input
            name="description"
            placeholder="Description (optional)"
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          />
          <button className="rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white">
            Add team
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Assign / update someone on the exercise</h2>
        <form
          action={assignMemberAction}
          className="grid grid-cols-1 gap-2 rounded-md border border-slate-200 bg-white p-4 sm:grid-cols-2"
        >
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <label className="block text-sm">
            <span className="text-slate-700">Person (must already belong to the organisation)</span>
            <select
              name="userId"
              required
              defaultValue=""
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="" disabled>Select a person…</option>
              {orgUsers.map((u) => {
                const existing = participantByUserId.get(u.id);
                return (
                  <option key={u.id} value={u.id}>
                    {u.name ?? u.email}
                    {existing ? ` — currently ${existing.roleTitle}` : ""}
                  </option>
                );
              })}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Team</span>
            <select
              name="teamId"
              defaultValue=""
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="">— No team —</option>
              {exercise.teams.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Role title</span>
            <input
              name="roleTitle"
              required
              maxLength={100}
              placeholder="e.g. CTO, Sn.TPM, ISM"
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="text-slate-700">Exercise role</span>
            <select
              name="exerciseRole"
              required
              defaultValue="PARTICIPANT"
              className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2"
            >
              <option value="FACILITATOR">Facilitator</option>
              <option value="LEAD">Lead</option>
              <option value="PARTICIPANT">Participant</option>
              <option value="OBSERVER">Observer</option>
            </select>
          </label>
          <button className="col-span-1 rounded-md bg-slate-900 px-3 py-1.5 text-sm text-white sm:col-span-2">
            Save assignment
          </button>
        </form>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Current roster ({exercise.participants.length})</h2>
        <ul className="divide-y divide-slate-200 overflow-hidden rounded-md border border-slate-200 bg-white">
          {exercise.participants.length === 0 && (
            <li className="p-4 text-sm text-slate-500">No one assigned yet.</li>
          )}
          {exercise.participants.map((p) => {
            const team = exercise.teams.find((t) => t.id === p.teamId);
            return (
              <li key={p.id} className="flex items-center justify-between p-3 text-sm">
                <div>
                  <div className="font-medium">{p.user.name ?? p.user.email}</div>
                  <div className="text-xs text-slate-500">
                    {p.roleTitle} · {p.exerciseRole}
                    {team ? ` · ${team.name}` : " · (no team)"}
                  </div>
                </div>
                <form action={removeExerciseMemberAction}>
                  <input type="hidden" name="participantId" value={p.id} />
                  <input type="hidden" name="exerciseId" value={exercise.id} />
                  <button className="text-xs text-rose-600 hover:underline">Remove</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
