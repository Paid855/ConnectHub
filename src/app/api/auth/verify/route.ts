import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { verificationPhoto, frames } = await req.json();
  if (!verificationPhoto) return NextResponse.json({ error: "No selfie captured" }, { status: 400 });

  // Store verification photo and set status to pending
  await prisma.user.update({
    where: { id },
    data: {
      verificationPhoto,
      verificationStatus: "pending"
    }
  });

  // Create notification for admin
  await prisma.notification.create({
    data: {
      userId: id,
      type: "verification",
      title: "Verification Submitted",
      message: "Your identity verification is being reviewed. We will notify you once approved.",
      fromUserId: null
    }
  }).catch(() => {});

  return NextResponse.json({ success: true, status: "pending" });
}
