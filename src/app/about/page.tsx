"use client";
import PageHeader from "@/components/PageHeader";
import Link from "next/link";
export default function AboutPage() {
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="min-h-screen bg-white">
        {/* Hero */}
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl" />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>About <span className="italic">ConnectHub</span></h1>
            <p className="text-lg text-rose-100/80 max-w-2xl mx-auto" style={{fontFamily:"'DM Sans',sans-serif"}}>Where meaningful connections begin. We are building the future of online dating — safe, real, and truly global.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20" style={{fontFamily:"'DM Sans',sans-serif"}}>
          {/* Mission */}
          <div className="text-center mb-16">
            <span className="inline-block px-5 py-2 bg-rose-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-5">Our Mission</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-gray-900 mb-5" style={{fontFamily:"'Playfair Display',serif"}}>Connecting Hearts <span className="italic text-rose-600">Worldwide</span></h2>
            <p className="text-gray-500 max-w-2xl mx-auto leading-relaxed">ConnectHub was built with one purpose: to help people around the world find genuine, meaningful connections. We believe everyone deserves love, companionship, and the chance to meet someone truly special — no matter where they are.</p>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
            {[{n:"10M+",l:"Active Users",icon:"👥"},{n:"50K+",l:"Matches Made",icon:"💕"},{n:"190+",l:"Countries",icon:"🌍"},{n:"4.9★",l:"App Rating",icon:"⭐"}].map((s,i) => (
              <div key={i} className="text-center bg-gradient-to-br from-rose-50 to-pink-50 rounded-2xl p-6 border border-rose-100">
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="text-3xl font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">{s.n}</p>
                <p className="text-gray-400 text-xs mt-1 font-medium">{s.l}</p>
              </div>
            ))}
          </div>

          {/* What makes us different */}
          <div className="mb-16">
            <div className="text-center mb-10">
              <span className="inline-block px-5 py-2 bg-rose-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-5">Why ConnectHub</span>
              <h2 className="text-3xl font-extrabold text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>What Makes Us <span className="italic text-rose-600">Different</span></h2>
            </div>
            <div className="grid sm:grid-cols-2 gap-5">
              {[
                {icon:"🔒",t:"Safety First",d:"Every profile goes through face scan + ID verification. We use bank-level encryption to protect your data and advanced fraud detection to keep our community safe."},
                {icon:"🌍",t:"Global Community",d:"Connect with verified singles from 190+ countries. Love has no borders — find your match anywhere in the world with 30+ language support."},
                {icon:"💕",t:"Real Connections",d:"Our matching system focuses on compatibility, shared values, and genuine interests — not just looks. We help you find relationships that last."},
                {icon:"🎥",t:"Video Dating",d:"See and hear your matches before meeting in person. Build real chemistry through face-to-face video calls, safely from the comfort of home."},
              ].map((item,i) => (
                <div key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                  <div className="w-12 h-12 bg-rose-50 rounded-xl flex items-center justify-center text-2xl mb-4">{item.icon}</div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">{item.t}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{item.d}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact */}
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Get in Touch</h2>
              <p className="text-rose-100/80 mb-8 max-w-md mx-auto">Have questions? We would love to hear from you.</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl mx-auto">
                {[
                  {l:"Support",e:"support@connecthub.love"},
                  {l:"General",e:"info@connecthub.love"},
                  {l:"Privacy",e:"privacy@connecthub.love"},
                  {l:"Advertising",e:"ads@connecthub.love"},
                ].map((c,i) => (
                  <a key={i} href={"mailto:"+c.e} className="bg-white/15 backdrop-blur-xl rounded-xl p-4 border border-white/20 hover:bg-white/25 transition-all text-center group">
                    <p className="text-white font-bold text-sm mb-1">{c.l}</p>
                    <p className="text-rose-200/70 text-[10px] group-hover:text-white transition-colors">{c.e}</p>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
