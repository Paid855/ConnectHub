"use client";
export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Advertise on ConnectHub</h1>
        <p className="text-center text-gray-500 mb-12">Reach millions of engaged singles worldwide</p>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Why Advertise With Us?</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon:"🌍", title:"Global Reach", desc:"Users from 190+ countries actively looking for connections" },
                { icon:"🎯", title:"Targeted Audience", desc:"Reach 18-45 year olds who are actively engaged and spending" },
                { icon:"📱", title:"Premium Placement", desc:"Your brand seen by thousands of daily active users" },
              ].map((item, i) => (
                <div key={i} className="bg-rose-50 rounded-xl p-5 text-center">
                  <p className="text-3xl mb-2">{item.icon}</p>
                  <h3 className="font-bold text-gray-900 text-sm mb-1">{item.title}</h3>
                  <p className="text-xs text-gray-600">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Advertising Packages</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { name:"Starter", price:"$99/mo", features:["Banner ads", "10,000 impressions", "Basic analytics", "Email support"] },
                { name:"Growth", price:"$199/mo", features:["Banner + feed ads", "50,000 impressions", "Advanced analytics", "Priority support", "A/B testing"] },
                { name:"Enterprise", price:"$299/mo", features:["All ad placements", "Unlimited impressions", "Real-time analytics", "Dedicated manager", "Custom campaigns", "Brand partnerships"] },
              ].map((plan, i) => (
                <div key={i} className={"rounded-xl border p-6 " + (i===1?"border-rose-500 border-2 relative":"border-gray-200")}>
                  {i===1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold">POPULAR</span>}
                  <h3 className="font-bold text-gray-900 mb-1">{plan.name}</h3>
                  <p className="text-2xl font-bold text-rose-600 mb-4">{plan.price}</p>
                  <ul className="space-y-2">
                    {plan.features.map((f, j) => <li key={j} className="text-sm text-gray-600 flex items-center gap-2"><span className="text-emerald-500">✓</span>{f}</li>)}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-r from-rose-500 to-pink-500 rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl font-bold mb-2">Ready to Get Started?</h2>
            <p className="text-rose-100 mb-6">Contact our advertising team today</p>
            <a href="mailto:ads@connecthub.love" className="inline-block px-8 py-3 bg-white text-rose-600 rounded-full font-bold hover:shadow-lg">Email ads@connecthub.love</a>
          </div>
        </div>
      </div>
    </div>
  );
}
