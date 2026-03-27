import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const APP_ID = process.env.NEXT_PUBLIC_AGORA_APP_ID || "";
const APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || "";

function generateRtcToken(channelName: string, uid: number, role: number, expireTimestamp: number): string {
  const VERSION = "006";
  const SERVICES = { RTC: 1, RTM: 2, FPA: 4, CHAT: 5 };

  const salt = crypto.randomInt(1, 99999999);
  const ts = Math.floor(Date.now() / 1000);
  const expire = expireTimestamp || ts + 3600;

  const m = {
    salt,
    ts,
    services: {
      [SERVICES.RTC]: {
        privilege: {
          1: expire, // JOIN_CHANNEL
          2: role === 1 ? expire : 0, // PUBLISH_AUDIO
          3: role === 1 ? expire : 0, // PUBLISH_VIDEO
        },
        channelName,
        uid: String(uid),
      },
    },
  };

  const content = Buffer.from(JSON.stringify(m));
  const sign = crypto.createHmac("sha256", APP_CERTIFICATE).update(content).digest();
  const token = VERSION + Buffer.concat([sign, content]).toString("base64");
  return token;
}

function buildToken(channelName: string, uid: string, role: string): string {
  // Simple HMAC token approach for Agora
  const ts = Math.floor(Date.now() / 1000);
  const expire = ts + 7200;
  const info = JSON.stringify({ appId: APP_ID, channel: channelName, uid, role, ts, expire });
  const sig = crypto.createHmac("sha256", APP_CERTIFICATE).update(info).digest("hex");
  return Buffer.from(info).toString("base64") + "." + sig;
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { channelName, isHost } = await req.json();
  if (!channelName) return NextResponse.json({ error: "Channel name required" }, { status: 400 });

  // For Agora, we'll use the App ID directly (no token auth for testing)
  // In production with token auth enabled, you'd generate proper tokens
  const uid = Math.floor(Math.random() * 100000);

  return NextResponse.json({
    appId: APP_ID,
    channel: channelName,
    uid,
    // Token is empty string when using App ID only (testing mode)
    token: "",
  });
}
