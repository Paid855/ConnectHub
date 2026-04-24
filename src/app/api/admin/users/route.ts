import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function isAdmin(req: NextRequest) { try { return JSON.parse(req.cookies.get("admin_session")?.value || "{}").isAdmin === true; } catch { return false; } }

export async function GET(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const users = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
    const safe = users.map((u: any) => { const { password, ...rest } = u; return rest; });
    return NextResponse.json({ users: safe });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Failed to load users" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!isAdmin(req)) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const body = await req.json();
    const { userId, action } = body;
    if (!userId || !action) return NextResponse.json({ error: "Missing userId or action" }, { status: 400 });

    if (action === "ban") {
      try { await prisma.user.update({ where: { id: userId }, data: { banned: true } }); }
      catch { await prisma.$executeRawUnsafe('UPDATE "User" SET "banned" = true WHERE "id" = $1', userId); }
    }
    else if (action === "unban") {
      try { await prisma.user.update({ where: { id: userId }, data: { banned: false } }); }
      catch { await prisma.$executeRawUnsafe('UPDATE "User" SET "banned" = false WHERE "id" = $1', userId); }
    }
    else if (action === "delete") {
      const tables = ["Notification","Message","Friend","Block","Like","ProfileView","Gift","Report","Call","Post","Comment","Story"];
      for (const t of tables) {
        try {
          await prisma.$executeRawUnsafe(`DELETE FROM "${t}" WHERE "userId" = $1 OR "senderId" = $1 OR "receiverId" = $1 OR "callerId" = $1 OR "reporterId" = $1 OR "reportedId" = $1 OR "likerId" = $1 OR "likedId" = $1 OR "friendId" = $1 OR "blockerId" = $1 OR "blockedId" = $1 OR "viewerId" = $1 OR "viewedId" = $1`, userId);
        } catch {}
      }
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    else if (action === "upgrade") {
      await prisma.user.update({ where: { id: userId }, data: { tier: body.tier || "premium" } });
    }
    else if (action === "addCoins") {
      const amt = parseInt(body.amount) || 0;
      if (amt > 0) await prisma.user.update({ where: { id: userId }, data: { coins: { increment: amt } } });
    }
    else if (action === "setCoins") {
      const amt = parseInt(body.amount) || 0;
      await prisma.user.update({ where: { id: userId }, data: { coins: amt } });
    }
    else if (action === "editProfile") {
      const updates: any = {};
      const strFields = ["name","email","username","phone","gender","country","city","bio","lookingFor","tier"];
      for (const f of strFields) {
        if (body[f] !== undefined) updates[f] = body[f] || null;
      }
      if (body.name) updates.name = body.name;
      if (body.email) updates.email = body.email;
      if (body.tier) updates.tier = body.tier;
      if (body.age !== undefined) updates.age = body.age ? parseInt(body.age) : null;
      if (body.verified !== undefined) updates.verified = body.verified;

      if (Object.keys(updates).length > 0) {
        try {
          await prisma.user.update({ where: { id: userId }, data: updates });
        } catch (e: any) {
          // If bulk update fails, try field by field
          console.error("Bulk edit failed, trying field by field:", e?.message);
          for (const [key, val] of Object.entries(updates)) {
            try {
              await prisma.user.update({ where: { id: userId }, data: { [key]: val } });
            } catch (e2: any) {
              console.error(`Field ${key} failed:`, e2?.message);
            }
          }
        }
      }
    }
    else if (action === "resetVerification") {
      const resetData: any = { verified: false, verificationStatus: null, verificationPhoto: null, idDocument: null };
      try { resetData.idDocumentBack = null; resetData.idType = null; } catch {}
      try {
        await prisma.user.update({ where: { id: userId }, data: resetData });
      } catch {
        await prisma.user.update({ where: { id: userId }, data: { verified: false, verificationStatus: null, verificationPhoto: null, idDocument: null } });
      }
    }
    else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error("Admin action error:", e?.message);
    return NextResponse.json({ error: e?.message || "Action failed" }, { status: 500 });
  }
}
