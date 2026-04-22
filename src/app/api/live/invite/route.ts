import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// POST - host invites a viewer to co-host
export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { streamId, inviteeId } = await req.json();
  if (!streamId || !inviteeId) return NextResponse.json({ error: "Missing data" }, { status: 400 });

  // Verify caller is the host
  const stream = await prisma.liveStream.findUnique({ where: { id: streamId } });
  if (!stream || stream.userId !== id) return NextResponse.json({ error: "Not the host" }, { status: 403 });

  const host = await prisma.user.findUnique({ where: { id }, select: { name: true } });
  const invitee = await prisma.user.findUnique({ where: { id: inviteeId }, select: { name: true } });

  // Send invite as a special chat message
  await prisma.liveChat.create({
    data: {
      streamId,
      userId: id,
      content: `🎤 INVITE:${inviteeId}:${invitee?.name || "User"} — ${host?.name || "Host"} invited ${invitee?.name || "you"} to co-host!`
    }
  });

  return NextResponse.json({ success: true });
}

// GET - check if I have a pending invite
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ invited: false });

  const url = new URL(req.url);
  const streamId = url.searchParams.get("streamId");
  if (!streamId) return NextResponse.json({ invited: false });

  const invite = await prisma.liveChat.findFirst({
    where: {
      streamId,
      content: { contains: `INVITE:${id}:` },
      createdAt: { gte: new Date(Date.now() - 60000) } // last 60 seconds
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({ invited: !!invite });
}
