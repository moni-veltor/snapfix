import { redirect } from "next/navigation";
import { requireOrgUser } from "@/lib/auth";

export default async function RunRouter({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireOrgUser();
  const { id } = await params;
  if (user.orgRole === "OWNER" || user.orgRole === "ADMIN") {
    redirect(`/runs/${id}/facilitator`);
  }
  redirect(`/runs/${id}/participant`);
}
