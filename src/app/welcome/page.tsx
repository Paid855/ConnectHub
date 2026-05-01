"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Head from "next/head";

export default function WelcomePage() {
  const router = useRouter();
  const [splash, setSplash] = useState(true);
  const [theme, setTheme] = useState<"dark"|"light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const saved = localStorage.getItem("ch_app_theme");
    if (saved === "light") setTheme("light");
    const hasSession = document.cookie.includes("session=") || document.cookie.includes("token=");
    if (hasSession) { router.replace("/dashboard"); return; }
    const timer = setTimeout(() => setSplash(false), 2400);
    return () => clearTimeout(timer);
  }, [router]);

  useEffect(() => {
    if (mounted) localStorage.setItem("ch_app_theme", theme);
  }, [theme, mounted]);

  const dk = theme === "dark";
  if (!mounted) return null;

  const css = ".font-display{font-family:'Cormorant Garamond',serif}@keyframes chGlow{0%,100%{transform:scale(1);opacity:.4}50%{transform:scale(1.08);opacity:.7}}@keyframes chLogoIn{0%{opacity:0;transform:scale(.4) rotate(-10deg)}60%{transform:scale(1.06) rotate(2deg)}100%{opacity:1;transform:scale(1) rotate(0)}}@keyframes chFadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes chBar{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes chSpin{to{transform:rotate(360deg)}}@keyframes chHeart{0%,100%{transform:scale(1)}12%{transform:scale(1.1)}24%{transform:scale(1)}36%{transform:scale(1.06)}48%{transform:scale(1)}}@keyframes chFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-16px)}}";

  return (
    <div className={"min-h-screen transition-colors duration-500 overflow-hidden " + (dk ? "bg-[#0a0a0c]" : "bg-[#fafafa]")}>
      <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      <style dangerouslySetInnerHTML={{__html: css}} />

      {/* SPLASH */}
      <div className={"fixed inset-0 z-50 flex flex-col items-center justify-center transition-all duration-700 " + (splash ? "opacity-100" : "opacity-0 pointer-events-none") + " " + (dk ? "bg-[#0a0a0c]" : "bg-[#fafafa]")}>
        <div className={"absolute w-[350px] h-[350px] rounded-full " + (dk ? "bg-rose-500/10" : "bg-rose-500/5")} style={{animation:"chGlow 3s ease-in-out infinite"}} />
        <div className="w-[90px] h-[90px] bg-gradient-to-br from-rose-500 to-pink-500 rounded-[24px] flex items-center justify-center text-[46px] shadow-2xl shadow-rose-500/30 relative z-10" style={{animation:"chLogoIn 0.8s cubic-bezier(.34,1.56,.64,1) 0.2s both"}}>
          💕
        </div>
        <h1 className={"mt-5 text-[32px] font-bold relative z-10 font-display " + (dk ? "text-white" : "text-gray-900")} style={{animation:"chFadeUp 0.6s ease 0.5s both"}}>ConnectHub</h1>
        <p className={"mt-2 text-[11px] tracking-[4px] uppercase relative z-10 " + (dk ? "text-white/25" : "text-gray-400")} style={{animation:"chFadeUp 0.6s ease 0.7s both"}}>Find Your Perfect Match</p>
        <div className={"mt-10 w-9 h-[3px] rounded-full overflow-hidden relative z-10 " + (dk ? "bg-white/10" : "bg-gray-200")} style={{animation:"chFadeUp 0.4s ease 0.9s both"}}>
          <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full" style={{transformOrigin:"left",animation:"chBar 1.6s ease-in-out 1s forwards",transform:"scaleX(0)"}} />
        </div>
      </div>

      {/* WELCOME */}
      <div className={"min-h-screen flex flex-col transition-all duration-700 " + (splash ? "opacity-0 scale-95" : "opacity-100 scale-100")}>
        <div className="flex justify-end p-5 pt-14 sm:pt-6">
          <button onClick={() => setTheme(dk ? "light" : "dark")} className={"w-11 h-11 rounded-full flex items-center justify-center text-lg transition-all active:scale-90 " + (dk ? "bg-white/5 border border-white/10 hover:bg-white/10" : "bg-gray-100 border border-gray-200 hover:bg-gray-200")}>
            {dk ? "☀️" : "🌙"}
          </button>
        </div>

        <div className="flex-1 flex items-center justify-center px-6 relative">
          <div className={"absolute w-1.5 h-1.5 rounded-full top-[20%] left-[15%] " + (dk ? "bg-rose-500/10" : "bg-rose-500/15")} style={{animation:"chFloat 6s ease-in-out infinite"}} />
          <div className={"absolute w-1 h-1 rounded-full top-[35%] right-[12%] " + (dk ? "bg-pink-500/8" : "bg-pink-500/12")} style={{animation:"chFloat 8s ease-in-out infinite 1s"}} />
          <div className={"absolute w-1.5 h-1.5 rounded-full bottom-[30%] left-[20%] " + (dk ? "bg-amber-500/8" : "bg-amber-500/10")} style={{animation:"chFloat 7s ease-in-out infinite 0.5s"}} />

          <div className="relative w-[250px] h-[250px]">
            <div className={"absolute inset-0 rounded-full border " + (dk ? "border-rose-500/10" : "border-rose-300/25")} style={{animation:"chSpin 22s linear infinite"}}>
              <div className="absolute -top-1 left-1/2 w-[9px] h-[9px] rounded-full bg-rose-500 shadow-lg shadow-rose-500/40" />
            </div>
            <div className={"absolute inset-[30px] rounded-full border " + (dk ? "border-pink-500/10" : "border-pink-300/20")} style={{animation:"chSpin 16s linear infinite reverse"}}>
              <div className="absolute -bottom-1 right-[22%] w-2 h-2 rounded-full bg-pink-400 shadow-lg shadow-pink-400/40" />
            </div>
            <div className={"absolute inset-[58px] rounded-full border " + (dk ? "border-amber-500/10" : "border-amber-300/15")} style={{animation:"chSpin 11s linear infinite"}}>
              <div className="absolute top-[22%] -left-[3px] w-[7px] h-[7px] rounded-full bg-amber-400 shadow-lg shadow-amber-400/30" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-[78px] h-[78px] bg-gradient-to-br from-rose-500 to-pink-500 rounded-[22px] flex items-center justify-center text-[40px] shadow-2xl shadow-rose-500/25" style={{animation:"chHeart 2.8s ease-in-out infinite"}}>
                💕
              </div>
            </div>
          </div>
        </div>

        <div className="px-7 pb-12 sm:pb-16 sm:max-w-md sm:mx-auto sm:w-full">
          <h2 className={"text-[30px] sm:text-[34px] leading-tight font-bold mb-3 font-display " + (dk ? "text-white" : "text-gray-900")}>
            Where Love<br/>Finds <em className="bg-gradient-to-r from-rose-500 to-pink-400 bg-clip-text text-transparent italic">You</em>
          </h2>
          <p className={"text-[14px] leading-relaxed mb-8 " + (dk ? "text-white/30" : "text-gray-400")}>
            Join millions finding real connections through voice, video, and meaningful conversations.
          </p>

          <Link href="/login" className="block w-full py-[18px] bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl text-center text-white font-bold text-[16px] shadow-xl shadow-rose-500/20 hover:shadow-2xl hover:shadow-rose-500/30 transition-all active:scale-[0.98] mb-3 no-underline">
            Sign In
          </Link>
          <Link href="/signup" className={"block w-full py-[18px] rounded-2xl text-center font-semibold text-[16px] transition-all active:scale-[0.98] border no-underline mb-5 " + (dk ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100")}>
            Create Account
          </Link>

          <p className={"text-center text-[11px] leading-relaxed " + (dk ? "text-white/20" : "text-gray-300")}>
            By continuing, you agree to our{" "}
            <Link href="/terms" className="text-rose-500/50 hover:text-rose-500 no-underline">Terms</Link> and{" "}
            <Link href="/privacy" className="text-rose-500/50 hover:text-rose-500 no-underline">Privacy Policy</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
