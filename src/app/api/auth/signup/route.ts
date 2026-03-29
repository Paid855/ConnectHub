import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { sanitize, isValidEmail, isSuspicious } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, username, password, phone, age, gender, lookingFor, country, dateOfBirth } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email" }, { status: 400 });
    if (isSuspicious(name) || isSuspicious(email)) return NextResponse.json({ error: "Invalid input" }, { status: 400 });

    // Age verification - MUST be 18+
    let userAge = age ? parseInt(age) : null;
    if (dateOfBirth) {
      const birth = new Date(dateOfBirth);
      const today = new Date();
      userAge = today.getFullYear() - birth.getFullYear();
      const monthDiff = today.getMonth() - birth.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) userAge--;
    }

    if (userAge !== null && userAge < 18) {
      return NextResponse.json({ 
        error: "age_restricted",
        message: "You must be 18 years or older to join ConnectHub. Our platform is designed for adults seeking meaningful connections. Please come back when you're 18!"
      }, { status: 403 });
    }

    const cleanName = sanitize(name.trim());
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username ? username.toLowerCase().trim() : null;

    const [existEmail, existUser, existPhone] = await Promise.all([
      prisma.user.findFirst({ where: { email: cleanEmail } }),
      cleanUsername ? prisma.user.findFirst({ where: { username: cleanUsername } }) : null,
      phone ? prisma.user.findFirst({ where: { phone } }) : null,
    ]);

    if (existEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    if (existUser) return NextResponse.json({ error: "Username taken" }, { status: 400 });
    if (existPhone) return NextResponse.json({ error: "Phone already registered" }, { status: 400 });

    const hashed = await bcrypt.hash(password, 12);
    const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name: cleanName, email: cleanEmail, username: cleanUsername, password: hashed,
        phone: phone || null, age: userAge, gender: gender || null, lookingFor: lookingFor || null,
        country: country || null, referralCode, coins: 50,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      }
    });

    await prisma.coinTransaction.create({ data: { userId: user.id, amount: 50, type: "welcome_bonus", description: "Welcome to ConnectHub!" } }).catch(() => {});

    const session = JSON.stringify({ id: user.id, email: cleanEmail, name: cleanName });
    const res = NextResponse.json({ success: true, userId: user.id, step: "upload_photo" });
    res.cookies.set("session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*7 });

    return res;
  } catch (e: any) {
    console.error("Signup error:", e);
    if (e.code === "P2002") return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
