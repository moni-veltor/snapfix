import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.orgId) {
    return NextResponse.json({ results: [] }, { status: 401 });
  }
  const orgId = session.user.orgId;
  const url = new URL(req.url);
  const q = (url.searchParams.get("q") ?? "").trim().slice(0, 80);

  // No query → return a small set of "recent / pinned" items for first-open.
  const where = q
    ? {
        contains: q,
        mode: "insensitive" as const,
      }
    : undefined;

  const [scenarios, exercises, ibsList, actionItems, members, vendors, systems] = await Promise.all([
    prisma.scenario.findMany({
      where: q
        ? {
            orgId,
            isTemplate: false,
            OR: [{ title: where }, { background: where }],
          }
        : { orgId, isTemplate: false },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { id: true, title: true },
    }),
    prisma.exercise.findMany({
      where: q
        ? { orgId, OR: [{ title: where }, { description: where }] }
        : { orgId },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, status: true },
    }),
    prisma.organizationIBS.findMany({
      where: q
        ? { orgId, OR: [{ code: where }, { name: where }, { outcome: where }] }
        : { orgId },
      orderBy: { code: "asc" },
      take: 6,
      select: { id: true, code: true, name: true },
    }),
    prisma.exerciseActionItem.findMany({
      where: q
        ? { orgId, OR: [{ title: where }, { description: where }] }
        : { orgId, status: { in: ["OPEN", "IN_PROGRESS", "BLOCKED"] } },
      orderBy: { createdAt: "desc" },
      take: 6,
      select: { id: true, title: true, exerciseId: true, status: true },
    }),
    prisma.user.findMany({
      where: q
        ? { orgId, OR: [{ name: where }, { email: where }] }
        : { orgId },
      orderBy: { name: "asc" },
      take: 6,
      select: { id: true, name: true, email: true },
    }),
    prisma.vendor.findMany({
      where: q
        ? {
            orgId,
            OR: [
              { name: where },
              { serviceKind: where },
              { hyperscaler: where },
            ],
          }
        : { orgId },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      take: 6,
      select: { id: true, name: true, tier: true, serviceKind: true },
    }),
    prisma.techSystem.findMany({
      where: q
        ? { orgId, OR: [{ name: where }, { description: where }] }
        : { orgId },
      orderBy: [{ tier: "asc" }, { name: "asc" }],
      take: 6,
      select: { id: true, name: true, tier: true },
    }),
  ]);

  return NextResponse.json({
    q,
    results: {
      scenarios,
      exercises,
      ibsList,
      actionItems,
      members,
      vendors,
      systems,
    },
  });
}
