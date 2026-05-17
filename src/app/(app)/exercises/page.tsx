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
  const exercises = await prisma.exercise.findMany({
    where: { orgId: user.orgId },
    orderBy: [{ status: "asc" }, { plannedDate: "asc" }, { createdAt: "desc" }],
    include: {
      scenario: { select: { title: true } },
      facilitator: { select: { name: true, email: true } },
      _count: { select: { participants: true, teams: true } },
    },
  });
  const canCreate = user.orgRole === "OWNER" || user.orgRole === "ADMIN";

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="War room"
        icon={Target}
        title="Exercises"
        pitch="Where scenarios meet your team. Plan it, run it live with a D-Day clock, debrief honestly, learn fast."
        actions={canCreate && <ExerciseAddButton />}
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
          ctaHref={canCreate ? "/exercises/new" : undefined}
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
