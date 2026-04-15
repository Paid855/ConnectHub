"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

export default function HomePage() {
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number|null>(null);
  const [isMonthly, setIsMonthly] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (r.ok) window.location.href = "/dashboard"; }).catch(() => {});
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-white">

      {/* NAVBAR */}
      <nav className={"fixed top-0 w-full z-50 transition-all duration-500 " + (scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-rose-100/20 border-b border-rose-100/50" : "bg-white/60 backdrop-blur-md")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-rose-500 via-pink-500 to-rose-600 rounded-xl flex items-center justify-center shadow-lg shadow-rose-200/50 group-hover:shadow-rose-300/60 transition-all group-hover:scale-105">
                <span className="text-white text-lg sm:text-xl">💕</span>
              </div>
              <span className="text-xl sm:text-2xl font-extrabold bg-gradient-to-r from-rose-600 via-pink-600 to-rose-500 bg-clip-text text-transparent">ConnectHub</span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {[["Features","#features"],["How It Works","#how-it-works"],["Pricing","#pricing"],["Stories","#testimonials"]].map(([name,href]) => (
                <a key={name} href={href} className="px-4 py-2 text-gray-600 hover:text-rose-600 text-sm font-medium transition-all hover:bg-rose-50 rounded-lg">{name}</a>
              ))}
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              <Link href="/login" className="hidden sm:inline-flex px-5 py-2.5 text-sm font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-full transition-all">Sign In</Link>
              <Link href="/signup" className="px-5 py-2.5 sm:px-7 sm:py-3 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all hover:scale-[1.02] active:scale-[0.98]">Get Started</Link>
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2.5 rounded-xl hover:bg-rose-50 transition-colors">
                <div className="w-5 flex flex-col gap-1">
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "rotate-45 translate-y-1.5" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "opacity-0" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded-full transition-all duration-300 " + (mobileMenu ? "-rotate-45 -translate-y-1.5" : "")} />
                </div>
              </button>
            </div>
          </div>

          {mobileMenu && (
            <div className="md:hidden pb-6 border-t border-rose-100 animate-in slide-in-from-top">
              <div className="pt-4 space-y-1">
                {[["Features","#features"],["How It Works","#how-it-works"],["Pricing","#pricing"],["Stories","#testimonials"]].map(([name,href]) => (
                  <a key={name} href={href} onClick={()=>setMobileMenu(false)} className="block px-4 py-3 rounded-xl text-gray-700 hover:bg-gradient-to-r hover:from-rose-50 hover:to-pink-50 font-medium transition-all">{name}</a>
                ))}
                <div className="flex gap-3 pt-4 px-2">
                  <Link href="/login" onClick={()=>setMobileMenu(false)} className="flex-1 py-3 text-center border-2 border-rose-400 text-rose-600 rounded-full font-bold hover:bg-rose-50 transition-all">Sign In</Link>
                  <Link href="/signup" onClick={()=>setMobileMenu(false)} className="flex-1 py-3 text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold shadow-lg shadow-rose-200/50">Sign Up</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50/80 to-purple-50/60" />
        <div className="absolute top-20 right-10 w-[500px] h-[500px] bg-gradient-to-br from-rose-200/40 to-pink-200/30 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-gradient-to-tr from-purple-200/30 to-pink-200/20 rounded-full blur-3xl" style={{animationDelay:"3s"}} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-rose-100/20 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-700 rounded-full text-sm font-semibold mb-8 shadow-sm">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                Trusted by thousands worldwide
              </div>
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-[1.1] mb-6 tracking-tight">
                Find Your<br/>
                <span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent" style={{fontFamily:"'Playfair Display',serif"}}>Perfect Match</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-lg leading-relaxed">
                Video-verified profiles and real connections. Join thousands of singles finding meaningful love on ConnectHub.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="group px-8 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full text-base font-bold hover:shadow-2xl hover:shadow-rose-300/40 transition-all text-center hover:scale-[1.02] active:scale-[0.98]">
                  Start Free Today
                  <span className="inline-block ml-2 group-hover:translate-x-1 transition-transform">→</span>
                </Link>
                <a href="#how-it-works" className="px-8 py-4 bg-white border-2 border-rose-200 text-rose-600 rounded-full text-base font-bold hover:border-rose-400 hover:shadow-lg hover:shadow-rose-100/50 transition-all text-center">See How It Works</a>
              </div>
              <div className="flex items-center gap-6 mt-12">
                <div className="flex -space-x-3">
                  {["from-rose-400 to-pink-400","from-purple-400 to-pink-400","from-amber-400 to-orange-400","from-emerald-400 to-teal-400"].map((g,i) => (
                    <div key={i} className={"w-11 h-11 rounded-full border-[3px] border-white bg-gradient-to-br " + g + " flex items-center justify-center text-white text-xs font-bold shadow-md"}>
                      {["S","M","A","J"][i]}
                    </div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-base">★</span>)}</div>
                  <p className="text-gray-400 text-xs font-medium mt-0.5">Join 10,000+ finding love</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-[580px]">
                <div className="absolute inset-4 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-500 rounded-[2rem] shadow-2xl shadow-rose-300/40 overflow-hidden">
                  <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-30" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-lg flex items-center justify-center text-3xl animate-heartbeat shadow-lg">💕</div>
                      <div>
                        <p className="text-white font-bold text-xl">New Match!</p>
                        <p className="text-white/70 text-sm">You and Sarah have 8 things in common</p>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-xl rounded-2xl p-5 border border-white/20 shadow-xl">
                      <div className="flex gap-2 flex-wrap">
                        {["Travel","Music","Coffee","Fitness","Photography"].map(t => (
                          <span key={t} className="px-4 py-1.5 bg-white/20 text-white text-xs rounded-full font-medium backdrop-blur">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-28 h-28 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-xl shadow-amber-200/50 animate-float">
                  <div className="text-center"><p className="text-3xl mb-1">💎</p><p className="text-xs font-bold text-amber-900">Premium</p></div>
                </div>
                <div className="absolute -bottom-3 -left-3 bg-white rounded-2xl p-5 shadow-xl shadow-rose-100/50 border border-rose-100 w-56">
                  <p className="text-gray-900 font-bold text-sm">Video Date</p>
                  <p className="text-gray-400 text-xs mt-0.5">Face-to-face before you meet</p>
                  <div className="flex gap-1.5 mt-3">{[1,2,3].map(i => <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-300 to-pink-400 shadow-md" />)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-14 sm:py-20 bg-white border-y border-rose-100/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 sm:gap-12">
            {[{n:"10M+",l:"Active Users",icon:"👥"},{n:"50K+",l:"Matches Made",icon:"💕"},{n:"190+",l:"Countries",icon:"🌍"},{n:"4.9★",l:"App Rating",icon:"⭐"}].map((s,i) => (
              <div key={i} className="text-center group">
                <p className="text-3xl mb-2">{s.icon}</p>
                <p className="text-3xl sm:text-5xl font-extrabold bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">{s.n}</p>
                <p className="text-gray-400 text-sm sm:text-base mt-2 font-medium">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28 bg-gradient-to-b from-white via-rose-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-sm font-semibold mb-5">WHY CONNECTHUB</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Everything You Need to
              <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent"> Find Love</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto text-base sm:text-lg">Modern dating meets meaningful connections. Built for people who are serious about finding real relationships.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {icon:"🔒",title:"Verified Profiles",desc:"Face scan + ID check ensures every profile is a real person. Trust who you match with.",color:"from-blue-500/10 to-indigo-500/10",border:"border-blue-100"},
              {icon:"🎥",title:"Video Dating",desc:"See and hear your match before meeting. Build real chemistry through face-to-face video calls.",color:"from-rose-500/10 to-pink-500/10",border:"border-rose-100"},
              {icon:"🌍",title:"Global Community",desc:"Connect with singles from 190+ countries. Love knows no borders on ConnectHub.",color:"from-emerald-500/10 to-teal-500/10",border:"border-emerald-100"},
              {icon:"🛡️",title:"Privacy First",desc:"Control who sees your info. Hide your phone, email, and personal details with one tap.",color:"from-purple-500/10 to-violet-500/10",border:"border-purple-100"},
              {icon:"💬",title:"Smart Messaging",desc:"Rich messaging with voice notes, photos, videos, typing indicators, and read receipts.",color:"from-amber-500/10 to-orange-500/10",border:"border-amber-100"},
              {icon:"📡",title:"Live Streaming",desc:"Go live, connect with viewers, receive gifts, and earn real coins from your audience.",color:"from-pink-500/10 to-rose-500/10",border:"border-pink-100"},
            ].map((f,i) => (
              <div key={i} className={"bg-gradient-to-br " + f.color + " rounded-2xl p-7 sm:p-8 border " + f.border + " hover:shadow-xl hover:-translate-y-2 transition-all duration-500 group cursor-pointer"}>
                <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-2xl mb-5 shadow-sm group-hover:scale-110 transition-transform duration-300">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-3">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-rose-50 to-transparent rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16 sm:mb-20">
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-sm font-semibold mb-5">SIMPLE STEPS</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              How <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span> Works
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">Find your perfect match in just four simple steps</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-10">
            {[
              {step:"1",icon:"📝",title:"Create Profile",desc:"Sign up in 60 seconds. Add photos, bio, and your interests.",color:"from-rose-500 to-pink-500"},
              {step:"2",icon:"✅",title:"Get Verified",desc:"Quick face scan + ID upload. Earn the trusted blue badge.",color:"from-purple-500 to-violet-500"},
              {step:"3",icon:"💕",title:"Discover Matches",desc:"Swipe through profiles curated and tailored to your preferences.",color:"from-pink-500 to-rose-500"},
              {step:"4",icon:"☕",title:"Connect & Date",desc:"Chat, voice call, or video date. Then meet in person!",color:"from-amber-500 to-orange-500"},
            ].map((s,i) => (
              <div key={i} className="relative text-center group">
                <div className={"w-20 h-20 mx-auto bg-gradient-to-br " + s.color + " rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-xl group-hover:scale-110 group-hover:rotate-3 transition-all duration-300"}>
                  {s.icon}
                </div>
                <div className="absolute top-16 left-1/2 w-7 h-7 -ml-3.5 bg-white border-[3px] border-rose-500 rounded-full flex items-center justify-center text-rose-600 text-xs font-extrabold z-10 shadow-md">{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2 mt-3">{s.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 sm:py-28 bg-gradient-to-b from-rose-50/40 via-pink-50/20 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-sm font-semibold mb-5">SIMPLE PRICING</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Choose Your <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Perfect Plan</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">No hidden fees. Cancel anytime. Start free today.</p>
            <div className="inline-flex mt-8 p-1.5 bg-gray-100 rounded-full">
              <button onClick={() => setIsMonthly(true)} className={"px-6 py-2.5 rounded-full text-sm font-semibold transition-all " + (isMonthly ? "bg-white shadow-md text-gray-900" : "text-gray-400 hover:text-gray-600")}>Monthly</button>
              <button onClick={() => setIsMonthly(false)} className={"px-6 py-2.5 rounded-full text-sm font-semibold transition-all " + (!isMonthly ? "bg-white shadow-md text-gray-900" : "text-gray-400 hover:text-gray-600")}>Yearly (Save 20%)</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {name:"Free",price:"$0",period:"/forever",desc:"Perfect for getting started",features:["Browse profiles","Limited daily matches","5 messages per day","Basic search filters","Voice and video calls"],excluded:["Ads shown","Limited photos","No rewinds","No live streaming","No profile boost"],cta:"Get Started",popular:false},
              {name:"Plus",price:isMonthly?"$12":"$10",period:"/month",desc:"Best for active daters",features:["Everything in Free","No ads anywhere","16 photo uploads","Unlimited likes","Rewind last swipe","Extended profile views","Live streaming access","Priority matching"],excluded:[],cta:"Upgrade to Plus",popular:true},
              {name:"Premium",price:isMonthly?"$25":"$20",period:"/month",desc:"The ultimate experience",features:["Everything in Plus","See who likes you","5 Super Likes per week","Daily Top Picks","Read receipts","Higher profile visibility","Monthly profile boost","Priority support"],excluded:[],cta:"Go Premium",popular:false},
            ].map((plan,i) => (
              <div key={i} className={"rounded-2xl border overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 " + (plan.popular ? "border-rose-400 border-2 relative shadow-xl shadow-rose-100/50 bg-gradient-to-b from-white to-rose-50/30" : "border-gray-200 bg-white hover:border-rose-200")}>
                {plan.popular && <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white text-center py-2.5 text-xs font-bold tracking-widest">MOST POPULAR</div>}
                <div className="p-7 sm:p-9">
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-400 text-sm mb-5">{plan.desc}</p>
                  <div className="mb-7">
                    <span className="text-5xl font-extrabold text-gray-900">{plan.price}</span>
                    <span className="text-gray-400 font-medium">{plan.period}</span>
                  </div>
                  <Link href="/signup" className={"block w-full py-3.5 rounded-full text-center font-bold text-sm transition-all " + (plan.popular ? "bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white hover:shadow-xl hover:shadow-rose-200/50" : "border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600 hover:bg-rose-50")}>{plan.cta}</Link>
                  <div className="mt-7 space-y-3">
                    {plan.features.map((f,j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span><span className="text-gray-600">{f}</span></div>)}
                    {plan.excluded.map((f,j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="w-5 h-5 bg-gray-100 text-gray-300 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✗</span><span className="text-gray-300">{f}</span></div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-300 text-xs mt-8">Prices and features are subject to change. All prices in USD.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-sm font-semibold mb-5">SUCCESS STORIES</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">
              Real Couples, <span className="bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Real Love</span>
            </h2>
            <p className="text-gray-400 max-w-xl mx-auto text-base sm:text-lg">Hear from couples who found love on ConnectHub</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {name:"Sarah & Michael",loc:"New York, USA",quote:"We matched on ConnectHub and immediately connected over our love for hiking. Six months later, we are inseparable!",status:"Married 2025",color:"from-rose-50 to-pink-50",border:"border-rose-100"},
              {name:"David & Priya",loc:"London, UK",quote:"The video dating feature let us build real chemistry before meeting. Best decision I ever made was joining ConnectHub.",status:"Together 2 years",color:"from-purple-50 to-pink-50",border:"border-purple-100"},
              {name:"Emma & Carlos",loc:"Barcelona, Spain",quote:"ConnectHub matched us based on shared values. We connected from different countries and love brought us together.",status:"Engaged 2026",color:"from-amber-50 to-rose-50",border:"border-amber-100"},
            ].map((t,i) => (
              <div key={i} className={"bg-gradient-to-br " + t.color + " rounded-2xl p-7 sm:p-9 border " + t.border + " hover:shadow-xl transition-all duration-500 group"}>
                <div className="flex gap-0.5 mb-5">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400 text-lg">★</span>)}</div>
                <p className="text-gray-600 text-sm leading-relaxed mb-7 italic">&ldquo;{t.quote}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold shadow-lg shadow-rose-200/50">{t.name[0]}</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">{t.loc} · {t.status}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 sm:py-28 bg-gradient-to-b from-white to-rose-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block px-5 py-2.5 bg-gradient-to-r from-rose-100 to-pink-100 text-rose-600 rounded-full text-sm font-semibold mb-5">FAQ</span>
            <h2 className="text-4xl sm:text-5xl font-extrabold text-gray-900 mb-5 tracking-tight">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {[
              {q:"Is ConnectHub free to use?",a:"Yes! Basic features are completely free. Browse profiles, match, and send messages at no cost. Upgrade to Plus ($12/month) or Premium ($25/month) for enhanced features like unlimited likes, no ads, and live streaming."},
              {q:"Is ConnectHub safe and secure?",a:"Absolutely. We use bank-level encryption, verified profiles with face scan + ID check, and advanced fraud detection. Your personal information is hidden by default and we never sell your data to anyone."},
              {q:"How does matching work?",a:"Our smart matching system analyzes your preferences, interests, values, and location to find the most compatible people for you. The more you use ConnectHub, the better your matches become."},
              {q:"Can I use ConnectHub worldwide?",a:"Yes! ConnectHub is available in over 190 countries with support for 30+ languages. Find love anywhere in the world."},
              {q:"How do video dates work?",a:"Add someone as a friend, then start a video call directly in the app. Both users need to grant camera permission. All calls are private and end-to-end encrypted."},
              {q:"What is the difference between Plus and Premium?",a:"Plus removes ads, gives unlimited likes, rewinds, and live streaming access. Premium includes everything in Plus, plus see who likes you, Super Likes, Daily Top Picks, read receipts, profile boosts, and priority support."},
            ].map((faq,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
                <button onClick={() => setActiveFaq(activeFaq===i?null:i)} className="w-full flex items-center justify-between p-6 text-left group">
                  <span className="font-semibold text-gray-900 text-sm sm:text-base pr-4 group-hover:text-rose-600 transition-colors">{faq.q}</span>
                  <span className={"w-8 h-8 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center text-lg font-light transition-all flex-shrink-0 " + (activeFaq===i ? "rotate-45 bg-rose-500 text-white" : "")}> + </span>
                </button>
                {activeFaq===i && <div className="px-6 pb-6"><p className="text-gray-500 text-sm leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 sm:py-28 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.06%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-4xl mb-4 animate-heartbeat">💕</p>
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 tracking-tight">Your Perfect Match is Waiting</h2>
          <p className="text-lg sm:text-xl text-rose-100 mb-10 max-w-2xl mx-auto">Join thousands of verified singles finding real love on ConnectHub. Your love story starts here.</p>
          <Link href="/signup" className="inline-block px-12 py-5 bg-white text-rose-600 rounded-full font-extrabold text-lg hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-[1.03] active:scale-[0.98]">
            Start Free Today →
          </Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2.5 mb-5">
                <span className="text-2xl">💕</span>
                <span className="text-xl font-extrabold">ConnectHub</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Where meaningful connections begin. Find love, friendship, and everything in between.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-gray-200">Company</h4>
              <div className="space-y-3">
                <Link href="/about" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">About Us</Link>
                <Link href="/contact" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Contact</Link>
                <Link href="/advertise" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Advertise</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-gray-200">Support</h4>
              <div className="space-y-3">
                <Link href="/help" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Help Center</Link>
                <Link href="/terms" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Terms of Service</Link>
                <Link href="/privacy" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">Privacy Policy</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm text-gray-200">Contact</h4>
              <div className="space-y-3">
                <a href="mailto:support@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">support@connecthub.love</a>
                <a href="mailto:info@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">info@connecthub.love</a>
                <a href="mailto:privacy@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">privacy@connecthub.love</a>
                <a href="mailto:ads@connecthub.love" className="block text-gray-400 text-sm hover:text-rose-400 transition-colors">ads@connecthub.love</a>
              </div>
            </div>
          </div>
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
