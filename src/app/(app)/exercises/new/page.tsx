import { redirect } from "next/navigation";
import Link from "next/link";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createExerciseAction } from "@/app/actions/exercises";

export default async function NewExercisePage({
  searchParams,
}: {
  searchParams: Promise<{ scenarioId?: string }>;
}) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const scenarios = await prisma.scenario.findMany({
    where: { orgId: user.orgId },
    orderBy: { createdAt: "desc" },
    select: { id: true, title: true },
  });
  if (scenarios.length === 0) {
    redirect("/scenarios/new");
  }
  const sp = await searchParams;
  const preselectedScenarioId = sp.scenarioId && scenarios.some((s) => s.id === sp.scenarioId)
    ? sp.scenarioId
    : scenarios[0].id;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Plan a new exercise</h1>
        <p className="mt-1 text-sm text-muted">
          Pick a scenario, set a planned date, and we'll spin up default teams (Incident Mgmt, Tech
          Recovery, Comms, Customer Ops, Exec Observers). You can adjust everything after creating.
        </p>
      </header>

      <form
        action={createExerciseAction}
        className="space-y-4 rounded-md border border-line bg-surface-1 p-5"
      >
        <label className="block text-sm">
          <span className="text-ink">Scenario</span>
          <select
            name="scenarioId"
            required
            defaultValue={preselectedScenarioId}
            className="mt-1 w-full rounded-md border border-line-strong bg-surface-1 px-3 py-2"
          >
            {scenarios.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title}
              </option>
            ))}
          </select>
          <span className="mt-1 block text-xs text-muted">
            Don't see the right scenario?{" "}
            <Link href="/scenarios/new" className="underline">
              Create one
            </Link>
            .
          </span>
        </label>

        <Field
          label="Title"
          name="title"
          required
          maxLength={200}
          placeholder="e.g. Q3 Functional Exercise — Cyber Disruption"
        />
        <TextArea
          label="Description (optional)"
          name="description"
          rows={3}
          placeholder="Anything specific about this run of the scenario."
        />
        <div className="grid grid-cols-2 gap-3">
          <Field label="Planned date" name="plannedDate" type="datetime-local" />
          <Field label="Location" name="location" placeholder="e.g. London HQ, 10 Chiswell St" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/exercises"
            className="rounded-md border border-line-strong px-4 py-2 text-sm hover:bg-surface-1"
          >
            Cancel
          </Link>
          <button
            type="submit"
            className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white hover:bg-slate-700"
          >
            Create exercise
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <input
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}

function TextArea({
  label,
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block text-sm">
      <span className="text-ink">{label}</span>
      <textarea
        {...props}
        className="mt-1 w-full rounded-md border border-line-strong px-3 py-2 outline-none focus:ring-2 focus:ring-slate-400"
      />
    </label>
  );
}
