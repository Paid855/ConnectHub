import { getUserId } from "@/lib/auth";

import { NextRequest, NextResponse } from "next/server";
import { uploadImage, uploadVideo } from "@/lib/cloudinary";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { data, type, hd } = await req.json();
  if (!data) return NextResponse.json({ error: "No file" }, { status: 400 });

  try {
    let url: string | null = null;
    if (type === "video") {
      url = await uploadVideo(data, "messages");
    } else {
      if (hd === false) {
        // Compressed: smaller file, faster send
        url = await uploadImage(data, "messages");
      } else {
        // HD: full resolution upload
        url = await uploadImage(data, "messages-hd");
      }
    }

    if (!url) return NextResponse.json({ error: "Upload failed" }, { status: 500 });
    return NextResponse.json({ url, type: type || "image" });
  } catch (e: any) {
    console.error("Media upload error:", e);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
