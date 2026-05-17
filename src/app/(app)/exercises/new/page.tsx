import Link from "next/link";
import { redirect } from "next/navigation";
import { requireOrgRole } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import WizardShell from "@/components/exercises/wizard/WizardShell";
import StepBasics from "./StepBasics";
import StepScenarioMinimal from "./StepScenarioMinimal";

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

  // ─── Step 2: Pick the primary scenario, create the Exercise ─────────────
  if (step === 2) {
    if (!carry.title) {
      // Came directly to Step 2 without basics — bounce back.
      redirect("/exercises/new?step=1");
    }
    const scenarios = await prisma.scenario.findMany({
      where: { OR: [{ orgId: user.orgId }, { orgId: null, isTemplate: true }] },
      orderBy: [{ isTemplate: "asc" }, { createdAt: "desc" }],
      select: {
        id: true,
        title: true,
        category: true,
        durationMin: true,
        isTemplate: true,
        _count: { select: { events: true, injects: true, ibsList: true } },
      },
    });

    const backParams = new URLSearchParams();
    backParams.set("step", "1");
    for (const [k, v] of Object.entries(carry)) {
      if (k === "step") continue;
      if (v) backParams.set(k, v);
    }
    return (
      <WizardShell currentStep={2} carryParams={carry} draftTitle={carry.title}>
        <StepScenarioMinimal
          scenarios={scenarios}
          basics={carry}
          backHref={`/exercises/new?${backParams.toString()}`}
        />
      </WizardShell>
    );
  }

  // ─── Steps 3-5: Placeholder until the next commits land ─────────────────
  const idRaw = Array.isArray(sp.id) ? sp.id[0] : sp.id;
  if (!idRaw) redirect("/exercises/new?step=1");
  const exercise = await prisma.exercise.findFirst({
    where: { id: idRaw, orgId: user.orgId },
    select: { id: true, title: true, status: true },
  });
  if (!exercise) redirect("/exercises/new?step=1");

  return (
    <WizardShell currentStep={step} carryParams={carry} draftTitle={exercise.title}>
      <section className="rounded-xl border border-dashed border-line bg-surface-1 p-6 text-sm">
        <p className="font-semibold text-ink">Step {step} arrives in the next commits</p>
        <p className="mt-1 text-muted">
          The wizard chrome and Steps 1-2 are live. Steps 3-5 (Team, Injects, Pre-flight) ship in
          commits C-G of the Plan-an-Exercise rollout.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <Link
            href={`/exercises/${exercise.id}`}
            className="inline-flex items-center gap-1.5 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Open this draft &rarr;
          </Link>
          <Link
            href="/exercises"
            className="inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-1 px-3 py-2 text-sm font-medium text-ink hover:border-line-strong hover:bg-surface-2"
          >
            Back to exercises
          </Link>
        </div>
      </section>
    </WizardShell>
  );
}
