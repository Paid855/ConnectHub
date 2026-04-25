import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  await prisma.user.update({
    where: { id },
    data: { verificationStatus: null }
  });

  return NextResponse.json({ success: true });
}
