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
  /**
   * Encoded picker value. Either `builtin:DECISION_TYPE` for a built-in
   * DecisionType enum entry, or `org:<OrgDecisionType.id>` for an
   * org-defined preset. Falls back to plain enum name for backwards
   * compatibility with any older form posts.
   */
  decisionPick: z.string(),
  title: z.string().min(1),
  rationale: z.string().optional(),
  triggeredByInjectId: z.string().optional(),
});

const ApproveDecisionInput = z.object({
  exerciseId: z.string(),
  decisionId: z.string(),
});

/**
 * Approve a decision from the role-routed approvals dock. The caller's
 * role must be one of `approverRolesRequired` on the decision (case-
 * insensitive title/abbreviation match) and they cannot approve their own
 * decision. First-approver-wins — the schema models a single approver
 * stamp, so for joint-approval rows the second matching role's click is
 * a no-op rather than blocking on the first.
 */
export async function approveDecisionAction(formData: FormData) {
  const ctx = await ctxFor(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = ApproveDecisionInput.parse(Object.fromEntries(formData));

  const decision = await prisma.decisionRecord.findFirst({
    where: { id: data.decisionId, incident: { exerciseId: ctx.exercise.id } },
    select: {
      id: true,
      approverRolesRequired: true,
      approvedAt: true,
      authorUserId: true,
    },
  });
  if (!decision || decision.approvedAt) return;
  if (decision.authorUserId === ctx.me.id) return; // can't self-approve

  // Role-match check — participant's role title OR seat abbreviation must
  // appear in approverRolesRequired (case-insensitive).
  const seat = await prisma.exerciseSeat.findFirst({
    where: { exerciseId: ctx.exercise.id, holderUserId: ctx.me.id },
    include: { role: { select: { title: true, abbreviation: true } } },
  });
  const myRoleTokens = new Set<string>();
  if (ctx.participant.roleTitle) myRoleTokens.add(ctx.participant.roleTitle.toLowerCase());
  if (seat?.role.title) myRoleTokens.add(seat.role.title.toLowerCase());
  if (seat?.role.abbreviation) myRoleTokens.add(seat.role.abbreviation.toLowerCase());
  const required = decision.approverRolesRequired.map((r) => r.toLowerCase());
  const ok = required.some((r) => myRoleTokens.has(r));
  if (!ok) return;

  await prisma.decisionRecord.update({
    where: { id: decision.id },
    data: {
      approverParticipantId: ctx.participant.id,
      approverUserId: ctx.me.id,
      approvedAt: new Date(),
    },
  });

  revalidatePath(`/exercises/${ctx.exercise.id}/live`);
  revalidatePath(`/exercises/${ctx.exercise.id}/facilitator`);
}

export async function recordDecisionAction(formData: FormData) {
  const ctx = await ctxFor(String(formData.get("exerciseId")));
  if (!ctx) return;
  const data = DecisionInput.parse(Object.fromEntries(formData));

  const incident = await prisma.incident.findFirst({
    where: { id: data.incidentId, exerciseId: ctx.exercise.id },
  });
  if (!incident) return;

  const clock = currentDDay(ctx.exercise.dDayAnchor, ctx.exercise.speedMultiplier);

  let decisionTypeKey: DecisionType = DecisionType.OTHER;
  let orgDecisionTypeId: string | null = null;
  let approvers: string[] = [];

  if (data.decisionPick.startsWith("org:")) {
    const id = data.decisionPick.slice(4);
    const preset = await prisma.orgDecisionType.findFirst({
      where: { id, orgId: ctx.me.orgId, archived: false },
    });
    if (!preset) return;
    orgDecisionTypeId = preset.id;
    approvers = preset.approverRoles;
  } else {
    const code = data.decisionPick.startsWith("builtin:")
      ? data.decisionPick.slice(8)
      : data.decisionPick;
    decisionTypeKey = code as DecisionType;
    approvers = APPROVER_ROLES[code as keyof typeof DecisionType] ?? [];
  }

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
      decisionType: decisionTypeKey,
      title: data.title,
      rationale: data.rationale ?? null,
      authorParticipantId: ctx.participant.id,
      authorUserId: ctx.me.id,
      approverRolesRequired: approvers,
      orgDecisionTypeId,
      triggeredByInjectId:
        data.triggeredByInjectId && data.triggeredByInjectId !== ""
          ? data.triggeredByInjectId
          : null,
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
