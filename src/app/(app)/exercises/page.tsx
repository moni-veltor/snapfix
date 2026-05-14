import Link from "next/link";
import { Target, Plus } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import EmptyState from "@/components/EmptyState";
import PageHero from "@/components/ui/PageHero";
import { ExercisesIllustration } from "@/components/illustrations/Illustrations";
import ExerciseGrid from "@/components/exercises/ExerciseGrid";

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
        actions={
          canCreate && (
            <Link
              href="/exercises/new"
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-card)] transition-all hover:-translate-y-px hover:bg-slate-700 hover:shadow-[var(--shadow-card-md)] dark:bg-indigo-500 dark:hover:bg-indigo-400"
            >
              <Plus size={14} strokeWidth={2.4} />
              Plan an exercise
            </Link>
          )
        }
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
