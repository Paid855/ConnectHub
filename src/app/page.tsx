"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Shield, Video, MessageCircle, Users, Star, ChevronDown, Check, X, ArrowRight, Sparkles, Lock, Zap } from "lucide-react";
import { motion } from "framer-motion";

export default function LandingPage() {
  const [isMonthly, setIsMonthly] = useState(true);
  const [activeFAQ, setActiveFAQ] = useState<number|null>(null);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", h);
    return () => window.removeEventListener("scroll", h);
  }, []);

  const features = [
    { icon: Zap, title: "AI-Powered Matching", desc: "Our algorithm finds your most compatible matches based on personality and interests", color: "from-violet-500 to-purple-500", bg: "bg-violet-50" },
    { icon: Shield, title: "Verified Profiles", desc: "3-pose face scan + ID verification ensures every person is real", color: "from-blue-500 to-indigo-500", bg: "bg-blue-50" },
    { icon: Video, title: "Video Dating", desc: "See your match face-to-face before meeting in person", color: "from-pink-500 to-rose-500", bg: "bg-pink-50" },
    { icon: MessageCircle, title: "Real-Time Chat", desc: "Instant messaging with emojis, read receipts, and more", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-50" },
    { icon: Lock, title: "Privacy First", desc: "Control who sees your profile with advanced privacy settings", color: "from-amber-500 to-orange-500", bg: "bg-amber-50" },
    { icon: Users, title: "Community Events", desc: "Join exclusive events and meet people in real life", color: "from-cyan-500 to-blue-500", bg: "bg-cyan-50" },
  ];

  const plans = [
    { name:"Basic", price:"$0", yPrice:"$0", features:["5 daily swipes","Basic profile","3 messages/day"], excluded:["See who likes you","Video calls","Unlimited messages"], cta:"Get Started Free", link:"/signup" },
    { name:"Premium", price:"$29", yPrice:"$23", features:["Unlimited swipes","Unlimited messages","Video calls","See who likes you","Priority matching","5 boosts/month"], excluded:["Personal coach"], cta:"Choose Premium", link:"/signup", popular:true },
    { name:"Gold", price:"$49", yPrice:"$39", features:["Everything in Premium","VIP badge","Personal dating coach","Exclusive events","Unlimited boosts","Priority support","Read receipts","Advanced filters"], excluded:[], cta:"Choose Gold", link:"/signup" },
  ];

  const faqs = [
    { q: "How does ConnectHub verification work?", a: "Every user completes a 3-pose live face scan (center, left, right turn) plus uploads a government ID. Our admin team manually reviews each submission to ensure every profile is a real person." },
    { q: "Is ConnectHub free to use?", a: "Yes! Our Basic plan is completely free. You can create a profile, swipe, and send up to 3 messages per day. Premium and Gold plans unlock unlimited features." },
    { q: "How do video dates work?", a: "Once both users are verified, you can start a video call directly from the chat. It is safe, secure, and a great way to connect before meeting in person." },
    { q: "Can I cancel my subscription?", a: "Absolutely. You can downgrade or cancel anytime from your profile settings. No long-term contracts, no hidden fees." },
    { q: "How does ConnectHub protect my privacy?", a: "We use encryption for all messages, never share your data with third parties, and give you full control over who can see your profile and photos." },
  ];

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <header className={"fixed top-0 left-0 right-0 z-50 transition-all duration-300 " + (scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm border-b border-gray-100" : "bg-transparent")}>
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div>
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span>
          </Link>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Features</a>
            <a href="#how" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">FAQ</a>
          </nav>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors hidden sm:block">Sign In</Link>
            <Link href="/signup" className="px-5 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all">Get Started</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-white">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <motion.div initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{duration:0.6}} className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 bg-rose-100 border border-rose-200 rounded-full px-4 py-1.5 mb-6"><Sparkles className="w-4 h-4 text-rose-500" /><span className="text-sm font-semibold text-rose-600">The future of dating is here</span></div>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">Find Your <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Perfect Match</span></h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">ConnectHub uses AI-powered matching and video-verified profiles to help you find real, meaningful connections.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold text-lg hover:shadow-xl hover:shadow-rose-200 transition-all flex items-center justify-center gap-2">Start Matching Free <ArrowRight className="w-5 h-5" /></Link>
              <a href="#how" className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-semibold text-lg hover:bg-gray-50 transition-all text-center">How It Works</a>
            </div>
            <div className="flex items-center gap-3 mt-8 justify-center lg:justify-start">
              <div className="flex -space-x-2">
                {["🧕","👩","👨","👩‍🦱","🧔"].map((e,i) => <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-200 to-pink-200 border-2 border-white flex items-center justify-center text-lg">{e}</div>)}
              </div>
              <div><div className="flex items-center gap-1">{[...Array(5)].map((_,i) => <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />)}<span className="text-sm font-bold text-gray-900 ml-1">5.0</span></div><p className="text-xs text-gray-500">Join 10,000+ happy members</p></div>
            </div>
          </motion.div>
          <motion.div initial={{opacity:0,scale:0.9}} animate={{opacity:1,scale:1}} transition={{duration:0.6,delay:0.2}} className="flex-1 max-w-md">
            <div className="bg-white rounded-3xl shadow-2xl shadow-rose-100 p-6 border border-gray-100">
              <div className="h-64 bg-gradient-to-br from-rose-400 to-pink-400 rounded-2xl flex items-center justify-center mb-4 relative overflow-hidden">
                <span className="text-8xl">💑</span>
                <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1"><div className="w-2 h-2 bg-emerald-400 rounded-full" /><span className="text-xs font-bold text-gray-700">Online</span></div>
              </div>
              <div className="flex items-center justify-between mb-3"><h3 className="text-xl font-bold text-gray-900">Sarah, 28</h3><Shield className="w-5 h-5 text-blue-500" /></div>
              <p className="text-sm text-gray-500 mb-3">Art lover, coffee addict, sunset chaser</p>
              <div className="flex items-center gap-2 mb-4"><span className="text-xs text-gray-400">Compatibility</span><div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-gradient-to-r from-rose-400 to-pink-400 rounded-full w-[94%]" /></div><span className="text-sm font-bold text-rose-500">94%</span></div>
              <div className="flex gap-3">
                <button className="flex-1 py-2.5 border-2 border-gray-200 rounded-xl text-gray-400 font-semibold flex items-center justify-center"><X className="w-5 h-5" /></button>
                <button className="flex-[2] py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2"><Heart className="w-5 h-5 fill-white" /> Match</button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14"><span className="inline-block bg-rose-100 text-rose-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">Features</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Why Choose ConnectHub</h2><p className="text-gray-500 max-w-lg mx-auto">Everything you need for meaningful connections</p></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={i} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}} transition={{delay:i*0.1}} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm hover:shadow-md transition-all group">
                <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + f.color + " flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"}><f.icon className="w-6 h-6 text-white" /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how" className="py-20 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-14"><span className="inline-block bg-rose-100 text-rose-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">How It Works</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Find Love in 4 Steps</h2></div>
          <div className="space-y-6">
            {[
              { step:"1", title:"Create Your Profile", desc:"Sign up, upload your photo, and tell people about yourself", emoji:"📝", color:"bg-violet-500" },
              { step:"2", title:"Get Verified", desc:"Complete our face scan and ID verification to earn your blue badge", emoji:"🔐", color:"bg-blue-500" },
              { step:"3", title:"Discover Matches", desc:"Swipe through AI-recommended profiles based on compatibility", emoji:"💕", color:"bg-rose-500" },
              { step:"4", title:"Connect & Meet", desc:"Chat, video call, and plan your first date!", emoji:"🎉", color:"bg-emerald-500" },
            ].map((s, i) => (
              <motion.div key={i} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*0.15}} className="flex items-center gap-5 bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className={s.color + " w-14 h-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"}>{s.emoji}</div>
                <div className="flex-1"><div className="flex items-center gap-2 mb-1"><span className="text-xs font-bold text-gray-400">STEP {s.step}</span></div><h3 className="text-lg font-bold text-gray-900">{s.title}</h3><p className="text-sm text-gray-500">{s.desc}</p></div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10"><span className="inline-block bg-rose-100 text-rose-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">Pricing</span><h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Simple, Transparent Pricing</h2></div>
          <div className="flex justify-center mb-8"><div className="inline-flex bg-gray-100 rounded-full p-1"><button onClick={() => setIsMonthly(true)} className={"px-6 py-2 rounded-full text-sm font-semibold transition-all " + (isMonthly ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Monthly</button><button onClick={() => setIsMonthly(false)} className={"px-6 py-2 rounded-full text-sm font-semibold transition-all " + (!isMonthly ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Yearly <span className="text-emerald-500 text-xs">-20%</span></button></div></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {plans.map((p, i) => (
              <div key={i} className={"bg-white rounded-2xl p-6 border shadow-sm relative " + (p.popular ? "border-rose-300 ring-2 ring-rose-100" : "border-gray-200")}>
                {p.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>}
                <h3 className="text-lg font-bold text-gray-900 mb-1">{p.name}</h3>
                <div className="flex items-baseline gap-1 mb-4"><span className="text-4xl font-bold">{isMonthly ? p.price : p.yPrice}</span><span className="text-gray-500 text-sm">/month</span></div>
                <div className="space-y-2.5 mb-6">
                  {p.features.map((f,j) => <div key={j} className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center"><Check className="w-3 h-3 text-emerald-600" /></div><span className="text-sm text-gray-700">{f}</span></div>)}
                  {p.excluded.map((f,j) => <div key={j} className="flex items-center gap-2"><div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center"><X className="w-3 h-3 text-gray-400" /></div><span className="text-sm text-gray-400">{f}</span></div>)}
                </div>
                <Link href={p.link} className={"block w-full py-3 rounded-xl font-semibold text-sm text-center transition-all " + (p.popular ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg" : "border-2 border-gray-200 text-gray-700 hover:bg-gray-50")}>{p.cta}</Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6 bg-gray-50">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10"><span className="inline-block bg-rose-100 text-rose-600 text-sm font-bold px-4 py-1.5 rounded-full mb-4">FAQ</span><h2 className="text-3xl font-bold text-gray-900 mb-4">Common Questions</h2></div>
          <div className="space-y-3">
            {faqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setActiveFAQ(activeFAQ === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left"><h3 className="font-semibold text-gray-900 pr-4">{f.q}</h3><ChevronDown className={"w-5 h-5 text-gray-400 transition-transform " + (activeFAQ === i ? "rotate-180" : "")} /></button>
                {activeFAQ === i && <div className="px-5 pb-5"><p className="text-sm text-gray-600 leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 rounded-3xl p-12 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Match?</h2>
          <p className="text-lg text-rose-100 mb-8 max-w-lg mx-auto">Join thousands of people finding meaningful connections on ConnectHub</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-500 rounded-full font-bold text-lg hover:shadow-xl transition-all">Start Free Today <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div><span className="text-lg font-bold">ConnectHub</span></div>
            <div className="flex gap-8"><a href="#features" className="text-sm text-gray-400 hover:text-white transition-colors">Features</a><a href="#pricing" className="text-sm text-gray-400 hover:text-white transition-colors">Pricing</a><a href="#faq" className="text-sm text-gray-400 hover:text-white transition-colors">FAQ</a><Link href="/admin" className="text-sm text-gray-400 hover:text-white transition-colors">Admin</Link></div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center"><p className="text-sm text-gray-500">2026 ConnectHub. All rights reserved. Made with <Heart className="w-3 h-3 inline text-rose-500 fill-rose-500" /> for real connections.</p></div>
        </div>
      </footer>
    </div>
  );
}
