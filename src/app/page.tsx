"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { t } from "@/lib/translations";

const LANGUAGES = [
  {code:"en",name:"English (US)",flag:"🇺🇸"},{code:"es",name:"Español",flag:"🇪🇸"},{code:"fr",name:"Français",flag:"🇫🇷"},
  {code:"pt",name:"Português",flag:"🇧🇷"},{code:"de",name:"Deutsch",flag:"🇩🇪"},{code:"it",name:"Italiano",flag:"🇮🇹"},
  {code:"nl",name:"Nederlands",flag:"🇳🇱"},{code:"ru",name:"Русский",flag:"🇷🇺"},{code:"ar",name:"العربية",flag:"🇸🇦"},
  {code:"hi",name:"हिन्दी",flag:"🇮🇳"},{code:"zh",name:"中文",flag:"🇨🇳"},{code:"ja",name:"日本語",flag:"🇯🇵"},
  {code:"ko",name:"한국어",flag:"🇰🇷"},{code:"tr",name:"Türkçe",flag:"🇹🇷"},{code:"th",name:"ไทย",flag:"🇹🇭"},
  {code:"vi",name:"Tiếng Việt",flag:"🇻🇳"},{code:"sw",name:"Kiswahili",flag:"🇰🇪"},{code:"id",name:"Bahasa Indonesia",flag:"🇮🇩"},
  {code:"pl",name:"Polski",flag:"🇵🇱"},{code:"uk",name:"Українська",flag:"🇺🇦"},{code:"ro",name:"Română",flag:"🇷🇴"},
  {code:"el",name:"Ελληνικά",flag:"🇬🇷"},{code:"sv",name:"Svenska",flag:"🇸🇪"},{code:"da",name:"Dansk",flag:"🇩🇰"},
  {code:"ms",name:"Bahasa Melayu",flag:"🇲🇾"},{code:"tl",name:"Filipino",flag:"🇵🇭"},{code:"he",name:"עברית",flag:"🇮🇱"},
  {code:"no",name:"Norsk",flag:"🇳🇴"},{code:"fi",name:"Suomi",flag:"🇫🇮"},{code:"hu",name:"Magyar",flag:"🇭🇺"},
];

export default function HomePage() {
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("en");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number|null>(null);
  const [isMonthly, setIsMonthly] = useState(true);
  const langRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/auth/me").then(r => { if (r.ok) window.location.href = "/dashboard"; }).catch(() => {});
    const saved = localStorage.getItem("ch_lang");
    if (saved) setLang(saved);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Click outside to close language picker (#20)
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (langRef.current && !langRef.current.contains(e.target as Node)) setLangOpen(false);
      if (mobileMenu) setMobileMenu(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [langOpen, mobileMenu]);

  const selectLang = (code: string) => {
    setLang(code);
    localStorage.setItem("ch_lang", code);
    setLangOpen(false);
  };

  const curLang = LANGUAGES.find(l => l.code === lang);

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className={"fixed top-0 w-full z-50 transition-all duration-300 " + (scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-transparent")}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white text-lg sm:text-xl">💕</span></div>
              <span className={"text-xl sm:text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent"}>ConnectHub</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-6">
              <a href="#features" className="text-gray-600 hover:text-rose-600 text-sm font-medium transition-colors">{t(lang,"features")}</a>
              <a href="#how-it-works" className="text-gray-600 hover:text-rose-600 text-sm font-medium transition-colors">{t(lang,"how_works")}</a>
              <a href="#pricing" className="text-gray-600 hover:text-rose-600 text-sm font-medium transition-colors">{t(lang,"pricing")}</a>
              <a href="#testimonials" className="text-gray-600 hover:text-rose-600 text-sm font-medium transition-colors">{t(lang,"stories")}</a>
            </div>

            <div className="flex items-center gap-2 sm:gap-3">
              {/* Language picker (#20) */}
              <div ref={langRef} className="relative">
                <button onClick={() => setLangOpen(!langOpen)} className="flex items-center gap-1 px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg text-xs sm:text-sm text-gray-600 hover:bg-gray-50 border border-gray-200">
                  <span>{curLang?.flag}</span>
                  <span className="hidden sm:inline">{curLang?.name}</span>
                </button>
                {langOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 max-h-72 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
                    {LANGUAGES.map(l => (
                      <button key={l.code} onClick={() => selectLang(l.code)} className={"w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-rose-50 transition-colors " + (lang === l.code ? "bg-rose-50 text-rose-600 font-medium" : "text-gray-700")}>
                        <span>{l.flag}</span><span>{l.name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <Link href="/login" className="hidden sm:inline-flex px-4 py-2 text-sm font-medium text-gray-700 hover:text-rose-600 transition-colors">{t(lang,"sign_in")}</Link>
              <Link href="/signup" className="px-4 py-2 sm:px-6 sm:py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg hover:shadow-rose-200 transition-all">{t(lang,"get_started")}</Link>

              {/* Mobile hamburger */}
              <button onClick={() => setMobileMenu(!mobileMenu)} className="md:hidden p-2 rounded-lg hover:bg-gray-50">
                <div className="w-5 flex flex-col gap-1">
                  <span className={"h-0.5 bg-gray-700 rounded transition-all " + (mobileMenu ? "rotate-45 translate-y-1.5" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded transition-all " + (mobileMenu ? "opacity-0" : "")} />
                  <span className={"h-0.5 bg-gray-700 rounded transition-all " + (mobileMenu ? "-rotate-45 -translate-y-1.5" : "")} />
                </div>
              </button>
            </div>
          </div>

          {/* Mobile menu (#8) */}
          {mobileMenu && (
            <div className="md:hidden pb-4 border-t border-gray-100">
              <div className="pt-4 space-y-2">
                <a href="#features" onClick={()=>setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50 font-medium">Features</a>
                <a href="#how-it-works" onClick={()=>setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50 font-medium">How It Works</a>
                <a href="#pricing" onClick={()=>setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50 font-medium">Pricing</a>
                <a href="#testimonials" onClick={()=>setMobileMenu(false)} className="block px-4 py-3 rounded-lg text-gray-700 hover:bg-rose-50 font-medium">Stories</a>
                <div className="flex gap-3 pt-2">
                  <Link href="/login" className="flex-1 py-3 text-center border-2 border-rose-500 text-rose-600 rounded-full font-bold">Sign In</Link>
                  <Link href="/signup" className="flex-1 py-3 text-center bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold">Sign Up</Link>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="relative min-h-screen flex items-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-0 w-80 h-80 bg-pink-200/30 rounded-full blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-sm font-medium mb-6">
                <span className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                {t(lang,"trusted")}
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                {t(lang,"hero_title")}<br/><span className="bg-gradient-to-r from-rose-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">{t(lang,"hero_highlight")}</span>
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-lg leading-relaxed">
                {t(lang,"hero_desc")}
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-base font-bold hover:shadow-xl hover:shadow-rose-200 transition-all text-center">{t(lang,"cta_start")}</Link>
                <a href="#how-it-works" className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full text-base font-bold hover:border-rose-300 hover:text-rose-600 transition-all text-center">{t(lang,"cta_how")}</a>
              </div>
              <div className="flex items-center gap-6 mt-10">
                <div className="flex -space-x-2">
                  {["A","B","C","D"].map((l,i) => (
                    <div key={i} className="w-10 h-10 rounded-full border-2 border-white bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{l}</div>
                  ))}
                </div>
                <div>
                  <div className="flex gap-0.5">{[1,2,3,4,5].map(i => <span key={i} className="text-amber-400 text-sm">★</span>)}</div>
                  <p className="text-gray-500 text-xs">{t(lang,"join")}</p>
                </div>
              </div>
            </div>

            <div className="relative hidden lg:block">
              <div className="relative w-full h-[550px]">
                <div className="absolute inset-4 bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400 rounded-3xl shadow-2xl shadow-rose-200/50 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  <div className="absolute bottom-8 left-8 right-8">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur flex items-center justify-center text-2xl">💕</div>
                      <div><p className="text-white font-bold text-lg">New Match!</p><p className="text-white/70 text-sm">You and Sarah have 8 things in common</p></div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20">
                      <div className="flex gap-2 flex-wrap">
                        {["Travel","Music","Coffee","Fitness","Photography"].map(t => (
                          <span key={t} className="px-3 py-1 bg-white/20 text-white text-xs rounded-full">{t}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="absolute -top-4 -right-4 w-24 h-24 bg-amber-400 rounded-2xl flex items-center justify-center shadow-lg">
                  <div className="text-center"><p className="text-3xl">💎</p><p className="text-xs font-bold text-amber-900">Premium</p></div>
                </div>
                <div className="absolute -bottom-2 -left-2 bg-white rounded-2xl p-4 shadow-xl border border-gray-100 w-52">
                  <p className="text-gray-900 font-bold text-sm">Video Date</p>
                  <p className="text-gray-500 text-xs">Face-to-face before you meet</p>
                  <div className="flex gap-1 mt-2">{[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-rose-300 to-pink-300" />)}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-12 sm:py-16 bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            {[{n:"10M+",l:"Active Users"},{n:"50K+",l:"Matches Made"},{n:"190+",l:"Countries"},{n:"4.9★",l:"App Rating"}].map((s,i) => (
              <div key={i} className="text-center">
                <p className="text-2xl sm:text-4xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{s.n}</p>
                <p className="text-gray-500 text-xs sm:text-sm mt-1">{s.l}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES (#7 removed AI references) */}
      <section id="features" className="py-16 sm:py-24 bg-gradient-to-b from-white to-rose-50/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs sm:text-sm font-medium mb-4">{t(lang,"features_tag")}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t(lang,"features_title")}</h2>
            <p className="text-gray-500 max-w-2xl mx-auto text-sm sm:text-base">{t(lang,"features_desc")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {[
              {icon:"🔒",title:{t(lang,"feat_verified")},desc:{t(lang,"feat_verified_d")}},
              {icon:"🎥",title:{t(lang,"feat_video")},desc:{t(lang,"feat_video_d")}},
              {icon:"🌍",title:{t(lang,"feat_global")},desc:{t(lang,"feat_global_d")}},
              {icon:"🛡️",title:{t(lang,"feat_privacy")},desc:{t(lang,"feat_privacy_d")}},
              {icon:"💬",title:{t(lang,"feat_message")},desc:{t(lang,"feat_message_d")}},
              {icon:"📡",title:{t(lang,"feat_live")},desc:{t(lang,"feat_live_d")}},
            ].map((f,i) => (
              <div key={i} className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300">
                <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center text-2xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12 sm:mb-16">
            <span className="inline-block px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs sm:text-sm font-medium mb-4">{t(lang,"how_tag")}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t(lang,"how_title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">{t(lang,"how_desc")}</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {step:"1",icon:"📝",title:{t(lang,"step1")},desc:{t(lang,"step1_d")}},
              {step:"2",icon:"💕",title:{t(lang,"step2")},desc:{t(lang,"step2_d")}},
              {step:"3",icon:"💬",title:{t(lang,"step3")},desc:{t(lang,"step3_d")}},
              {step:"4",icon:"☕",title:{t(lang,"step4")},desc:{t(lang,"step4_d")}},
            ].map((s,i) => (
              <div key={i} className="relative text-center">
                <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center text-2xl mb-4 shadow-lg shadow-rose-200">{s.icon}</div>
                <div className="absolute top-8 left-1/2 w-6 h-6 -ml-3 bg-white border-2 border-rose-500 rounded-full flex items-center justify-center text-rose-600 text-xs font-bold z-10">{s.step}</div>
                <h3 className="text-base font-bold text-gray-900 mb-2 mt-2">{s.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRICING (#13) */}
      <section id="pricing" className="py-16 sm:py-24 bg-gradient-to-b from-rose-50/30 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs sm:text-sm font-medium mb-4">{t(lang,"price_tag")}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t(lang,"price_title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">{t(lang,"price_desc")}</p>
            <div className="inline-flex mt-6 p-1 bg-gray-100 rounded-full">
              <button onClick={() => setIsMonthly(true)} className={"px-5 py-2 rounded-full text-sm font-medium transition-all " + (isMonthly ? "bg-white shadow text-gray-900" : "text-gray-500")}>{t(lang,"monthly")}</button>
              <button onClick={() => setIsMonthly(false)} className={"px-5 py-2 rounded-full text-sm font-medium transition-all " + (!isMonthly ? "bg-white shadow text-gray-900" : "text-gray-500")}>{t(lang,"yearly")}</button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 sm:gap-8 max-w-5xl mx-auto">
            {[
              {name:"Free",price:"$0",period:"/forever",desc:{t(lang,"free_desc")},features:["Browse profiles","Limited daily matches","5 messages per day","Basic search filters","Voice and video calls"],excluded:["Ads shown","Limited photos","No rewinds","No live streaming","No profile boost"],cta:"Get Started",popular:false},
              {name:"Plus",price:isMonthly?"$12":"$10",period:"/month",desc:{t(lang,"plus_desc")},features:["Everything in Free","No ads anywhere","16 photo uploads","Unlimited likes","Rewind last swipe","Extended profile views","Live streaming access","Priority matching"],excluded:[],cta:"{t(lang,"upgrade_plus")}",popular:true},
              {name:"Premium",price:isMonthly?"$25":"$20",period:"/month",desc:{t(lang,"premium_desc")},features:["Everything in Plus","See who likes you","5 Super Likes per week","Daily Top Picks","Read receipts","Higher profile visibility","Monthly profile boost","Priority support"],excluded:[],cta:"{t(lang,"go_premium")}",popular:false},
            ].map((plan,i) => (
              <div key={i} className={"rounded-2xl border overflow-hidden transition-all hover:shadow-lg " + (plan.popular ? "border-rose-500 border-2 relative shadow-lg shadow-rose-100" : "border-gray-200")}>
                {plan.popular && <div className="bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-2 text-xs font-bold tracking-wide">{t(lang,"most_popular")}</div>}
                <div className="p-6 sm:p-8">
                  <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-gray-500 text-sm mb-4">{plan.desc}</p>
                  <div className="mb-6"><span className="text-4xl font-bold text-gray-900">{plan.price}</span><span className="text-gray-400">{plan.period}</span></div>
                  <Link href="/signup" className={"block w-full py-3 rounded-full text-center font-bold text-sm transition-all " + (plan.popular ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg" : "border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600")}>{plan.cta}</Link>
                  <div className="mt-6 space-y-3">
                    {plan.features.map((f,j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="text-emerald-500 font-bold">✓</span><span className="text-gray-700">{f}</span></div>)}
                    {plan.excluded.map((f,j) => <div key={j} className="flex items-center gap-3 text-sm"><span className="text-gray-300 font-bold">✗</span><span className="text-gray-400">{f}</span></div>)}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <p className="text-center text-gray-400 text-xs mt-8">Prices and features are subject to change. All prices in USD.</p>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="testimonials" className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs sm:text-sm font-medium mb-4">{t(lang,"stories_tag")}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t(lang,"stories_title")}</h2>
            <p className="text-gray-500 max-w-xl mx-auto text-sm sm:text-base">{t(lang,"stories_desc")}</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 sm:gap-8">
            {[
              {name:"Sarah & Michael",loc:"New York, USA",quote:"We matched on ConnectHub and immediately connected over our love for hiking. Six months later, we are inseparable!",status:"Married 2025"},
              {name:"David & Priya",loc:"London, UK",quote:"The video dating feature let us build real chemistry before meeting. Best decision I ever made was joining ConnectHub.",status:"Together 2 years"},
              {name:"Emma & Carlos",loc:"Barcelona, Spain",quote:"ConnectHub matched us based on shared values. We connected from different countries and love brought us together.",status:"Engaged 2026"},
            ].map((t,i) => (
              <div key={i} className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 sm:p-8 border border-rose-100">
                <div className="flex gap-0.5 mb-4">{[1,2,3,4,5].map(s => <span key={s} className="text-amber-400">★</span>)}</div>
                <p className="text-gray-700 text-sm leading-relaxed mb-6">{t.quote}</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-sm font-bold">{t.name[0]}</div>
                  <div><p className="text-sm font-bold text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.loc} · {t.status}</p></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ (#24) */}
      <section className="py-16 sm:py-24 bg-gradient-to-b from-white to-rose-50/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <span className="inline-block px-4 py-2 bg-rose-100 text-rose-600 rounded-full text-xs sm:text-sm font-medium mb-4">{t(lang,"faq_tag")}</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{t(lang,"faq_title")}</h2>
          </div>
          <div className="space-y-3">
            {[
              {q:"Is ConnectHub free to use?",a:"Yes! Basic features are completely free. Browse profiles, match, and send messages at no cost. Upgrade to Plus ($12/month) or Premium ($25/month) for enhanced features."},
              {q:"Is ConnectHub safe and secure?",a:"Absolutely. We use bank-level encryption, verified profiles, and advanced security. Your personal information is hidden by default. We never sell your data to anyone."},
              {q:"How does matching work?",a:"Our smart matching system analyzes your preferences, interests, values, and location to find the most compatible people for you. The more you use ConnectHub, the better your matches become."},
              {q:"Can I use ConnectHub worldwide?",a:"Yes! ConnectHub is available in over 190 countries with support for 30+ languages. Find love anywhere in the world."},
              {q:"How do video dates work?",a:"Add someone as a friend, then start a video call directly in the app. Both users need to grant camera permission. Calls are private and encrypted."},
              {q:"What is the difference between Plus and Premium?",a:"Plus removes ads, gives unlimited likes, rewinds, and live streaming. Premium includes everything in Plus, plus see who likes you, Super Likes, Top Picks, read receipts, and higher visibility."},
            ].map((faq,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={() => setActiveFaq(activeFaq===i?null:i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <span className={"text-rose-500 text-xl font-light transition-transform " + (activeFaq===i?"rotate-45":"")}>+</span>
                </button>
                {activeFaq===i && <div className="px-5 pb-5"><p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">{t(lang,"cta_final")}</h2>
          <p className="text-lg text-rose-100 mb-8 max-w-2xl mx-auto">{t(lang,"cta_final_desc")}</p>
          <Link href="/signup" className="inline-block px-10 py-4 bg-white text-rose-600 rounded-full font-bold text-lg hover:shadow-xl transition-all">Start Free Today</Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <span className="text-xl">💕</span>
                <span className="text-xl font-bold">ConnectHub</span>
              </div>
              <p className="text-gray-400 text-sm leading-relaxed">Where meaningful connections begin. Find love, friendship, and everything in between.</p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">{t(lang,"company")}</h4>
              <div className="space-y-2">
                <Link href="/about" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"about")}</Link>
                <Link href="/contact" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"contact")}</Link>
                <Link href="/advertise" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"advertise")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Support</h4>
              <div className="space-y-2">
                <Link href="/help" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"help")}</Link>
                <Link href="/terms" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"terms")}</Link>
                <Link href="/privacy" className="block text-gray-400 text-sm hover:text-white transition-colors">{t(lang,"privacy")}</Link>
              </div>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-sm">Contact</h4>
              <div className="space-y-2">
                <a href="mailto:support@connecthub.love" className="block text-gray-400 text-sm hover:text-white transition-colors">support@connecthub.love</a>
                <a href="mailto:info@connecthub.love" className="block text-gray-400 text-sm hover:text-white transition-colors">info@connecthub.love</a>
                <a href="mailto:privacy@connecthub.love" className="block text-gray-400 text-sm hover:text-white transition-colors">privacy@connecthub.love</a>
                <a href="mailto:ads@connecthub.love" className="block text-gray-400 text-sm hover:text-white transition-colors">ads@connecthub.love</a>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-500 text-sm">&copy; 2026 ConnectHub. {t(lang,"rights")}.</p>
            <div className="flex gap-4">
              <Link href="/terms" className="text-gray-500 text-sm hover:text-white">Terms</Link>
              <Link href="/privacy" className="text-gray-500 text-sm hover:text-white">Privacy</Link>
              <Link href="/help" className="text-gray-500 text-sm hover:text-white">Help</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
