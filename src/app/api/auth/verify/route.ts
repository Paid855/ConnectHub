import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const { photos, idDocument } = await req.json();

    if (!photos) return NextResponse.json({ error: "Face photos required" }, { status: 400 });
    if (!idDocument) return NextResponse.json({ error: "ID document required" }, { status: 400 });

    // Check if user has a profile photo
    const user = await prisma.user.findUnique({ where: { id }, select: { profilePhoto: true } });
    if (!user?.profilePhoto) return NextResponse.json({ error: "Please upload a profile photo first" }, { status: 400 });

    await prisma.user.update({
      where: { id },
      data: {
        verificationPhoto: photos,
        idDocument: idDocument,
        verificationStatus: "pending"
      }
    });

    return NextResponse.json({ success: true, message: "Verification submitted for review" });
  } catch (e) {
    console.error("Verify error:", e);
    return NextResponse.json({ error: "Submission failed. Try again." }, { status: 500 });
  }
}
