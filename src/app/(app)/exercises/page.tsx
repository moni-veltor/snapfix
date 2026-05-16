import { Target } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";
import PageHero from "@/components/ui/PageHero";
import { ExercisesIllustration } from "@/components/illustrations/Illustrations";
import ExerciseGrid from "@/components/exercises/ExerciseGrid";
import ExerciseAddButton from "@/components/exercises/ExerciseAddButton";

export default async function ExercisesPage() {
  const user = await requireOrgUser();
  const [exercises, scenarios] = await Promise.all([
    prisma.exercise.findMany({
      where: { orgId: user.orgId },
      orderBy: [{ status: "asc" }, { plannedDate: "asc" }, { createdAt: "desc" }],
      include: {
        scenario: { select: { title: true } },
        facilitator: { select: { name: true, email: true } },
        _count: { select: { participants: true, teams: true } },
      },
    }),
    prisma.scenario.findMany({
      where: { orgId: user.orgId, isTemplate: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, dDayDate: true },
    }),
  ]);
  const canCreate = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  const scenarioOptions = scenarios.map((s) => ({
    id: s.id,
    title: s.title,
    dDayDate: s.dDayDate.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="War room"
        icon={Target}
        title="Exercises"
        pitch="Where scenarios meet your team. Plan it, run it live with a D-Day clock, debrief honestly, learn fast."
        actions={canCreate && <ExerciseAddButton scenarios={scenarioOptions} />}
      />
      {exercises.length === 0 ? (
        <EmptyState
          icon={<ExercisesIllustration size={96} className="text-indigo-500 dark:text-indigo-300" />}
          title="A quiet calendar"
          body={
            canCreate
              ? "Pick a scenario, set a date, assemble the team. The platform handles the D-Day clock, the addressed inbox and the read-receipt grid."
              : "Your team hasn't planned an exercise yet. When they do, you'll see it here."
          }
          ctaHref={canCreate ? "/exercises?new=1" : undefined}
          ctaLabel={canCreate ? "Plan an exercise" : undefined}
          secondaryHref={canCreate ? "/templates" : undefined}
          secondaryLabel={canCreate ? "Browse scenarios" : undefined}
        />
      ) : (
        <ExerciseGrid exercises={exercises} />
      )}
    </div>
  );
}
