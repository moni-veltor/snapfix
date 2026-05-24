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
import InjectComposerModal from "@/components/scenario/InjectComposerModal";
import { loadReadReceipts } from "@/lib/read-receipts";
import FacilitatorRuntimeControls from "@/components/live/FacilitatorRuntimeControls";
import FacilitatorSitrepGapPanel, {
  type SitrepGapRow,
} from "@/components/facilitator/FacilitatorSitrepGapPanel";
import { prisma } from "@/lib/prisma";
import { currentDDay } from "@/lib/dday";

/** Parse a "HH:MM" D-Day clock value into total minutes; null if malformed. */
function ddayHHMMToMinutes(value: string): number | null {
  const m = value.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (Number.isNaN(h) || Number.isNaN(min)) return null;
  return h * 60 + min;
}

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
  const rosterRoles = await prisma.exerciseParticipant.findMany({
    where: { exerciseId: exercise.id },
    select: { roleTitle: true },
    distinct: ["roleTitle"],
  });
  const rosterRoleTitles = rosterRoles.map((r) => r.roleTitle).sort();

  // Sitrep-cadence roll-up per BU. Pulls the latest sitrep per BU for
  // any incident invoked on this exercise, then computes minutes-since
  // and promise-overdue against the live D-Day clock. Same thresholds
  // as the participant-side SitrepCadenceBanner.
  const activeIncident = await prisma.incident.findFirst({
    where: {
      exerciseId: exercise.id,
      status: { in: ["INVOKED", "CONTAINED", "RESOLVED"] },
    },
    orderBy: { invokedAt: "desc" },
    select: { id: true },
  });
  const sitrepRows = activeIncident
    ? await prisma.sitrep.findMany({
        where: { incidentId: activeIncident.id },
        orderBy: { createdAt: "desc" },
      })
    : [];
  const sitrepClock = currentDDay(exercise.dDayAnchor, exercise.speedMultiplier);
  const sitrepDDayMin = ddayHHMMToMinutes(sitrepClock.hhmm);
  // Server-component render maps 1:1 to a request — snapshot the wall
  // clock once so all sitrep-age math is consistent for this response.
  // eslint-disable-next-line react-hooks/purity
  const sitrepNowMs = Date.now();
  const latestPerBU = new Map<string, (typeof sitrepRows)[number]>();
  for (const s of sitrepRows) {
    if (!latestPerBU.has(s.businessUnit)) latestPerBU.set(s.businessUnit, s);
  }
  const sitrepGapRows: SitrepGapRow[] = Array.from(latestPerBU.values()).map((s) => {
    const minutesSinceLast = Math.floor(
      (sitrepNowMs - s.createdAt.getTime()) / 60_000,
    );
    const promised = s.nextUpdateDDayTime;
    let promiseOverdueMin: number | null = null;
    if (promised) {
      const promisedMin = ddayHHMMToMinutes(promised);
      if (promisedMin !== null && sitrepDDayMin !== null) {
        const delta = sitrepDDayMin - promisedMin;
        if (delta > 0) promiseOverdueMin = delta;
      }
    }
    return {
      businessUnit: s.businessUnit,
      minutesSinceLast,
      promisedNextUpdate: promised,
      promiseOverdueMin,
    };
  });

  const overdueBeats =
    events.filter((e) => !e.released).length +
    injects.filter((j) => !j.released).length;

  // Roles + next-inject-no for the in-flight composer modal. Pull role
  // titles from existing inject/event addressing so the composer can warn
  // about typos against the cast that's already in play.
  const knownRoles = Array.from(
    new Set<string>([
      ...exercise.scenario.injects.flatMap((j) => [
        ...(j.senderRoleTitle ? [j.senderRoleTitle] : []),
        ...(j.toRoleTitles ?? []),
        ...(j.ccRoleTitles ?? []),
      ]),
      ...exercise.scenario.events.flatMap((e) => [
        ...(e.senderRoleTitle ? [e.senderRoleTitle] : []),
        ...(e.toRoleTitles ?? []),
        ...(e.ccRoleTitles ?? []),
      ]),
    ]),
  );
  const nextInjectNo =
    Math.max(0, ...exercise.scenario.injects.map((j) => j.injectNo)) + 1;

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
            <Link href={`/exercises/${exercise.id}`} className="underline">
              Planning
            </Link>
            {" · "}
            <Link href={`/exercises/${exercise.id}/debrief`} className="underline">
              Debrief
            </Link>
            {" · "}
            <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{exercise.status}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <InjectComposerModal
            scenarioId={exercise.scenario.id}
            nextInjectNo={nextInjectNo}
            knownRoles={knownRoles}
            triggerLabel="Compose inject"
          />
          <DDayClockTicker
            anchor={exercise.dDayAnchor?.toISOString() ?? null}
            speedMultiplier={exercise.speedMultiplier}
            status={exercise.status}
          />
        </div>
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

      <FacilitatorRuntimeControls
        exerciseId={exercise.id}
        status={exercise.status}
        rosterRoleTitles={rosterRoleTitles}
      />

      <FacilitatorSitrepGapPanel
        rows={sitrepGapRows}
        incidentInvoked={!!activeIncident}
      />

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
