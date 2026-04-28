import { NextRequest, NextResponse } from "next/server";
import { requireAdmin, adminAction } from "@/lib/admin-auth";
import { prisma } from "@/lib/db";


export async function GET(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    let pending: any[] = [];
    try {
      pending = await prisma.$queryRawUnsafe(
        'SELECT * FROM "User" WHERE "verificationStatus" = $1 ORDER BY "createdAt" DESC',
        "pending"
      );
    } catch {
      const fallback = await prisma.user.findMany({
        where: { verificationStatus: "pending" },
        orderBy: { createdAt: "desc" },
      });
      pending = fallback as any[];
    }
    const safe = pending.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
    return NextResponse.json({ verifications: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const ctx = await requireAdmin(req);
  if (ctx instanceof NextResponse) return ctx;
  try {
    const { userId, action } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    if (action === "approve") {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: true, verificationStatus: "approved" },
      });
      try { await prisma.user.update({ where: { id: userId }, data: { coins: { increment: 100 } } }); } catch {}
      try { await prisma.notification.create({ data: { userId, type: "verification", title: "Identity Verified!", message: "Your identity has been verified. You earned 100 bonus coins!", fromUserId: null } }); } catch {}
    } else if (action === "reject") {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: false, verificationStatus: "rejected", verificationPhoto: null, idDocument: null },
      });
      try { await prisma.$executeRawUnsafe('UPDATE "User" SET "idDocumentBack" = NULL, "idType" = NULL, "verificationFrames" = NULL WHERE "id" = $1', userId); } catch {}
      try { await prisma.notification.create({ data: { userId, type: "verification", title: "Verification Rejected", message: "Please try again with clearer photos.", fromUserId: null } }); } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
