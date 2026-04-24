import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const pending = await prisma.user.findMany({
      where: { verificationStatus: "pending" },
      orderBy: { createdAt: "desc" },
    });
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
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const { userId, action } = await req.json();
    if (!userId || !action) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    if (action === "approve") {
      await prisma.user.update({
        where: { id: userId },
        data: { verified: true, verificationStatus: "approved" },
      });
      try {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: 100 } } });
      } catch {}
      try {
        await prisma.notification.create({
          data: { userId, type: "verification", title: "Identity Verified!", message: "Your identity has been verified. You earned 100 bonus coins!", fromUserId: null },
        });
      } catch {}
    } else if (action === "reject") {
      await prisma.user.update({
        where: { id: userId },
        data: {
          verified: false,
          verificationStatus: "rejected",
          verificationPhoto: null,
          idDocument: null,
        },
      });
      try {
        await prisma.$executeRawUnsafe('UPDATE "User" SET "idDocumentBack" = NULL, "idType" = NULL WHERE "id" = $1', userId);
      } catch {}
      try {
        await prisma.notification.create({
          data: { userId, type: "verification", title: "Verification Rejected", message: "Your verification was rejected. Please try again with clearer photos.", fromUserId: null },
        });
      } catch {}
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
