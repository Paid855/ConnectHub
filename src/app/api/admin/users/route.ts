import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) {
  try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; }
  catch { return false; }
}

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    let users: any[] = [];
    try {
      users = await prisma.$queryRawUnsafe('SELECT * FROM "User" ORDER BY "createdAt" DESC');
    } catch {
      const fallback = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
      users = fallback as any[];
    }
    const safe = users.map((u: any) => {
      const { password, ...rest } = u;
      return rest;
    });
    return NextResponse.json({ users: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const { userId, action, tier, field, value, coins, coinsAction, editProfile } = await req.json();
    if (!userId) return NextResponse.json({ error: "Missing userId" }, { status: 400 });

    if (action === "ban") {
      try { await prisma.user.update({ where: { id: userId }, data: { banned: true } }); } catch {
        await prisma.$executeRawUnsafe('UPDATE "User" SET "banned" = true WHERE "id" = $1', userId);
      }
    } else if (action === "unban") {
      try { await prisma.user.update({ where: { id: userId }, data: { banned: false } }); } catch {
        await prisma.$executeRawUnsafe('UPDATE "User" SET "banned" = false WHERE "id" = $1', userId);
      }
    } else if (action === "delete") {
      await prisma.user.delete({ where: { id: userId } });
    } else if (action === "upgrade" && tier) {
      await prisma.user.update({ where: { id: userId }, data: { tier } });
    } else if (action === "downgrade") {
      await prisma.user.update({ where: { id: userId }, data: { tier: "free" } });
    } else if (action === "resetVerify") {
      // Clear all verification data
      await prisma.user.update({ where: { id: userId }, data: { verified: false, verificationStatus: "reset", verificationPhoto: null, idDocument: null } });
      try { await prisma.$executeRawUnsafe('UPDATE "User" SET "idDocumentBack" = NULL, "idType" = NULL, "verificationFrames" = NULL WHERE "id" = $1', userId); } catch {}
      
      // Get admin note if provided
      const reason = body.reason || "Your verification has been reset by our team.";
      
      // Notify the user
      try {
        const { createNotification } = await import("@/lib/notify");
        const { sendPushToUser } = await import("@/lib/push");
        createNotification(userId, "verification", "Verification Reset ⚠️", reason + " Please re-verify your profile or contact support for more information.");
        sendPushToUser(userId, { title: "Verification Reset ⚠️", body: "Your verification has been reset. Please re-verify your profile.", url: "/dashboard/verify", tag: "verify-reset" });
      } catch {}
    } else if (action === "coins" && coins !== undefined) {
      if (coinsAction === "set") {
        await prisma.user.update({ where: { id: userId }, data: { coins: Number(coins) } });
      } else {
        await prisma.user.update({ where: { id: userId }, data: { coins: { increment: Number(coins) } } });
      }
    } else if (action === "editProfile" && editProfile) {
      const allowed = ["name","email","username","phone","age","gender","country","city","bio","lookingFor","tier"];
      const data: any = {};
      for (const key of allowed) {
        if (editProfile[key] !== undefined) {
          data[key] = key === "age" ? (editProfile[key] ? Number(editProfile[key]) : null) : editProfile[key];
        }
      }
      try {
        await prisma.user.update({ where: { id: userId }, data });
      } catch {
        for (const [k, v] of Object.entries(data)) {
          try { await prisma.$executeRawUnsafe(`UPDATE "User" SET "${k}" = $1 WHERE "id" = $2`, v, userId); } catch {}
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
