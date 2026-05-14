import "server-only";
import { prisma } from "@/lib/prisma";

export type SeatView = {
  id: string;
  roleId: string;
  roleAbbreviation: string;
  roleTitle: string;
  responsibility: string | null;
  isSMF: boolean;
  isExecutive: boolean;
  status: string;
  isDeputy: boolean;
  holderUserId: string | null;
  holderName: string | null;
  holderEmail: string | null;
  claimedAt: Date | null;
  defaultHolderName: string | null;
  defaultHolderUserId: string | null;
  /** Abbreviation of the role this seat is deputy of, if any. */
  deputyOfAbbreviation: string | null;
  orderIdx: number;
};

/** Load all seats for an exercise, joined with role + holder details. */
export async function loadSeats(exerciseId: string): Promise<SeatView[]> {
  const seats = await prisma.exerciseSeat.findMany({
    where: { exerciseId },
    include: {
      role: {
        include: {
          defaultHolder: { select: { id: true, name: true, email: true } },
          deputyOf: { select: { abbreviation: true } },
        },
      },
      holderUser: { select: { name: true, email: true } },
    },
  });
  const out = seats.map<SeatView>((s) => ({
    id: s.id,
    roleId: s.roleId,
    roleAbbreviation: s.role.abbreviation,
    roleTitle: s.role.title,
    responsibility: s.role.responsibility,
    isSMF: s.role.isSMF,
    isExecutive: s.role.isExecutive,
    status: s.status,
    isDeputy: s.isDeputy,
    holderUserId: s.holderUserId,
    holderName: s.holderUser?.name ?? null,
    holderEmail: s.holderUser?.email ?? null,
    claimedAt: s.claimedAt,
    defaultHolderName:
      s.role.defaultHolder?.name ?? s.role.defaultHolder?.email ?? null,
    defaultHolderUserId: s.role.defaultHolder?.id ?? null,
    deputyOfAbbreviation: s.role.deputyOf?.abbreviation ?? null,
    orderIdx: s.role.orderIdx,
  }));
  out.sort((a, b) => a.orderIdx - b.orderIdx);
  return out;
}

/**
 * Find the seat(s) the user is currently holding in this exercise. Returns
 * an array; in practice it's 0 or 1.
 */
export async function myCurrentSeats(exerciseId: string, userId: string): Promise<SeatView[]> {
  const all = await loadSeats(exerciseId);
  return all.filter((s) => s.holderUserId === userId);
}
