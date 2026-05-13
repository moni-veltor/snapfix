"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgUser } from "@/lib/auth";
import { currentDDay } from "@/lib/dday";
import { DecisionType, SitrepStatus } from "@/generated/prisma/enums";

async function ctxFor(exerciseId: string) {
  const me = await requireOrgUser();
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: me.orgId },
    select: { id: true, dDayAnchor: true, speedMultiplier: true },
  });
  if (!exercise) return null;
  const participant = await prisma.exerciseParticipant.findFirst({
    where: { exerciseId, userId: me.id },
  });
  return participant ? { me, exercise, participant } : null;
}

/** Map decision types to the roles whose approval the policy expects. */
const APPROVER_ROLES: Partial<Record<keyof typeof DecisionType, string[]>> = {
  INVOKE_IMT: ["CEO"],
  STAND_DOWN_IMT: ["CEO"],
  CLASSIFY_SEVERITY: ["CRO"],
  ACTIVATE_BCP: ["CEO", "CRO"], // joint
  DEACTIVATE_BCP: ["CEO", "CRO"],
  NOTIFY_FCA: ["CEO"],
  NOTIFY_PRA: ["CEO"],
  NOTIFY_ICO: ["CRO"],
  CONVENE_ACTION_COMMITTEE: ["CEO"],
  APPROVE_CRISIS_COMMS: ["CEO"],
  APPROVE_REGULATOR_COMMS: ["CEO"],
  CFO_EMERGENCY_SPEND: ["CFO"], // up to £100k; over that needs CEO+CFO joint
  DRAW_CONTINGENT_LIQUIDITY: ["CEO"],
  DO_NOT_PAY_RANSOM: ["Board", "Legal"],
  INSURANCE_INVOCATION: ["CRO"],
  RECOVERY_OPTION_CHOSEN: ["CEO"],
  OTHER: [],
};

const DecisionInput = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  decisionType: z.string(),
  title: z.string().min(1),
  rationale: z.string().optional(),
});

export async function recordDecisionAction(formData: FormData) {
  const ctx = await ctxFor(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = DecisionInput.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);
  const decisionTypeKey = data.decisionType as keyof typeof DecisionType;
  const approvers = APPROVER_ROLES[decisionTypeKey] ?? [];

  const logEntry = await prisma.incidentLogEntry.create({
    data: {
      exerciseId: ctx.exercise.id,
      incidentId: incident.id,
      authorId: ctx.me.id,
      dDayTime: clock.hhmm,
      kind: "DECISION",
      body: `${data.title}${data.rationale ? ` — ${data.rationale}` : ""}`,
    },
  });

  await prisma.decisionRecord.create({
    data: {
      incidentId: incident.id,
      logEntryId: logEntry.id,
      decisionType: decisionTypeKey as DecisionType,
      title: data.title,
      rationale: data.rationale ?? null,
      authorParticipantId: ctx.participant.id,
      authorUserId: ctx.me.id,
      approverRolesRequired: approvers,
      dDayTime: clock.hhmm,
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}

const SitrepInput = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  businessUnit: z.string().min(1),
  status: z.enum(["GREEN", "AMBER", "RED"]),
  summary: z.string().min(1),
  issues: z.string().optional(),
  asks: z.string().optional(),
  nextUpdateDDayTime: z.string().optional(),
});

export async function addSitrepAction(formData: FormData) {
  const ctx = await ctxFor(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = SitrepInput.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);

  await prisma.sitrep.create({
    data: {
      incidentId: incident.id,
      businessUnit: data.businessUnit,
      status: data.status as SitrepStatus,
      summary: data.summary,
      issues: data.issues ?? null,
      asks: data.asks ?? null,
      nextUpdateDDayTime: data.nextUpdateDDayTime ?? null,
      dDayTime: clock.hhmm,
      authorParticipantId: ctx.participant.id,
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}

const IMTMeetingInput = z.object({
  exerciseId: z.string(),
  incidentId: z.string(),
  situation: z.string().optional(),
  decisions: z.string().optional(),
  actions: z.string().optional(),
  risks: z.string().optional(),
  nextMeetingDDay: z.string().optional(),
});

export async function recordIMTMeetingAction(formData: FormData) {
  const ctx = await ctxFor(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = IMTMeetingInput.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);
  const meetingCount = await prisma.iMTMeeting.count({ where: { incidentId: incident.id } });

  await prisma.iMTMeeting.create({
    data: {
      incidentId: incident.id,
      meetingNumber: meetingCount + 1,
      startedAtDDay: clock.hhmm,
      situation: data.situation ?? null,
      decisions: data.decisions ?? null,
      actions: data.actions ?? null,
      risks: data.risks ?? null,
      nextMeetingDDay: data.nextMeetingDDay ?? null,
      scribeUserId: ctx.me.id,
      chairParticipantId: ctx.participant.id,
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}
