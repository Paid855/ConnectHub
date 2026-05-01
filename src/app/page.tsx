"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import LanguageSelector from "@/components/LanguageSelector";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

function AnimatedCounter({ target, suffix = "", duration = 2000 }: { target: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useInView(0.3);
  useEffect(() => {
    if (!visible) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [visible, target, duration]);
  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  const [isMonthly, setIsMonthly] = useState(true);
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (r.ok) window.location.href = "/dashboard"; }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const i = setInterval(() => setActiveTestimonial(p => (p + 1) % testimonials.length), 5000);
    return () => clearInterval(i);
  }, []);

  const testimonials = [
    { name: "Sarah & Michael", loc: "New York, USA", quote: "We matched on ConnectHub and immediately connected over our love for hiking and Italian food. Six months later, we are inseparable and planning our future together!", status: "Married 2025", emoji: "💒", img: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=100&h=100&fit=crop&crop=faces" },
    { name: "David & Priya", loc: "London, UK", quote: "The video dating feature let us build real chemistry before meeting in person. Best decision I ever made was joining ConnectHub — found my soulmate.", status: "Together 2 years", emoji: "💕", img: "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=100&h=100&fit=crop&crop=faces" },
    { name: "Emma & Carlos", loc: "Barcelona, Spain", quote: "ConnectHub matched us based on shared values and passions. We connected from different countries, and love brought us together across the ocean.", status: "Engaged 2026", emoji: "💍", img: "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=100&h=100&fit=crop&crop=faces" },
    { name: "Aisha & James", loc: "Toronto, Canada", quote: "After years of unsuccessful dating, ConnectHub's matching system finally understood what I was looking for. James appeared within a week!", status: "Together 1 year", emoji: "🌹", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces" },
  ];

  const s1 = useInView(); const s2 = useInView(); const s3 = useInView(); const s4 = useInView();
  const s5 = useInView(); const s6 = useInView(); const s7 = useInView(); const s8 = useInView();

  return (
    <div className="min-h-screen bg-white overflow-x-hidden">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;0,800;1,400;1,500&family=DM+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-20px)} }
        @keyframes float-slow { 0%,100%{transform:translateY(0) rotate(0)} 50%{transform:translateY(-15px) rotate(3deg)} }
        @keyframes heartbeat { 0%,100%{transform:scale(1)} 14%{transform:scale(1.15)} 28%{transform:scale(1)} 42%{transform:scale(1.1)} 70%{transform:scale(1)} }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        @keyframes fade-up { from{opacity:0;transform:translateY(40px)} to{opacity:1;transform:translateY(0)} }
        @keyframes fade-in { from{opacity:0} to{opacity:1} }
        @keyframes scale-in { from{opacity:0;transform:scale(0.9)} to{opacity:1;transform:scale(1)} }
        @keyframes slide-right { from{opacity:0;transform:translateX(-30px)} to{opacity:1;transform:translateX(0)} }
        .animate-float { animation: float 6s ease-in-out infinite; }
        .animate-float-slow { animation: float-slow 8s ease-in-out infinite; }
        .animate-heartbeat { animation: heartbeat 2s ease-in-out infinite; }
        .animate-shimmer { background-size: 200% 100%; animation: shimmer 3s ease-in-out infinite; }
        .reveal { opacity:0; transform:translateY(40px); transition:all 0.8s cubic-bezier(0.16,1,0.3,1); }
        .reveal.visible { opacity:1; transform:translateY(0); }
        .reveal-delay-1 { transition-delay: 0.1s; }
        .reveal-delay-2 { transition-delay: 0.2s; }
        .reveal-delay-3 { transition-delay: 0.3s; }
        .reveal-delay-4 { transition-delay: 0.4s; }
        .reveal-delay-5 { transition-delay: 0.5s; }
        .glass { background: rgba(255,255,255,0.7); backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px); }
        .gradient-text { background: linear-gradient(135deg, #e11d48, #ec4899, #a855f7); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; }
      `}</style>

      {/* ═══ NAVBAR ═══ */}
      <nav className={"fixed top-0 w-full z-50 transition-all duration-500 font-body " + (scrolled ? "glass shadow-lg shadow-rose-100/20 border-b border-rose-100/40" : "bg-transparent")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <a href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 sm:w-11 sm:h-11 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 group-hover:shadow-rose-300/60 transition-all group-hover:scale-105 group-hover:rotate-3">
                <span className="text-white text-lg sm:text-xl">💕</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold gradient-text tracking-tight">ConnectHub</span>
            </a>

            <div className="hidden md:flex items-center gap-1">
              {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Stories", "#testimonials"]].map(([name, href]) => (
                <a key={name} href={href} className="px-4 py-2 text-gray-600 hover:text-rose-600 text-sm font-medium transition-all hover:bg-rose-50/80 rounded-lg">{name}</a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <a href="/login" className="hidden sm:inline-flex px-5 py-2.5 text-sm font-semibold text-gray-700 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-all">Sign In</a>
              <a href="/signup" className="px-5 py-2.5 sm:px-7 sm:py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all hover:scale-[1.02] active:scale-[0.98] animate-shimmer bg-[length:200%_100%]">
                Get Started
              </a>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2.5 rounded-xl hover:bg-rose-50 transition-colors">
                <div className="w-5 flex flex-col gap-1">
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "rotate-45 translate-y-1.5" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "opacity-0" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "-rotate-45 -translate-y-1.5" : "")} />
                </div>
              </button>
            </div>
          </div>

        </div>
      </nav>

      {/* Mobile menu overlay */}
      {mobileMenu && (
        <div className="md:hidden fixed inset-0 z-[60] bg-white">
          <div className="flex items-center justify-between px-6 py-4 border-b border-rose-100">
            <div className="flex items-center gap-2">
              <img src="/logo.png" alt="ConnectHub" className="h-9 w-auto" />
              <span className="text-xl font-extrabold gradient-text">ConnectHub</span>
            </div>
            <button onClick={() => setMobileMenu(false)} className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-rose-50">
              <span className="text-2xl text-gray-500">&times;</span>
            </button>
          </div>
          <div className="flex flex-col justify-center px-6 py-10 space-y-2">
            {[["Features", "#features"], ["How It Works", "#how-it-works"], ["Pricing", "#pricing"], ["Success Stories", "#testimonials"]].map(([name, href]) => (
              <a key={name} href={href} onClick={() => setMobileMenu(false)} className="block px-5 py-4 rounded-2xl text-lg font-semibold text-gray-800 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 transition-all">{name}</a>
            ))}
          </div>
          <div className="absolute bottom-0 left-0 right-0 p-6 space-y-3 border-t border-rose-100 bg-gradient-to-t from-rose-50/50 to-white">
            <a href="/signup" onClick={() => setMobileMenu(false)} className="block w-full py-4 text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-2xl font-bold text-base shadow-lg shadow-rose-200/50">Create Account</a>
            <a href="/login" onClick={() => setMobileMenu(false)} className="block w-full py-4 text-center border-2 border-rose-200 text-rose-600 rounded-2xl font-bold text-base hover:bg-rose-50 transition-all">Sign In</a>
            <p className="text-center text-xs text-gray-400 pt-2">Join 10,000+ singles finding love</p>
          </div>
        </div>
      )}

      {/* ═══ HERO ═══ */}
      <section className="relative min-h-0 sm:min-h-screen flex items-center overflow-hidden pt-24 pb-12 sm:pt-0 sm:pb-0">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-white to-pink-50/60" />
        <div className="absolute top-20 right-0 w-[600px] h-[600px] bg-gradient-to-br from-rose-200/30 to-pink-200/20 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-gradient-to-tr from-purple-200/20 to-pink-100/20 rounded-full blur-3xl animate-float-slow" />
        <div className="absolute top-1/3 left-1/3 w-[300px] h-[300px] bg-amber-100/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
            <div className="font-body">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-white/80 backdrop-blur border border-rose-100 text-rose-700 rounded-full text-sm font-semibold mb-8 shadow-sm" style={{ animation: "fade-up 0.6s ease-out" }}>
                <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span>2,847 people found love this week</span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-gray-900 leading-[1.05] mb-6 sm:mb-7 tracking-tight" style={{ animation: "fade-up 0.8s ease-out" }}>
                Where Love<br />
                <span className="font-display italic gradient-text">Finds You</span>
              </h1>
              <p className="text-base sm:text-lg lg:text-xl text-gray-500 mb-8 sm:mb-10 max-w-lg leading-relaxed" style={{ animation: "fade-up 1s ease-out" }}>
                Video-verified profiles. Intelligent matching. Real connections that lead to real relationships. Your next chapter starts here.
              </p>
              <div className="flex flex-col sm:flex-row gap-4" style={{ animation: "fade-up 1.2s ease-out" }}>
                <a href="/signup" className="group relative px-9 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full text-base font-bold hover:shadow-2xl hover:shadow-rose-300/40 transition-all text-center hover:scale-[1.02] active:scale-[0.98] overflow-hidden">
                  <span className="relative z-10">Start Matching Free <span className="inline-block ml-1 group-hover:translate-x-1 transition-transform">→</span></span>
                </a>
                <a href="#how-it-works" className="px-9 py-4 glass border border-rose-200/60 text-gray-700 rounded-full text-base font-bold hover:border-rose-300 hover:shadow-lg hover:shadow-rose-100/30 transition-all text-center">
                  See How It Works
                </a>
              </div>
              <div className="flex items-center gap-5 mt-14" style={{ animation: "fade-up 1.4s ease-out" }}>
                <div className="flex -space-x-3">
                  {[["S", "from-rose-400 to-pink-500"], ["M", "from-violet-400 to-purple-500"], ["A", "from-amber-400 to-orange-500"], ["J", "from-emerald-400 to-teal-500"], ["K", "from-sky-400 to-blue-500"]].map(([l, g], i) => (
                    <div key={i} className={"w-11 h-11 rounded-full border-[3px] border-white bg-gradient-to-br " + g + " flex items-center justify-center text-white text-xs font-bold shadow-md"}>
                      {l}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[1, 2, 3, 4, 5].map(i => <span key={i} className="text-amber-400 text-base">★</span>)}</div>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">Loved by 10,000+ singles worldwide</p>
                </div>
              </div>
            </div>

            {/* Mobile hero card */}
            <div className="lg:hidden relative mx-auto max-w-xs mt-4" style={{ animation: "scale-in 1s ease-out 0.3s both" }}>
              <div className="relative aspect-[3/4] rounded-3xl overflow-hidden shadow-2xl shadow-rose-300/30">
                <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=500&q=80&fit=crop&crop=faces" alt="Match" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-end justify-between">
                    <div>
                      <p className="text-white/60 text-[10px] font-medium tracking-widest uppercase mb-0.5">Your Match</p>
                      <p className="text-white font-bold text-xl font-display">Sarah, 26</p>
                      <p className="text-white/70 text-xs mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" /> Online now
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button className="w-10 h-10 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center text-white border border-white/10">✕</button>
                      <button className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30">♥</button>
                    </div>
                  </div>
                  <div className="flex gap-1.5 mt-3 flex-wrap">
                    {["Travel ✈️", "Music 🎵", "Coffee ☕"].map(t => (
                      <span key={t} className="px-2.5 py-1 bg-white/15 text-white text-[10px] rounded-full font-medium border border-white/10">{t}</span>
                    ))}
                  </div>
                </div>
              </div>
              {/* Mini floating notification */}
              <div className="absolute -top-3 -right-2 bg-white rounded-2xl px-4 py-2.5 shadow-xl border border-rose-100 flex items-center gap-2" style={{ animation: "fade-up 1.5s ease-out" }}>
                <div className="w-8 h-8 bg-gradient-to-br from-rose-400 to-pink-400 rounded-full flex items-center justify-center text-white text-sm">💕</div>
                <div>
                  <p className="text-xs font-bold text-gray-900">New Match!</p>
                  <p className="text-[10px] text-gray-400">Just now</p>
                </div>
              </div>
            </div>

            {/* Desktop hero visual */}
            <div className="relative hidden lg:block" style={{ animation: "scale-in 1s ease-out 0.3s both" }}>
              <div className="relative w-full h-[600px]">
                {/* Main card */}
                <div className="absolute inset-4 rounded-[2.5rem] shadow-2xl shadow-rose-300/30 overflow-hidden">
                  <img src="https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?w=600&q=80&fit=crop&crop=faces" alt="Match" className="absolute inset-0 w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />
                  <div className="absolute bottom-8 left-8 right-8 space-y-4">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-white/60 text-xs font-medium tracking-widest uppercase mb-1">Your Match</p>
                        <p className="text-white font-bold text-2xl font-display">Sarah, 26</p>
                        <p className="text-white/70 text-sm mt-1 flex items-center gap-1.5">
                          <span className="w-2 h-2 bg-emerald-400 rounded-full" /> 2 km away · Online now
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <button className="w-12 h-12 bg-white/15 backdrop-blur rounded-xl flex items-center justify-center text-white hover:bg-white/25 transition-colors border border-white/10">✕</button>
                        <button className="w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-white shadow-lg shadow-rose-500/30 hover:scale-105 transition-transform">♥</button>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-4 border border-white/10">
                      <p className="text-white/50 text-xs font-medium mb-2.5">Shared Interests</p>
                      <div className="flex gap-2 flex-wrap">
                        {["Travel ✈️", "Music 🎵", "Coffee ☕", "Fitness 💪", "Art 🎨"].map(t => (
                          <span key={t} className="px-3.5 py-1.5 bg-white/15 text-white text-xs rounded-full font-medium border border-white/10">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Floating cards */}
                <div className="absolute -top-6 -right-6 bg-white rounded-2xl p-4 shadow-xl shadow-amber-100/50 border border-amber-100 animate-float" style={{ animationDelay: "1s" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center text-xl shadow-md">✨</div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Super Like!</p>
                      <p className="text-xs text-gray-400">Stand out from the crowd</p>
                    </div>
                  </div>
                </div>

                <div className="absolute -bottom-4 -left-6 bg-white rounded-2xl p-5 shadow-xl shadow-rose-100/50 border border-rose-100 animate-float-slow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-lg">🔒</div>
                    <div>
                      <p className="font-bold text-sm text-gray-900">Video Verified</p>
                      <p className="text-xs text-gray-400">100% real profiles</p>
                    </div>
                  </div>
                  <div className="flex gap-1.5">
                    {[1, 2, 3, 4].map(i => <div key={i} className={"w-9 h-9 rounded-full bg-gradient-to-br shadow-sm " + ["from-rose-300 to-pink-400", "from-violet-300 to-purple-400", "from-amber-300 to-orange-400", "from-sky-300 to-blue-400"][i - 1]} />)}
                    <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-500">+8k</div>
                  </div>
                </div>

                <div className="absolute top-1/3 -right-10 bg-white rounded-xl px-4 py-3 shadow-lg border border-rose-100 animate-float" style={{ animationDelay: "2s" }}>
                  <p className="text-xl animate-heartbeat">💕</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-50">
          <p className="text-xs text-gray-400 font-medium font-body">Scroll to explore</p>
          <div className="w-6 h-10 border-2 border-gray-300 rounded-full flex justify-center pt-2">
            <div className="w-1.5 h-3 bg-gray-400 rounded-full animate-bounce" />
          </div>
        </div>
      </section>

      {/* ═══ TRUSTED BY / STATS ═══ */}
      <section ref={s1.ref} className="py-16 sm:py-24 bg-white border-y border-gray-100 font-body">
        <div className={"max-w-7xl mx-auto px-4 sm:px-6 reveal " + (s1.visible ? "visible" : "")}>
          <p className="text-center text-sm font-semibold text-gray-300 uppercase tracking-[0.2em] mb-12">Trusted by singles worldwide</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 sm:gap-16">
            {[
              { n: 10, suffix: "M+", l: "Active Users", icon: "👥", color: "from-rose-600 to-pink-600" },
              { n: 50, suffix: "K+", l: "Matches Made", icon: "💕", color: "from-pink-600 to-purple-600" },
              { n: 190, suffix: "+", l: "Countries", icon: "🌍", color: "from-purple-600 to-violet-600" },
              { n: 4.9, suffix: "★", l: "App Rating", icon: "⭐", color: "from-amber-500 to-orange-500" },
            ].map((s, i) => (
              <div key={i} className={"text-center reveal " + (s1.visible ? "visible" : "") + " reveal-delay-" + (i + 1)}>
                <p className="text-3xl mb-3">{s.icon}</p>
                <p className={"text-4xl sm:text-5xl font-extrabold bg-gradient-to-r " + s.color + " bg-clip-text text-transparent"}>
                  {s.suffix === "★" ? "4.9★" : <AnimatedCounter target={s.n} suffix={s.suffix} />}
                </p>
                <p className="text-gray-400 text-sm mt-2 font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURES ═══ */}
      <section id="features" ref={s2.ref} className="py-24 sm:py-32 bg-gradient-to-b from-white via-rose-50/30 to-white font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={"text-center mb-16 sm:mb-20 reveal " + (s2.visible ? "visible" : "")}>
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Why ConnectHub</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Everything You Need to<br />
              <span className="font-display italic gradient-text">Find Real Love</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">Modern dating meets meaningful connections. Built for people who are serious about finding the one.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
            {[
              { icon: "🔒", title: "Verified Profiles", desc: "Face scan + ID check ensures every profile is a real person. No catfishing, no bots — just real people.", color: "from-blue-50 to-indigo-50", border: "border-blue-100/60", accent: "bg-blue-500" },
              { icon: "🎥", title: "Video Dating", desc: "See and hear your match before meeting. Build chemistry through face-to-face video calls, safely from home.", color: "from-rose-50 to-pink-50", border: "border-rose-100/60", accent: "bg-rose-500" },
              { icon: "🌍", title: "Global Community", desc: "Connect with verified singles from 190+ countries. Love knows no borders — find yours anywhere in the world.", color: "from-emerald-50 to-teal-50", border: "border-emerald-100/60", accent: "bg-emerald-500" },
              { icon: "🛡️", title: "Privacy First", desc: "Control who sees your information. Hide your phone, email, date of birth and personal details with one tap.", color: "from-purple-50 to-violet-50", border: "border-purple-100/60", accent: "bg-purple-500" },
              { icon: "💬", title: "Smart Messaging", desc: "Rich messaging with voice notes, photos, typing indicators, read receipts, and expressive reactions.", color: "from-amber-50 to-orange-50", border: "border-amber-100/60", accent: "bg-amber-500" },
              { icon: "📡", title: "Live Streaming", desc: "Go live, connect with viewers, receive virtual gifts, and earn real coins from your audience worldwide.", color: "from-pink-50 to-rose-50", border: "border-pink-100/60", accent: "bg-pink-500" },
            ].map((f, i) => (
              <div key={i} className={"reveal " + (s2.visible ? "visible" : "") + " reveal-delay-" + Math.min(i + 1, 5)}>
                <div className={"bg-gradient-to-br " + f.color + " rounded-2xl p-8 border " + f.border + " hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer h-full"}>
                  <div className="flex items-center gap-4 mb-5">
                    <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">{f.icon}</div>
                    <div className={"w-8 h-0.5 " + f.accent + " rounded-full opacity-30"} />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HOW IT WORKS ═══ */}
      <section id="how-it-works" ref={s3.ref} className="py-24 sm:py-32 bg-white relative overflow-hidden font-body">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-bl from-rose-50 to-transparent rounded-full blur-3xl opacity-60" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-gradient-to-tr from-purple-50 to-transparent rounded-full blur-3xl opacity-40" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className={"text-center mb-16 sm:mb-20 reveal " + (s3.visible ? "visible" : "")}>
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Simple Steps</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              How <span className="font-display italic gradient-text">ConnectHub</span> Works
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">Find your perfect match in just four simple steps</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-6 relative">
            {/* Connecting line */}
            <div className="hidden lg:block absolute top-[60px] left-[12.5%] right-[12.5%] h-[2px] bg-gradient-to-r from-rose-200 via-pink-300 to-purple-200" />

            {[
              { step: "01", icon: "📝", title: "Create Profile", desc: "Sign up in 60 seconds. Add your best photos, write a bio, and share your interests.", color: "from-rose-500 to-pink-500" },
              { step: "02", icon: "✅", title: "Get Verified", desc: "Quick face scan + ID upload. Earn the trusted blue verification badge.", color: "from-purple-500 to-violet-500" },
              { step: "03", icon: "💕", title: "Discover Matches", desc: "Browse profiles curated for you based on compatibility, values, and preferences.", color: "from-pink-500 to-rose-500" },
              { step: "04", icon: "☕", title: "Connect & Date", desc: "Chat, voice call, or video date. When you are ready, meet in person!", color: "from-amber-500 to-orange-500" },
            ].map((s, i) => (
              <div key={i} className={"text-center group reveal " + (s3.visible ? "visible" : "") + " reveal-delay-" + (i + 1)}>
                <div className="relative inline-block mb-8">
                  <div className={"w-[72px] h-[72px] mx-auto bg-gradient-to-br " + s.color + " rounded-2xl flex items-center justify-center text-3xl shadow-xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500"}>
                    {s.icon}
                  </div>
                  <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-7 h-7 bg-white border-[3px] border-rose-500 rounded-full flex items-center justify-center text-rose-600 text-[10px] font-extrabold shadow-md z-10">
                    {s.step}
                  </div>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed max-w-[240px] mx-auto">{s.desc}</p>
              </div>
            ))}
          </div>

          {/* CTA after steps */}
          <div className={"text-center mt-16 reveal " + (s3.visible ? "visible" : "") + " reveal-delay-5"}>
            <a href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold hover:shadow-2xl hover:shadow-rose-300/30 transition-all hover:scale-[1.02]">
              Create Your Free Profile <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ PRICING ═══ */}
      <section id="pricing" ref={s4.ref} className="py-24 sm:py-32 bg-gradient-to-b from-gray-50 via-rose-50/20 to-white font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={"text-center mb-14 reveal " + (s4.visible ? "visible" : "")}>
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Simple Pricing</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Choose Your <span className="font-display italic gradient-text">Perfect Plan</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg mb-8">No hidden fees. Cancel anytime. Start free today.</p>
            <div className="inline-flex p-1.5 bg-gray-100 rounded-full">
              <button onClick={() => setIsMonthly(true)} className={"px-6 py-2.5 rounded-full text-sm font-semibold transition-all " + (isMonthly ? "bg-white shadow-md text-gray-900" : "text-gray-400 hover:text-gray-600")}>Monthly</button>
              <button onClick={() => setIsMonthly(false)} className={"px-6 py-2.5 rounded-full text-sm font-semibold transition-all " + (!isMonthly ? "bg-white shadow-md text-gray-900" : "text-gray-400 hover:text-gray-600")}>
                Yearly <span className="text-rose-500 text-xs font-bold">-20%</span>
              </button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-7 max-w-5xl mx-auto">
            {[
              { name: "Free", price: "$0", period: "/forever", desc: "Perfect for getting started", features: ["Browse profiles", "Limited daily matches", "5 messages per day", "Basic search filters", "Voice and video calls"], excluded: ["Ads shown", "Limited photos", "No rewinds", "No live streaming"], cta: "Get Started", popular: false },
              { name: "Plus", price: isMonthly ? "$12" : "$10", period: "/month", desc: "Best for active daters", features: ["Everything in Free", "No ads anywhere", "16 photo uploads", "Unlimited likes", "Rewind last swipe", "Extended profile views", "Live streaming access", "Priority matching"], excluded: [], cta: "Upgrade to Plus", popular: true },
              { name: "Premium", price: isMonthly ? "$25" : "$20", period: "/month", desc: "The ultimate experience", features: ["Everything in Plus", "See who likes you", "5 Super Likes per week", "Daily Top Picks", "Read receipts", "Higher profile visibility", "Monthly profile boost", "Priority support"], excluded: [], cta: "Go Premium", popular: false },
            ].map((plan, i) => (
              <div key={i} className={"reveal " + (s4.visible ? "visible" : "") + " reveal-delay-" + (i + 1)}>
                <div className={"rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-2 h-full " + (plan.popular ? "border-rose-300 border-2 relative shadow-xl shadow-rose-100/50 bg-gradient-to-b from-white to-rose-50/30 scale-[1.03]" : "border-gray-200 bg-white hover:border-rose-200")}>
                  {plan.popular && <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 text-white text-center py-2.5 text-xs font-bold tracking-[0.15em]">MOST POPULAR</div>}
                  <div className="p-7 sm:p-9">
                    <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                    <p className="text-gray-400 text-sm mb-5">{plan.desc}</p>
                    <div className="mb-7">
                      <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                      <span className="text-gray-400 font-medium">{plan.period}</span>
                    </div>
                    <a href="/signup" className={"block w-full py-3.5 rounded-full text-center font-bold text-sm transition-all " + (plan.popular ? "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:shadow-xl hover:shadow-rose-200/50" : "border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50")}>{plan.cta}</a>
                    <div className="mt-7 space-y-3">
                      {plan.features.map((f, j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span><span className="text-gray-600">{f}</span></div>)}
                      {plan.excluded.map((f, j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="w-5 h-5 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✗</span><span className="text-gray-300 line-through">{f}</span></div>)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ TESTIMONIALS ═══ */}
      <section id="testimonials" ref={s5.ref} className="py-24 sm:py-32 bg-white overflow-hidden font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={"text-center mb-14 reveal " + (s5.visible ? "visible" : "")}>
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Success Stories</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Real Couples, <span className="font-display italic gradient-text">Real Love</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">Thousands have found their person on ConnectHub</p>
          </div>

          {/* Desktop grid */}
          <div className={"hidden md:grid md:grid-cols-2 lg:grid-cols-4 gap-6 reveal " + (s5.visible ? "visible" : "")}>
            {testimonials.map((t, i) => (
              <div key={i} className={"bg-gradient-to-br from-gray-50 to-rose-50/30 rounded-2xl p-7 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 reveal-delay-" + (i + 1)}>
                <p className="text-3xl mb-4">{t.emoji}</p>
                <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  {t.img ? <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover shadow-lg border-2 border-rose-100" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-rose-200/40">{t.name[0]}</div>}
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.loc} · {t.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Mobile carousel */}
          <div className="md:hidden">
            <div className="overflow-hidden">
              <div className="transition-transform duration-500" style={{ transform: `translateX(-${activeTestimonial * 100}%)`, display: "flex" }}>
                {testimonials.map((t, i) => (
                  <div key={i} className="w-full flex-shrink-0 px-2">
                    <div className="bg-gradient-to-br from-gray-50 to-rose-50/30 rounded-2xl p-7 border border-gray-100">
                      <p className="text-3xl mb-4">{t.emoji}</p>
                      <div className="flex gap-0.5 mb-4">{[1, 2, 3, 4, 5].map(s => <span key={s} className="text-amber-400 text-sm">★</span>)}</div>
                      <p className="text-gray-600 text-sm leading-relaxed mb-6">&ldquo;{t.quote}&rdquo;</p>
                      <div className="flex items-center gap-3">
                        {t.img ? <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover shadow-lg border-2 border-rose-100" /> : <div className="w-11 h-11 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg">{t.name[0]}</div>}
                        <div>
                          <p className="text-sm font-bold text-gray-900">{t.name}</p>
                          <p className="text-xs text-gray-400">{t.loc} · {t.status}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, i) => (
                <button key={i} onClick={() => setActiveTestimonial(i)} className={"w-2.5 h-2.5 rounded-full transition-all " + (i === activeTestimonial ? "bg-rose-500 w-7" : "bg-gray-200 hover:bg-gray-300")} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FAQ ═══ */}
      <section ref={s6.ref} className="py-24 sm:py-32 bg-gradient-to-b from-white to-rose-50/30 font-body">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className={"text-center mb-14 reveal " + (s6.visible ? "visible" : "")}>
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Common <span className="font-display italic gradient-text">Questions</span>
            </h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "Is ConnectHub free to use?", a: "Yes! Basic features are completely free. Browse profiles, match, and send messages at no cost. Upgrade to Plus ($12/month) or Premium ($25/month) for enhanced features like unlimited likes, no ads, and live streaming." },
              { q: "Is ConnectHub safe and secure?", a: "Absolutely. We use bank-level encryption, verified profiles with face scan + ID check, and advanced fraud detection. Your personal information is hidden by default and we never sell your data." },
              { q: "How does matching work?", a: "Our matching system analyzes your preferences, interests, values, and location to find the most compatible people for you. The more you use ConnectHub, the smarter your matches become." },
              { q: "Can I use ConnectHub worldwide?", a: "Yes! ConnectHub is available in over 190 countries with support for 30+ languages. Find love anywhere in the world — love knows no borders." },
              { q: "How do video dates work?", a: "Add someone as a friend, then start a video call directly in the app. Both users need to grant camera permission. All calls are private and end-to-end encrypted for your safety." },
              { q: "What is the difference between Plus and Premium?", a: "Plus removes ads, gives unlimited likes, rewinds, and live streaming access. Premium includes everything in Plus, plus see who likes you, Super Likes, Daily Top Picks, read receipts, profile boosts, and priority support." },
            ].map((faq, i) => (
              <div key={i} className={"reveal " + (s6.visible ? "visible" : "") + " reveal-delay-" + Math.min(i + 1, 5)}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md hover:border-rose-100 transition-all">
                  <button onClick={() => setActiveFaq(activeFaq === i ? null : i)} className="w-full flex items-center justify-between p-6 text-left group">
                    <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4 group-hover:text-rose-600 transition-colors">{faq.q}</span>
                    <span className={"w-8 h-8 rounded-full flex items-center justify-center text-lg font-light transition-all duration-300 flex-shrink-0 " + (activeFaq === i ? "bg-rose-500 text-white rotate-45" : "bg-rose-100 text-rose-500")}> + </span>
                  </button>
                  <div className={"overflow-hidden transition-all duration-300 " + (activeFaq === i ? "max-h-60 opacity-100" : "max-h-0 opacity-0")}>
                    <div className="px-6 pb-6">
                      <p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ FEATURED MEMBERS ═══ */}
      <section ref={useInView().ref} className="py-20 sm:py-24 bg-white font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center">
          <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-6">Real People, Real Connections</span>
          <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
            Meet Our <span className="font-display italic gradient-text">Community</span>
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg mb-14">Thousands of verified singles are already finding love on ConnectHub. Will you be next?</p>
          <div className="flex justify-center gap-6 flex-wrap">
            {[
              { name: "Join Today", emoji: "💕", desc: "Create your free profile in 2 minutes" },
              { name: "Get Verified", emoji: "✓", desc: "Face scan + ID for trust & safety" },
              { name: "Find Love", emoji: "💍", desc: "Match, chat, video call, and meet" },
            ].map((s, i) => (
              <div key={i} className="bg-gradient-to-br from-rose-50 to-pink-50 border border-rose-100 rounded-2xl p-8 w-64 hover:shadow-xl hover:-translate-y-2 transition-all duration-300">
                <span className="text-4xl mb-4 block">{s.emoji}</span>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.name}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-12">
            <a href="/signup" className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold text-lg hover:shadow-2xl hover:shadow-rose-300/30 transition-all hover:scale-[1.02]">
              Start Your Love Story <span>→</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="py-12 bg-gray-50 font-body">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="flex items-center justify-center gap-8 flex-wrap">
            <a href="https://www.facebook.com/share/1BFqFtAP5X/?mibextid=wwXIfr" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-400 hover:text-blue-500 transition-colors">
              <span className="text-2xl">📘</span>
              <span className="text-sm font-medium">Facebook</span>
            </a>
            <a href="https://www.instagram.com/connecthub.love" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-400 hover:text-pink-500 transition-colors">
              <span className="text-2xl">📷</span>
              <span className="text-sm font-medium">Instagram</span>
            </a>
            <a href="https://play.google.com/store/apps/details?id=love.connecthub.app" target="_blank" rel="noopener" className="flex items-center gap-2 text-gray-400 hover:text-green-500 transition-colors">
              <span className="text-2xl">▶️</span>
              <span className="text-sm font-medium">Google Play</span>
            </a>
          </div>
        </div>
      </section>

      {/* ═══ FINAL CTA ═══ */}
      <section ref={s7.ref} className="py-24 sm:py-32 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize: "32px 32px" }} />
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-purple-300/10 rounded-full blur-3xl" />
        <div className={"relative max-w-4xl mx-auto px-4 sm:px-6 text-center reveal " + (s7.visible ? "visible" : "")}>
          <p className="text-5xl mb-6 animate-heartbeat">💕</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight font-display">
            Your Love Story<br />Starts Here
          </h2>
          <p className="text-lg sm:text-xl text-rose-100/80 mb-12 max-w-2xl mx-auto font-body">
            Join thousands of verified singles finding real love on ConnectHub. No games, no ghosting — just real connections.
          </p>
          <a href="/signup" className="inline-block px-14 py-5 bg-white text-rose-600 rounded-full font-extrabold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-[1.03] active:scale-[0.98] font-body">
            Start Free Today →
          </a>
          <p className="text-rose-200/50 text-sm mt-6 font-body">No credit card required · Free forever plan available</p>
        </div>
      </section>

      {/* ═══ GET THE APP ═══ */}
      <section className="py-16 sm:py-20 bg-white font-body">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-3xl p-8 sm:p-14 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-rose-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[200px] h-[200px] bg-pink-500/10 rounded-full blur-3xl" />
            <div className="relative flex flex-col md:flex-row items-center gap-8 md:gap-14">
              <div className="flex-1 text-center md:text-left">
                <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 tracking-tight">Take Love On The Go</h2>
                <p className="text-gray-400 text-sm sm:text-base mb-8 max-w-md">Download ConnectHub on your phone. Get instant notifications when someone likes you, matches with you, or sends a message.</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center md:justify-start">
                  <a href="https://play.google.com/store/apps/details?id=love.connecthub.app" target="_blank" rel="noopener" className="inline-flex items-center gap-3 px-6 py-3.5 bg-white rounded-xl hover:bg-gray-50 transition-all hover:shadow-lg">
                    <svg className="w-7 h-7" viewBox="0 0 24 24"><path fill="#34A853" d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734c0-.382.218-.72.609-.92z"/><path fill="#FBBC04" d="M16.247 9.544L5.12.808A1.004 1.004 0 013.609 1.814l10.183 10.183 2.455-2.453z"/><path fill="#4285F4" d="M21.393 10.916l-3.146-1.764-2.455 2.453 2.455 2.453 3.146-1.764c.783-.44.783-1.537 0-1.978z"/><path fill="#EA4335" d="M3.609 22.186L16.247 14.06l-2.455-2.453L3.609 22.186z"/></svg>
                    <div className="text-left"><p className="text-[10px] text-gray-500 font-medium">GET IT ON</p><p className="text-base font-bold text-gray-900 -mt-0.5">Google Play</p></div>
                  </a>
                  <div className="inline-flex items-center gap-3 px-6 py-3.5 bg-gray-700/50 rounded-xl border border-gray-600 cursor-default">
                    <svg className="w-7 h-7 text-gray-400" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                    <div className="text-left"><p className="text-[10px] text-gray-500 font-medium">COMING SOON</p><p className="text-base font-bold text-gray-400 -mt-0.5">App Store</p></div>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-48 h-48 sm:w-56 sm:h-56 bg-gradient-to-br from-rose-500 to-pink-500 rounded-3xl flex items-center justify-center shadow-2xl shadow-rose-500/20 rotate-6 hover:rotate-0 transition-transform duration-500">
                  <div className="text-center -rotate-6 hover:rotate-0 transition-transform duration-500">
                    <span className="text-6xl">💕</span>
                    <p className="text-white font-extrabold text-lg mt-2">ConnectHub</p>
                    <p className="text-rose-200 text-xs">Find Your Match</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══ FOOTER ═══ */}
      <footer ref={s8.ref} className="bg-gray-950 text-white pt-20 pb-10 font-body">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className={"grid grid-cols-2 md:grid-cols-4 gap-10 mb-16 reveal " + (s8.visible ? "visible" : "")}>
            <div className="col-span-2 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-5">
                <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center text-lg shadow-lg">💕</div>
                <span className="text-xl font-extrabold">ConnectHub</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed mb-6">Where meaningful connections begin. Find love, friendship, and everything in between.</p>
              <div className="flex gap-3">
                {[
                  { icon: "📘", href: "https://www.facebook.com/share/1BFqFtAP5X/?mibextid=wwXIfr", label: "Facebook" },
                  { icon: "📷", href: "https://www.instagram.com/connecthub.love", label: "Instagram" },
                  { icon: "𝕏", href: "#", label: "X" },
                ].map((s, i) => (
                  <a key={i} href={s.href} target="_blank" rel="noopener" className="w-9 h-9 bg-gray-800 hover:bg-rose-500/20 border border-gray-700 hover:border-rose-500/50 rounded-lg flex items-center justify-center text-gray-400 hover:text-rose-400 transition-all text-sm" title={s.label}>{s.icon}</a>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-gray-200 tracking-wide">Company</h4>
              <div className="space-y-3">
                <Link href="/about" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">About Us</Link>
                <Link href="/contact" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Contact</Link>
                <Link href="/advertise" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Advertise</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-gray-200 tracking-wide">Support</h4>
              <div className="space-y-3">
                <Link href="/help" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Help Center</Link>
                <Link href="/terms" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Privacy Policy</Link>
                <Link href="/child-safety" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Child Safety</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-5 text-sm text-gray-200 tracking-wide">Get in Touch</h4>
              <div className="space-y-3">
                <a href="mailto:support@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">support@connecthub.love</a>
                <a href="mailto:info@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">info@connecthub.love</a>
                <a href="mailto:privacy@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">privacy@connecthub.love</a>
                <a href="mailto:ads@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">ads@connecthub.love</a>
              </div>
            </div>
          </div>

          <LanguageSelector dark />

          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2026 ConnectHub. All rights reserved.</p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-gray-500 text-sm hover:text-rose-400 transition-colors">Terms</Link>
              <Link href="/privacy" className="text-gray-500 text-sm hover:text-rose-400 transition-colors">Privacy</Link>
              <Link href="/help" className="text-gray-500 text-sm hover:text-rose-400 transition-colors">Help</Link>
            </div>
          </div>
        </div>
      </footer>



    </div>
  );
}
