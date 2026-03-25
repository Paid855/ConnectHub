import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const url = new URL(req.url);
  const userId = url.searchParams.get("id");
  if (!userId) return NextResponse.json({ error: "No user ID" }, { status: 400 });

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id:true, name:true, username:true, email:true, phone:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, verificationStatus:true, interests:true, isPrivate:true, createdAt:true, lastSeen:true }
    });
    if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const posts = await prisma.post.findMany({ where: { userId }, orderBy: { createdAt: "desc" }, take: 20 });

    // Check friend status
    const friend = await prisma.friend.findFirst({ where: { OR: [{ userId: id, friendId: userId }, { userId: userId, friendId: id }] } });
    const blocked = await prisma.block.findFirst({ where: { blockerId: id, blockedId: userId } });

    return NextResponse.json({
      user,
      posts,
      friendStatus: friend?.status || null,
      blocked: !!blocked
    });
  } catch (e) {
    console.error("Profile error:", e);
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}
