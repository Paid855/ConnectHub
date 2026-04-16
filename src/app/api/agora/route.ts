import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-access-token";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  if (!APP_ID || !APP_CERTIFICATE) {
    return NextResponse.json({ error: "Agora credentials not configured" }, { status: 500 });
  }

  const { channelName, isHost } = await req.json();
  if (!channelName) return NextResponse.json({ error: "Channel name required" }, { status: 400 });

  const uid = Math.floor(Math.random() * 1000000);
  const role = isHost ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER;

  // Token expires in 2 hours
  const expireTime = 7200;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpireTime = currentTimestamp + expireTime;

  const token = RtcTokenBuilder.buildTokenWithUid(
    APP_ID,
    APP_CERTIFICATE,
    channelName,
    uid,
    role,
    privilegeExpireTime
  );

  return NextResponse.json({
    appId: APP_ID,
    channel: channelName,
    uid,
    token
  });
}
