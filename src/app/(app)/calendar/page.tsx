import { CalendarClock } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import CalendarMonthGrid from "@/components/calendar/CalendarMonthGrid";
import ExerciseAddButton from "@/components/exercises/ExerciseAddButton";

export const metadata = { title: "Calendar — SnapFix" };

export default async function CalendarPage() {
  const me = await requireOrgUser();
  const canCreate = me.orgRole === "OWNER" || me.orgRole === "ADMIN";

  const exercises = await prisma.exercise.findMany({
    where: {
      orgId: me.orgId,
      OR: [{ plannedDate: { not: null } }, { startedAt: { not: null } }],
    },
    orderBy: [{ plannedDate: "asc" }, { startedAt: "asc" }],
    include: {
      scenario: { select: { title: true } },
      facilitator: { select: { name: true, email: true } },
    },
  });

  const exerciseDots = exercises.map((ex) => {
    const d = ex.plannedDate ?? ex.startedAt ?? ex.createdAt;
    return {
      id: ex.id,
      title: ex.title,
      scenarioTitle: ex.scenario.title,
      facilitator: ex.facilitator?.name ?? ex.facilitator?.email ?? null,
      status: ex.status,
      dateISO: d.toISOString(),
    };
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Schedule"
        icon={CalendarClock}
        title="Exercise calendar"
        pitch={
          exercises.length === 0
            ? "Nothing scheduled yet"
            : `${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"} scheduled`
        }
        actions={canCreate && <ExerciseAddButton />}
      />

      <CalendarMonthGrid exercises={exerciseDots} />
    </div>
  );
}
