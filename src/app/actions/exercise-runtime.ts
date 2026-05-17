"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole, requireOrgUser } from "@/lib/auth";
import { appendAuditEntry } from "@/lib/audit-hash-chain";

// ─── Mid-exercise curveball ──────────────────────────────────────────────────

const CurveballSchema = z.object({
  exerciseId: z.string(),
  summary: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  toRoleTitlesCsv: z.string().min(1).max(500),
  senderRoleTitle: z.string().max(120).optional(),
  ccRoleTitlesCsv: z.string().max(500).optional(),
  kind: z.string().optional(),
});

/**
 * Facilitator fires an ad-hoc inject at the team during a live exercise.
 * Captured as an ExerciseInjectOverride with injectId=null + an immediate
 * "released now" InjectRelease so participants see it on their next poll.
 */
export async function fireCurveballInjectAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = CurveballSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: me.orgId },
    select: {
      id: true,
      status: true,
      dDayAnchor: true,
      speedMultiplier: true,
    },
  });
  if (!exercise) return;
  if (exercise.status !== "IN_PROGRESS" && exercise.status !== "PAUSED") return;

  // Compute the D-Day HH:MM at moment of firing so the inject is tagged
  // with the live clock position.
  const now = new Date();
  const dDayMin = exercise.dDayAnchor
    ? Math.floor(
        ((now.getTime() - exercise.dDayAnchor.getTime()) / 60_000) * exercise.speedMultiplier,
      )
    : 0;
  const hh = String(Math.floor(dDayMin / 60)).padStart(2, "0");
  const mm = String(Math.max(0, dDayMin) % 60).padStart(2, "0");
  const scheduledTime = `${hh}:${mm}`;

  await prisma.exerciseInjectOverride.create({
    data: {
      exerciseId: parsed.exerciseId,
      injectId: null,
      scheduledTime,
      summary: parsed.summary,
      description: parsed.description,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      kind: (parsed.kind as any) ?? null,
      senderRoleTitle: parsed.senderRoleTitle ?? "Facilitator",
      toRoleTitles: parsed.toRoleTitlesCsv.split(",").map((s) => s.trim()).filter(Boolean),
      ccRoleTitles: (parsed.ccRoleTitlesCsv ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
    },
  });

  await appendAuditEntry(parsed.exerciseId, {
    action: "CURVEBALL_FIRED",
    actorUserId: me.id,
    summary: parsed.summary,
    toRoleTitles: parsed.toRoleTitlesCsv,
    dDayTime: scheduledTime,
  });

  revalidatePath(`/exercises/${parsed.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${parsed.exerciseId}/live`);
}

// ─── Real-incident abort ─────────────────────────────────────────────────────

const AbortSchema = z.object({
  exerciseId: z.string(),
  reason: z.string().min(1).max(500),
});

/**
 * Hard abort. Used when a real incident takes over the war-room. Flips
 * status to ABANDONED, records timestamp + reason, frees all participants,
 * preserves all captured state for later resumption / archival.
 */
export async function abortExerciseAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = AbortSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: me.orgId },
    select: { id: true, status: true },
  });
  if (!exercise) return;
  if (exercise.status === "COMPLETED" || exercise.status === "ABANDONED") return;

  await prisma.exercise.update({
    where: { id: exercise.id },
    data: {
      status: "ABANDONED",
      abortedAt: new Date(),
      abortReason: parsed.reason,
    },
  });

  await appendAuditEntry(parsed.exerciseId, {
    action: "EXERCISE_ABORTED",
    actorUserId: me.id,
    reason: parsed.reason,
  });

  revalidatePath(`/exercises/${parsed.exerciseId}`);
  revalidatePath(`/exercises/${parsed.exerciseId}/facilitator`);
  revalidatePath(`/exercises/${parsed.exerciseId}/live`);
  redirect(`/exercises/${parsed.exerciseId}`);
}

// ─── Wellbeing check (anonymous end-of-exercise stress capture) ──────────────

const WellbeingSchema = z.object({
  exerciseId: z.string(),
  stressLevel: z.coerce.number().int().min(1).max(5),
  note: z.string().max(500).optional(),
  attributed: z.string().optional(), // when "on", attribute to participant
});

export async function submitWellbeingCheckAction(formData: FormData) {
  const me = await requireOrgUser();
  const parsed = WellbeingSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  let participantId: string | null = null;
  if (parsed.attributed === "on") {
    const participant = await prisma.exerciseParticipant.findFirst({
      where: { exerciseId: exercise.id, userId: me.id },
      select: { id: true },
    });
    participantId = participant?.id ?? null;
  }

  await prisma.exerciseWellbeingCheck.create({
    data: {
      exerciseId: exercise.id,
      participantId,
      stressLevel: parsed.stressLevel,
      note: parsed.note ?? null,
    },
  });

  revalidatePath(`/exercises/${parsed.exerciseId}/debrief`);
}

// ─── Promote a debrief answer to an action item ──────────────────────────────

const PromoteAnswerSchema = z.object({
  exerciseId: z.string(),
  debriefAnswerId: z.string(),
  title: z.string().min(1).max(200),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
});

/**
 * Lifts a debrief answer into an ExerciseActionItem so the finding gets a
 * persistent owner + due date + status — closes the loop the regulator
 * looks for ("you said X — what did you do about it?").
 */
export async function promoteDebriefAnswerToActionAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const parsed = PromoteAnswerSchema.parse(Object.fromEntries(formData));

  const [exercise, answer] = await Promise.all([
    prisma.exercise.findFirst({
      where: { id: parsed.exerciseId, orgId: me.orgId },
      select: { id: true, orgId: true },
    }),
    prisma.debriefAnswer.findFirst({
      where: { id: parsed.debriefAnswerId, exerciseId: parsed.exerciseId },
      select: { body: true, author: { select: { name: true, email: true } } },
    }),
  ]);
  if (!exercise || !answer) return;

  await prisma.exerciseActionItem.create({
    data: {
      orgId: exercise.orgId,
      exerciseId: exercise.id,
      title: parsed.title,
      description: `Promoted from debrief answer by ${answer.author?.name ?? answer.author?.email ?? "anonymous"}:\n\n${answer.body}`,
      priority: parsed.priority,
      status: "OPEN",
      createdById: me.id,
    },
  });

  revalidatePath(`/exercises/${parsed.exerciseId}/debrief`);
}

// ─── Hot-wash (immediate end-of-exercise debrief) ────────────────────────────

const HotWashSchema = z.object({
  exerciseId: z.string(),
  summary: z.string().max(2000).optional(),
  immediateGaps: z.string().max(2000).optional(),
  immediateWins: z.string().max(2000).optional(),
  nextActionsRaw: z.string().max(2000).optional(),
});

/**
 * 15-minute hot-wash captured live by the facilitator immediately at end
 * of exercise. Distinct from the formal Retrospective (5 days later) and
 * from the publish-grade AAR.
 */
export async function upsertHotWashAction(formData: FormData) {
  const me = await requireOrgUser();
  const parsed = HotWashSchema.parse(Object.fromEntries(formData));

  const exercise = await prisma.exercise.findFirst({
    where: { id: parsed.exerciseId, orgId: me.orgId },
    select: { id: true },
  });
  if (!exercise) return;

  await prisma.exerciseHotWash.upsert({
    where: { exerciseId: exercise.id },
    update: {
      summary: parsed.summary ?? null,
      immediateGaps: parsed.immediateGaps ?? null,
      immediateWins: parsed.immediateWins ?? null,
      nextActionsRaw: parsed.nextActionsRaw ?? null,
      capturedByUserId: me.id,
    },
    create: {
      exerciseId: exercise.id,
      summary: parsed.summary ?? null,
      immediateGaps: parsed.immediateGaps ?? null,
      immediateWins: parsed.immediateWins ?? null,
      nextActionsRaw: parsed.nextActionsRaw ?? null,
      capturedByUserId: me.id,
    },
  });

  revalidatePath(`/exercises/${parsed.exerciseId}/debrief`);
  revalidatePath(`/exercises/${parsed.exerciseId}`);
}
