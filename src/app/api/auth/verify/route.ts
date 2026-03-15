import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const session = req.cookies.get("session");
    if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

    const { id } = JSON.parse(session.value);
    const { photos, idDocument } = await req.json();

    if (!photos) return NextResponse.json({ error: "Face scan required" }, { status: 400 });
    if (!idDocument) return NextResponse.json({ error: "ID document required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id }, select: { profilePhoto: true } });
    if (!user?.profilePhoto) return NextResponse.json({ error: "Upload profile photo first" }, { status: 400 });

    // Set to PENDING — admin must review and approve
    await prisma.user.update({
      where: { id },
      data: {
        verificationStatus: "pending",
        verificationPhoto: photos,
        idDocument: idDocument,
      }
    });

    return NextResponse.json({ success: true, message: "Submitted for admin review" });
  } catch (error) {
    console.error("Verify error:", error);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
