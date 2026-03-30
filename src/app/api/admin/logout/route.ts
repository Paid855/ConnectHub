import { NextRequest, NextResponse } from "next/server";
export async function POST(req: NextRequest) {
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", "", { path: "/", maxAge: 0 });
  return res;
}
