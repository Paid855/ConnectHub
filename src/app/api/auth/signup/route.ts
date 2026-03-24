import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, username, password, phone, age, gender, lookingFor, country, securityQuestion, securityAnswer } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    const existingEmail = await prisma.user.findFirst({ where: { email: email.toLowerCase() } });
    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });

    if (username) {
      const existingUsername = await prisma.user.findFirst({ where: { username: username.toLowerCase() } });
      if (existingUsername) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    }

    if (phone) {
      const existingPhone = await prisma.user.findFirst({ where: { phone } });
      if (existingPhone) return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });
    }

    // Check if email/phone/username was recently deleted (30-day ban)
    const deletedCheck = await prisma.user.findFirst({ where: { email: email.toLowerCase(), tier: "banned" } });
    if (deletedCheck) return NextResponse.json({ error: "This email was recently deleted. Please wait 30 days." }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.toLowerCase().trim(),
        username: username ? username.toLowerCase().trim() : null,
        password: hashedPassword,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        lookingFor: lookingFor || null,
        country: country || null,
        securityQuestion: securityQuestion || null,
        securityAnswer: securityAnswer ? securityAnswer.toLowerCase().trim() : null,
        referralCode,
        coins: 50, // Welcome bonus
      }
    });

    // Give welcome coins transaction
    await prisma.coinTransaction.create({ data: { userId: user.id, amount: 50, type: "welcome_bonus", description: "Welcome to ConnectHub! 🎉" } }).catch(() => {});

    return NextResponse.json({ success: true, userId: user.id, message: "Account created successfully! You received 50 welcome coins." });
  } catch (e: any) {
    console.error("Signup error:", e);
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
