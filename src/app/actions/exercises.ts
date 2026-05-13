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
  const existing = await prisma.eventRelease.findUnique({
    where: { exerciseId_eventId: { exerciseId, eventId } },
  });
  await prisma.eventRelease.upsert({
    where: { exerciseId_eventId: { exerciseId, eventId } },
    create: { exerciseId, eventId, triggeredBy: user.id },
    update: {},
  });
  if (!existing) {
    // First-time release — notify addressed participants.
    notifyAddressedParticipants(exerciseId, { kind: "EVENT", id: eventId }).catch(
      (err) => console.error("[notify] event release failed:", err),
    );
  }
  revalidatePath(`/exercises/${exerciseId}/facilitator`);
  revalidatePath(`/exercises/${exerciseId}/live`);
}

export async function releaseInjectAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const exerciseId = String(formData.get("exerciseId"));
  const injectId = String(formData.get("injectId"));
  const existing = await prisma.injectRelease.findUnique({
    where: { exerciseId_injectId: { exerciseId, injectId } },
  });
  await prisma.injectRelease.upsert({
    where: { exerciseId_injectId: { exerciseId, injectId } },
    create: { exerciseId, injectId, triggeredBy: user.id },
    update: {},
  });
  if (!existing) {
    notifyAddressedParticipants(exerciseId, { kind: "INJECT", id: injectId }).catch(
      (err) => console.error("[notify] inject release failed:", err),
    );
  }
  revalidatePath(`/exercises/${exerciseId}/facilitator`);
  revalidatePath(`/exercises/${exerciseId}/live`);
}

/**
 * Sends an email to every exercise participant whose roleTitle is addressed
 * (TO or CC) by the given event/inject. Fire-and-forget — caller catches.
 */
async function notifyAddressedParticipants(
  exerciseId: string,
  target: { kind: "EVENT" | "INJECT"; id: string },
) {
  const { sendEmail } = await import("@/lib/email");

  const exercise = await prisma.exercise.findUnique({
    where: { id: exerciseId },
    include: {
      org: { select: { name: true } },
      scenario: { select: { title: true } },
      participants: { include: { user: { select: { email: true, name: true } } } },
    },
  });
  if (!exercise) return;

  let payload: {
    senderRoleTitle: string | null;
    toRoleTitles: string[];
    ccRoleTitles: string[];
    title: string;
    body: string;
    scheduledTime: string;
  };

  if (target.kind === "EVENT") {
    const e = await prisma.event.findUnique({ where: { id: target.id } });
    if (!e) return;
    payload = {
      senderRoleTitle: e.senderRoleTitle,
      toRoleTitles: e.toRoleTitles,
      ccRoleTitles: e.ccRoleTitles,
      title: `Event #${e.eventNo}: ${e.title}`,
      body: e.description,
      scheduledTime: e.scheduledTime,
    };
  } else {
    const j = await prisma.inject.findUnique({ where: { id: target.id } });
    if (!j) return;
    payload = {
      senderRoleTitle: j.senderRoleTitle,
      toRoleTitles: j.toRoleTitles,
      ccRoleTitles: j.ccRoleTitles,
      title: `Inject #${j.injectNo}: ${j.summary}`,
      body: j.description,
      scheduledTime: j.scheduledTime,
    };
  }

  const toSet = new Set(payload.toRoleTitles.map((s) => s.toLowerCase()));
  const ccSet = new Set(payload.ccRoleTitles.map((s) => s.toLowerCase()));

  const origin = process.env.NEXTAUTH_URL?.replace(/\/+$/, "") ?? "";
  const link = `${origin}/exercises/${exerciseId}/live`;

  await Promise.all(
    exercise.participants
      .filter((p) => {
        const r = p.roleTitle.toLowerCase();
        return toSet.has(r) || ccSet.has(r);
      })
      .map((p) => {
        const addressing = toSet.has(p.roleTitle.toLowerCase()) ? "TO" : "CC";
        const subject = `[${exercise.org.name}] ${payload.title}`;
        const preheader = `D-Day ${payload.scheduledTime} · You are on the ${addressing} line for this message.`;
        const html = `<!doctype html><html><body style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;background:#f8fafc;color:#0f172a;padding:24px">
          <div style="max-width:560px;margin:0 auto;background:#fff;border:1px solid #e2e8f0;border-radius:12px;padding:24px">
            <div style="font-size:12px;color:#64748b;text-transform:uppercase;letter-spacing:0.05em">${escapeHtml(exercise.org.name)} · ${escapeHtml(exercise.scenario.title)}</div>
            <h1 style="font-size:18px;margin:8px 0 4px">${escapeHtml(payload.title)}</h1>
            <div style="font-size:12px;color:#64748b">D-Day ${escapeHtml(payload.scheduledTime)} · From: ${escapeHtml(payload.senderRoleTitle ?? "—")} · You are <strong>${addressing}</strong></div>
            <div style="margin-top:16px;color:#334155;white-space:pre-wrap;line-height:1.5">${escapeHtml(payload.body)}</div>
            <p style="margin-top:24px"><a href="${link}" style="display:inline-block;background:#4f46e5;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">Open live workspace</a></p>
            <p style="margin-top:16px;font-size:11px;color:#94a3b8">You're receiving this because you are on the ${addressing} list of this exercise message as <strong>${escapeHtml(p.roleTitle)}</strong>.</p>
          </div>
        </body></html>`;
        const text = `${payload.title}\n\nD-Day ${payload.scheduledTime} · From: ${payload.senderRoleTitle ?? "—"} · You are ${addressing}\n\n${payload.body}\n\nOpen the live workspace: ${link}`;
        return sendEmail({
          to: p.user.email,
          subject,
          html,
          text,
          preheaderLink: preheader,
        });
      }),
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
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
  revalidatePath(`/exercises/${data.exerciseId}/live`);
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
  revalidatePath(`/exercises/${data.exerciseId}/live`);
  revalidatePath(`/exercises/${data.exerciseId}/facilitator`);
}

const CommsInput = z.object({
  exerciseId: z.string(),
  audience: z.enum(["CUSTOMER", "REGULATOR", "INTERNAL", "SENIOR_MGMT", "MEDIA"]),
  stakeholder: z
    .enum([
      "EMPLOYEES",
      "CUSTOMERS",
      "REGULATORS",
      "SHAREHOLDERS",
      "MEDIA",
      "THIRD_PARTY_VENDORS",
      "INTERMEDIARIES",
      "ICO",
      "INSURERS",
      "OTHER",
    ])
    .optional(),
  subject: z.string().min(1),
  body: z.string().min(1),
});

export async function createCommsDraftAction(formData: FormData) {
  const user = await requireUser();
  const data = CommsInput.parse(Object.fromEntries(formData));
  await prisma.communicationDraft.create({
    data: {
      exerciseId: data.exerciseId,
      audience: data.audience,
      stakeholder: data.stakeholder ?? null,
      subject: data.subject,
      body: data.body,
      authorId: user.id,
    },
  });
  revalidatePath(`/exercises/${data.exerciseId}/live`);
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
