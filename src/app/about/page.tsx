"use client";
import PageHeader from "@/components/PageHeader";
export default function AboutPage() {
  return (
    <div className="min-h-screen"><PageHeader /><div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-4xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">About ConnectHub</h1>
        <p className="text-center text-gray-500 mb-12">Where Meaningful Connections Begin</p>
        <div className="space-y-8">
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h2>
            <p className="text-gray-600 leading-relaxed">ConnectHub was built with one purpose: to help people around the world find genuine, meaningful connections. We believe everyone deserves love, companionship, and the chance to meet someone special.</p>
          </section>
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">What Makes Us Different</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {[{t:"Safety First",d:"Every profile is verified. We use advanced security to protect your data."},{t:"Global Community",d:"Connect with people from 190+ countries. Love has no borders."},{t:"Real Connections",d:"Our matching focuses on compatibility, shared values, and genuine interests."},{t:"Video Dating",d:"See and hear your matches before meeting in person."}].map((item,i) => (
                <div key={i} className="bg-rose-50 rounded-xl p-5"><h3 className="font-bold text-gray-900 mb-2">{item.t}</h3><p className="text-sm text-gray-600">{item.d}</p></div>
              ))}
            </div>
          </section>
          <section className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <div className="space-y-3 text-gray-600">
              <p>📧 General: <a href="mailto:info@connecthub.love" className="text-rose-600 hover:underline">info@connecthub.love</a></p>
              <p>🛟 Support: <a href="mailto:support@connecthub.love" className="text-rose-600 hover:underline">support@connecthub.love</a></p>
              <p>🔒 Privacy: <a href="mailto:privacy@connecthub.love" className="text-rose-600 hover:underline">privacy@connecthub.love</a></p>
              <p>📢 Advertising: <a href="mailto:ads@connecthub.love" className="text-rose-600 hover:underline">ads@connecthub.love</a></p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
</div>
}