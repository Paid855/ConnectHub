import { NextRequest, NextResponse } from "next/server";
import { sendWelcomeEmail, sendAdminAlert } from "@/lib/email";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, username, password, phone, age, gender, lookingFor, country, dateOfBirth, securityQuestion, securityAnswer, profilePhoto, interests } = body;

    if (!name || !email || !password) return NextResponse.json({ error: "Name, email and password required" }, { status: 400 });
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 });

    // Block emojis and special characters in name
    const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
    const cleanName = name.trim();
    if (emojiRegex.test(cleanName)) {
      return NextResponse.json({ error: "Name cannot contain emojis or special symbols" }, { status: 400 });
    }
    if (cleanName.length < 2 || cleanName.length > 50) {
      return NextResponse.json({ error: "Name must be 2-50 characters" }, { status: 400 });
    }
    if (!/^[a-zA-Z\s\-\']+$/.test(cleanName)) {
      return NextResponse.json({ error: "Name can only contain letters, spaces, hyphens, and apostrophes" }, { status: 400 });
    }

    // Block emojis in username
    if (username) {
      const cleanUsername = username.trim().toLowerCase();
      if (emojiRegex.test(cleanUsername)) {
        return NextResponse.json({ error: "Username cannot contain emojis" }, { status: 400 });
      }
      if (!/^[a-z0-9_]{3,20}$/.test(cleanUsername)) {
        return NextResponse.json({ error: "Username must be 3-20 characters: letters, numbers, underscore only" }, { status: 400 });
      }
    }

    // Age check - must be 18+ (required)
    if (!dateOfBirth) {
      return NextResponse.json({ error: "Date of birth is required" }, { status: 400 });
    }
    const birth = new Date(dateOfBirth);
    const today = new Date();
    let userAge = today.getFullYear() - birth.getFullYear();
    const md = today.getMonth() - birth.getMonth();
    if (md < 0 || (md === 0 && today.getDate() < birth.getDate())) userAge--;
    if (userAge < 18) {
      return NextResponse.json({ error: "You must be 18 or older to join ConnectHub. This platform is for adults only.", ageRestricted: true }, { status: 403 });
    }

    // Email validation
    const cleanEmail = email.toLowerCase().trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      return NextResponse.json({ error: "Please enter a valid email address" }, { status: 400 });
    }

    // Block admin/system emails from regular signup
    const blockedEmails = ["admin@connecthub.com", "admin@connecthub.love", "support@connecthub.love", "noreply@connecthub.love", "privacy@connecthub.love", "ads@connecthub.love"];
    if (blockedEmails.includes(cleanEmail)) {
      return NextResponse.json({ error: "This email is reserved. Please use a different email." }, { status: 400 });
    }

    // Check if email already exists
    const existing = await prisma.user.findFirst({ where: { email: cleanEmail } });
    if (existing) return NextResponse.json({ error: "This email is already registered. Try logging in instead." }, { status: 400 });

    // Check if phone number already exists
    if (phone && phone.trim()) {
      const cleanPhone = phone.trim().replace(/[\s\-()]/g, "");
      if (cleanPhone.length >= 7) {
        const existingPhone = await prisma.user.findFirst({ where: { phone: cleanPhone } });
        if (existingPhone) return NextResponse.json({ error: "This phone number is already linked to another account." }, { status: 400 });
      }
    }

    // Check if username is taken
    if (username) {
      const existUser = await prisma.user.findFirst({ where: { username: username.toLowerCase().trim() } });
      if (existUser) return NextResponse.json({ error: "This username is taken. Try a different one." }, { status: 400 });
    }

    const hashed = await bcrypt.hash(password, 12);
    const referralCode = "CH" + Math.random().toString(36).substring(2, 8).toUpperCase();

    const user = await prisma.user.create({
      data: {
        name: name.trim(),
        email: cleanEmail,
        username: username ? username.toLowerCase().trim() : null,
        password: hashed,
        phone: phone ? phone.trim().replace(/[\s\-()]/g, "") : null,
        age: userAge,
        gender: gender || null,
        lookingFor: lookingFor || null,
        country: country || null,
        referralCode,
        securityQuestion: securityQuestion || null,
        securityAnswer: securityAnswer || null,
        coins: 20,
      }
    });

    // Upload profile photo to Cloudinary if provided
    if (profilePhoto && profilePhoto.startsWith("data:image")) {
      try {
        const crypto = require("crypto");
        const cloudName = process.env.CLOUDINARY_CLOUD_NAME || "dpov63szx";
        const apiKey = process.env.CLOUDINARY_API_KEY || "";
        const apiSecret = process.env.CLOUDINARY_API_SECRET || "";
        const timestamp = Math.floor(Date.now() / 1000);
        const folder = "connecthub/profiles";
        const sigStr = "folder=" + folder + "&timestamp=" + timestamp + apiSecret;
        const signature = crypto.createHash("sha1").update(sigStr).digest("hex");

        const formData = new URLSearchParams();
        formData.append("file", profilePhoto);
        formData.append("folder", folder);
        formData.append("timestamp", String(timestamp));
        formData.append("api_key", apiKey);
        formData.append("signature", signature);

        const cloudRes = await fetch("https://api.cloudinary.com/v1_1/" + cloudName + "/image/upload", {
          method: "POST",
          body: formData
        });
        const cloudData = await cloudRes.json();
        if (cloudData.secure_url) {
          await prisma.user.update({ where: { id: user.id }, data: { profilePhoto: cloudData.secure_url } });
        } else {
          console.error("Cloudinary error:", cloudData);
        }
      } catch (e) { console.error("Photo upload error:", e); }
    }

    // Save interests
    if (interests && Array.isArray(interests) && interests.length > 0) {
      try {
        await prisma.user.update({ where: { id: user.id }, data: { interests } });
      } catch {}
    }

    await prisma.coinTransaction.create({ data: { userId: user.id, amount: 20, type: "welcome_bonus", description: "Welcome to ConnectHub!" } }).catch(() => {});

    // Send welcome email
    try { await sendWelcomeEmail(cleanEmail, name.trim()); } catch (e) { console.error("Welcome email error:", e); }

    // Create welcome notification
    await prisma.notification.create({
      data: { userId: user.id, type: "purchase", title: "Welcome to ConnectHub! 🎉", message: "You received 20 free coins as a welcome gift. Start exploring and find your perfect match!", read: false }
    }).catch(() => {});

    // Set session FIRST so signup succeeds even if email fails
    const session = JSON.stringify({ id: user.id, email: cleanEmail, name: name.trim() });
    const res = NextResponse.json({ success: true, userId: user.id, step: "verify_email" });
    res.cookies.set("session", session, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 60*60*24*7 });

    // Generate verification code (non-blocking — signup succeeds regardless)
    try {
      const emailOtp = String(Math.floor(100000 + Math.random() * 900000));
      const emailOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      await prisma.user.update({ where: { id: user.id }, data: { emailOtp, emailOtpExpiry } });
    } catch (e) { console.error("OTP save error:", e); }

    return res;
  } catch (e: any) {
    console.error("Signup error:", e);
    if (e.code === "P2002") return NextResponse.json({ error: "Account already exists" }, { status: 400 });
    return NextResponse.json({ error: "Server error. Please try again." }, { status: 500 });
  }
}
