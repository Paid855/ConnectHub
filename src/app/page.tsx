"use client";
import { useState, useEffect } from "react";
import { Heart, Shield, Video, MessageCircle, Sparkles, Star, ChevronDown, Check, X, ArrowRight, Globe, Users, Zap, Lock, Crown, Eye, Phone } from "lucide-react";
import Link from "next/link";

const PROFILES = [
  { name:"Sarah", age:28, img:"https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=500&fit=crop", bio:"Art lover, coffee addict, sunset chaser", country:"USA" },
  { name:"Marcus", age:31, img:"https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=500&fit=crop", bio:"Chef by day, musician by night", country:"UK" },
  { name:"Aisha", age:25, img:"https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=400&h=500&fit=crop", bio:"Travel enthusiast with a kind heart", country:"Nigeria" },
  { name:"David", age:29, img:"https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=500&fit=crop", bio:"Fitness coach, dog dad, dreamer", country:"Canada" },
  { name:"Luna", age:26, img:"https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=400&h=500&fit=crop", bio:"Yoga instructor, book worm, foodie", country:"Brazil" },
  { name:"James", age:33, img:"https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=500&fit=crop", bio:"Architect building a beautiful life", country:"Australia" },
];

const TESTIMONIALS = [
  { name:"Jessica & Ryan", img:"https://images.unsplash.com/photo-1522556189639-b150ed9c4330?w=200&h=200&fit=crop", quote:"We matched on ConnectHub and knew instantly. The video verification gave me confidence he was real. We got married last summer!", location:"New York" },
  { name:"Amara & Chidi", img:"https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=200&h=200&fit=crop", quote:"After months of chatting, we finally met in person. ConnectHub matching algorithm really works — we have so much in common!", location:"Lagos" },
  { name:"Emma & Michael", img:"https://images.unsplash.com/photo-1529333166437-7750a6dd5a70?w=200&h=200&fit=crop", quote:"I was skeptical about dating apps until ConnectHub. The verified profiles and video calls made all the difference.", location:"London" },
];

export default function LandingPage() {
  const [currentProfile, setCurrentProfile] = useState(0);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);
  const [isMonthly, setIsMonthly] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number|null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);

  useEffect(() => {
    const i = setInterval(() => setCurrentProfile(p => (p+1)%PROFILES.length), 4000);
    const j = setInterval(() => setCurrentTestimonial(t => (t+1)%TESTIMONIALS.length), 6000);
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => { clearInterval(i); clearInterval(j); window.removeEventListener("scroll", handleScroll); };
  }, []);

  const p = PROFILES[currentProfile];

  const faqs = [
    { q:"How does ConnectHub matching work?", a:"Our AI analyzes your personality, interests, values, and preferences to find highly compatible matches. The algorithm improves as you interact — liking, messaging, and connecting with profiles helps us understand what you are looking for." },
    { q:"Is ConnectHub safe?", a:"Absolutely. Every user must complete face verification with a government ID. Our admin team manually reviews all verification submissions. We have zero tolerance for fake profiles, scams, or harassment." },
    { q:"Can I use ConnectHub for free?", a:"Yes! Our Basic plan lets you create a profile, browse matches, and send a limited number of messages daily. Premium and Gold plans unlock unlimited messaging, video calls, and exclusive features." },
    { q:"What makes ConnectHub different?", a:"Three things: real identity verification (face scan + ID), AI-powered compatibility matching, and live video features. We focus on quality connections, not endless swiping." },
    { q:"How do I cancel my subscription?", a:"Go to Profile then Settings then Manage Subscription. You can cancel anytime. Your premium features remain active until the end of your billing period." },
  ];

  return (
    <div className="min-h-screen bg-white overflow-hidden">
      <header className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + (scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm" : "bg-transparent")}>
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            
            
          </Link>
          <nav className="hidden lg:flex items-center gap-8">
            {["Features","How It Works","Pricing","FAQ"].map(item => (
              <a key={item} href={"#"+item.toLowerCase().replace(/ /g,"")} className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">{item}</a>
            ))}
          </nav>
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/login" className="px-4 py-2 text-sm font-semibold text-gray-700 hover:text-rose-500 transition-colors">Sign In</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all">Get Started</Link>
          </div>
          <button onClick={() => setMobileMenu(!mobileMenu)} className="lg:hidden p-2"><div className="space-y-1.5"><span className={"block h-0.5 w-6 bg-gray-600 transition-all " + (mobileMenu?"rotate-45 translate-y-2":"")}/><span className={"block h-0.5 w-6 bg-gray-600 transition-all " + (mobileMenu?"opacity-0":"")}/><span className={"block h-0.5 w-6 bg-gray-600 transition-all " + (mobileMenu?"-rotate-45 -translate-y-2":"")}/></div></button>
        </div>
        {mobileMenu && (
          <div className="lg:hidden bg-white border-t border-gray-100 px-6 py-4 space-y-3 shadow-lg">
            {["Features","How It Works","Pricing","FAQ"].map(item => <a key={item} href={"#"+item.toLowerCase().replace(/ /g,"")} onClick={() => setMobileMenu(false)} className="block text-sm font-medium text-gray-700 py-2">{item}</a>)}
            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <Link href="/login" className="flex-1 py-2.5 text-center text-sm font-semibold text-gray-700 border border-gray-200 rounded-xl">Sign In</Link>
              <Link href="/signup" className="flex-1 py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl">Sign Up</Link>
            </div>
          </div>
        )}
      </header>

      <section className="relative pt-28 pb-20 lg:pt-36 lg:pb-28">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-50 via-pink-50/50 to-white" />
        <div className="absolute top-20 left-10 w-72 h-72 bg-rose-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-pink-200/20 rounded-full blur-3xl" />
        <div className="relative max-w-7xl mx-auto px-6 flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-6">
              <Sparkles className="w-4 h-4 text-rose-500" />
              <span className="text-sm font-semibold text-rose-600">The future of dating is here</span>
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              Find Your<br /><span className="bg-gradient-to-r from-rose-500 via-pink-500 to-red-400 bg-clip-text text-transparent">Perfect Match</span>
            </h1>
            <p className="text-lg text-gray-500 mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              ConnectHub uses AI-powered matching and video-verified profiles to help you find real, meaningful connections.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-base font-semibold hover:shadow-xl hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">
                Start Matching Free <ArrowRight className="w-5 h-5" />
              </Link>
              <a href="#howitworks" className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full text-base font-semibold hover:border-rose-200 hover:text-rose-500 transition-all text-center">
                How It Works
              </a>
            </div>
            <div className="flex items-center gap-4 justify-center lg:justify-start">
              <div className="flex -space-x-3">
                {PROFILES.slice(0,5).map((pr,i) => <img key={i} src={pr.img} className="w-10 h-10 rounded-full border-2 border-white object-cover" alt={pr.name} />)}
              </div>
              <div>
                <div className="flex items-center gap-1">{[...Array(5)].map((_,i)=><Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400"/>)}<span className="text-sm font-bold text-gray-900 ml-1">5.0</span></div>
                <p className="text-xs text-gray-500">Join 10,000+ happy members</p>
              </div>
            </div>
          </div>
          <div className="flex-shrink-0 w-full max-w-sm">
            <div className="bg-white rounded-3xl shadow-2xl shadow-rose-100/50 border border-rose-100 overflow-hidden">
              <div className="relative h-80">
                <img src={p.img} alt={p.name} className="w-full h-full object-cover transition-all duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
                <div className="absolute top-4 right-4 bg-emerald-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Online</div>
              </div>
              <div className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-xl font-bold text-gray-900">{p.name}, {p.age}</h3>
                  <Shield className="w-5 h-5 text-blue-500" />
                </div>
                <p className="text-sm text-gray-500 mb-3">{p.bio}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-xs text-gray-400">Compatibility</span>
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full" style={{width:"94%"}} /></div>
                  <span className="text-sm font-bold text-rose-500">94%</span>
                </div>
                <div className="flex gap-3">
                  <button className="flex-1 py-3 border-2 border-gray-200 rounded-2xl text-gray-400 flex items-center justify-center hover:border-red-200 hover:text-red-400 transition-all"><X className="w-6 h-6" /></button>
                  <button className="flex-[2] py-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl text-white flex items-center justify-center gap-2 font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all"><Heart className="w-5 h-5 fill-white" /> Match</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-5xl mx-auto px-6">
          <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest mb-6">Trusted worldwide</p>
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4 text-gray-300">
            {["Forbes","TechCrunch","The Guardian","Wired","Mashable"].map(n => <span key={n} className="text-lg font-bold tracking-wide hover:text-gray-400 transition-colors">{n}</span>)}
          </div>
        </div>
      </section>

      <section id="features" className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4"><Sparkles className="w-4 h-4" /> Why Choose Us</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">Premium Dating<br /><span className="text-rose-500">Features</span></h2>
            <p className="text-lg text-gray-500 max-w-2xl mx-auto">Everything you need to find meaningful connections with confidence and safety.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon:Zap, title:"AI Matching", desc:"Advanced algorithms learn your preferences to deliver highly compatible matches every day.", color:"text-violet-500", bg:"bg-violet-50", border:"border-violet-100" },
              { icon:Shield, title:"Verified Profiles", desc:"Face scan + government ID verification ensures every person is real and authentic.", color:"text-blue-500", bg:"bg-blue-50", border:"border-blue-100" },
              { icon:Video, title:"Video Dates", desc:"Connect face-to-face before meeting in person with built-in HD video calling.", color:"text-rose-500", bg:"bg-rose-50", border:"border-rose-100" },
              { icon:MessageCircle, title:"Smart Chat", desc:"Send texts, photos, videos, and emojis. Icebreaker suggestions help start conversations.", color:"text-emerald-500", bg:"bg-emerald-50", border:"border-emerald-100" },
              { icon:Lock, title:"Privacy Controls", desc:"Control who sees your profile. Premium members can set profiles to private.", color:"text-amber-500", bg:"bg-amber-50", border:"border-amber-100" },
              { icon:Globe, title:"Go Live", desc:"Start live video streams, connect with the community, and meet people in real-time.", color:"text-pink-500", bg:"bg-pink-50", border:"border-pink-100" },
            ].map((f,i) => (
              <div key={i} className={"bg-white rounded-2xl p-7 border "+f.border+" hover:shadow-xl hover:shadow-gray-100 hover:-translate-y-1 transition-all duration-300 group"}>
                <div className={"w-14 h-14 rounded-2xl "+f.bg+" flex items-center justify-center mb-5 group-hover:scale-110 transition-transform"}><f.icon className={"w-7 h-7 "+f.color} /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="howitworks" className="py-20 lg:py-28 bg-gradient-to-b from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4">Simple Steps</span>
            <h2 className="text-4xl lg:text-5xl font-bold text-gray-900 mb-4">How ConnectHub<br /><span className="text-rose-500">Works</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { step:"01", title:"Create Profile", desc:"Sign up with your photo, bio, and preferences. Tell us what you are looking for.", color:"from-rose-500 to-pink-500" },
              { step:"02", title:"Get Verified", desc:"Complete face verification and ID upload. Verified profiles get 5x more matches.", color:"from-blue-500 to-indigo-500" },
              { step:"03", title:"Match & Chat", desc:"Our AI finds compatible matches. Send messages, photos, and video call.", color:"from-violet-500 to-purple-500" },
              { step:"04", title:"Meet & Connect", desc:"When ready, plan a date and meet your perfect match in person.", color:"from-amber-500 to-orange-500" },
            ].map((s,i) => (
              <div key={i} className="text-center group">
                <div className={"w-16 h-16 rounded-2xl bg-gradient-to-br "+s.color+" flex items-center justify-center mx-auto mb-5 shadow-lg text-white text-xl font-bold group-hover:scale-110 transition-transform"}>{s.step}</div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real People, Real <span className="text-rose-500">Connections</span></h2>
            <p className="text-gray-500">Verified members from around the world</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {PROFILES.map((pr,i) => (
              <div key={i} className="relative rounded-2xl overflow-hidden group h-64">
                <img src={pr.img} alt={pr.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-3 left-3 right-3">
                  <p className="text-white font-bold text-sm">{pr.name}, {pr.age}</p>
                  <p className="text-white/70 text-xs flex items-center gap-1"><Globe className="w-3 h-3" /> {pr.country}</p>
                </div>
                <div className="absolute top-2 right-2 w-3 h-3 bg-emerald-400 rounded-full border-2 border-white" />
              </div>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/signup" className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all">
              Join 10,000+ Members <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section id="testimonials" className="py-20 lg:py-28 bg-gradient-to-b from-rose-50/50 to-white">
        <div className="max-w-4xl mx-auto px-6">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 bg-rose-100 text-rose-600 text-sm font-semibold px-4 py-1.5 rounded-full mb-4"><Heart className="w-4 h-4 fill-rose-500" /> Love Stories</span>
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Real Success <span className="text-rose-500">Stories</span></h2>
          </div>
          <div className="bg-white rounded-3xl border border-gray-100 shadow-xl p-8 md:p-12">
            <div className="text-center">
              <img src={TESTIMONIALS[currentTestimonial].img} className="w-20 h-20 rounded-full object-cover mx-auto mb-5 ring-4 ring-rose-100" alt="" />
              <p className="text-lg text-gray-700 leading-relaxed mb-6 max-w-2xl mx-auto italic">{TESTIMONIALS[currentTestimonial].quote}</p>
              <p className="font-bold text-gray-900">{TESTIMONIALS[currentTestimonial].name}</p>
              <p className="text-sm text-gray-500">{TESTIMONIALS[currentTestimonial].location}</p>
              <div className="flex justify-center gap-2 mt-6">
                {TESTIMONIALS.map((_,i) => <button key={i} onClick={() => setCurrentTestimonial(i)} className={"w-2.5 h-2.5 rounded-full transition-all " + (i===currentTestimonial?"bg-rose-500 w-8":"bg-gray-200")} />)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="pricing" className="py-20 lg:py-28">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Simple <span className="text-rose-500">Pricing</span></h2>
            <p className="text-gray-500 mb-6">Choose the plan that fits your dating journey</p>
            <div className="inline-flex bg-gray-100 rounded-full p-1">
              <button onClick={() => setIsMonthly(true)} className={"px-5 py-2 rounded-full text-sm font-semibold transition-all " + (isMonthly?"bg-white text-gray-900 shadow-sm":"text-gray-500")}>Monthly</button>
              <button onClick={() => setIsMonthly(false)} className={"px-5 py-2 rounded-full text-sm font-semibold transition-all " + (!isMonthly?"bg-white text-gray-900 shadow-sm":"text-gray-500")}>Yearly <span className="text-rose-500 text-xs">-20%</span></button>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name:"Basic", price:"$0", features:["Limited daily matches","5 messages per day","Basic profile","Browse members","Community feed"], featured:false, cta:"Get Started" },
              { name:"Premium", price:isMonthly?"$29":"$23", features:["Unlimited matches","Unlimited messages","Video calls","Advanced filters","See who likes you"], featured:true, cta:"Go Premium" },
              { name:"Gold", price:isMonthly?"$49":"$39", features:["Everything in Premium","VIP profile badge","Live streaming","Profile boost monthly","Priority support"], featured:false, cta:"Go Gold" },
            ].map((plan,i) => (
              <div key={i} className={"rounded-3xl p-8 border transition-all " + (plan.featured ? "bg-gradient-to-b from-rose-500 to-pink-500 text-white border-rose-400 shadow-2xl shadow-rose-200 scale-105" : "bg-white border-gray-200 hover:shadow-xl")}>
                {plan.featured && <span className="inline-block bg-white/20 text-white text-xs font-bold px-3 py-1 rounded-full mb-4">MOST POPULAR</span>}
                <h3 className={"text-xl font-bold mb-2 " + (plan.featured?"text-white":"text-gray-900")}>{plan.name}</h3>
                <div className="mb-6"><span className="text-4xl font-bold">{plan.price}</span><span className={plan.featured?"text-rose-100":"text-gray-400"}>/month</span></div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f,j) => (
                    <li key={j} className="flex items-center gap-3 text-sm"><Check className={"w-4 h-4 flex-shrink-0 " + (plan.featured?"text-white":"text-emerald-500")} /><span className={plan.featured?"text-rose-50":"text-gray-600"}>{f}</span></li>
                  ))}
                </ul>
                <Link href="/signup" className={"block w-full py-3.5 rounded-full text-center text-sm font-semibold transition-all " + (plan.featured ? "bg-white text-rose-500 hover:shadow-lg" : "bg-gray-900 text-white hover:bg-gray-800")}>{plan.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="faq" className="py-20 lg:py-28 bg-gray-50">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Frequently Asked <span className="text-rose-500">Questions</span></h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
                <button onClick={() => setActiveFaq(activeFaq===i?null:i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-gray-900 text-sm">{faq.q}</span>
                  <ChevronDown className={"w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ml-4 " + (activeFaq===i?"rotate-180":"")} />
                </button>
                {activeFaq === i && <div className="px-5 pb-5"><p className="text-sm text-gray-500 leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-28 bg-gradient-to-r from-rose-500 via-pink-500 to-red-400">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <h2 className="text-4xl lg:text-5xl font-bold text-white mb-4">Ready to Find Love?</h2>
          <p className="text-lg text-rose-100 mb-8 max-w-lg mx-auto">Download ConnectHub and start your journey to meaningful connections today.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <a href="https://apps.apple.com" target="_blank" className="flex items-center gap-3 bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-2xl px-6 py-3.5 transition-all border border-white/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              <div className="text-left"><span className="text-[10px] text-white/70 block">Download on the</span><span className="text-white font-semibold">App Store</span></div>
            </a>
            <a href="https://play.google.com" target="_blank" className="flex items-center gap-3 bg-black/20 backdrop-blur-sm hover:bg-black/30 rounded-2xl px-6 py-3.5 transition-all border border-white/20">
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/></svg>
              <div className="text-left"><span className="text-[10px] text-white/70 block">Get it on</span><span className="text-white font-semibold">Google Play</span></div>
            </a>
          </div>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-500 rounded-full text-base font-semibold hover:shadow-2xl transition-all">Start Matching Free <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      <footer className="bg-gray-900 text-white pt-16 pb-8">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4"><img src="/logo.png" alt="ConnectHub" className="h-12 w-auto" /></div>
              <p className="text-sm text-gray-400 mb-5">Finding meaningful connections in the digital age.</p>
              <div className="space-y-2">
                <a href="https://apps.apple.com" target="_blank" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2.5 transition-all">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                  <div><span className="text-[10px] text-gray-500 block">Download on the</span><span className="text-sm font-semibold">App Store</span></div>
                </a>
                <a href="https://play.google.com" target="_blank" className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-xl px-4 py-2.5 transition-all">
                  <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.198l2.807 1.626a1 1 0 010 1.73l-2.808 1.626L15.206 12l2.492-2.491zM5.864 2.658L16.802 8.99l-2.303 2.303-8.635-8.635z"/></svg>
                  <div><span className="text-[10px] text-gray-500 block">Get it on</span><span className="text-sm font-semibold">Google Play</span></div>
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-sm">Product</h3>
              <div className="space-y-2.5"><a href="#features" className="block text-sm text-gray-400 hover:text-white transition-colors">Features</a><a href="#pricing" className="block text-sm text-gray-400 hover:text-white transition-colors">Pricing</a><a href="#howitworks" className="block text-sm text-gray-400 hover:text-white transition-colors">How It Works</a><Link href="/signup" className="block text-sm text-gray-400 hover:text-white transition-colors">Sign Up</Link></div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-sm">Company</h3>
              <div className="space-y-2.5"><Link href="/terms" className="block text-sm text-gray-400 hover:text-white transition-colors">Terms of Service</Link><Link href="/privacy" className="block text-sm text-gray-400 hover:text-white transition-colors">Privacy Policy</Link><Link href="/advertise" className="block text-sm text-gray-400 hover:text-white transition-colors">Advertise with Us</Link><Link href="/admin" className="block text-sm text-gray-400 hover:text-white transition-colors">Admin</Link></div>
            </div>
            <div>
              <h3 className="font-bold mb-4 text-sm">Support</h3>
              <div className="space-y-2.5"><a href="#faq" className="block text-sm text-gray-400 hover:text-white transition-colors">FAQ</a><a href="mailto:support@connecthub.com" className="block text-sm text-gray-400 hover:text-white transition-colors">support@connecthub.com</a><Link href="/advertise" className="block text-sm text-rose-400 hover:text-rose-300 transition-colors font-semibold">Partner with Us</Link></div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-gray-500">© 2026 ConnectHub. All rights reserved.</p>
            <div className="flex items-center gap-1"><span className="text-sm text-gray-500">Made with</span><Heart className="w-3 h-3 text-rose-500 fill-rose-500" /><span className="text-sm text-gray-500">for real connections</span></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
