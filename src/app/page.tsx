"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Heart, Shield, Video, MessageCircle, Sparkles, Star, ChevronDown, ChevronRight, Users, Zap, Crown, Gem, Check, X as XIcon, ArrowRight, Globe, Lock, Camera } from "lucide-react";

const STATS = [
  { num: "10K+", label: "Active Members" },
  { num: "50K+", label: "Matches Made" },
  { num: "4.9★", label: "App Rating" },
  { num: "150+", label: "Countries" },
];

const FEATURES = [
  { icon: Sparkles, title: "AI-Powered Matching", desc: "Our algorithm learns what you love and finds your perfect match.", color: "from-violet-500 to-purple-500", bg: "bg-violet-100" },
  { icon: Shield, title: "Verified Profiles", desc: "Face scan + ID check ensures every profile is a real person.", color: "from-blue-500 to-cyan-500", bg: "bg-blue-100" },
  { icon: Video, title: "Video Dating", desc: "See and hear your match before meeting. No catfishing.", color: "from-rose-500 to-pink-500", bg: "bg-rose-100" },
  { icon: MessageCircle, title: "Voice Messages", desc: "Send voice notes to add that personal touch to conversations.", color: "from-emerald-500 to-teal-500", bg: "bg-emerald-100" },
  { icon: Camera, title: "Stories", desc: "Share moments that disappear in 24h. Reactions and replies built in.", color: "from-amber-500 to-orange-500", bg: "bg-amber-100" },
  { icon: Globe, title: "Global Community", desc: "Connect with singles from 150+ countries worldwide.", color: "from-indigo-500 to-blue-500", bg: "bg-indigo-100" },
];

const STEPS = [
  { step: "01", title: "Create Profile", desc: "Sign up in 60 seconds. Add photos, bio, and your interests." },
  { step: "02", title: "Get Verified", desc: "Quick face scan + ID upload. Earn the trusted blue badge." },
  { step: "03", title: "Discover Matches", desc: "Swipe through AI-curated profiles tailored to your preferences." },
  { step: "04", title: "Connect & Date", desc: "Chat, voice call, or video date. Then meet in person!" },
];

const TESTIMONIALS = [
  { name: "Sarah & James", loc: "London, UK", text: "We matched on ConnectHub and knew instantly. The video call feature made us so comfortable before our first date!", status: "Married 2025", img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&crop=face" },
  { name: "Maria & Alex", loc: "New York, USA", text: "After years on other apps, ConnectHub's verification system gave me confidence. Alex was my 3rd match!", status: "Together 1 year", img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&crop=face" },
  { name: "Priya & David", loc: "Toronto, Canada", text: "The compatibility quiz matched us at 94%. We bonded over shared values and haven't looked back since.", status: "Engaged 2026", img: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&crop=face" },
];

const FAQS = [
  { q: "Is ConnectHub free?", a: "Yes! Basic accounts are free forever with daily matches, messaging, and community access. Premium and Gold unlock extra features like unlimited messages, video calls, and ad-free browsing." },
  { q: "How does verification work?", a: "Our verification uses a 4-pose face scan plus government ID upload. An admin reviews and approves your verification, giving you the trusted blue badge that gets up to 5x more matches." },
  { q: "Is my data safe?", a: "Absolutely. All passwords are encrypted with bcrypt, data is transmitted over SSL, and we never sell personal information to third parties. You can delete your account and all data at any time." },
  { q: "What's the difference between Premium and Gold?", a: "Premium ($3.99 worth of coins, one-time) gives unlimited messages, video calls, and ad-free browsing. Gold ($6.99 worth, one-time) adds VIP badge, live streaming, profile boosts, and priority support." },
  { q: "Can I use ConnectHub internationally?", a: "Yes! ConnectHub works in 150+ countries. Our matching algorithm considers location preferences, and you can search for singles in any country." },
];

export default function LandingPage() {
  const [activeFAQ, setActiveFAQ] = useState<number|null>(null);
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    const i = setInterval(() => setCurrentTestimonial(p => (p + 1) % TESTIMONIALS.length), 5000);
    return () => clearInterval(i);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* NAVBAR */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <img src="/logo.png" alt="ConnectHub" className="w-8 h-8 rounded-lg" />
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span>
          </Link>
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">Features</a>
            <a href="#how" className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">How It Works</a>
            <a href="#pricing" className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">Pricing</a>
            <a href="#faq" className="text-sm font-medium text-gray-600 hover:text-rose-500 transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm font-medium text-gray-700 hover:text-rose-500 hidden sm:block">Log In</Link>
            <Link href="/signup" className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all">Get Started</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-28 pb-20 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-white overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12">
          <div className="flex-1 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold mb-6">
              <Sparkles className="w-4 h-4" /> #1 AI-Powered Dating App
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
              Find Your<br /><span className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500 bg-clip-text text-transparent">Perfect Match</span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-lg mx-auto lg:mx-0">
              AI-powered matching, video-verified profiles, and real connections. Join thousands finding love on ConnectHub.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start mb-10">
              <Link href="/signup" className="px-8 py-4 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-base hover:shadow-xl transition-all flex items-center justify-center gap-2">Start Matching Free <ArrowRight className="w-5 h-5" /></Link>
              <a href="#how" className="px-8 py-4 border-2 border-gray-200 text-gray-700 rounded-full font-bold text-base hover:border-rose-300 hover:text-rose-500 transition-all text-center">See How It Works</a>
            </div>
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto lg:mx-0">
              {STATS.map(s => <div key={s.label} className="text-center"><p className="text-xl font-bold text-gray-900">{s.num}</p><p className="text-xs text-gray-500">{s.label}</p></div>)}
            </div>
          </div>
          <div className="flex-1 relative max-w-md">
            <div className="relative z-10">
              <img src="https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=500&h=600&fit=crop" alt="Happy couple" className="rounded-3xl shadow-2xl w-full object-cover" style={{height:"500px"}} />
              <div className="absolute -bottom-4 -left-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3 border border-gray-100">
                <div className="w-10 h-10 bg-rose-100 rounded-full flex items-center justify-center"><Heart className="w-5 h-5 text-rose-500 fill-rose-500" /></div>
                <div><p className="font-bold text-sm text-gray-900">New Match!</p><p className="text-xs text-gray-500">94% compatible</p></div>
              </div>
              <div className="absolute -top-4 -right-4 bg-white rounded-2xl shadow-xl p-3 flex items-center gap-2 border border-gray-100">
                <Shield className="w-5 h-5 text-blue-500" /><span className="text-xs font-bold text-gray-900">Verified ✓</span>
              </div>
            </div>
            <div className="absolute top-10 -right-10 w-40 h-40 bg-rose-200 rounded-full blur-3xl opacity-50" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-purple-200 rounded-full blur-3xl opacity-50" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-rose-500 font-semibold text-sm mb-2">WHY CONNECTHUB</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Features Built for <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Real Love</span></h2>
            <p className="text-gray-500 max-w-xl mx-auto">Every feature is designed to help you build genuine, lasting connections.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="group p-6 rounded-2xl border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all bg-white">
                <div className={"w-12 h-12 rounded-xl " + f.bg + " flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"}><f.icon className={"w-6 h-6 text-" + f.color.split(" ")[0].replace("from-", "")} /></div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="text-rose-500 font-semibold text-sm mb-2">SIMPLE STEPS</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">How ConnectHub <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Works</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((s, i) => (
              <div key={i} className="relative bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <span className="text-4xl font-black bg-gradient-to-br from-rose-500 to-pink-500 bg-clip-text text-transparent">{s.step}</span>
                <h3 className="text-lg font-bold text-gray-900 mt-3 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500">{s.desc}</p>
                {i < 3 && <ChevronRight className="hidden lg:block absolute top-1/2 -right-4 w-6 h-6 text-gray-300" />}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 px-6">
        <div className="max-w-3xl mx-auto text-center">
          <p className="text-rose-500 font-semibold text-sm mb-2">SUCCESS STORIES</p>
          <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">Real Couples, <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Real Love</span></h2>
          <div className="relative">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className={"transition-all duration-500 " + (i === currentTestimonial ? "opacity-100" : "opacity-0 absolute inset-0")}>
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
                  <div className="flex items-center gap-4 mb-4 justify-center">
                    <img src={t.img} className="w-14 h-14 rounded-full object-cover" alt={t.name} />
                    <div className="text-left"><p className="font-bold text-gray-900">{t.name}</p><p className="text-xs text-gray-500">{t.loc} · {t.status}</p></div>
                  </div>
                  <p className="text-gray-600 italic leading-relaxed">"{t.text}"</p>
                  <div className="flex justify-center gap-1 mt-4">{[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}</div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-center gap-2 mt-6">{TESTIMONIALS.map((_, i) => <button key={i} onClick={() => setCurrentTestimonial(i)} className={"w-2.5 h-2.5 rounded-full transition-all " + (i === currentTestimonial ? "bg-rose-500 w-6" : "bg-gray-300")} />)}</div>
        </div>
      </section>

      {/* PRICING */}
      <section id="pricing" className="py-20 px-6 bg-gray-50">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 font-semibold text-sm mb-2">SIMPLE PRICING</p>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">One-Time Payment, <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Forever Yours</span></h2>
            <p className="text-gray-500">No subscriptions. No hidden fees. Pay once, keep forever.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Basic */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-900">Basic</h3>
              <p className="text-sm text-gray-500 mb-4">Start your journey</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">Free</p>
              <p className="text-xs text-gray-400 mb-6">Forever · No credit card</p>
              <ul className="space-y-3 mb-8">
                {["10 daily matches","5 messages per day","Basic profile","Community feed","Browse members"].map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>)}
                {["Video calls","Live streaming","Ad-free experience","See who viewed you","Priority support"].map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-300"><XIcon className="w-4 h-4 flex-shrink-0" />{f}</li>)}
              </ul>
              <Link href="/signup" className="block w-full py-3 border-2 border-gray-200 rounded-full font-semibold text-center text-gray-700 hover:border-rose-300 hover:text-rose-500 transition-all">Get Started</Link>
            </div>
            {/* Premium */}
            <div className="bg-white rounded-2xl border-2 border-rose-500 p-8 relative shadow-lg scale-[1.02]">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">MOST POPULAR</div>
              <div className="flex items-center gap-2 mb-1"><Gem className="w-5 h-5 text-rose-500" /><h3 className="text-xl font-bold text-gray-900">Premium</h3></div>
              <p className="text-sm text-gray-500 mb-4">For serious daters</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">2,000 <span className="text-base font-normal text-gray-400">coins</span></p>
              <p className="text-xs text-gray-400 mb-6">≈ $3.99 · One-time forever</p>
              <ul className="space-y-3 mb-8">
                {["Unlimited daily matches","Unlimited messages","Video & voice calls","Advanced search filters","Ad-free experience","See who likes you","Compatibility quiz access"].map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-rose-500 flex-shrink-0" />{f}</li>)}
                {["VIP gold badge","Live streaming","Priority support"].map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-300"><XIcon className="w-4 h-4 flex-shrink-0" />{f}</li>)}
              </ul>
              <Link href="/signup" className="block w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold text-center hover:shadow-lg transition-all">Go Premium</Link>
            </div>
            {/* Gold */}
            <div className="bg-white rounded-2xl border border-gray-200 p-8 relative">
              <div className="flex items-center gap-2 mb-1"><Crown className="w-5 h-5 text-amber-500" /><h3 className="text-xl font-bold text-gray-900">Gold</h3></div>
              <p className="text-sm text-gray-500 mb-4">The ultimate experience</p>
              <p className="text-4xl font-bold text-gray-900 mb-1">5,000 <span className="text-base font-normal text-gray-400">coins</span></p>
              <p className="text-xs text-gray-400 mb-6">≈ $6.99 · One-time forever</p>
              <ul className="space-y-3 mb-8">
                {["Everything in Premium","VIP gold badge on profile","Go live & stream video","Monthly free profile boost","Priority customer support","Exclusive Gold events","Early access to features"].map(f => <li key={f} className="flex items-center gap-2 text-sm text-gray-600"><Check className="w-4 h-4 text-amber-500 flex-shrink-0" />{f}</li>)}
              </ul>
              <Link href="/signup" className="block w-full py-3 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full font-semibold text-center hover:shadow-lg transition-all">Go Gold</Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-rose-500 font-semibold text-sm mb-2">FAQ</p>
            <h2 className="text-3xl font-bold text-gray-900">Common Questions</h2>
          </div>
          <div className="space-y-3">
            {FAQS.map((f, i) => (
              <div key={i} className="border border-gray-200 rounded-xl overflow-hidden">
                <button onClick={() => setActiveFAQ(activeFAQ === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-gray-900 text-sm">{f.q}</span>
                  <ChevronDown className={"w-5 h-5 text-gray-400 transition-transform " + (activeFAQ === i ? "rotate-180" : "")} />
                </button>
                {activeFAQ === i && <div className="px-5 pb-5"><p className="text-sm text-gray-500 leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 bg-gradient-to-r from-rose-500 via-pink-500 to-purple-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">Your Perfect Match is Waiting</h2>
          <p className="text-rose-100 text-lg mb-8">Join thousands of verified singles finding real love on ConnectHub.</p>
          <Link href="/signup" className="inline-flex items-center gap-2 px-8 py-4 bg-white text-rose-500 rounded-full font-bold text-lg hover:shadow-xl transition-all">Create Free Account <ArrowRight className="w-5 h-5" /></Link>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-12 px-6 bg-gray-900 text-gray-400">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div><Link href="/" className="flex items-center gap-2 mb-4"><img src="/logo.png" alt="ConnectHub" className="w-7 h-7 rounded-lg" /><span className="text-lg font-bold text-white">ConnectHub</span></Link><p className="text-sm">Connecting hearts together since 2022.</p></div>
            <div><h4 className="text-white font-semibold mb-3 text-sm">Product</h4><div className="space-y-2 text-sm"><a href="#features" className="block hover:text-white">Features</a><a href="#pricing" className="block hover:text-white">Pricing</a><Link href="/login" className="block hover:text-white">Log In</Link><Link href="/signup" className="block hover:text-white">Sign Up</Link></div></div>
            <div><h4 className="text-white font-semibold mb-3 text-sm">Company</h4><div className="space-y-2 text-sm"><Link href="/terms" className="block hover:text-white">Terms of Service</Link><Link href="/privacy" className="block hover:text-white">Privacy Policy</Link><Link href="/advertise" className="block hover:text-white">Advertise</Link></div></div>
            <div><h4 className="text-white font-semibold mb-3 text-sm">Support</h4><div className="space-y-2 text-sm"><a href="mailto:support@connecthub.com" className="block hover:text-white">support@connecthub.com</a><Link href="/dashboard/support" className="block hover:text-white">Help Center</Link></div></div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2022 ConnectHub. All rights reserved.</p>
            <p className="text-sm flex items-center gap-1">Made with <Heart className="w-3 h-3 text-rose-500 fill-rose-500" /> for lovers everywhere</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
