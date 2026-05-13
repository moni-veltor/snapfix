import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { loadExerciseWithScenario } from "@/lib/exercise-queries";
import { answerDebriefAction, upsertAARAction } from "@/app/actions/exercises";
import {
  createActionItemAction,
  deleteActionItemAction,
  updateActionItemStatusAction,
} from "@/app/actions/action-items";
import { savePIRAction, saveRetrospectiveAction } from "@/app/actions/closure";
import { prisma } from "@/lib/prisma";

export default async function DebriefPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOrgUser();
  const { id } = await params;
  const exercise = await loadExerciseWithScenario(id, user.orgId);
  if (!exercise) notFound();
  const isFacilitator = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  const actionItems = await prisma.exerciseActionItem.findMany({
    where: { exerciseId: exercise.id },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: { ownerUser: { select: { name: true, email: true } } },
  });
  const closedIncident = await prisma.incident.findFirst({
    where: { exerciseId: exercise.id, status: "CLOSED" },
    orderBy: { closedAt: "desc" },
    include: { postIncidentReport: true },
  });
  const retrospective = await prisma.retrospective.findFirst({
    where: { exerciseId: exercise.id },
  });
  const answersByQuestion = new Map<string, typeof exercise.debriefAnswers>();
  for (const a of exercise.debriefAnswers) {
    const list = answersByQuestion.get(a.questionId) ?? [];
    list.push(a);
    answersByQuestion.set(a.questionId, list);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Debrief — {exercise.title}</h1>
        <p className="text-sm text-muted">
          <Link href={`/exercises/${exercise.id}`} className="underline">Back to exercise</Link>
          {" · "}
          {exercise.scenario.title}
          {" · "}
          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">{exercise.status}</span>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Debrief questions</h2>
        {exercise.scenario.debriefQuestions.length === 0 && (
          <p className="text-sm text-muted">No debrief questions defined for this scenario.</p>
        )}
        <ul className="space-y-3">
          {exercise.scenario.debriefQuestions.map((q) => {
            const answers = answersByQuestion.get(q.id) ?? [];
            return (
              <li key={q.id} className="rounded-md border border-line bg-surface-1 p-4 text-sm">
                <div className="text-xs uppercase tracking-wide text-muted">{q.category}</div>
                <div className="mt-1 font-medium">{q.text}</div>
                <ul className="mt-2 space-y-1">
                  {answers.map((a) => (
                    <li key={a.id} className="rounded bg-surface-0 px-3 py-2">
                      <div className="text-xs text-muted">{a.author?.name ?? a.author?.email ?? "—"}</div>
                      <p className="whitespace-pre-wrap text-slate-700">{a.body}</p>
                    </li>
                  ))}
                </ul>
                <form action={answerDebriefAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="exerciseId" value={exercise.id} />
                  <input type="hidden" name="questionId" value={q.id} />
                  <textarea name="body" required rows={2} placeholder="Your answer…" className="flex-1 rounded border border-line-strong px-2 py-1" />
                  <button className="self-start rounded-md bg-slate-900 px-3 py-1.5 text-white">Submit</button>
                </form>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">After-Action Report</h2>
        {isFacilitator ? (
          <form action={upsertAARAction} className="space-y-3 rounded-md border border-line bg-surface-1 p-4">
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <TextArea label="Summary" name="summary" required defaultValue={exercise.aar?.summary ?? ""} />
            <TextArea label="Strengths" name="strengths" defaultValue={exercise.aar?.strengths ?? ""} />
            <TextArea label="Gaps & weaknesses" name="gaps" defaultValue={exercise.aar?.gaps ?? ""} />
            <TextArea label="Actions & next steps" name="actions" defaultValue={exercise.aar?.actions ?? ""} />
            <button className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white">
              {exercise.aar ? "Update AAR" : "Save AAR"}
            </button>
          </form>
        ) : exercise.aar ? (
          <div className="space-y-2 rounded-md border border-line bg-surface-1 p-4 text-sm">
            <ReadOnlyBlock label="Summary" body={exercise.aar.summary} />
            {exercise.aar.strengths && <ReadOnlyBlock label="Strengths" body={exercise.aar.strengths} />}
            {exercise.aar.gaps && <ReadOnlyBlock label="Gaps & weaknesses" body={exercise.aar.gaps} />}
            {exercise.aar.actions && <ReadOnlyBlock label="Actions & next steps" body={exercise.aar.actions} />}
          </div>
        ) : (
          <p className="text-sm text-muted">No AAR has been published yet.</p>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Action items</h2>
        {actionItems.length === 0 ? (
          <p className="text-sm text-muted">
            No action items yet. Capture follow-up actions below so they don't get lost.
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {actionItems.map((a) => (
              <li
                key={a.id}
                className="flex items-start justify-between gap-3 rounded-md border border-line bg-surface-1 p-3"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{a.title}</span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                      {a.priority}
                    </span>
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs">
                      {a.status}
                    </span>
                  </div>
                  {a.description && <p className="mt-1 text-slate-600">{a.description}</p>}
                  <div className="mt-1 text-xs text-muted">
                    {a.ownerUser?.name ?? a.ownerUser?.email ?? a.ownerText ?? "Unassigned"}
                    {a.dueAt && <> · Due {a.dueAt.toISOString().slice(0, 10)}</>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <form action={updateActionItemStatusAction}>
                    <input type="hidden" name="id" value={a.id} />
                    <select
                      name="status"
                      defaultValue={a.status}
                      className="rounded border border-line-strong px-2 py-1 text-xs"
                    >
                      <option value="OPEN">OPEN</option>
                      <option value="IN_PROGRESS">IN_PROGRESS</option>
                      <option value="BLOCKED">BLOCKED</option>
                      <option value="DONE">DONE</option>
                      <option value="WONT_FIX">WONT_FIX</option>
                    </select>
                    <button className="ml-1 rounded border border-line-strong px-2 py-1 text-xs">
                      Save
                    </button>
                  </form>
                  {isFacilitator && (
                    <form action={deleteActionItemAction}>
                      <input type="hidden" name="id" value={a.id} />
                      <button className="text-xs text-rose-600 hover:underline">Delete</button>
                    </form>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
        <form
          action={createActionItemAction}
          className="grid grid-cols-1 gap-2 rounded-md border border-dashed border-line-strong bg-surface-1 p-3 text-sm sm:grid-cols-2"
        >
          <input type="hidden" name="exerciseId" value={exercise.id} />
          <input
            name="title"
            required
            maxLength={200}
            placeholder="Action item title (e.g. 'Update Sumsub fallback runbook')"
            className="rounded border border-line-strong px-2 py-1 sm:col-span-2"
          />
          <textarea
            name="description"
            rows={2}
            placeholder="Description (optional)"
            className="rounded border border-line-strong px-2 py-1 sm:col-span-2"
          />
          <input
            name="ownerText"
            placeholder="Owner (free text)"
            className="rounded border border-line-strong px-2 py-1"
          />
          <input
            name="dueAt"
            type="date"
            className="rounded border border-line-strong px-2 py-1"
          />
          <select
            name="priority"
            defaultValue="MEDIUM"
            className="rounded border border-line-strong px-2 py-1"
          >
            <option value="LOW">LOW</option>
            <option value="MEDIUM">MEDIUM</option>
            <option value="HIGH">HIGH</option>
            <option value="CRITICAL">CRITICAL</option>
          </select>
          <button className="rounded-md bg-slate-900 px-3 py-1.5 text-white">
            Add action item
          </button>
        </form>
      </section>

      {closedIncident?.postIncidentReport && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Post-Incident Report</h2>
            <p className="text-xs text-muted">
              {closedIncident.postIncidentReport.submittedAt
                ? `Submitted ${closedIncident.postIncidentReport.submittedAt.toISOString().slice(0, 10)}`
                : `Due ${closedIncident.postIncidentReport.dueAt.toISOString().slice(0, 10)} · IMP §6.5.3 (10 business days)`}
            </p>
          </div>
          <form
            action={savePIRAction}
            className="space-y-3 rounded-md border border-line bg-surface-1 p-4"
          >
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <input type="hidden" name="incidentId" value={closedIncident.id} />
            <TextArea label="Incident summary" name="incidentSummary" defaultValue={closedIncident.postIncidentReport.incidentSummary ?? ""} />
            <TextArea label="Timeline" name="timeline" defaultValue={closedIncident.postIncidentReport.timeline ?? ""} />
            <TextArea label="Root cause" name="rootCause" defaultValue={closedIncident.postIncidentReport.rootCause ?? ""} />
            <TextArea label="Customer impact" name="customerImpact" defaultValue={closedIncident.postIncidentReport.customerImpact ?? ""} />
            <TextArea label="Regulatory impact" name="regulatoryImpact" defaultValue={closedIncident.postIncidentReport.regulatoryImpact ?? ""} />
            <TextArea label="Control failures" name="controlFailures" defaultValue={closedIncident.postIncidentReport.controlFailures ?? ""} />
            <TextArea label="What worked well" name="whatWorkedWell" defaultValue={closedIncident.postIncidentReport.whatWorkedWell ?? ""} />
            <TextArea label="Remediation commitments" name="remediationCommitments" defaultValue={closedIncident.postIncidentReport.remediationCommitments ?? ""} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="submit" />
              Mark as submitted (tables into the next ERCC then BRCC)
            </label>
            <button className="rounded-md bg-slate-900 px-3 py-1.5 text-white">Save PIR</button>
          </form>
        </section>
      )}

      {retrospective && (
        <section className="space-y-3">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">Team retrospective</h2>
            <p className="text-xs text-muted">
              {retrospective.heldAt
                ? `Held ${retrospective.heldAt.toISOString().slice(0, 10)}`
                : `Due ${retrospective.dueAt.toISOString().slice(0, 10)} · BCPlans §6.6.1 R-5 (5 business days)`}
            </p>
          </div>
          <form
            action={saveRetrospectiveAction}
            className="space-y-3 rounded-md border border-line bg-surface-1 p-4"
          >
            <input type="hidden" name="exerciseId" value={exercise.id} />
            <TextArea label="What went well" name="wentWell" defaultValue={retrospective.wentWell ?? ""} />
            <TextArea label="What didn't go well" name="didntGoWell" defaultValue={retrospective.didntGoWell ?? ""} />
            <TextArea label="Improvements" name="improvements" defaultValue={retrospective.improvements ?? ""} />
            <label className="flex items-center gap-2 text-xs">
              <input type="checkbox" name="held" />
              Mark retrospective as held
            </label>
            <button className="rounded-md bg-slate-900 px-3 py-1.5 text-white">Save retrospective</button>
          </form>
        </section>
      )}
    </div>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <textarea {...props} rows={4} className="mt-1 w-full rounded-md border border-line-strong px-3 py-2" />
    </label>
  );
}

function ReadOnlyBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-muted">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-slate-700">{body}</p>
    </div>
  );
}
