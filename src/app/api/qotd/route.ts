import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const QUESTIONS = [
  "What\'s your love language? 💕",
  "Beach vacation or mountain adventure? 🏖️⛰️",
  "What\'s the most romantic thing someone could do for you? 🌹",
  "Breakfast in bed or dinner under the stars? 🌙",
  "What song makes you think of love? 🎵",
  "What\'s your ideal first date? ☕",
  "Early bird or night owl? 🌅🦉",
  "What\'s your biggest green flag in a partner? 🟢",
  "Cook at home or eat out? 🍳🍽️",
  "What makes you laugh the hardest? 😂",
  "What\'s the most adventurous thing you\'ve done? 🪂",
  "Dogs or cats? 🐕🐱",
  "What\'s your comfort movie? 🎬",
  "City life or countryside? 🏙️🌾",
  "What do you value most in a relationship? 💎",
  "What\'s your hidden talent? ✨",
  "Spontaneous trip or planned vacation? 🗺️",
  "What\'s your guilty pleasure? 🤫",
  "Text all day or save it for the date? 📱",
  "What\'s the best compliment you\'ve received? 💐",
  "Netflix night or game night? 🎮",
  "What does your perfect Sunday look like? ☀️",
  "Coffee, tea, or hot chocolate? ☕🍵🍫",
  "What would you do with a million dollars? 💰",
  "Describe yourself in 3 emojis 🤔",
  "What\'s the last thing that made you smile? 😊",
  "Road trip or fly there? 🚗✈️",
  "What\'s your favorite way to show love? 💝",
  "Sweet or savory? 🍰🧀",
  "What\'s your dream date destination? 🌍",
];

function getTodayQuestion(): { question: string; index: number } {
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const index = dayOfYear % QUESTIONS.length;
  return { question: QUESTIONS[index]!, index };
}

export async function GET(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { question, index } = getTodayQuestion();
  const today = new Date().toISOString().split("T")[0];

  // Get user's answer for today
  const myAnswer = await prisma.qotdAnswer.findFirst({
    where: { userId: id, date: today }
  }).catch(() => null);

  // Get recent answers from others (only if user has answered)
  let otherAnswers: any[] = [];
  if (myAnswer) {
    const answers = await prisma.qotdAnswer.findMany({
      where: { date: today, userId: { not: id } },
      take: 20,
      orderBy: { createdAt: "desc" }
    });
    const userIds = answers.map(a => a.userId);
    const users = userIds.length > 0 ? await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, profilePhoto: true, tier: true, verified: true }
    }) : [];
    otherAnswers = answers.map(a => ({
      answer: a.answer,
      user: users.find(u => u.id === a.userId) || null
    })).filter(a => a.user);
  }

  return NextResponse.json({
    question,
    questionIndex: index,
    date: today,
    myAnswer: myAnswer?.answer || null,
    totalAnswers: await prisma.qotdAnswer.count({ where: { date: today } }).catch(() => 0),
    otherAnswers
  });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });

  const { answer } = await req.json();
  if (!answer || typeof answer !== "string" || answer.trim().length === 0) {
    return NextResponse.json({ error: "Answer required" }, { status: 400 });
  }

  const today = new Date().toISOString().split("T")[0];
  const existing = await prisma.qotdAnswer.findFirst({ where: { userId: id, date: today } }).catch(() => null);
  if (existing) {
    return NextResponse.json({ error: "Already answered today" }, { status: 400 });
  }

  const { index } = getTodayQuestion();
  await prisma.qotdAnswer.create({
    data: { userId: id, date: today, questionIndex: index, answer: answer.trim().substring(0, 200) }
  });

  return NextResponse.json({ success: true });
}
