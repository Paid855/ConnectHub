import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();
    if (!email || !password) return NextResponse.json({ error: "Email and password are required" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    if (user.tier === "banned") {
      return NextResponse.json({ 
        error: "Your account has been suspended. To appeal, contact support@connecthub.com with a valid ID card or passport." 
      }, { status: 403 });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) return NextResponse.json({ error: "Invalid email or password" }, { status: 401 });

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, name: user.name, email: user.email, tier: user.tier, verified: user.verified },
    });

    response.cookies.set("session", JSON.stringify({ id: user.id, name: user.name, email: user.email, tier: user.tier }), {
      httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", maxAge: 60*60*24*7, path: "/",
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
