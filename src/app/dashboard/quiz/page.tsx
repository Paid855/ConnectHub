"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, ArrowRight, ArrowLeft, Check, Sparkles, Crown, Globe, Coins, Trophy } from "lucide-react";
import Link from "next/link";

type Question = { id:number; q:string; opts:string[] };

export default function QuizPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [phase, setPhase] = useState<"intro"|"quiz"|"done"|"results">("intro");
  const [matches, setMatches] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [reward, setReward] = useState(0);

  useEffect(() => {
    fetch("/api/quiz").then(r => r.json()).then(d => setQuestions(d.questions || []));
    // Check if already taken quiz
    fetch("/api/quiz/match").then(r => { if (r.ok) return r.json(); return null; }).then(d => {
      if (d?.matches) { setMatches(d.matches); setPhase("results"); }
    }).catch(() => {});
  }, []);

  const selectAnswer = (optIdx: number) => {
    const newAnswers = [...answers];
    newAnswers[current] = optIdx;
    setAnswers(newAnswers);
    // Auto advance after short delay
    setTimeout(() => {
      if (current < questions.length - 1) setCurrent(current + 1);
      else submitQuiz(newAnswers);
    }, 400);
  };

  const submitQuiz = async (finalAnswers: number[]) => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ answers:finalAnswers }) });
      const d = await res.json();
      if (res.ok) { setReward(d.reward || 15); setPhase("done"); reload(); }
    } catch {} finally { setLoading(false); }
  };

  const loadMatches = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/quiz/match");
      if (res.ok) { const d = await res.json(); setMatches(d.matches || []); setPhase("results"); }
    } catch {} finally { setLoading(false); }
  };

  if (!user) return null;

  // INTRO
  if (phase === "intro") return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
        <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 p-8">
          <div className="text-6xl mb-4">💕</div>
          <h1 className="text-2xl font-bold text-white mb-2">Compatibility Quiz</h1>
          <p className="text-purple-100 text-sm">Find out who you match with best</p>
        </div>
        <div className="p-6">
          <div className="space-y-3 mb-6 text-left">
            {["10 fun questions about your personality","Get matched with compatible users","Earn 15 free coins for completing"].map((t,i) => (
              <div key={i} className={"flex items-center gap-3 p-3 rounded-xl " + (dc?"bg-gray-700":"bg-gray-50")}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">{i+1}</div>
                <span className={"text-sm " + (dc?"text-gray-300":"text-gray-700")}>{t}</span>
              </div>
            ))}
          </div>
          <button onClick={() => { setPhase("quiz"); setAnswers([]); setCurrent(0); }} className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg flex items-center justify-center gap-2"><Heart className="w-5 h-5" /> Start Quiz</button>
        </div>
      </div>
    </div>
  );

  // QUIZ
  if (phase === "quiz" && questions.length > 0) {
    const q = questions[current];
    return (
      <div className="max-w-md mx-auto py-4">
        <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
          <div className="bg-gradient-to-r from-violet-500 to-pink-500 px-6 py-4 flex items-center justify-between">
            <span className="text-white font-bold text-sm">Question {current+1}/{questions.length}</span>
            <span className="text-white/70 text-xs">{Math.round(((current+1)/questions.length)*100)}%</span>
          </div>
          <div className="flex gap-0.5 px-4 pt-3">{questions.map((_,i) => <div key={i} className={"flex-1 h-1 rounded-full " + (i<=current?"bg-violet-500":(dc?"bg-gray-700":"bg-gray-200"))} />)}</div>
          <div className="p-6">
            <h2 className={"text-lg font-bold mb-5 " + (dc?"text-white":"text-gray-900")}>{q.q}</h2>
            <div className="space-y-3">
              {q.opts.map((opt, oi) => (
                <button key={oi} onClick={() => selectAnswer(oi)} className={"w-full text-left px-5 py-4 rounded-xl border text-sm font-medium transition-all " + (answers[current] === oi ? "bg-gradient-to-r from-violet-500 to-pink-500 text-white border-transparent shadow-lg" : (dc?"bg-gray-700 border-gray-600 text-gray-200 hover:border-violet-400":"bg-white border-gray-200 text-gray-700 hover:border-violet-300 hover:bg-violet-50"))}>
                  <span className="flex items-center gap-3"><span className={"w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold " + (answers[current]===oi?"border-white text-white":"border-gray-300 text-gray-400")}>{String.fromCharCode(65+oi)}</span>{opt}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between mt-5">
              <button onClick={() => setCurrent(Math.max(0, current-1))} disabled={current===0} className={"flex items-center gap-1 text-sm font-medium disabled:opacity-30 " + (dc?"text-gray-400":"text-gray-500")}><ArrowLeft className="w-4 h-4" /> Back</button>
              {loading && <span className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Submitting...</span>}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // DONE
  if (phase === "done") return (
    <div className="max-w-md mx-auto text-center py-8">
      <div className={"rounded-3xl border overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
        <div className="bg-gradient-to-br from-emerald-500 to-teal-500 p-8">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-emerald-100">Your compatibility profile is ready</p>
        </div>
        <div className="p-6">
          <div className={"flex items-center justify-center gap-2 mb-4 p-3 rounded-xl " + (dc?"bg-amber-500/10":"bg-amber-50")}>
            <Coins className="w-5 h-5 text-amber-500" />
            <span className={"font-bold " + (dc?"text-amber-400":"text-amber-600")}>+{reward} coins earned!</span>
          </div>
          <button onClick={loadMatches} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg flex items-center justify-center gap-2">{loading?"Loading...":<><Sparkles className="w-5 h-5" /> See My Matches</>}</button>
        </div>
      </div>
    </div>
  );

  // RESULTS
  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Your Top Matches</h1><p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>Based on your compatibility quiz</p></div>
        <button onClick={() => { setPhase("intro"); setAnswers([]); setCurrent(0); }} className={"px-4 py-2 rounded-xl text-sm font-medium border " + (dc?"border-gray-600 text-gray-400 hover:text-white":"border-gray-200 text-gray-500 hover:text-gray-900")}>Retake Quiz</button>
      </div>
      {matches.length === 0 ? (
        <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <p className={dc?"text-gray-500":"text-gray-400"}>No other users have taken the quiz yet. Invite friends!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m: any, i: number) => (
            <Link key={m.user.id} href={"/dashboard/user?id=" + m.user.id} className={"flex items-center gap-4 p-4 rounded-2xl border transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700 hover:border-gray-600":"bg-white border-gray-100 hover:border-rose-200")}>
              <div className="relative">
                <span className={"absolute -top-1 -left-1 w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 " + (i<3?"bg-gradient-to-br from-amber-400 to-orange-500 text-white":"bg-gray-200 text-gray-600")}>#{i+1}</span>
                {m.user.profilePhoto ? <img src={m.user.profilePhoto} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">{m.user.name?.[0]}</div>}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2"><p className={"font-bold " + (dc?"text-white":"text-gray-900")}>{m.user.name}{m.user.age ? ", "+m.user.age : ""}</p><TierBadge tier={m.user.tier} /></div>
                {m.user.country && <p className={"text-xs flex items-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><Globe className="w-3 h-3" />{m.user.country}</p>}
                {m.user.interests?.length > 0 && <div className="flex gap-1 mt-1">{m.user.interests.slice(0,3).map((t:string) => <span key={t} className={"text-[10px] px-2 py-0.5 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500")}>{t}</span>)}</div>}
              </div>
              <div className="text-center flex-shrink-0">
                <div className={"text-2xl font-bold " + (m.score>=80?"text-emerald-500":m.score>=50?"text-amber-500":"text-gray-400")}>{m.score}%</div>
                <p className={"text-[10px] " + (dc?"text-gray-500":"text-gray-400")}>match</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
