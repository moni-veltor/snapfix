import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgRole } from "@/lib/auth";
import { computeVisibility, loadExerciseWithScenario } from "@/lib/exercise-queries";
import {
  completeExerciseAction,
  pauseExerciseAction,
  startExerciseAction,
} from "@/app/actions/exercises";
import DDayClockTicker from "@/components/DDayClockTicker";
import IncidentLogPanel from "@/components/IncidentLogPanel";
import FacilitatorControls from "@/components/facilitator/FacilitatorControls";
import ReadReceiptGrid from "@/components/facilitator/ReadReceiptGrid";
import RunSheet from "@/components/facilitator/RunSheet";
import FacilitatorPanels from "@/components/facilitator/FacilitatorPanels";
import { loadReadReceipts } from "@/lib/read-receipts";

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
  const receipts = await loadReadReceipts(exercise.id);

  const overdueBeats =
    events.filter((e) => !e.released).length +
    injects.filter((j) => !j.released).length;

  return (
    <div className="space-y-5">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight">{exercise.title}</h1>
          <p className="text-sm text-muted">
            {exercise.scenario.title} ·{" "}
            <Link href={`/exercises/${exercise.id}/live`} className="underline">
              Live workspace
            </Link>
            {" · "}
            <Link href={`/exercises/${exercise.id}/team`} className="underline">
              Team
            </Link>
            {" · "}
            <Link href={`/exercises/${exercise.id}/debrief`} className="underline">
              Debrief
            </Link>
            {" · "}
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{exercise.status}</span>
          </p>
        </div>
        <DDayClockTicker
          anchor={exercise.dDayAnchor?.toISOString() ?? null}
          speedMultiplier={exercise.speedMultiplier}
          status={exercise.status}
        />
      </header>

      <section className="flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface-1 p-3">
        {exercise.status === "IN_PROGRESS" ? (
          <>
            <form action={pauseExerciseAction}>
              <input type="hidden" name="id" value={exercise.id} />
              <button className="rounded-md border border-line bg-surface-0 px-3 py-1.5 text-sm font-medium text-ink hover:bg-surface-2">
                Pause
              </button>
            </form>
            <form action={completeExerciseAction}>
              <input type="hidden" name="id" value={exercise.id} />
              <button className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-rose-500">
                Complete exercise
              </button>
            </form>
          </>
        ) : (
          <form action={startExerciseAction} className="flex items-center gap-2">
            <input type="hidden" name="id" value={exercise.id} />
            <label className="text-sm text-muted">
              Speed
              <select
                name="speed"
                defaultValue="1"
                className="ml-2 rounded-md border border-line bg-surface-0 px-2 py-1 text-sm"
              >
                <option value="1">×1 real-time</option>
                <option value="5">×5</option>
                <option value="15">×15</option>
                <option value="60">×60 (1 minute = 1 D-Day hour)</option>
              </select>
            </label>
            <button className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-500">
              {exercise.status === "PAUSED" ? "Resume" : "Start exercise"}
            </button>
          </form>
        )}
      </section>

      {(exercise.status === "IN_PROGRESS" || exercise.status === "PAUSED") && (
        <FacilitatorControls
          exerciseId={exercise.id}
          status={exercise.status}
          dDayHHMM={clock.hhmm}
        />
      )}

      {/* Two-pane: tabbed run sheet on the left, sticky live incident log on the right. */}
      <div className="grid gap-4 lg:grid-cols-12">
        <div className="lg:col-span-8">
          <FacilitatorPanels
            counts={{
              runsheet: overdueBeats,
              receipts: receipts ? receipts.messages.length : 0,
              responses: exercise.responses.length,
            }}
            panels={{
              runsheet: (
                <RunSheet
                  exerciseId={exercise.id}
                  events={events.map((e) => ({
                    id: e.id,
                    eventNo: e.eventNo,
                    scheduledTime: e.scheduledTime,
                    title: e.title,
                    description: e.description,
                    senderRoleTitle: e.senderRoleTitle,
                    toRoleTitles: e.toRoleTitles,
                    ccRoleTitles: e.ccRoleTitles,
                    released: e.released,
                  }))}
                  injects={injects.map((j) => ({
                    id: j.id,
                    injectNo: j.injectNo,
                    scheduledTime: j.scheduledTime,
                    summary: j.summary,
                    description: j.description,
                    senderRoleTitle: j.senderRoleTitle,
                    toRoleTitles: j.toRoleTitles,
                    ccRoleTitles: j.ccRoleTitles,
                    released: j.released,
                    injectKind: j.kind,
                  }))}
                  dDayHHMM={clock.hhmm}
                />
              ),
              receipts:
                receipts && receipts.messages.length > 0 ? (
                  <ReadReceiptGrid
                    messages={receipts.messages}
                    participants={receipts.participants}
                    cells={receipts.cells}
                  />
                ) : (
                  <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
                    No messages released yet. Read receipts appear once events / injects
                    are out.
                  </div>
                ),
              responses:
                exercise.responses.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-line bg-surface-1 p-8 text-center text-sm text-muted">
                    No participant assessments submitted yet.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {exercise.responses.map((r) => (
                      <li
                        key={r.id}
                        className="rounded-xl border border-line bg-surface-1 p-3 text-sm"
                      >
                        <div className="flex flex-wrap items-baseline gap-2 text-[10px] text-soft">
                          <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-800 dark:bg-amber-950/40 dark:text-amber-200">
                            Inject #{r.inject.injectNo}
                          </span>
                          <span className="text-muted">
                            {r.author.name ?? r.author.email}
                          </span>
                        </div>
                        <h4 className="mt-1 text-sm font-semibold text-ink">
                          {r.inject.summary}
                        </h4>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                          <span className="font-semibold text-ink">Assessment:</span>{" "}
                          {r.assessment}
                        </p>
                        <p className="mt-1 whitespace-pre-wrap text-xs text-muted">
                          <span className="font-semibold text-ink">
                            Proposed actions:
                          </span>{" "}
                          {r.proposedActions}
                        </p>
                      </li>
                    ))}
                  </ul>
                ),
            }}
          />
        </div>

        <aside className="lg:col-span-4">
          <div className="lg:sticky lg:top-4 space-y-3">
            <header className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-ink">Incident log</h2>
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-800 dark:bg-rose-950/40 dark:text-rose-200">
                Live
              </span>
            </header>
            <div className="max-h-[calc(100vh-12rem)] overflow-y-auto rounded-xl border border-line bg-surface-1">
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
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
