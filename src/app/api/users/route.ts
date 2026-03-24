import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCache, setCache } from "@/lib/cache";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  try {
    const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
    const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

    const users = await prisma.user.findMany({
      where: { id: { not: id, notIn: blockedIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
      select: { id:true, name:true, age:true, gender:true, lookingFor:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, interests:true, boostedUntil:true, lastSeen:true },
      orderBy: { createdAt: "desc" },
      take: 100
    });

    const now = new Date();
    users.sort((a: any, b: any) => {
      const aB = a.boostedUntil && new Date(a.boostedUntil) > now ? 1 : 0;
      const bB = b.boostedUntil && new Date(b.boostedUntil) > now ? 1 : 0;
      return bB - aB;
    });

    return NextResponse.json({ users });
  } catch (e) {
    console.error("Users error:", e);
    return NextResponse.json({ users: [] });
  }
}
