import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";

export default async function RunRouter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const { id } = await params;
  if (user.role === "FACILITATOR" || user.role === "ADMIN") {
    redirect(`/runs/${id}/facilitator`);
  }
  redirect(`/runs/${id}/participant`);
}
