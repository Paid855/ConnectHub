import { NextRequest, NextResponse } from "next/server";

const typingUsers = new Map<string, { userId: string; timestamp: number }>();

function getUserId(req: NextRequest) {
  try {
    const c = req.cookies.get("session")?.value;
    if (!c) return null;
    const p = JSON.parse(c);
    return p.id || p.userId || null;
  } catch { return null; }
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { receiverId } = await req.json();
  if (!receiverId) return NextResponse.json({ error: "No receiverId" }, { status: 400 });

  const key = `${id}:${receiverId}`;
  typingUsers.set(key, { userId: id, timestamp: Date.now() });

  // Clean up old entries (older than 10 seconds)
  const now = Date.now();
  for (const [k, v] of typingUsers.entries()) {
    if (now - v.timestamp > 10000) typingUsers.delete(k);
  }

  return NextResponse.json({ ok: true });
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const from = req.nextUrl.searchParams.get("from");
  if (!from) return NextResponse.json({ typing: false });

  const key = `${from}:${id}`;
  const entry = typingUsers.get(key);

  // Typing is valid for 8 seconds (matches client send interval of 1.5s with buffer)
  if (entry && Date.now() - entry.timestamp < 8000) {
    return NextResponse.json({ typing: true });
  }

  return NextResponse.json({ typing: false });
}
