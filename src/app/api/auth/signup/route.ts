import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import { rateLimit } from "@/lib/rate-limit";
import { sanitize, isValidEmail, isValidUsername, isSuspicious } from "@/lib/sanitize";

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";

    // Rate limit: 5 signups per IP per hour
    const rl = rateLimit("signup:" + ip, 5, 3600000);
    if (!rl.success) return NextResponse.json({ error: "Too many signup attempts. Please try again later." }, { status: 429 });

    const body = await req.json();
    const { name, email, username, password, phone, age, gender, lookingFor, country, securityQuestion, securityAnswer } = body;

    // Validate required fields
    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password are required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });
    if (!isValidEmail(email)) return NextResponse.json({ error: "Invalid email format" }, { status: 400 });

    // Check for suspicious input
    if (isSuspicious(name) || isSuspicious(email)) {
      return NextResponse.json({ error: "Invalid input detected" }, { status: 400 });
    }

    // Validate username if provided
    if (username && !isValidUsername(username)) {
      return NextResponse.json({ error: "Username must be 3-20 characters: letters, numbers, underscores only" }, { status: 400 });
    }

    // Sanitize text inputs
    const cleanName = sanitize(name.trim());
    const cleanEmail = email.toLowerCase().trim();
    const cleanUsername = username ? username.toLowerCase().trim() : null;

    // Check existing accounts
    const [existingEmail, existingUsername, existingPhone] = await Promise.all([
      prisma.user.findFirst({ where: { email: cleanEmail } }),
      cleanUsername ? prisma.user.findFirst({ where: { username: cleanUsername } }) : null,
      phone ? prisma.user.findFirst({ where: { phone } }) : null,
    ]);

    if (existingEmail) return NextResponse.json({ error: "Email already registered" }, { status: 400 });
    if (existingUsername) return NextResponse.json({ error: "Username already taken" }, { status: 400 });
    if (existingPhone) return NextResponse.json({ error: "Phone number already registered" }, { status: 400 });

    // Check banned accounts (30-day cooldown)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const bannedCheck = await prisma.user.findFirst({
      where: { email: cleanEmail, tier: "banned", updatedAt: { gte: thirtyDaysAgo } }
    });
    if (bannedCheck) return NextResponse.json({ error: "This email was recently deleted. Please wait 30 days." }, { status: 400 });

    const hashedPassword = await bcrypt.hash(password, 12);
    const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name: cleanName,
        email: cleanEmail,
        username: cleanUsername,
        password: hashedPassword,
        phone: phone || null,
        age: age ? parseInt(age) : null,
        gender: gender || null,
        lookingFor: lookingFor || null,
        country: country || null,
        securityQuestion: securityQuestion ? sanitize(securityQuestion) : null,
        securityAnswer: securityAnswer ? securityAnswer.toLowerCase().trim() : null,
        referralCode,
        coins: 50,
      }
    });

    await prisma.coinTransaction.create({
      data: { userId: user.id, amount: 50, type: "welcome_bonus", description: "Welcome to ConnectHub!" }
    }).catch(() => {});

    return NextResponse.json({ success: true, userId: user.id, message: "Account created! You received 50 welcome coins." });
  } catch (e: any) {
    console.error("Signup error:", e);
    if (e.code === "P2002") return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
