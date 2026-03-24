"use client";
import Link from "next/link";
import { Mail, BarChart3, Users, Eye, Zap, Target, TrendingUp, ArrowLeft, Heart, CheckCircle } from "lucide-react";

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="border-b border-gray-100 bg-white/80 backdrop-blur-lg sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><img src="/logo.png" alt="ConnectHub" className="w-8 h-8 rounded-lg" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-rose-500 flex items-center gap-1"><ArrowLeft className="w-4 h-4" /> Back to ConnectHub</Link>
        </div>
      </nav>

      <section className="py-20 px-6 bg-gradient-to-br from-rose-50 via-pink-50 to-white">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-100 text-rose-600 rounded-full text-sm font-semibold mb-6"><Target className="w-4 h-4" /> Advertising</div>
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">Reach Thousands of <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Engaged Singles</span></h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-10">ConnectHub users spend an average of 45 minutes daily on our platform. Put your brand in front of an active, engaged audience.</p>
          <div className="grid grid-cols-3 gap-6 max-w-lg mx-auto">
            <div><p className="text-3xl font-bold text-gray-900">10K+</p><p className="text-sm text-gray-500">Active Users</p></div>
            <div><p className="text-3xl font-bold text-gray-900">45min</p><p className="text-sm text-gray-500">Avg Session</p></div>
            <div><p className="text-3xl font-bold text-gray-900">8.5%</p><p className="text-sm text-gray-500">Avg CTR</p></div>
          </div>
        </div>
      </section>

      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Advertising Packages</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name:"Starter", price:"$99", period:"/month", desc:"Perfect for local businesses", features:["Feed banner placement","5,000 impressions/month","Basic targeting","Monthly performance report","Email support"], color:"border-gray-200" },
              { name:"Growth", price:"$299", period:"/month", desc:"For growing brands", features:["Feed + Browse + Discover ads","25,000 impressions/month","Advanced demographic targeting","Weekly analytics dashboard","Priority support","A/B testing"], color:"border-rose-500", popular:true },
              { name:"Enterprise", price:"Custom", period:"", desc:"For large campaigns", features:["All ad placements","Unlimited impressions","Custom audience segments","Dedicated account manager","Real-time analytics API","Custom integrations","Brand safety controls"], color:"border-gray-200" },
            ].map((plan, i) => (
              <div key={i} className={"bg-white rounded-2xl border-2 p-8 relative " + plan.color}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold px-4 py-1 rounded-full">POPULAR</div>}
                <h3 className="text-xl font-bold text-gray-900 mb-1">{plan.name}</h3>
                <p className="text-sm text-gray-500 mb-4">{plan.desc}</p>
                <p className="text-3xl font-bold text-gray-900 mb-6">{plan.price}<span className="text-sm font-normal text-gray-400">{plan.period}</span></p>
                <ul className="space-y-2.5 mb-8">{plan.features.map((f,fi) => <li key={fi} className="flex items-start gap-2 text-sm text-gray-600"><CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />{f}</li>)}</ul>
                <a href={"mailto:ads@connecthub.com?subject=" + plan.name + " Ad Package"} className={"block w-full py-3 rounded-full font-semibold text-center text-sm transition-all " + (plan.popular ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg" : "border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-500")}>Get Started</a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-center text-gray-900 mb-10">Why Advertise on ConnectHub?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon:Target, title:"Precise Targeting", desc:"Target by age, gender, location, interests, and relationship status." },
              { icon:TrendingUp, title:"High Engagement", desc:"Our users are actively browsing profiles, making them receptive to relevant ads." },
              { icon:Eye, title:"Premium Placement", desc:"Ads appear naturally in feeds, discover pages, and between profile cards." },
            ].map((f,i) => (
              <div key={i} className="bg-white rounded-xl p-6 border border-gray-100"><f.icon className="w-8 h-8 text-rose-500 mb-3" /><h3 className="font-bold text-gray-900 mb-2">{f.title}</h3><p className="text-sm text-gray-500">{f.desc}</p></div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 px-6 bg-gradient-to-r from-rose-500 to-pink-500">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to Grow Your Brand?</h2>
          <p className="text-rose-100 mb-8">Contact our advertising team for a custom proposal</p>
          <a href="mailto:ads@connecthub.com" className="inline-flex items-center gap-2 bg-white text-rose-500 px-8 py-3.5 rounded-full font-bold hover:shadow-xl transition-all"><Mail className="w-5 h-5" /> ads@connecthub.com</a>
        </div>
      </section>

      <footer className="py-8 px-6 bg-gray-900 text-center">
        <p className="text-gray-500 text-sm">© 2022 ConnectHub. All rights reserved.</p>
      </footer>
    </div>
  );
}
