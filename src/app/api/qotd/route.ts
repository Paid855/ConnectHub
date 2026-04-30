import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const QUESTIONS = [
  "What\'s the sexiest accent in the world? 🗣️🔥",
  "Rooftop dinner or midnight beach walk? 🌃🏖️",
  "What\'s your biggest turn-on personality wise? 😏",
  "If we matched, what would your opening line be? 💬",
  "Describe your ideal partner in 3 words 💕",
  "What\'s the boldest move you\'ve ever made on a date? 🎯",
  "Would you rather have amazing chemistry or deep emotional connection? 🔥💎",
  "What song would play during your love scene? 🎵😏",
  "Biggest dating deal-breaker? Be honest 🚩",
  "If we went on a date tonight, where are we going? 🌙",
  "What\'s your most attractive quality? Don\'t be shy 💅",
  "Hot take: what\'s overrated in dating? 🤔🔥",
  "Candlelight dinner or spontaneous adventure? 🕯️🪂",
  "What makes someone unforgettable? ✨",
  "Morning person who makes breakfast or night owl who plans surprises? 🌅🌙",
  "What\'s your love language? Show don\'t tell 💕",
  "If you could teleport anywhere for a date right now, where? 🌍",
  "What\'s the most romantic text you\'ve ever received? 📱💋",
  "Flirty eyes across the room or confident walk-up? 👀🚶",
  "What\'s the best first date you\'ve ever been on? ☕✨",
  "Truth or dare? Pick one and explain why 🎲",
  "What do people always get wrong about you? 🤷",
  "Gym date or cooking together? 💪🍳",
  "What\'s your guilty pleasure song to sing in the shower? 🚿🎤",
  "How do you know when someone is THE ONE? 💍",
  "What would your ex say is your best quality? 😂",
  "Hookup culture or old school romance? Be real 💯",
  "If you wrote a dating profile for your best friend, what would you say? 👀",
  "What\'s the craziest place you\'ve been kissed? 💋🗺️",
  "Are you the one who catches feelings first? Be honest 🫠",
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
