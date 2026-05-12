"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOrgRole } from "@/lib/auth";

const DEFAULT_TEAMS = [
  { name: "Incident Management", description: "Coordinates the overall response." },
  { name: "Tech Recovery", description: "Restores systems and infrastructure." },
  { name: "Communications", description: "Customer, regulator and media comms." },
  { name: "Customer Operations", description: "Customer-facing operations and call centre." },
  { name: "Executive Observers", description: "CEO, CRO, CCO — observe and authorise." },
];

const CreateExerciseSchema = z.object({
  scenarioId: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  plannedDate: z.string().optional(),
  location: z.string().optional(),
});

export async function createExerciseAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = CreateExerciseSchema.parse({
    scenarioId: formData.get("scenarioId"),
    title: formData.get("title") || `Exercise ${new Date().toISOString().slice(0, 16)}`,
    description: formData.get("description") || undefined,
    plannedDate: formData.get("plannedDate") || undefined,
    location: formData.get("location") || undefined,
  });
  // Verify scenario belongs to the org
  const scenario = await prisma.scenario.findFirst({
    where: { id: parsed.scenarioId, orgId: user.orgId },
    select: { id: true },
  });
  if (!scenario) {
    redirect("/scenarios");
  }
  const exercise = await prisma.exercise.create({
    data: {
      orgId: user.orgId,
      scenarioId: parsed.scenarioId,
      facilitatorId: user.id,
      title: parsed.title,
      description: parsed.description ?? null,
      plannedDate: parsed.plannedDate ? new Date(parsed.plannedDate) : null,
      location: parsed.location ?? null,
      status: "PLANNING",
      teams: {
        create: DEFAULT_TEAMS.map((t, i) => ({ ...t, orderIdx: i })),
      },
      participants: {
        create: {
          userId: user.id,
          roleTitle: "Facilitator",
          exerciseRole: "FACILITATOR",
        },
      },
    },
  });
  redirect(`/exercises/${exercise.id}`);
}

const UpdateExerciseSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  plannedDate: z.string().optional(),
  location: z.string().optional(),
});

export async function updateExerciseAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = UpdateExerciseSchema.parse({
    id: formData.get("id"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    plannedDate: formData.get("plannedDate") || undefined,
    location: formData.get("location") || undefined,
  });
  await prisma.exercise.updateMany({
    where: { id: parsed.id, orgId: user.orgId },
    data: {
      title: parsed.title,
      description: parsed.description ?? null,
      plannedDate: parsed.plannedDate ? new Date(parsed.plannedDate) : null,
      location: parsed.location ?? null,
    },
  });
  revalidatePath(`/exercises/${parsed.id}`);
}

const TeamSchema = z.object({
  exerciseId: z.string().min(1),
  name: z.string().min(1).max(100),
  description: z.string().optional(),
});

export async function addTeamAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const parsed = TeamSchema.parse({
    exerciseId: formData.get("exerciseId"),
    name: formData.get("name"),
    description: formData.get("description") || undefined,
  });
  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: user.orgId },
    select: { id: true, teams: { select: { orderIdx: true } } },
  });
  if (!exercise) return;
  const nextIdx = exercise.teams.reduce((m, t) => Math.max(m, t.orderIdx), -1) + 1;
  await prisma.exerciseTeam.create({
    data: {
      exerciseId: parsed.exerciseId,
      name: parsed.name,
      description: parsed.description ?? null,
      orderIdx: nextIdx,
    },
  });
  revalidatePath(`/exercises/${parsed.exerciseId}/team`);
}

export async function removeTeamAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const teamId = String(formData.get("teamId"));
  const exerciseId = String(formData.get("exerciseId"));
  await prisma.exerciseTeam.deleteMany({
    where: { id: teamId, exercise: { orgId: user.orgId, id: exerciseId } },
  });
  revalidatePath(`/exercises/${exerciseId}/team`);
}

const AssignMemberSchema = z.object({
  exerciseId: z.string().min(1),
  userId: z.string().min(1),
  teamId: z.string().optional(),
  roleTitle: z.string().min(1).max(100),
  exerciseRole: z.enum(["FACILITATOR", "LEAD", "PARTICIPANT", "OBSERVER"]),
});

export async function assignMemberAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = AssignMemberSchema.parse({
    exerciseId: formData.get("exerciseId"),
    userId: formData.get("userId"),
    teamId: formData.get("teamId") || undefined,
    roleTitle: formData.get("roleTitle"),
    exerciseRole: formData.get("exerciseRole"),
  });
  // Verify both exercise and user belong to my org
  const [exercise, target] = await Promise.all([
    prisma.exercise.findFirst({
      where: { id: parsed.exerciseId, orgId: me.orgId },
      select: { id: true },
    }),
    prisma.user.findFirst({
      where: { id: parsed.userId, orgId: me.orgId },
      select: { id: true },
    }),
  ]);
  if (!exercise || !target) return;
  await prisma.exerciseParticipant.upsert({
    where: { exerciseId_userId: { exerciseId: parsed.exerciseId, userId: parsed.userId } },
    create: {
      exerciseId: parsed.exerciseId,
      userId: parsed.userId,
      teamId: parsed.teamId || null,
      roleTitle: parsed.roleTitle,
      exerciseRole: parsed.exerciseRole,
    },
    update: {
      teamId: parsed.teamId || null,
      roleTitle: parsed.roleTitle,
      exerciseRole: parsed.exerciseRole,
    },
  });
  revalidatePath(`/exercises/${parsed.exerciseId}/team`);
  revalidatePath(`/exercises/${parsed.exerciseId}`);
}

export async function removeExerciseMemberAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const exerciseId = String(formData.get("exerciseId"));
  const participantId = String(formData.get("participantId"));
  await prisma.exerciseParticipant.deleteMany({
    where: {
      id: participantId,
      exercise: { id: exerciseId, orgId: me.orgId },
    },
  });
  revalidatePath(`/exercises/${exerciseId}/team`);
  revalidatePath(`/exercises/${exerciseId}`);
}

export async function transitionToReadyAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  // Require at least one facilitator and at least 2 participants total
  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    include: { participants: true },
  });
  if (!exercise) return;
  const facilitatorCount = exercise.participants.filter((p) => p.exerciseRole === "FACILITATOR").length;
  if (facilitatorCount < 1 || exercise.participants.length < 2) return;
  await prisma.exercise.update({
    where: { id },
    data: { status: "READY" },
  });
  revalidatePath(`/exercises/${id}`);
}

export async function startExerciseAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const speed = Number(formData.get("speed") || "1") || 1;
  const now = new Date();
  // Must be in PLANNING/READY/PAUSED to start
  const exercise = await prisma.exercise.findFirst({
    where: { id, orgId: me.orgId },
    select: { status: true, startedAt: true, dDayAnchor: true },
  });
  if (!exercise) return;
  await prisma.exercise.update({
    where: { id },
    data: {
      status: "IN_PROGRESS",
      startedAt: exercise.startedAt ?? now,
      dDayAnchor: exercise.dDayAnchor ?? now,
      pausedAt: null,
      speedMultiplier: speed,
    },
  });
  revalidatePath(`/exercises/${id}`);
  revalidatePath(`/exercises/${id}/facilitator`);
}

export async function pauseExerciseAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.exercise.update({
    where: { id },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
  revalidatePath(`/exercises/${id}/facilitator`);
}

export async function completeExerciseAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.exercise.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  revalidatePath(`/exercises/${id}`);
}

export async function releaseEventAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const exerciseId = String(formData.get("exerciseId"));
  const eventId = String(formData.get("eventId"));
  await prisma.eventRelease.upsert({
    where: { exerciseId_eventId: { exerciseId, eventId } },
    create: { exerciseId, eventId, triggeredBy: user.id },
    update: {},
  });
  revalidatePath(`/exercises/${exerciseId}/facilitator`);
  revalidatePath(`/exercises/${exerciseId}/participant`);
}

export async function releaseInjectAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const exerciseId = String(formData.get("exerciseId"));
  const injectId = String(formData.get("injectId"));
  await prisma.injectRelease.upsert({
    where: { exerciseId_injectId: { exerciseId, injectId } },
    create: { exerciseId, injectId, triggeredBy: user.id },
    update: {},
  });
  revalidatePath(`/exercises/${exerciseId}/facilitator`);
  revalidatePath(`/exercises/${exerciseId}/participant`);
}

const LogInput = z.object({
  exerciseId: z.string(),
  dDayTime: z.string().regex(/^\d{2}:\d{2}$/),
  kind: z.enum(["DECISION", "ACTION", "CHALLENGE", "RESOURCE", "NOTE"]),
  body: z.string().min(1),
});

export async function addLogEntryAction(formData: FormData) {
  const user = await requireUser();
  const data = LogInput.parse(Object.fromEntries(formData));
  await prisma.incidentLogEntry.create({
    data: { ...data, authorId: user.id },
  });
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${data.exerciseId}/participant`);
}

const ResponseInput = z.object({
  exerciseId: z.string(),
  injectId: z.string(),
  assessment: z.string().min(1),
  proposedActions: z.string().min(1),
  stakeholders: z.string().optional(),
  resources: z.string().optional(),
  commsNeeds: z.string().optional(),
});

export async function upsertResponseAction(formData: FormData) {
  const user = await requireUser();
  const data = ResponseInput.parse(Object.fromEntries(formData));
  // One response per (run, inject, author)
  const existing = await prisma.participantResponse.findFirst({
    where: { exerciseId: data.exerciseId, injectId: data.injectId, authorId: user.id },
  });
  if (existing) {
    await prisma.participantResponse.update({
      where: { id: existing.id },
      data: {
        assessment: data.assessment,
        proposedActions: data.proposedActions,
        stakeholders: data.stakeholders ?? null,
        resources: data.resources ?? null,
        commsNeeds: data.commsNeeds ?? null,
      },
    });
  } else {
    await prisma.participantResponse.create({
      data: { ...data, authorId: user.id },
    });
  }
  revalidatePath(`/exercises/${data.exerciseId}/participant`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

const CommsInput = z.object({
  exerciseId: z.string(),
  audience: z.enum(["CUSTOMER", "REGULATOR", "INTERNAL", "SENIOR_MGMT", "MEDIA"]),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function createCommsDraftAction(formData: FormData) {
  const user = await requireUser();
  const data = CommsInput.parse(Object.fromEntries(formData));
  await prisma.communicationDraft.create({
    data: { ...data, authorId: user.id },
  });
  revalidatePath(`/exercises/${data.exerciseId}/participant`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

export async function answerDebriefAction(formData: FormData) {
  const user = await requireUser();
  const exerciseId = String(formData.get("exerciseId"));
  const questionId = String(formData.get("questionId"));
  const body = String(formData.get("body"));
  if (!body.trim()) return;
  await prisma.debriefAnswer.create({
    data: { exerciseId, questionId, body, authorId: user.id },
  });
  revalidatePath(`/exercises/${exerciseId}/debrief`);
}

const AarInput = z.object({
  exerciseId: z.string(),
  summary: z.string().min(1),
  strengths: z.string().optional(),
  gaps: z.string().optional(),
  actions: z.string().optional(),
});

export async function upsertAARAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const data = AarInput.parse(Object.fromEntries(formData));
  await prisma.afterActionReport.upsert({
    where: { exerciseId: data.exerciseId },
    create: data,
    update: {
      summary: data.summary,
      strengths: data.strengths ?? null,
      gaps: data.gaps ?? null,
      actions: data.actions ?? null,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/debrief`);
}
