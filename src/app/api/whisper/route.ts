import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  // Get whispers received (anonymous)
  const received = await prisma.whisper.findMany({
    where: { toUserId: id },
    orderBy: { createdAt: "desc" },
    take: 20
  });

  // For revealed whispers, get sender info
  const revealedIds = received.filter(w => w.revealed).map(w => w.fromUserId);
  const senders = revealedIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: revealedIds } },
    select: { id: true, name: true, profilePhoto: true, tier: true, verified: true }
  }) : [];

  const whispers = received.map(w => ({
    id: w.id,
    message: w.message,
    revealed: w.revealed,
    liked: w.liked,
    sender: w.revealed ? senders.find(s => s.id === w.fromUserId) || null : null,
    createdAt: w.createdAt,
  }));

  // Get whispers sent
  const sent = await prisma.whisper.findMany({
    where: { fromUserId: id },
    orderBy: { createdAt: "desc" },
    take: 10
  });
  const sentToIds = sent.map(s => s.toUserId);
  const sentToUsers = sentToIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: sentToIds } },
    select: { id: true, name: true, profilePhoto: true }
  }) : [];

  const sentWhispers = sent.map(s => ({
    id: s.id,
    message: s.message,
    to: sentToUsers.find(u => u.id === s.toUserId) || null,
    revealed: s.revealed,
    liked: s.liked,
    createdAt: s.createdAt,
  }));

  return NextResponse.json({ received: whispers, sent: sentWhispers });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { action, toUserId, message, whisperId } = await req.json();

  if (action === "send") {
    if (!toUserId || !message) return NextResponse.json({ error: "Missing data" }, { status: 400 });
    if (toUserId === id) return NextResponse.json({ error: "Cannot whisper yourself" }, { status: 400 });

    // Check daily limit (3 whispers per day for free, unlimited for paid)
    const user = await prisma.user.findUnique({ where: { id }, select: { tier: true, coins: true } });
    const isPaid = user?.tier === "plus" || user?.tier === "premium" || user?.tier === "gold";
    
    if (!isPaid) {
      const todayStart = new Date(); todayStart.setHours(0,0,0,0);
      const todayCount = await prisma.whisper.count({ where: { fromUserId: id, createdAt: { gte: todayStart } } });
      if (todayCount >= 3) return NextResponse.json({ error: "Free users can send 3 whispers per day. Upgrade for unlimited!", upgrade: true }, { status: 403 });
    }

    // Cost: 10 coins per whisper
    if ((user?.coins || 0) < 10) return NextResponse.json({ error: "You need 10 coins to send a whisper", needCoins: true }, { status: 403 });

    await prisma.user.update({ where: { id }, data: { coins: { decrement: 10 } } });
    const whisper = await prisma.whisper.create({
      data: { fromUserId: id, toUserId, message: message.trim().substring(0, 200) }
    });

    createNotification(toUserId, "whisper", "Secret Whisper 🤫", "Someone sent you an anonymous message", null);
    return NextResponse.json({ success: true, whisper });
  }

  if (action === "like") {
    if (!whisperId) return NextResponse.json({ error: "Missing whisper ID" }, { status: 400 });
    const whisper = await prisma.whisper.findUnique({ where: { id: whisperId } });
    if (!whisper || whisper.toUserId !== id) return NextResponse.json({ error: "Not found" }, { status: 404 });

    await prisma.whisper.update({ where: { id: whisperId }, data: { liked: true, revealed: true } });
    createNotification(whisper.fromUserId, "whisper_liked", "Whisper Liked! 💕", "Someone liked your anonymous whisper — your identity has been revealed!", id);
    return NextResponse.json({ success: true, revealed: true });
  }

  if (action === "dismiss") {
    if (!whisperId) return NextResponse.json({ error: "Missing whisper ID" }, { status: 400 });
    await prisma.whisper.deleteMany({ where: { id: whisperId, toUserId: id } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
