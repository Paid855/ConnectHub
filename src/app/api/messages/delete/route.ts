import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { messageId, deleteFor } = await req.json();
  if (!messageId) return NextResponse.json({ error: "No message" }, { status: 400 });

  const msg = await prisma.message.findUnique({ where: { id: messageId } });
  if (!msg) return NextResponse.json({ error: "Message not found" }, { status: 404 });
  if (msg.senderId !== id && msg.receiverId !== id) return NextResponse.json({ error: "Not your message" }, { status: 403 });

  if (deleteFor === "everyone" && msg.senderId === id) {
    // Delete for everyone - only sender can do this within 5 minutes
    const fiveMin = 5 * 60 * 1000;
    if (Date.now() - new Date(msg.createdAt).getTime() < fiveMin) {
      await prisma.message.update({ where: { id: messageId }, data: { content: "[DELETED] This message was deleted" } });
    } else {
      return NextResponse.json({ error: "Can only delete for everyone within 5 minutes" }, { status: 400 });
    }
  } else {
    // Delete for me only
    let content = msg.content;
    if (msg.senderId === id) {
      content = "[DEL_SENDER]" + content.replace("[DEL_SENDER]", "");
    } else {
      content = "[DEL_RECEIVER]" + content.replace("[DEL_RECEIVER]", "");
    }
    await prisma.message.update({ where: { id: messageId }, data: { content } });
  }

  return NextResponse.json({ success: true });
}
