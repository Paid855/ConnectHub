import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, username, email, password, phone, age, gender, lookingFor, country, securityQuestion, securityAnswer } = await req.json();

    if (!name || !email || !password || !username) {
      return NextResponse.json({ error: "Name, username, email and password are required" }, { status: 400 });
    }

    if (username.length < 3) return NextResponse.json({ error: "Username must be at least 3 characters" }, { status: 400 });
    if (!/^[a-zA-Z0-9_]+$/.test(username)) return NextResponse.json({ error: "Username can only contain letters, numbers, and underscores" }, { status: 400 });

    const existingEmail = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 409 });

    const existingUsername = await prisma.user.findUnique({ where: { username: username.toLowerCase() } });
    if (existingUsername) return NextResponse.json({ error: "Username already taken" }, { status: 409 });

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await prisma.user.create({
      data: {
        name,
        username: username.toLowerCase(),
        email: email.toLowerCase(),
        password: hashedPassword,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        lookingFor: lookingFor || null,
        country: country || null,
        securityQuestion: securityQuestion || null,
        securityAnswer: securityAnswer ? securityAnswer.toLowerCase() : null,
      },
    });

    return NextResponse.json({ success: true, userId: user.id });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
