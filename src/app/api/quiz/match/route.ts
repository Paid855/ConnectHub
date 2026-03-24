import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  const session = req.cookies.get("session");
  if (!session) return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  const { id } = JSON.parse(session.value);

  // Get my quiz answers
  const myQuiz = await prisma.coinTransaction.findFirst({ where: { userId: id, type: "quiz_answers" }, orderBy: { createdAt: "desc" } });
  if (!myQuiz) return NextResponse.json({ error: "Take the quiz first", noQuiz: true }, { status: 400 });

  const myAnswers: number[] = JSON.parse(myQuiz.description);

  // Get all other users' quiz answers
  const allQuizzes = await prisma.coinTransaction.findMany({ where: { type: "quiz_answers", userId: { not: id } }, orderBy: { createdAt: "desc" } });

  // Deduplicate by userId (latest quiz only)
  const userQuizMap: Record<string, number[]> = {};
  allQuizzes.forEach(q => { if (!userQuizMap[q.userId]) userQuizMap[q.userId] = JSON.parse(q.description); });

  const userIds = Object.keys(userQuizMap);
  const users = userIds.length > 0 ? await prisma.user.findMany({
    where: { id: { in: userIds }, tier: { not: "banned" }, email: { not: "admin@connecthub.com" } },
    select: { id:true, name:true, profilePhoto:true, age:true, country:true, tier:true, verified:true, interests:true }
  }) : [];

  // Calculate compatibility scores
  const matches = users.map(u => {
    const theirAnswers = userQuizMap[u.id];
    if (!theirAnswers) return null;
    let same = 0;
    for (let i = 0; i < myAnswers.length; i++) { if (myAnswers[i] === theirAnswers[i]) same++; }
    const score = Math.round((same / myAnswers.length) * 100);
    return { user: u, score };
  }).filter(Boolean).sort((a: any, b: any) => b.score - a.score);

  return NextResponse.json({ matches });
}
