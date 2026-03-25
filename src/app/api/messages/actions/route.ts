import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { action, partnerId } = await req.json();

  if (!partnerId) return NextResponse.json({ error: "No partner" }, { status: 400 });

  if (action === "clear") {
    // Delete all messages between two users
    await prisma.message.deleteMany({ where: { OR: [{ senderId: id, receiverId: partnerId }, { senderId: partnerId, receiverId: id }] } });
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}
