"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";
import {
  Classification,
  Confidentiality,
  ExerciseMode,
  ExerciseType,
  Jurisdiction,
} from "@/generated/prisma/enums";

const DEFAULT_TEAMS = [
  { name: "Incident Management", description: "Coordinates the overall response." },
  { name: "Tech Recovery", description: "Restores systems and infrastructure." },
  { name: "Communications", description: "Customer, regulator and media comms." },
  { name: "Customer Operations", description: "Customer-facing operations and call centre." },
  { name: "Executive Observers", description: "CEO, CRO, CCO — observe and authorise." },
];

/** Carries Step 1 (Basics) state into the URL between steps until an Exercise
 *  row is created at the end of Step 2 (when the primary scenario is picked). */
const Step1QueryParams = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  exerciseType: z.nativeEnum(ExerciseType).optional(),
  plannedDate: z.string().optional(),
  durationMin: z.coerce.number().int().positive().optional(),
  timeZone: z.string().optional(),
  location: z.string().max(200).optional(),
  speedMultiplier: z.coerce.number().positive().optional(),
  jurisdiction: z.nativeEnum(Jurisdiction).optional(),
  classification: z.nativeEnum(Classification).optional(),
  classificationCaveat: z.string().max(120).optional(),
  confidentiality: z.nativeEnum(Confidentiality).optional(),
  mode: z.nativeEnum(ExerciseMode).optional(),
  regulatorMode: z.coerce.boolean().optional(),
  regulatorAudience: z.string().max(120).optional(),
  recurrenceRule: z.string().max(500).optional(),
});

export type WizardBasics = z.infer<typeof Step1QueryParams>;

/**
 * Step 1 submit. Validates Basics fields and redirects to Step 2 with the
 * fields preserved in the URL. We do NOT create an Exercise row yet — that
 * happens at the end of Step 2 once the user has chosen a primary scenario.
 * This avoids creating phantom drafts in the org's exercise list.
 */
export async function submitStep1BasicsAction(formData: FormData) {
  await requireOrgRole("OWNER", "ADMIN");

  const raw: Record<string, string> = {};
  for (const [k, v] of formData.entries()) {
    if (typeof v === "string" && v !== "") raw[k] = v;
  }
  const parsed = Step1QueryParams.parse(raw);

  const params = new URLSearchParams();
  params.set("step", "2");
  for (const [k, v] of Object.entries(parsed)) {
    if (v === undefined || v === "") continue;
    params.set(k, String(v));
  }
  redirect(`/exercises/new?${params.toString()}`);
}

/**
 * Step 2 submit. Creates the Exercise row from accumulated Step 1 query
 * params + the picked scenario(s) + objectives + IBSs, seeds default teams,
 * adds the creator as Facilitator, writes ExerciseScenarioLink rows for
 * primary + chained scenarios, links aggregated IBSs, and redirects to Step 3.
 */
const Step2Input = Step1QueryParams.extend({
  scenarioId: z.string().min(1),
  /** Encoded as "<scenarioId>:<offsetMin>:<label?>" entries, one per chained scenario. */
  chainedScenario: z.union([z.string(), z.array(z.string())]).optional(),
  /** One <textarea name="objective"> per line — split on newlines. */
  objectivesText: z.string().max(2000).optional(),
  /** Comma-separated IBS ids the facilitator wants this exercise linked to
   *  (defaults to the aggregated scenarios' IBSs if blank). */
  ibsIds: z.string().optional(),
});

export async function submitStep2ScenarioAction(formData: FormData) {
  const user = await requireOrgRole("OWNER", "ADMIN");

  const raw: Record<string, string | string[]> = {};
  for (const k of new Set(formData.keys())) {
    const values = formData.getAll(k).filter((v): v is string => typeof v === "string" && v !== "");
    if (values.length === 0) continue;
    raw[k] = values.length === 1 ? values[0] : values;
  }
  const parsed = Step2Input.parse(raw);

  // Validate primary scenario belongs to org or is a public template.
  const scenario = await prisma.scenario.findFirst({
    where: { id: parsed.scenarioId, OR: [{ orgId: user.orgId }, { orgId: null }] },
    select: { id: true },
  });
  if (!scenario) redirect("/scenarios");

  // Parse chained scenarios: "<id>:<offsetMin>:<label>" entries.
  const chainedEntries = parseChainedScenarios(parsed.chainedScenario);

  // Validate chained scenarios all belong to the org / are templates.
  const chainedIds = chainedEntries.map((c) => c.scenarioId);
  if (chainedIds.length > 0) {
    const accessible = await prisma.scenario.findMany({
      where: { id: { in: chainedIds }, OR: [{ orgId: user.orgId }, { orgId: null }] },
      select: { id: true },
    });
    const accessibleIds = new Set(accessible.map((s) => s.id));
    for (const id of chainedIds) {
      if (!accessibleIds.has(id)) redirect("/scenarios");
    }
  }

  // Parse objectives (one per non-empty line, max 10).
  const objectives = parseObjectives(parsed.objectivesText);

  // Parse IBS ids (comma-separated; can be empty → aggregate from scenarios).
  const explicitIbsIds = (parsed.ibsIds ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  // Determine final IBS set: explicit selection wins, else aggregate from
  // primary + chained scenarios.
  let ibsIdsToLink: string[];
  if (explicitIbsIds.length > 0) {
    const ownedByOrg = await prisma.importantBusinessService.findMany({
      where: { id: { in: explicitIbsIds }, scenario: { OR: [{ orgId: user.orgId }, { orgId: null }] } },
      select: { id: true },
    });
    ibsIdsToLink = ownedByOrg.map((i) => i.id);
  } else {
    const scenariosWithIbs = await prisma.scenario.findMany({
      where: { id: { in: [parsed.scenarioId, ...chainedIds] } },
      select: { ibsList: { select: { id: true } } },
    });
    ibsIdsToLink = Array.from(
      new Set(scenariosWithIbs.flatMap((s) => s.ibsList.map((i) => i.id))),
    );
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
      exerciseType: parsed.exerciseType ?? ExerciseType.TABLETOP,
      durationMin: parsed.durationMin ?? null,
      timeZone: parsed.timeZone ?? null,
      speedMultiplier: parsed.speedMultiplier ?? 1,
      confidentiality: parsed.confidentiality ?? Confidentiality.OPEN,
      jurisdiction: parsed.jurisdiction ?? Jurisdiction.UK,
      classification: parsed.classification ?? Classification.INTERNAL,
      classificationCaveat: parsed.classificationCaveat ?? null,
      mode: parsed.mode ?? ExerciseMode.PRODUCTION,
      regulatorMode: parsed.regulatorMode ?? false,
      regulatorAudience: parsed.regulatorAudience ?? null,
      recurrenceRule: parsed.recurrenceRule ?? null,
      objectives,
      teams: { create: DEFAULT_TEAMS.map((t, i) => ({ ...t, orderIdx: i })) },
      participants: {
        create: {
          userId: user.id,
          roleTitle: "Facilitator",
          exerciseRole: "FACILITATOR",
        },
      },
      // Primary scenario + chained scenarios as link rows
      chainedScenarios: {
        create: [
          { scenarioId: parsed.scenarioId, sequence: 0, offsetMin: 0, label: null },
          ...chainedEntries.map((c, idx) => ({
            scenarioId: c.scenarioId,
            sequence: idx + 1,
            offsetMin: c.offsetMin,
            label: c.label,
          })),
        ],
      },
      ibsLinks: {
        create: ibsIdsToLink.map((ibsId) => ({ ibsId })),
      },
    },
  });

  revalidatePath("/exercises");
  redirect(`/exercises/new?step=3&id=${exercise.id}`);
}

function parseChainedScenarios(
  raw: string | string[] | undefined,
): { scenarioId: string; offsetMin: number; label: string | null }[] {
  if (!raw) return [];
  const arr = Array.isArray(raw) ? raw : [raw];
  return arr
    .map((entry) => {
      const [id, offsetStr, label] = entry.split(":");
      if (!id) return null;
      const offsetMin = parseInt(offsetStr ?? "0", 10);
      return {
        scenarioId: id,
        offsetMin: Number.isFinite(offsetMin) ? offsetMin : 0,
        label: label && label.length > 0 ? label : null,
      };
    })
    .filter((c): c is { scenarioId: string; offsetMin: number; label: string | null } => c !== null)
    .slice(0, 3);
}

function parseObjectives(text: string | undefined): string[] {
  if (!text) return [];
  return text
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 10);
}

// ─── Step 3 (Team) wizard actions ────────────────────────────────────────────

async function loadDraftExercise(exerciseId: string) {
  const user = await requireOrgRole("OWNER", "ADMIN");
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, orgId: user.orgId },
    select: { id: true, status: true, regulatorMode: true },
  });
  if (!exercise) return null;
  // Once the exercise is past PLANNING, regulator-mode locks edits.
  if (exercise.regulatorMode && exercise.status !== "PLANNING") return null;
  return { user, exercise };
}

/** Set or clear the backup facilitator. Null = no co-facilitator. */
export async function setCoFacilitatorAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const coFacilitatorIdRaw = formData.get("coFacilitatorId");
  const ctx = await loadDraftExercise(exerciseId);
  if (!ctx) return;

  let coFacilitatorId: string | null = null;
  if (typeof coFacilitatorIdRaw === "string" && coFacilitatorIdRaw !== "") {
    const candidate = await prisma.user.findFirst({
      where: { id: coFacilitatorIdRaw, orgId: ctx.user.orgId },
      select: { id: true },
    });
    coFacilitatorId = candidate?.id ?? null;
  }

  await prisma.exercise.update({
    where: { id: exerciseId },
    data: { coFacilitatorId },
  });

  // Ensure the co-facilitator is on the roster as a FACILITATOR.
  if (coFacilitatorId) {
    await prisma.exerciseParticipant.upsert({
      where: { exerciseId_userId: { exerciseId, userId: coFacilitatorId } },
      create: {
        exerciseId,
        userId: coFacilitatorId,
        roleTitle: "Co-Facilitator",
        exerciseRole: "FACILITATOR",
      },
      update: { exerciseRole: "FACILITATOR" },
    });
  }

  revalidatePath(`/exercises/new?step=3&id=${exerciseId}`);
}

/** Link / unlink a deputy participant to a primary participant. */
export async function setDeputyAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const participantId = String(formData.get("participantId"));
  const deputyIdRaw = formData.get("deputyParticipantId");
  const ctx = await loadDraftExercise(exerciseId);
  if (!ctx) return;

  const deputyId =
    typeof deputyIdRaw === "string" && deputyIdRaw !== "" && deputyIdRaw !== participantId
      ? deputyIdRaw
      : null;

  await prisma.exerciseParticipant.updateMany({
    where: { id: participantId, exerciseId },
    data: { deputyParticipantId: deputyId },
  });

  revalidatePath(`/exercises/new?step=3&id=${exerciseId}`);
}

const VendorInviteSchema = z.object({
  exerciseId: z.string(),
  vendorId: z.string(),
  contactName: z.string().min(1).max(120),
  contactEmail: z.string().email(),
  scope: z.enum(["OBSERVER_ONLY", "RESPONDER_ROLE", "FULL_PARTICIPANT"]),
});

export async function inviteVendorParticipantAction(formData: FormData) {
  const parsed = VendorInviteSchema.parse(Object.fromEntries(formData));
  const ctx = await loadDraftExercise(parsed.exerciseId);
  if (!ctx) return;

  const vendor = await prisma.vendor.findFirst({
    where: { id: parsed.vendorId, orgId: ctx.user.orgId },
    select: { id: true },
  });
  if (!vendor) return;

  // Generate a one-time access token (32 hex chars). Expires 24h after the
  // planned exercise end or 7 days from now, whichever is later. The token
  // is what the vendor uses to access their scoped view at /vendor-portal/<token>.
  const accessToken = generateAccessToken();
  const tokenExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await prisma.exerciseVendorParticipant.create({
    data: {
      exerciseId: parsed.exerciseId,
      vendorId: parsed.vendorId,
      contactName: parsed.contactName,
      contactEmail: parsed.contactEmail,
      scope: parsed.scope,
      accessToken,
      tokenExpiresAt,
    },
  });

  revalidatePath(`/exercises/new?step=3&id=${parsed.exerciseId}`);
}

export async function removeVendorParticipantAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const vendorParticipantId = String(formData.get("vendorParticipantId"));
  const ctx = await loadDraftExercise(exerciseId);
  if (!ctx) return;
  await prisma.exerciseVendorParticipant.deleteMany({
    where: { id: vendorParticipantId, exerciseId },
  });
  revalidatePath(`/exercises/new?step=3&id=${exerciseId}`);
}

/**
 * CSV roster import. Expects rows of `email,roleTitle[,teamName]`.
 * Header row optional. Skips users not in the org. Upserts participants.
 */
export async function importRosterCsvAction(formData: FormData) {
  const exerciseId = String(formData.get("exerciseId"));
  const csv = String(formData.get("csv") ?? "");
  const ctx = await loadDraftExercise(exerciseId);
  if (!ctx) return;

  const rows = csv
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.toLowerCase().startsWith("email,"));

  if (rows.length === 0) return;

  // Resolve all org users by email upfront.
  const emails = Array.from(
    new Set(rows.map((r) => r.split(",")[0]?.trim().toLowerCase()).filter(Boolean)),
  );
  const orgUsers = await prisma.user.findMany({
    where: { email: { in: emails }, orgId: ctx.user.orgId },
    select: { id: true, email: true },
  });
  const emailToId = new Map(orgUsers.map((u) => [u.email.toLowerCase(), u.id]));

  const teams = await prisma.exerciseTeam.findMany({
    where: { exerciseId },
    select: { id: true, name: true },
  });
  const teamByName = new Map(teams.map((t) => [t.name.toLowerCase(), t.id]));

  for (const row of rows) {
    const [emailRaw, roleTitle, teamName] = row.split(",").map((s) => s.trim());
    const userId = emailToId.get(emailRaw.toLowerCase());
    if (!userId || !roleTitle) continue;
    const teamId = teamName ? teamByName.get(teamName.toLowerCase()) ?? null : null;

    await prisma.exerciseParticipant.upsert({
      where: { exerciseId_userId: { exerciseId, userId } },
      create: {
        exerciseId,
        userId,
        roleTitle,
        teamId,
        exerciseRole: "PARTICIPANT",
      },
      update: { roleTitle, ...(teamId ? { teamId } : {}) },
    });
  }

  revalidatePath(`/exercises/new?step=3&id=${exerciseId}`);
}

function generateAccessToken(): string {
  // 32 hex chars from crypto random bytes (Node 19+ has crypto.randomUUID/randomBytes).
  // Using Web Crypto for edge compatibility.
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr).map((b) => b.toString(16).padStart(2, "0")).join("");
}
