"use client";
import PageHeader from "@/components/PageHeader";
export default function TermsPage() {
  const sections = [
    {t:"1. Acceptance of Terms",c:"By accessing or using ConnectHub (connecthub.love), you agree to be bound by these Terms of Service. If you do not agree, please do not use our services. You must be at least 18 years of age to create an account or use ConnectHub."},
    {t:"2. Account Registration",c:"You agree to provide accurate, current, and complete information during registration. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized access."},
    {t:"3. User Conduct",c:"You agree not to: harass, threaten, or abuse other users; create fake or misleading profiles; upload illegal, explicit, or copyrighted content without permission; use ConnectHub for commercial solicitation or spam; attempt to hack, disrupt, or exploit the platform; impersonate another person or entity."},
    {t:"4. Subscriptions & Payments",c:"ConnectHub offers Plus ($12/month) and Premium ($25/month) subscription tiers. Subscriptions auto-renew unless cancelled before the billing period ends. All payments are processed securely through Flutterwave. Prices are in USD and may be subject to change with prior notice."},
    {t:"5. Virtual Currency (Coins)",c:"ConnectHub coins are virtual currency with no real-world monetary value. Coins can be used to send gifts, boost profiles, and access premium features. All coin purchases are final and non-refundable. ConnectHub reserves the right to modify coin pricing and availability."},
    {t:"6. Content Ownership",c:"You retain ownership of content you post on ConnectHub. By posting content, you grant ConnectHub a non-exclusive, worldwide, royalty-free license to use, display, and distribute your content within the platform. You may delete your content at any time."},
    {t:"7. Termination",c:"ConnectHub reserves the right to suspend or terminate accounts that violate these terms, at our sole discretion. You may delete your account at any time through your profile settings. Upon deletion, your data will be removed within 30 days."},
    {t:"8. Limitation of Liability",c:"ConnectHub is provided \"as is\" without warranties. We are not responsible for user-generated content, interactions between users, or any damages arising from use of the platform. Always exercise caution when meeting people online."},
    {t:"9. Privacy",c:"Your privacy is important to us. Please review our Privacy Policy at connecthub.love/privacy for details on how we collect, use, and protect your personal information."},
    {t:"10. Contact",c:"For questions about these terms, contact us at support@connecthub.love. We aim to respond within 24 hours."},
  ];
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <div className="min-h-screen bg-white">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Terms of <span className="italic">Service</span></h1>
            <p className="text-rose-100/80" style={{fontFamily:"'DM Sans',sans-serif"}}>Last updated: March 2026</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16" style={{fontFamily:"'DM Sans',sans-serif"}}>
          <div className="space-y-6">
            {sections.map((s,i) => (
              <section key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-gray-900 mb-3" style={{fontFamily:"'Playfair Display',serif"}}>{s.t}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{s.c}</p>
              </section>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm">Questions? Email <a href="mailto:support@connecthub.love" className="text-rose-500 font-semibold hover:text-rose-600">support@connecthub.love</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
