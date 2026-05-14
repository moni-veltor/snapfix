// Regulator notification scheduling (best practice
// FCA/PRA: within 4h of IMT invocation for High-severity incidents (CRO owns,
// CEO approves). ICO: within 72h of awareness for personal data breach.
// Closure FCA/PRA: within 2 business days of closure.

import "server-only";
import { prisma } from "@/lib/prisma";
import { Regulator } from "@/generated/prisma/enums";

const HOUR = 60 * 60 * 1000;

/**
 * On High-severity invocation, create FCA + PRA notification clocks (4h SLA).
 * Idempotent — does nothing if rows already exist for this incident +
 * regulator + this trigger.
 */
export async function autoCreateRegulatorNotificationsOnInvocation(
  incidentId: string,
  invokedAt: Date,
) {
  const trigger = "High-severity incident invoked";
  const dueAt = new Date(invokedAt.getTime() + 4 * HOUR);

  for (const regulator of [Regulator.FCA, Regulator.PRA]) {
    const existing = await prisma.regulatorNotification.findFirst({
      where: { incidentId, regulator, trigger },
    });
    if (existing) continue;
    await prisma.regulatorNotification.create({
      data: {
        incidentId,
        regulator,
        trigger,
        slaHours: 4,
        dueAt,
        ownerRoleTitle: "CRO",
        approverRoleTitle: "CEO",
      },
    });
  }
}

/**
 * On suspected personal data breach, create an ICO notification clock (72h
 * SLA, owned by Head of Compliance, approved by CRO).
 */
export async function createICONotification(incidentId: string, awarenessAt: Date) {
  const trigger = "Suspected/confirmed personal data breach";
  const existing = await prisma.regulatorNotification.findFirst({
    where: { incidentId, regulator: Regulator.ICO, trigger },
  });
  if (existing) return;
  await prisma.regulatorNotification.create({
    data: {
      incidentId,
      regulator: Regulator.ICO,
      trigger,
      slaHours: 72,
      dueAt: new Date(awarenessAt.getTime() + 72 * HOUR),
      ownerRoleTitle: "Head of Compliance",
      approverRoleTitle: "CRO",
    },
  });
}

/**
 * On closure of a High-severity incident, create FCA + PRA closure
 * notifications (2 business days SLA).
 */
export async function createClosureNotifications(incidentId: string, closedAt: Date) {
  const trigger = "Closure of High-severity incident";
  // 2 business days = 48 hours, ignoring weekends — simplified for the simulator.
  const dueAt = new Date(closedAt.getTime() + 48 * HOUR);
  for (const regulator of [Regulator.FCA, Regulator.PRA]) {
    const existing = await prisma.regulatorNotification.findFirst({
      where: { incidentId, regulator, trigger },
    });
    if (existing) continue;
    await prisma.regulatorNotification.create({
      data: {
        incidentId,
        regulator,
        trigger,
        slaHours: 48,
        dueAt,
        ownerRoleTitle: "CRO",
        approverRoleTitle: "CEO",
      },
    });
  }
}

export const REGULATOR_LABEL: Record<Regulator, string> = {
  FCA: "FCA",
  PRA: "PRA",
  ICO: "ICO",
  BANK_OF_ENGLAND: "Bank of England",
  OTHER: "Other",
};
