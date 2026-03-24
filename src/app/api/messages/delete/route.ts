import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const { messageId, deleteFor } = await req.json();

  if (!messageId) return NextResponse.json({ error: "No message ID" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });

  if (deleteFor === "everyone") {
    // Only sender can delete for everyone
    if (msg.senderId !== id) return NextResponse.json({ error: "Only sender can delete for everyone" }, { status: 403 });
    await prisma.message.update({ where: { id: messageId }, data: { content: "[DELETED]This message was deleted" } });
    return NextResponse.json({ success: true, type: "everyone" });
  }

  if (deleteFor === "me") {
    // Mark as deleted for this user by prepending a flag
    const flag = msg.senderId === id ? "[DEL_SENDER]" : "[DEL_RECEIVER]";
    if (!msg.content.includes(flag)) {
      await prisma.message.update({ where: { id: messageId }, data: { content: flag + msg.content } });
    }
    return NextResponse.json({ success: true, type: "me" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
