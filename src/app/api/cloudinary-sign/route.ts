import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getSessionUser } from "@/lib/session";

export async function POST(req: NextRequest) {
  const sessionCookie = req.cookies.get("session");
  if (!sessionCookie) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  let userId: string;
  const sess = getSessionUser(sessionCookie.value);
  if (sess) userId = sess.id;
  else { try { userId = JSON.parse(sessionCookie.value).id; } catch { return NextResponse.json({ error: "Invalid session" }, { status: 401 }); } }

  const timestamp = Math.round(Date.now() / 1000);
  const folder = "connecthub/profiles";
  const apiSecret = process.env.CLOUDINARY_API_SECRET!;
  const stringToSign = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
  const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

  return NextResponse.json({
    signature, timestamp, folder,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  });
}
