import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  // Top gifters (by total coins spent on gifts)
  const gifts = await prisma.gift.findMany({ orderBy: { createdAt: "desc" } });
  const gifterMap: Record<string, number> = {};
  const receiverMap: Record<string, number> = {};
  gifts.forEach(g => {
    gifterMap[g.senderId] = (gifterMap[g.senderId] || 0) + g.coinValue;
    receiverMap[g.receiverId] = (receiverMap[g.receiverId] || 0) + g.coinValue;
  });

  const topGifterIds = Object.entries(gifterMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);
  const topReceiverIds = Object.entries(receiverMap).sort((a, b) => b[1] - a[1]).slice(0, 10).map(e => e[0]);

  const allIds = [...new Set([...topGifterIds, ...topReceiverIds])];
  const users = allIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: allIds } },
    select: { id:true, name:true, profilePhoto:true, tier:true, country:true }
  }) : [];

  // Most popular (most profile views)
  const views = await prisma.profileView.groupBy({ by: ["viewedId"], _count: { viewedId: true }, orderBy: { _count: { viewedId: "desc" } }, take: 10 });
  const popularIds = views.map(v => v.viewedId);
  const popularUsers = popularIds.length > 0 ? await prisma.user.findMany({ where: { id: { in: popularIds } }, select: { id:true, name:true, profilePhoto:true, tier:true, country:true } }) : [];

  return NextResponse.json({
    topGifters: topGifterIds.map(id => ({ user: users.find(u => u.id === id), coins: gifterMap[id] })),
    topReceivers: topReceiverIds.map(id => ({ user: users.find(u => u.id === id), coins: receiverMap[id] })),
    mostPopular: views.map(v => ({ user: popularUsers.find(u => u.id === v.viewedId), views: v._count.viewedId }))
  });
}
