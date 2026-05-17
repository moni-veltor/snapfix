import { NextResponse } from "next/server";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateIcs } from "@/lib/exercise-ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const me = await requireOrgUser();
  const { id } = await params;

  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    select: {
      id: true,
      title: true,
      description: true,
      plannedDate: true,
      durationMin: true,
      location: true,
      facilitator: { select: { name: true, email: true } },
      participants: {
        select: { user: { select: { email: true } } },
      },
    },
  });

  if (!exercise || !exercise.plannedDate || !exercise.durationMin) {
    return new NextResponse("Exercise needs a planned date + duration to generate an invite.", {
      status: 422,
    });
  }

  const ics = generateIcs({
    uid: exercise.id,
    title: `[Exercise] ${exercise.title}`,
    description: exercise.description ?? "Operational-resilience exercise. See SnapFix for details.",
    location: exercise.location,
    start: exercise.plannedDate,
    durationMin: exercise.durationMin,
    organizerName: exercise.facilitator?.name ?? exercise.facilitator?.email ?? "Facilitator",
    organizerEmail: exercise.facilitator?.email ?? "no-reply@snapfix",
    attendeeEmails: exercise.participants.map((p) => p.user.email),
  });

  return new NextResponse(ics, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="snapfix-${exercise.id}.ics"`,
    },
  });
}
