import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

function getUserId(req: NextRequest) {
  try {
    const cookie = req.cookies.get("session")?.value;
    if (!cookie) return null;
    const parsed = JSON.parse(cookie);
    return parsed.id || parsed.userId || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const userId = getUserId(req);
  if (!userId) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  try {
    const body = await req.json();
    const { verificationPhoto, idDocument, idDocumentBack, idType } = body;

    if (!verificationPhoto) return NextResponse.json({ error: "Selfie photo is required" }, { status: 400 });
    if (!idDocument) return NextResponse.json({ error: "ID document is required" }, { status: 400 });

    const updateData: any = {
      verificationPhoto,
      idDocument,
      verificationStatus: "pending",
      verified: false,
    };

    if (idDocumentBack) updateData.idDocumentBack = idDocumentBack;
    if (idType) updateData.idType = idType;

    await prisma.user.update({
      where: { id: userId },
      data: updateData,
    });

    return NextResponse.json({ success: true, message: "Verification submitted for review" });
  } catch (e: any) {
    console.error("Verify error:", e?.message);
    return NextResponse.json({ error: "Failed to submit verification. Please try again." }, { status: 500 });
  }
}
