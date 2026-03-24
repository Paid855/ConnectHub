import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  const interest = url.searchParams.get("interest") || "";

  if (!q && !interest) return NextResponse.json({ users: [] });

  const blocked = await prisma.block.findMany({ where: { OR: [{ blockerId: id }, { blockedId: id }] } });
  const blockedIds = blocked.map(b => b.blockerId === id ? b.blockedId : b.blockerId);

  let where: any = { id: { not: id, notIn: blockedIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } };

  if (q) {
    where.OR = [
      { name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { country: { contains: q, mode: "insensitive" } },
      { bio: { contains: q, mode: "insensitive" } },
    ];
  }

  if (interest) {
    where.interests = { has: interest };
  }

  const users = await prisma.user.findMany({
    where,
    select: { id:true, name:true, username:true, age:true, gender:true, bio:true, country:true, profilePhoto:true, tier:true, verified:true, interests:true, lastSeen:true },
    take: 30,
    orderBy: { lastSeen: "desc" }
  });

  return NextResponse.json({ users });
}
