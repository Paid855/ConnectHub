import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, username, password, phone, age, gender, lookingFor, country, dateOfBirth } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    // Age check - must be 18+
    let userAge = age ? parseInt(age) : null;
    if (dateOfBirth) {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      userAge = today.getFullYear() - birth.getFullYear();
      const md = today.getMonth() - birth.getMonth();
      if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) userAge--;
    }
    if (userAge !== null && userAge < 18) {
      return NextResponse.json({ error: "You must be 18 or older to join ConnectHub", ageRestricted: true }, { status: 403 });
    }

    const cleanEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existing) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    if (username) {
      const existUser = await prisma.user.findFirst({ where: { username: username.toLowerCase() } });
      if (existUser) return NextResponse.json({ error: "Username taken" }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: username ? username.toLowerCase().trim() : null,
        password: hashed,
        phone: phone || null,
        age: userAge,
        gender: gender || null,
        lookingFor: lookingFor || null,
        country: country || null,
        referralCode,
        coins: 50,
      }
    });

    await prisma.coinTransaction.create({ data: { userId: user.id, amount: 50, type: "welcome_bonus", description: "Welcome to ConnectHub!" } }).catch(() => {});

    const session = JSON.stringify({ id: user.id, email: cleanEmail, name: name.trim() });
    const res = NextResponse.json({ success: true, userId: user.id, step: "upload_photo" });
    res.cookies.set("session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*7 });
    return res;
  } catch (e: any) {
    console.error("Signup error:", e);
    if (e.code === "P2002") return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
