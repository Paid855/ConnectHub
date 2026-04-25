"use client";
import PageHeader from "@/components/PageHeader";
export default function AdvertisePage() {
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="min-h-screen bg-white">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-28 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Advertise on <span className="italic">ConnectHub</span></h1>
            <p className="text-lg text-rose-100/80 max-w-xl mx-auto" style={{fontFamily:"'DM Sans',sans-serif"}}>Reach millions of engaged singles worldwide. Connect your brand with our passionate community.</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16 sm:py-20" style={{fontFamily:"'DM Sans',sans-serif"}}>
          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 mb-16">
            {[{n:"10M+",l:"Monthly Users",icon:"👥"},{n:"45min",l:"Avg. Session",icon:"⏱️"},{n:"190+",l:"Countries",icon:"🌍"}].map((s,i) => (
              <div key={i} className="text-center bg-gray-50 rounded-2xl p-6 border border-gray-100">
                <p className="text-2xl mb-2">{s.icon}</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-gray-900">{s.n}</p>
                <p className="text-gray-400 text-xs mt-1">{s.l}</p>
              </div>
            ))}
          </div>

          {/* Plans */}
          <div className="text-center mb-10">
            <span className="inline-block px-5 py-2 bg-rose-100 text-rose-600 rounded-full text-xs font-bold tracking-widest uppercase mb-5">Advertising Packages</span>
            <h2 className="text-3xl font-extrabold text-gray-900" style={{fontFamily:"'Playfair Display',serif"}}>Choose Your <span className="italic text-rose-600">Plan</span></h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-16">
            {[
              {n:"Starter",p:"$99",f:["Banner placements","10K impressions/mo","Basic analytics dashboard","Email support"],color:"border-gray-200",bg:"bg-white"},
              {n:"Growth",p:"$199",f:["Banner + feed ads","50K impressions/mo","Advanced analytics + A/B testing","Audience targeting","Priority support"],color:"border-rose-400 border-2",bg:"bg-gradient-to-b from-white to-rose-50/30",popular:true},
              {n:"Enterprise",p:"$299",f:["All ad placements","Unlimited impressions","Dedicated account manager","Custom campaigns","Real-time reporting","API access"],color:"border-gray-200",bg:"bg-white"},
            ].map((plan,i) => (
              <div key={i} className={"rounded-2xl border p-7 relative hover:shadow-xl hover:-translate-y-1 transition-all duration-300 " + plan.color + " " + plan.bg}>
                {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-4 py-1 rounded-full tracking-wider">MOST POPULAR</div>}
                <h3 className="font-bold text-gray-900 text-xl mb-1">{plan.n}</h3>
                <div className="mb-5"><span className="text-4xl font-extrabold text-gray-900">{plan.p}</span><span className="text-gray-400">/mo</span></div>
                <div className="space-y-3 mb-6">
                  {plan.f.map((f,j) => <div key={j} className="flex items-center gap-2.5 text-sm"><span className="w-5 h-5 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">✓</span><span className="text-gray-600">{f}</span></div>)}
                </div>
                <a href="mailto:ads@connecthub.love" className={"block w-full py-3.5 rounded-full text-center font-bold text-sm transition-all " + (plan.popular ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg hover:shadow-rose-200/50" : "border-2 border-gray-200 text-gray-700 hover:border-rose-300 hover:text-rose-600")}>Get Started</a>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="bg-gradient-to-r from-rose-500 via-pink-500 to-purple-600 rounded-3xl p-8 sm:p-12 text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
            <div className="relative">
              <h2 className="text-3xl font-extrabold text-white mb-3" style={{fontFamily:"'Playfair Display',serif"}}>Ready to Grow?</h2>
              <p className="text-rose-100/80 mb-8 max-w-md mx-auto">Connect with our advertising team and start reaching millions of engaged users today.</p>
              <a href="mailto:ads@connecthub.love" className="inline-block px-10 py-4 bg-white text-rose-600 rounded-full font-bold hover:shadow-2xl hover:shadow-white/20 transition-all hover:scale-[1.03] active:scale-[0.98]">
                Contact ads@connecthub.love →
              </a>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
