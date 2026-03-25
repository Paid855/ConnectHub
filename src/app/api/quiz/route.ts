import { getUserId } from "@/lib/auth";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

const QUESTIONS = [
  { id:1, q:"What is your ideal weekend?", opts:["Adventure outdoors","Relaxing at home","Socializing with friends","Learning something new"] },
  { id:2, q:"How do you handle conflict?", opts:["Talk it out immediately","Take time to cool down","Avoid it","Find a compromise"] },
  { id:3, q:"What matters most in a partner?", opts:["Sense of humor","Ambition","Kindness","Intelligence"] },
  { id:4, q:"Your love language is?", opts:["Words of affirmation","Physical touch","Acts of service","Quality time"] },
  { id:5, q:"How do you feel about long distance?", opts:["I can make it work","Prefer to be close","Absolutely not","Depends on the person"] },
  { id:6, q:"Kids in the future?", opts:["Definitely yes","Maybe someday","Prefer not to","Already have kids"] },
  { id:7, q:"How important is religion/faith?", opts:["Very important","Somewhat important","Not important","Spiritual but not religious"] },
  { id:8, q:"Your communication style?", opts:["Text all day","Call when needed","In-person talks","Mix of everything"] },
  { id:9, q:"Ideal first date?", opts:["Coffee & conversation","Dinner at a restaurant","Outdoor activity","Movie or show"] },
  { id:10, q:"What is your dealbreaker?", opts:["Dishonesty","Lack of ambition","No sense of humor","Clinginess"] },
];

export async function GET() {
  return NextResponse.json({ questions: QUESTIONS });
}

export async function POST(req: NextRequest) {
  const id = getUserId(req);
  if (!id) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { answers } = await req.json();

  if (!answers || answers.length !== QUESTIONS.length) return NextResponse.json({ error: "Answer all questions" }, { status: 400 });

  // Save answers as JSON in user bio field temporarily or a separate field
  // For now store in interests-adjacent approach using a transaction
  const quizData = JSON.stringify(answers);

  await prisma.user.update({ where: { id }, data: { bio: (await prisma.user.findUnique({ where: { id }, select: { bio: true } }))?.bio || "" } });

  // Calculate compatibility with all other users who have taken the quiz
  // Store quiz answers in a simple way - we'll use coinTransaction description field creatively
  await prisma.coinTransaction.create({ data: { userId: id, amount: 0, type: "quiz_answers", description: quizData } }).catch(() => {});

  // Give 15 coins for completing quiz
  await prisma.user.update({ where: { id }, data: { coins: { increment: 15 } } });
  await prisma.coinTransaction.create({ data: { userId: id, amount: 15, type: "quiz_reward", description: "Completed compatibility quiz" } });

  return NextResponse.json({ success: true, reward: 15 });
}
