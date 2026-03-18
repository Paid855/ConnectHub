import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) return NextResponse.json({ error: "Email/username and password are required" }, { status: 400 });

    const input = identifier.toLowerCase().trim();
    const isEmail = input.includes("@");

    const user = isEmail
      ? await prisma.user.findUnique({ where: { email: input } })
      : await prisma.user.findUnique({ where: { username: input } });

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    if (user.tier === "banned") {
      return NextResponse.json({ error: "Your account has been suspended. Contact support@connecthub.com", banned: true }, { status: 403 });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    const response = NextResponse.json({ success: true, user: { id: user.id, name: user.name, username: user.username } });
    response.cookies.set("session", JSON.stringify({ id: user.id, email: user.email }), {
      httpOnly: true, secure: false, sameSite: "lax", maxAge: 60 * 60 * 24 * 7, path: "/"
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
