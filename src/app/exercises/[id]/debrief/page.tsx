import Link from "next/link";
import { notFound } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";
import { loadExerciseWithScenario } from "@/lib/exercise-queries";
import { answerDebriefAction, upsertAARAction } from "@/app/actions/exercises";

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
        <p className="text-sm text-slate-500">
          <Link href={`/exercises/${exercise.id}`} className="underline">Back to exercise</Link>
          {" · "}
          {exercise.scenario.title}
          {" · "}
          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{exercise.status}</span>
        </p>
      </header>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Debrief questions</h2>
        {exercise.scenario.debriefQuestions.length === 0 && (
          <p className="text-sm text-slate-500">No debrief questions defined for this scenario.</p>
        )}
        <ul className="space-y-3">
          {exercise.scenario.debriefQuestions.map((q) => {
            const answers = answersByQuestion.get(q.id) ?? [];
            return (
              <li key={q.id} className="rounded-md border border-slate-200 bg-white p-4 text-sm">
                <div className="text-xs uppercase tracking-wide text-slate-500">{q.category}</div>
                <div className="mt-1 font-medium">{q.text}</div>
                <ul className="mt-2 space-y-1">
                  {answers.map((a) => (
                    <li key={a.id} className="rounded bg-slate-50 px-3 py-2">
                      <div className="text-xs text-slate-500">{a.author?.name ?? a.author?.email ?? "—"}</div>
                      <p className="whitespace-pre-wrap text-slate-700">{a.body}</p>
                    </li>
                  ))}
                </ul>
                <form action={answerDebriefAction} className="mt-2 flex gap-2">
                  <input type="hidden" name="exerciseId" value={exercise.id} />
                  <input type="hidden" name="questionId" value={q.id} />
                  <textarea name="body" required rows={2} placeholder="Your answer…" className="flex-1 rounded border border-slate-300 px-2 py-1" />
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
          <form action={upsertAARAction} className="space-y-3 rounded-md border border-slate-200 bg-white p-4">
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
          <div className="space-y-2 rounded-md border border-slate-200 bg-white p-4 text-sm">
            <ReadOnlyBlock label="Summary" body={exercise.aar.summary} />
            {exercise.aar.strengths && <ReadOnlyBlock label="Strengths" body={exercise.aar.strengths} />}
            {exercise.aar.gaps && <ReadOnlyBlock label="Gaps & weaknesses" body={exercise.aar.gaps} />}
            {exercise.aar.actions && <ReadOnlyBlock label="Actions & next steps" body={exercise.aar.actions} />}
          </div>
        ) : (
          <p className="text-sm text-slate-500">No AAR has been published yet.</p>
        )}
      </section>
    </div>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <textarea {...props} rows={4} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}

function ReadOnlyBlock({ label, body }: { label: string; body: string }) {
  return (
    <div>
      <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</div>
      <p className="mt-1 whitespace-pre-wrap text-slate-700">{body}</p>
    </div>
  );
}
