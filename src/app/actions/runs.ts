"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireUser, requireOrgRole } from "@/lib/auth";

export async function createRunAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const scenarioId = String(formData.get("scenarioId"));
  const title = String(formData.get("title") || `Exercise run ${new Date().toISOString().slice(0, 16)}`);
  const run = await prisma.exerciseRun.create({
    data: { scenarioId, title, orgId: user.orgId, facilitatorId: user.id },
  });
  redirect(`/runs/${run.id}/facilitator`);
}

export async function startRunAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const speed = Number(formData.get("speed") || "1") || 1;
  const now = new Date();
  await prisma.exerciseRun.update({
    where: { id },
    data: {
      status: "IN_PROGRESS",
      startedAt: now,
      dDayAnchor: now,
      pausedAt: null,
      speedMultiplier: speed,
    },
  });
  revalidatePath(`/runs/${id}/facilitator`);
}

export async function pauseRunAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.exerciseRun.update({
    where: { id },
    data: { status: "PAUSED", pausedAt: new Date() },
  });
  revalidatePath(`/runs/${id}/facilitator`);
}

export async function completeRunAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  await prisma.exerciseRun.update({
    where: { id },
    data: { status: "COMPLETED", completedAt: new Date() },
  });
  revalidatePath(`/runs/${id}`);
}

export async function releaseEventAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const runId = String(formData.get("runId"));
  const eventId = String(formData.get("eventId"));
  await prisma.eventRelease.upsert({
    where: { runId_eventId: { runId, eventId } },
    create: { runId, eventId, triggeredBy: user.id },
    update: {},
  });
  revalidatePath(`/runs/${runId}/facilitator`);
  revalidatePath(`/runs/${runId}/participant`);
}

export async function releaseInjectAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const runId = String(formData.get("runId"));
  const injectId = String(formData.get("injectId"));
  await prisma.injectRelease.upsert({
    where: { runId_injectId: { runId, injectId } },
    create: { runId, injectId, triggeredBy: user.id },
    update: {},
  });
  revalidatePath(`/runs/${runId}/facilitator`);
  revalidatePath(`/runs/${runId}/participant`);
}

const LogInput = z.object({
  runId: z.string(),
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
  revalidatePath(`/runs/${data.runId}/facilitator`);
  revalidatePath(`/runs/${data.runId}/participant`);
}

const ResponseInput = z.object({
  runId: z.string(),
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
    where: { runId: data.runId, injectId: data.injectId, authorId: user.id },
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
  revalidatePath(`/runs/${data.runId}/participant`);
  revalidatePath(`/runs/${data.runId}/facilitator`);
}

const CommsInput = z.object({
  runId: z.string(),
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
  revalidatePath(`/runs/${data.runId}/participant`);
  revalidatePath(`/runs/${data.runId}/facilitator`);
}

export async function answerDebriefAction(formData: FormData) {
  const user = await requireUser();
  const runId = String(formData.get("runId"));
  const questionId = String(formData.get("questionId"));
  const body = String(formData.get("body"));
  if (!body.trim()) return;
  await prisma.debriefAnswer.create({
    data: { runId, questionId, body, authorId: user.id },
  });
  revalidatePath(`/runs/${runId}/debrief`);
}

const AarInput = z.object({
  runId: z.string(),
  summary: z.string().min(1),
  strengths: z.string().optional(),
  gaps: z.string().optional(),
  actions: z.string().optional(),
});

export async function upsertAARAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");
  const data = AarInput.parse(Object.fromEntries(formData));
  await prisma.afterActionReport.upsert({
    where: { runId: data.runId },
    create: data,
    update: {
      summary: data.summary,
      strengths: data.strengths ?? null,
      gaps: data.gaps ?? null,
      actions: data.actions ?? null,
    },
  });
  revalidatePath(`/runs/${data.runId}/debrief`);
}
