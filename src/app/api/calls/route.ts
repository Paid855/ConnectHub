import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createNotification } from "@/lib/notify";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { action, receiverId, callId, type, duration } = await req.json();

  // INITIATE a call (ringing)
  if (action === "call") {
    if (!receiverId) return NextResponse.json({ error: "No receiver" }, { status: 400 });

    // Check if receiver blocked caller
    const blocked = await prisma.block.findFirst({ where: { OR: [{ blockerId: id, blockedId: receiverId }, { blockerId: receiverId, blockedId: id }] } });
    if (blocked) return NextResponse.json({ error: "Cannot call this user" }, { status: 403 });

    // Cancel any existing ringing calls from this caller
    await prisma.call.updateMany({ where: { callerId: id, status: "ringing" }, data: { status: "missed" } });

    const call = await prisma.call.create({
      data: { callerId: id, receiverId, type: type || "voice", status: "ringing", duration: 0 }
    });

    const caller = await prisma.user.findUnique({ where: { id }, select: { name: true } });
    await createNotification(receiverId, "call", "Incoming Call", `${caller?.name || "Someone"} is calling you (${type || "voice"})`, id);

    return NextResponse.json({ call });
  }

  // ACCEPT a call
  if (action === "accept") {
    if (!callId) return NextResponse.json({ error: "No call ID" }, { status: 400 });
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call || call.receiverId !== id) return NextResponse.json({ error: "Not your call" }, { status: 403 });

    await prisma.call.update({ where: { id: callId }, data: { status: "active" } });

    // Generate Agora tokens for both users
    const channelName = `call_${callId}`;
    return NextResponse.json({ success: true, channelName, callId });
  }

  // REJECT or END a call
  if (action === "reject" || action === "end") {
    if (!callId) return NextResponse.json({ error: "No call ID" }, { status: 400 });
    const call = await prisma.call.findUnique({ where: { id: callId } });
    if (!call) return NextResponse.json({ error: "Call not found" }, { status: 404 });
    if (call.callerId !== id && call.receiverId !== id) return NextResponse.json({ error: "Not your call" }, { status: 403 });

    const newStatus = action === "reject" ? "rejected" : "completed";
    await prisma.call.update({ where: { id: callId }, data: { status: newStatus, duration: duration || 0 } });

    return NextResponse.json({ success: true });
  }

  // CANCEL a call (caller hangs up before answer)
  if (action === "cancel") {
    if (!callId) return NextResponse.json({ error: "No call ID" }, { status: 400 });
    await prisma.call.update({ where: { id: callId }, data: { status: "missed" } });
    return NextResponse.json({ success: true });
  }

  // Legacy: simple create
  if (!action) {
    const call = await prisma.call.create({
      data: { callerId: id, receiverId, type: type || "voice", status: "completed", duration: duration || 0 }
    });
    return NextResponse.json({ call });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

// Check for incoming calls (polled by receiver)
export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) {
    // Admin fallback
    const adminSession = req.cookies.get("admin_session");
    if (adminSession) {
      const calls = await prisma.call.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
      const userIds = [...new Set([...calls.map(c => c.callerId), ...calls.map(c => c.receiverId)])];
      const users = await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, profilePhoto: true } });
      return NextResponse.json({ calls: calls.map(c => ({ ...c, caller: users.find(u => u.id === c.callerId), receiver: users.find(u => u.id === c.receiverId) })), total: calls.length });
    }
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  // Check for ringing calls where I'm the receiver
  const incoming = await prisma.call.findFirst({
    where: { receiverId: id, status: "ringing", createdAt: { gte: new Date(Date.now() - 30000) } }, // 30 second timeout
    orderBy: { createdAt: "desc" }
  });

  if (incoming) {
    const caller = await prisma.user.findUnique({ where: { id: incoming.callerId }, select: { id: true, name: true, profilePhoto: true, verified: true } });
    return NextResponse.json({ incoming: { ...incoming, caller } });
  }

  // Auto-expire old ringing calls
  await prisma.call.updateMany({ where: { status: "ringing", createdAt: { lt: new Date(Date.now() - 30000) } }, data: { status: "missed" } }).catch(() => {});

  return NextResponse.json({ incoming: null });
}
