import { requireRole } from "@/lib/auth";
import { createScenarioAction } from "@/app/actions/scenarios";

export default async function NewScenarioPage() {
  await requireRole("FACILITATOR", "ADMIN");
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-semibold tracking-tight">New scenario</h1>
      <form action={createScenarioAction} className="space-y-4 rounded-lg border border-slate-200 bg-white p-5">
        <Field label="Title" name="title" required maxLength={200} />
        <TextArea label="Background" name="background" required rows={5} />
        <TextArea label="Agenda (optional)" name="agenda" rows={4} />
        <div className="grid grid-cols-2 gap-3">
          <Field label="D-Day date" name="dDayDate" type="date" required />
          <Field label="Duration (minutes)" name="durationMin" type="number" defaultValue={120} required min={15} max={1440} />
        </div>
        <button
          type="submit"
          className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
        >
          Create scenario
        </button>
      </form>
    </div>
  );
}

function Field({ label, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <input {...props} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}

function TextArea({ label, ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-slate-700">{label}</span>
      <textarea {...props} className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2" />
    </label>
  );
}
