import "server-only";
import { prisma } from "@/lib/prisma";

export type ChatView = {
  id: string;
  body: string;
  authorId: string;
  authorName: string;
  authorRoleAbbreviation: string | null;
  dDayTime: string | null;
  createdAt: Date;
  reactions: { emoji: string; count: number; mine: boolean }[];
};

/**
 * Load the most-recent N chat messages with their reactions aggregated.
 * Reactions ship as { emoji, count, mine } so the UI can render the pills
 * and know which ones the current user has already toggled.
 */
export async function loadChat(exerciseId: string, meId: string, limit = 50): Promise<ChatView[]> {
  const rows = await prisma.chatMessage.findMany({
    where: { exerciseId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      author: { select: { name: true, email: true } },
      reactions: { select: { emoji: true, userId: true } },
    },
  });

  const out = rows.map<ChatView>((r) => {
    const agg = new Map<string, { count: number; mine: boolean }>();
    for (const reaction of r.reactions) {
      const entry = agg.get(reaction.emoji) ?? { count: 0, mine: false };
      entry.count += 1;
      if (reaction.userId === meId) entry.mine = true;
      agg.set(reaction.emoji, entry);
    }
    return {
      id: r.id,
      body: r.body,
      authorId: r.authorId,
      authorName: r.author.name ?? r.author.email,
      authorRoleAbbreviation: r.authorRoleAbbreviation,
      dDayTime: r.dDayTime,
      createdAt: r.createdAt,
      reactions: Array.from(agg.entries()).map(([emoji, v]) => ({
        emoji,
        count: v.count,
        mine: v.mine,
      })),
    };
  });

  return out.reverse(); // oldest at top, newest at bottom
}
