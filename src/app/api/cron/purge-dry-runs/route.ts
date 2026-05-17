import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * Hourly cron-style endpoint that deletes DRY_RUN exercises older than 30 days.
 * Triggered by Vercel Cron (configure in vercel.json) or any external scheduler.
 * Protected by the CRON_SECRET env variable to prevent abuse.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "CRON_SECRET not configured" }, { status: 500 });
  }
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const result = await prisma.exercise.deleteMany({
    where: {
      mode: "DRY_RUN",
      createdAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}
