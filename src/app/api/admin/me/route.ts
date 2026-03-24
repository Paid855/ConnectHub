import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("admin_session");
  if (!session) return NextResponse.json({ error: "Not authorized" }, { status: 401 });

  try {
    const data = JSON.parse(session.value);
    if (data.email !== "admin@connecthub.com" || data.role !== "admin") {
      return NextResponse.json({ error: "Not authorized" }, { status: 401 });
    }
    return NextResponse.json({ email: data.email, role: "admin" });
  } catch {
    return NextResponse.json({ error: "Invalid session" }, { status: 401 });
  }
}
