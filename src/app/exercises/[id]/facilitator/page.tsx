import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgRole } from "@/lib/auth";
import { computeVisibility, loadExerciseWithScenario } from "@/lib/exercise-queries";
import {
  completeExerciseAction,
  pauseExerciseAction,
  releaseEventAction,
  releaseInjectAction,
  startExerciseAction,
} from "@/app/actions/exercises";
import DDayClockTicker from "@/components/DDayClockTicker";
import IncidentLogPanel from "@/components/IncidentLogPanel";

export default async function FacilitatorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const { id } = await params;
  const exercise = await loadExerciseWithScenario(id, user.orgId);
  if (!exercise) notFound();
  const { clock, events, injects } = computeVisibility(exercise);

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          <p className="text-sm text-slate-500">
            {exercise.scenario.title} ·{" "}
            <Link href={`/exercises/${exercise.id}/debrief`} className="underline">
              Debrief
            </Link>
            {" · "}
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{exercise.status}</span>
          </p>
        </div>
        <DDayClockTicker
          anchor={exercise.dDayAnchor?.toISOString() ?? null}
          speedMultiplier={exercise.speedMultiplier}
          status={exercise.status}
        />
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-md border border-slate-200 bg-white p-3">
        {exercise.status === "IN_PROGRESS" ? (
          <>
            <form action={pauseExerciseAction}>
              <input type="hidden" name="id" value={exercise.id} />
              <button className="rounded-md border border-slate-300 px-3 py-1.5 text-sm">Pause</button>
            </form>
            <form action={completeExerciseAction}>
              <input type="hidden" name="id" value={exercise.id} />
              <button className="rounded-md bg-rose-600 px-3 py-1.5 text-sm text-white">Complete exercise</button>
            </form>
          </>
        ) : (
          <form action={startExerciseAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={exercise.id} />
            <label className="text-sm text-slate-600">
              Speed
              <select name="speed" defaultValue="1" className="ml-2 rounded border border-slate-300 px-2 py-1">
                <option value="1">×1 real-time</option>
                <option value="5">×5</option>
                <option value="15">×15</option>
                <option value="60">×60 (1 minute = 1 D-Day hour)</option>
              </select>
            </label>
            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm text-white">
              {exercise.status === "PAUSED" ? "Resume" : "Start exercise"}
            </button>
          </form>
        )}
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Master Scenario Events List</h2>
          <ul className="space-y-2">
            {events.map((e) => (
              <li key={e.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Event #{e.eventNo} · {e.scheduledTime} — {e.title}
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-700">{e.description}</p>
                  </div>
                  {e.released ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Released</span>
                  ) : (
                    <form action={releaseEventAction}>
                      <input type="hidden" name="exerciseId" value={exercise.id} />
                      <input type="hidden" name="eventId" value={e.id} />
                      <button className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white">Release now</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Injects</h2>
          <ul className="space-y-2">
            {injects.map((j) => (
              <li key={j.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="font-medium">
                      Inject #{j.injectNo} · {j.scheduledTime} — {j.summary}
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-slate-700">{j.description}</p>
                  </div>
                  {j.released ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs text-emerald-800">Released</span>
                  ) : (
                    <form action={releaseInjectAction}>
                      <input type="hidden" name="exerciseId" value={exercise.id} />
                      <input type="hidden" name="injectId" value={j.id} />
                      <button className="rounded-md bg-slate-900 px-3 py-1 text-xs text-white">Release now</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Incident log</h2>
        <IncidentLogPanel
          exerciseId={exercise.id}
          dDayHHMM={clock.hhmm}
          entries={exercise.incidentLog.map((e) => ({
            id: e.id,
            dDayTime: e.dDayTime,
            kind: e.kind,
            body: e.body,
            author: e.author?.name ?? e.author?.email ?? "—",
            createdAt: e.createdAt.toISOString(),
          }))}
        />
      </section>

      {exercise.responses.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Participant responses</h2>
          <ul className="space-y-2">
            {exercise.responses.map((r) => (
              <li key={r.id} className="rounded-md border border-slate-200 bg-white p-3 text-sm">
                <div className="text-xs text-slate-500">
                  Inject #{r.inject.injectNo} · {r.author.name ?? r.author.email}
                </div>
                <div className="mt-1 font-medium">{r.inject.summary}</div>
                <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Assessment:</span> {r.assessment}</p>
                <p className="mt-1 whitespace-pre-wrap"><span className="font-semibold">Proposed actions:</span> {r.proposedActions}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
