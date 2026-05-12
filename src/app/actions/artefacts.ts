"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { put, del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";
import { requireOrgRole } from "@/lib/auth";

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB
const ALLOWED_KINDS = [
  "FACILITATOR_GUIDE",
  "PARTICIPANT_GUIDE",
  "SCENARIO_GUIDE",
  "ALERT",
  "EMAIL",
  "REPORT",
  "DOC",
  "LOG",
  "OTHER",
] as const;

const UploadSchema = z.object({
  target: z.enum(["SCENARIO", "EXERCISE", "EVENT", "INJECT"]),
  targetId: z.string().min(1),
  kind: z.enum(ALLOWED_KINDS),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
});

export type UploadResult =
  | { ok: true; id: string; blobUrl: string }
  | { ok: false; error: string };

/**
 * Uploads a file to Vercel Blob and creates an Artefact record. Returns a
 * friendly error if BLOB_READ_WRITE_TOKEN is not configured rather than
 * crashing the request.
 */
export async function uploadArtefactAction(
  _prev: UploadResult | undefined,
  formData: FormData,
): Promise<UploadResult> {
  const me = await requireOrgRole("OWNER", "ADMIN");
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return {
      ok: false,
      error:
        "File storage is not configured yet. An admin needs to enable Vercel Blob and set BLOB_READ_WRITE_TOKEN.",
    };
  }
  const parsed = UploadSchema.safeParse({
    target: formData.get("target"),
    targetId: formData.get("targetId"),
    kind: formData.get("kind"),
    title: formData.get("title"),
    description: formData.get("description") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues.map((i) => i.message).join("; ") };
  }
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a file before uploading." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: `File is too large (>${Math.round(MAX_BYTES / 1024 / 1024)} MB).` };
  }

  // Verify the target belongs to the caller's org.
  const orgId = me.orgId;
  let revalidateFor: string;
  switch (parsed.data.target) {
    case "SCENARIO": {
      const ok = await prisma.scenario.findFirst({
        where: { id: parsed.data.targetId, orgId },
        select: { id: true },
      });
      if (!ok) return { ok: false, error: "Scenario not found." };
      revalidateFor = `/scenarios/${parsed.data.targetId}`;
      break;
    }
    case "EXERCISE": {
      const ok = await prisma.exercise.findFirst({
        where: { id: parsed.data.targetId, orgId },
        select: { id: true },
      });
      if (!ok) return { ok: false, error: "Exercise not found." };
      revalidateFor = `/exercises/${parsed.data.targetId}`;
      break;
    }
    case "EVENT": {
      const ev = await prisma.event.findFirst({
        where: { id: parsed.data.targetId, scenario: { orgId } },
        select: { id: true, scenarioId: true },
      });
      if (!ev) return { ok: false, error: "Event not found." };
      revalidateFor = `/scenarios/${ev.scenarioId}`;
      break;
    }
    case "INJECT": {
      const inj = await prisma.inject.findFirst({
        where: { id: parsed.data.targetId, scenario: { orgId } },
        select: { id: true, scenarioId: true },
      });
      if (!inj) return { ok: false, error: "Inject not found." };
      revalidateFor = `/scenarios/${inj.scenarioId}`;
      break;
    }
  }

  // Path layout: org/<orgId>/<target>/<targetId>/<timestamp>-<safe-name>
  const safeName = (file.name || "upload.bin").replace(/[^\w.\-]+/g, "_");
  const pathname = `org/${orgId}/${parsed.data.target.toLowerCase()}/${parsed.data.targetId}/${Date.now()}-${safeName}`;

  let blob: { url: string; pathname: string };
  try {
    blob = await put(pathname, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type || undefined,
    });
  } catch (err) {
    return {
      ok: false,
      error: `Upload failed: ${err instanceof Error ? err.message : "unknown error"}`,
    };
  }

  const artefact = await prisma.artefact.create({
    data: {
      scenarioId: parsed.data.target === "SCENARIO" ? parsed.data.targetId : null,
      exerciseId: parsed.data.target === "EXERCISE" ? parsed.data.targetId : null,
      eventId: parsed.data.target === "EVENT" ? parsed.data.targetId : null,
      injectId: parsed.data.target === "INJECT" ? parsed.data.targetId : null,
      kind: parsed.data.kind,
      title: parsed.data.title,
      description: parsed.data.description ?? null,
      blobUrl: blob.url,
      blobPath: blob.pathname,
      contentType: file.type || null,
      sizeBytes: file.size,
      uploadedById: me.id,
    },
  });

  revalidatePath(revalidateFor);
  return { ok: true, id: artefact.id, blobUrl: blob.url };
}

export async function deleteArtefactAction(formData: FormData) {
  const me = await requireOrgRole("OWNER", "ADMIN");
  const id = String(formData.get("id"));
  const orgId = me.orgId;
  const artefact = await prisma.artefact.findFirst({
    where: {
      id,
      OR: [
        { scenario: { orgId } },
        { exercise: { orgId } },
        { event: { scenario: { orgId } } },
        { inject: { scenario: { orgId } } },
      ],
    },
    select: {
      id: true,
      blobPath: true,
      scenarioId: true,
      exerciseId: true,
      event: { select: { scenarioId: true } },
      inject: { select: { scenarioId: true } },
    },
  });
  if (!artefact) return;
  // Best-effort blob delete
  if (artefact.blobPath && process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      await del(artefact.blobPath);
    } catch {
      // Ignore — DB row removal is the authoritative cleanup.
    }
  }
  await prisma.artefact.delete({ where: { id: artefact.id } });

  const path =
    artefact.scenarioId ? `/scenarios/${artefact.scenarioId}` :
    artefact.exerciseId ? `/exercises/${artefact.exerciseId}` :
    artefact.event?.scenarioId ? `/scenarios/${artefact.event.scenarioId}` :
    artefact.inject?.scenarioId ? `/scenarios/${artefact.inject.scenarioId}` :
    "/";
  revalidatePath(path);
}
