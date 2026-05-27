import "server-only";
import { prisma } from "@/lib/prisma";

export type AuditAction =
  | "scenario.created" | "scenario.updated" | "scenario.deleted"
  | "exercise.created" | "exercise.started" | "exercise.paused" | "exercise.completed" | "exercise.updated"
  | "exercise.member.added" | "exercise.member.removed"
  | "team.added" | "team.removed"
  | "event.released" | "inject.released"
  | "ibs.created" | "ibs.updated" | "ibs.approved" | "ibs.deprecated" | "ibs.deleted" | "ibs.added-from-library"
  | "ibs.attestation.requested" | "ibs.attestation.attested" | "ibs.attestation.rejected"
  | "vendor.added-from-library"
  | "system.added-from-library"
  | "dr_test.attested" | "dr_test.schedule_updated"
  | "scenario.added-from-library"
  | "scenario.ibs.added" | "scenario.ibs.linked" | "scenario.ibs.unlinked" | "scenario.ibs.removed"
  | "attestation.cycle.opened" | "attestation.cycle.superseded"
  | "attestation.first_line.signed" | "attestation.second_line.signed" | "attestation.executive.signed"
  | "attestation.board.approved"
  | "attestation.snapshot.generated" | "attestation.pack.generated"
  | "attestation.material_change.declared" | "attestation.material_change.reviewed"
  | "attestation.settings.updated"
  | "action_item.created" | "action_item.updated" | "action_item.closed"
  | "member.added" | "member.removed" | "member.role_changed" | "member.department_changed"
  | "department.created" | "department.updated" | "department.deleted"
  | "invitation.sent" | "invitation.revoked" | "invitation.accepted"
  | "settings.updated"
  | "artefact.uploaded" | "artefact.deleted"
  | "vendor.register.generated"
  | "vendor.notification.generated" | "vendor.notification.submitted" | "vendor.notification.acknowledged"
  | "vendor.mtp.updated" | "vendor.assessment.recorded"
  | "runbook.created" | "runbook.cloned_from_library" | "runbook.library_seeded"
  | "runbook.archived" | "runbook.deleted" | "runbook.updated" | "runbook.published"
  | "runbook.reviewed" | "runbook.drilled"
  | "runbook.escalation.added" | "runbook.escalation.removed"
  | "runbook.step.added" | "runbook.step.updated" | "runbook.step.deleted"
  | "runbook.step.reordered" | "runbook.ibs.linked" | "runbook.scenarios.linked"
  | "runbook.trigger.updated"
  | "runbook.execution.activated" | "runbook.execution.abandoned"
  | "runbook.execution.step.started" | "runbook.execution.step.completed"
  | "runbook.execution.step.skipped";

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
