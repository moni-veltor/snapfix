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

  const [exercises, scenarios] = await Promise.all([
    prisma.exercise.findMany({
      where: {
        orgId: me.orgId,
        OR: [{ plannedDate: { not: null } }, { startedAt: { not: null } }],
      },
      orderBy: [{ plannedDate: "asc" }, { startedAt: "asc" }],
      include: {
        scenario: { select: { title: true } },
        facilitator: { select: { name: true, email: true } },
      },
    }),
    prisma.scenario.findMany({
      where: { orgId: me.orgId, isTemplate: false },
      orderBy: { createdAt: "desc" },
      select: { id: true, title: true, dDayDate: true },
    }),
  ]);

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

  const scenarioOptions = scenarios.map((s) => ({
    id: s.id,
    title: s.title,
    dDayDate: s.dDayDate.toISOString(),
  }));

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Schedule"
        icon={CalendarClock}
        title="Exercise calendar"
        pitch={
          exercises.length === 0
            ? "No exercises planned yet. Click Plan exercise to add the first one."
            : `${exercises.length} ${exercises.length === 1 ? "exercise" : "exercises"} with planned or started dates.`
        }
        actions={canCreate && <ExerciseAddButton scenarios={scenarioOptions} />}
      />

      <CalendarMonthGrid exercises={exerciseDots} />
    </div>
  );
}
