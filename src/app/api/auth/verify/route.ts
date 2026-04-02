import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { verificationPhoto, idDocument, idType, frames } = await req.json();
  if (!verificationPhoto) return NextResponse.json({ error: "Selfie required" }, { status: 400 });

  const updateData: any = { verificationPhoto, verificationStatus: "pending" };
  if (idDocument) updateData.idDocument = idDocument;
  if (idType) updateData.idType = idType;

  await prisma.user.update({ where: { id }, data: updateData });

  await prisma.notification.create({
    data: { userId: id, type: "verification", title: "Verification Submitted", message: "Your documents are being reviewed. We will notify you once approved.", fromUserId: null }
  }).catch(() => {});

  return NextResponse.json({ success: true, status: "pending" });
}
