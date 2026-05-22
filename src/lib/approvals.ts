import "server-only";
import { prisma } from "@/lib/prisma";

/**
 * Role-routed approvals queue for a single participant on a single exercise.
 *
 * Decisions: surface any DecisionRecord where the caller's role
 *   (participant.roleTitle / seat.role.title / seat.role.abbreviation,
 *   case-insensitive) appears in `approverRolesRequired`, the decision
 *   isn't yet approved, and the caller isn't the author.
 *
 * Comms drafts: surface drafts in AWAITING_APPROVAL state where the
 *   caller is the assigned approver, OR the draft has no assigned
 *   approver and the caller's role makes them a default approver for
 *   that stakeholder (CEO/CRO for regulators, CEO/Head of Comms for
 *   external-facing audiences, Head of People for employees, …).
 *
 * Single round-trip via Promise.all so it's cheap to poll.
 */

export type DecisionApprovalItem = {
  decisionId: string;
  title: string;
  rationale: string | null;
  decisionType: string;
  approverRolesRequired: string[];
  authorName: string | null;
  authorRole: string | null;
  dDayTime: string;
  createdAt: Date;
};

export type CommsApprovalItem = {
  draftId: string;
  subject: string;
  body: string;
  stakeholder: string | null;
  audience: string;
  authorName: string | null;
  createdAt: Date;
  assignedToMe: boolean;
};

export type ApprovalsQueue = {
  decisions: DecisionApprovalItem[];
  comms: CommsApprovalItem[];
  myRoleTokens: string[];
};

/**
 * Default approver-role mapping for comms drafts that don't have an
 * `approverId` explicitly assigned. Mirrors the policy ladder a real IMT
 * uses — CEO/CRO sign-off regulators, CEO/Head of Comms sign-off external
 * audiences, Head of People owns employees-only.
 */
const COMMS_DEFAULT_APPROVERS: Record<string, string[]> = {
  REGULATORS: ["ceo", "cro"],
  ICO: ["cro", "dpo"],
  CUSTOMERS: ["ceo", "head of comms"],
  MEDIA: ["ceo", "head of comms"],
  SHAREHOLDERS: ["ceo", "cfo"],
  INTERMEDIARIES: ["coo", "head of comms"],
  THIRD_PARTY_VENDORS: ["coo", "head of procurement"],
  EMPLOYEES: ["head of people", "chief people officer", "ceo"],
  INSURERS: ["cro", "cfo"],
  OTHER: ["ceo"],
};

export async function loadApprovalsQueue(
  exerciseId: string,
  userId: string,
): Promise<ApprovalsQueue> {
  const [participant, seat] = await Promise.all([
    prisma.exerciseParticipant.findFirst({
      where: { exerciseId, userId },
      select: { id: true, roleTitle: true },
    }),
    prisma.exerciseSeat.findFirst({
      where: { exerciseId, holderUserId: userId },
      include: { role: { select: { title: true, abbreviation: true } } },
    }),
  ]);
  if (!participant) return { decisions: [], comms: [], myRoleTokens: [] };

  const tokens = new Set<string>();
  if (participant.roleTitle) tokens.add(participant.roleTitle.toLowerCase());
  if (seat?.role.title) tokens.add(seat.role.title.toLowerCase());
  if (seat?.role.abbreviation) tokens.add(seat.role.abbreviation.toLowerCase());
  const myRoleTokens = Array.from(tokens);

  const [decisionRows, commsRows] = await Promise.all([
    prisma.decisionRecord.findMany({
      where: {
        incident: { exerciseId },
        approvedAt: null,
        authorUserId: { not: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        title: true,
        rationale: true,
        decisionType: true,
        approverRolesRequired: true,
        dDayTime: true,
        createdAt: true,
        authorUser: { select: { name: true, email: true } },
        authorParticipant: { select: { roleTitle: true } },
      },
    }),
    prisma.communicationDraft.findMany({
      where: {
        exerciseId,
        status: "AWAITING_APPROVAL",
        NOT: { authorId: userId },
      },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: {
        id: true,
        subject: true,
        body: true,
        stakeholder: true,
        audience: true,
        approverId: true,
        createdAt: true,
        author: { select: { name: true, email: true } },
      },
    }),
  ]);

  // Decisions: filter to those where my role appears in approverRolesRequired.
  const decisions: DecisionApprovalItem[] = [];
  for (const d of decisionRows) {
    const required = d.approverRolesRequired.map((r) => r.toLowerCase());
    if (!required.some((r) => tokens.has(r))) continue;
    decisions.push({
      decisionId: d.id,
      title: d.title,
      rationale: d.rationale,
      decisionType: d.decisionType,
      approverRolesRequired: d.approverRolesRequired,
      authorName: d.authorUser?.name ?? d.authorUser?.email ?? null,
      authorRole: d.authorParticipant?.roleTitle ?? null,
      dDayTime: d.dDayTime,
      createdAt: d.createdAt,
    });
  }

  // Comms: explicit approver match OR default approver-role for stakeholder.
  const comms: CommsApprovalItem[] = [];
  for (const c of commsRows) {
    const assignedToMe = c.approverId === userId;
    let inQueue = assignedToMe;
    if (!inQueue && !c.approverId && c.stakeholder) {
      const defaults = COMMS_DEFAULT_APPROVERS[c.stakeholder] ?? [];
      if (defaults.some((r) => tokens.has(r))) inQueue = true;
    }
    if (!inQueue) continue;
    comms.push({
      draftId: c.id,
      subject: c.subject,
      body: c.body,
      stakeholder: c.stakeholder,
      audience: c.audience,
      authorName: c.author?.name ?? c.author?.email ?? null,
      createdAt: c.createdAt,
      assignedToMe,
    });
  }

  return { decisions, comms, myRoleTokens };
}
