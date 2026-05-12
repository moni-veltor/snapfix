import "server-only";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "scenario.created" | "scenario.updated" | "scenario.deleted"
  | "exercise.created" | "exercise.started" | "exercise.paused" | "exercise.completed" | "exercise.updated"
  | "exercise.member.added" | "exercise.member.removed"
  | "team.added" | "team.removed"
  | "event.released" | "inject.released"
  | "ibs.created" | "ibs.updated" | "ibs.approved" | "ibs.deprecated" | "ibs.deleted"
  | "action_item.created" | "action_item.updated" | "action_item.closed"
  | "member.added" | "member.removed" | "member.role_changed"
  | "invitation.sent" | "invitation.revoked" | "invitation.accepted"
  | "settings.updated"
  | "artefact.uploaded" | "artefact.deleted";

type AuditInput = {
  orgId: string;
  actorId?: string | null;
  action: AuditAction;
  targetType: string;
  targetId?: string | null;
  summary: string;
  metadata?: Record<string, unknown>;
};

export async function audit(input: AuditInput): Promise<void> {
  try {
    await prisma.auditLogEntry.create({
      data: {
        orgId: input.orgId,
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        summary: input.summary,
        metadata: (input.metadata ?? null) as never,
      },
    });
  } catch (err) {
    // Audit failures must not break the user's action. Log and continue.
    console.error("[audit] write failed:", err);
  }
}
