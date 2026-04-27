import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      isPrivate: true, hideDob: true, hideEmail: true, hidePhone: true,
      hideOnline: true, hideLastSeen: true, showDistance: true, allowMessages: true,
      emailNotifs: true, pushNotifs: true, notifMatches: true, notifMessages: true,
      notifLikes: true, notifGifts: true, verified: true, tier: true,
      email: true, phone: true, createdAt: true, lastSeen: true, emailVerified: true, phoneVerified: true
    }
  }).catch(async () => {
    // Fallback without new fields
    return prisma.user.findUnique({
      where: { id },
      select: {
        isPrivate: true, hideDob: true, hideEmail: true, hidePhone: true,
        hideOnline: true, hideLastSeen: true, showDistance: true, allowMessages: true,
        emailNotifs: true, pushNotifs: true, notifMatches: true, notifMessages: true,
        notifLikes: true, notifGifts: true, verified: true, tier: true,
        email: true, phone: true, createdAt: true, lastSeen: true
      }
    });
  });

  return NextResponse.json({ settings: { ...user, emailVerified: (user as any)?.emailVerified ?? false, phoneVerified: (user as any)?.phoneVerified ?? false } });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const body = await req.json();
  const allowed = [
    "isPrivate", "hideDob", "hideEmail", "hidePhone",
    "hideOnline", "hideLastSeen", "showDistance", "allowMessages",
    "emailNotifs", "pushNotifs", "notifMatches", "notifMessages",
    "notifLikes", "notifGifts"
  ];

  const data: any = {};
  for (const key of allowed) {
    if (body[key] !== undefined) data[key] = body[key];
  }

  if (Object.keys(data).length === 0) return NextResponse.json({ error: "No settings to update" }, { status: 400 });

  await prisma.user.update({ where: { id }, data });
  return NextResponse.json({ success: true });
}
