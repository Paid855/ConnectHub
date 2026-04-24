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
    const {
      verificationPhoto, idDocument, idDocumentBack, idType,
      selfieFrames, liveness, verificationMode, sessionId
    } = body;

    if (!verificationPhoto && (!selfieFrames || selfieFrames.length === 0)) {
      return NextResponse.json({ error: "Selfie photo is required" }, { status: 400 });
    }
    if (!idDocument) return NextResponse.json({ error: "ID document is required" }, { status: 400 });

    const updateData: any = {
      verificationPhoto: verificationPhoto || selfieFrames?.[0]?.image || "",
      idDocument,
      verificationStatus: "pending",
      verified: false,
    };

    if (idDocumentBack) updateData.idDocumentBack = idDocumentBack;
    if (idType) updateData.idType = idType;

    await prisma.user.update({ where: { id: userId }, data: updateData });

    if (selfieFrames && selfieFrames.length > 0) {
      const framesData = JSON.stringify({
        mode: verificationMode || "unknown",
        sessionId: sessionId || "",
        submittedAt: new Date().toISOString(),
        liveness: liveness || null,
        frames: selfieFrames.map((f: any) => ({
          pose: f.pose,
          label: f.label,
          image: f.image,
          capturedAt: f.capturedAt,
          metrics: f.metrics || null,
        })),
      });
      try {
        await prisma.$executeRawUnsafe(
          'UPDATE "User" SET "verificationFrames" = $1 WHERE "id" = $2',
          framesData, userId
        );
      } catch {
        try {
          await prisma.$executeRawUnsafe(
            'ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "verificationFrames" TEXT'
          );
          await prisma.$executeRawUnsafe(
            'UPDATE "User" SET "verificationFrames" = $1 WHERE "id" = $2',
            framesData, userId
          );
        } catch (e2) {
          console.error("Could not store frames:", e2);
        }
      }
    }

    return NextResponse.json({ success: true, message: "Verification submitted for review" });
  } catch (e: any) {
    console.error("Verify error:", e?.message);
    return NextResponse.json({ error: "Failed to submit. Please try again." }, { status: 500 });
  }
}
