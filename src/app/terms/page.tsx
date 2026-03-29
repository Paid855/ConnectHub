"use client";
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Terms of Service</h1>
        <p className="text-center text-gray-500 mb-12">Last updated: March 2026</p>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2><p>By using ConnectHub (connecthub.love), you agree to these Terms. You must be 18+ to create an account.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">2. Account Registration</h2><p>Provide accurate information. You are responsible for your account security and all activities under it.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">3. User Conduct</h2><p>No harassment, fake profiles, illegal content, commercial solicitation, or hacking attempts allowed.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions</h2><p>Plus ($12/month) and Premium ($25/month) plans are available. Auto-renew unless cancelled. All prices in USD.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">5. Virtual Currency</h2><p>Coins have no real-world cash value and cannot be exchanged for money. Coin purchases are final.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">6. Content</h2><p>You own your content but grant ConnectHub license to display it. We may remove content violating guidelines.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">7. Privacy</h2><p>See our <a href="/privacy" className="text-rose-600 hover:underline">Privacy Policy</a> for data handling details.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2><p>Questions? Email <a href="mailto:support@connecthub.love" className="text-rose-600 hover:underline">support@connecthub.love</a></p></section>
        </div>
      </div>
    </div>
  );
}
