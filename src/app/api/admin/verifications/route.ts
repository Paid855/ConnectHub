import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  try {
    const verifications = await prisma.user.findMany({
      where: { verificationStatus: "pending" },
      select: { id:true, name:true, email:true, profilePhoto:true, verificationPhoto:true, idDocument:true, createdAt:true },
      orderBy: { createdAt: "desc" }
    });
    return NextResponse.json({ verifications });
  } catch { return NextResponse.json({ verifications: [] }); }
}
