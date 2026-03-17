import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { receiverId, type, status, duration } = await req.json();

  const call = await prisma.call.create({
    data: { callerId: id, receiverId, type: type || "voice", status: status || "completed", duration: duration || 0 }
  });

  return NextResponse.json({ call });
}

export async function GET(req: NextRequest) {
  // Admin only
  const adminSession = req.cookies.get("admin_session");
  if (!adminSession) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const calls = await prisma.call.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  const userIds = [...new Set([...calls.map(c => c.callerId), ...calls.map(c => c.receiverId)])];
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, profilePhoto: true }
  });

  const callsWithUsers = calls.map(c => ({
    ...c,
    caller: users.find(u => u.id === c.callerId),
    receiver: users.find(u => u.id === c.receiverId),
  }));

  return NextResponse.json({ calls: callsWithUsers, total: calls.length });
}
