import { CheckSquare } from "lucide-react";
import { requireOrgUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import PageHero from "@/components/ui/PageHero";
import ActionItemBoard from "@/components/action-items/ActionItemBoard";

export const metadata = { title: "Action Items — SnapFix" };

export default async function ActionItemsPage() {
  const me = await requireOrgUser();

  const items = await prisma.exerciseActionItem.findMany({
    where: { orgId: me.orgId },
    orderBy: [{ priority: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: {
      exercise: { select: { id: true, title: true } },
      ownerUser: { select: { name: true, email: true } },
    },
  });

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Follow-through"
        icon={CheckSquare}
        title="Action items"
        pitch="Everything that came out of an exercise debrief. Filter by status, group by priority, close the loop."
      />
      <ActionItemBoard
        items={items.map((i) => ({
          id: i.id,
          title: i.title,
          description: i.description,
          priority: i.priority,
          status: i.status,
          dueAt: i.dueAt,
          ownerText: i.ownerText,
          ownerUser: i.ownerUser,
          exercise: i.exercise,
        }))}
      />
    </div>
  );
}
