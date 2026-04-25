import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserId(req: NextRequest) {
  try { const c = req.cookies.get("session")?.value; if (!c) return null; const p = JSON.parse(c); return p.id || p.userId || null; } catch { return null; }
}

// POST — toggle a reaction
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { messageId, emoji } = await req.json();
  if (!messageId || !emoji) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  // Toggle — remove if exists, add if not
  const existing = await prisma.reaction.findUnique({
    where: { messageId_userId_emoji: { messageId, userId: id, emoji } },
  });

  if (existing) {
    await prisma.reaction.delete({ where: { id: existing.id } });
    return NextResponse.json({ removed: true, emoji });
  } else {
    await prisma.reaction.create({ data: { messageId, userId: id, emoji } });
    return NextResponse.json({ added: true, emoji });
  }
}

// GET — get reactions for messages
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const messageIds = req.nextUrl.searchParams.get("ids")?.split(",") || [];
  if (!messageIds.length) return NextResponse.json({ reactions: {} });

  const reactions = await prisma.reaction.findMany({
    where: { messageId: { in: messageIds } },
  });

  // Group by messageId
  const grouped: Record<string, { emoji: string; count: number; mine: boolean }[]> = {};
  for (const r of reactions) {
    if (!grouped[r.messageId]) grouped[r.messageId] = [];
    const existing = grouped[r.messageId].find(g => g.emoji === r.emoji);
    if (existing) {
      existing.count++;
      if (r.userId === id) existing.mine = true;
    } else {
      grouped[r.messageId].push({ emoji: r.emoji, count: 1, mine: r.userId === id });
    }
  }

  return NextResponse.json({ reactions: grouped });
}
