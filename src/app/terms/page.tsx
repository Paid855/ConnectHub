"use client";
export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Terms of Service</h1>
        <p className="text-center text-gray-500 mb-12">Last updated: March 2026</p>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">1. Acceptance of Terms</h2><p>By using ConnectHub (connecthub.love), you agree to these Terms of Service. If you don't agree, please don't use our platform. You must be at least 18 years old to create an account.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">2. Account Registration</h2><p>You must provide accurate information when creating your account. You're responsible for maintaining the security of your account and all activities under it. ConnectHub reserves the right to suspend or terminate accounts that violate these terms.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">3. User Conduct</h2><p>You agree not to: harass, threaten, or abuse other users; post inappropriate, illegal, or offensive content; create fake profiles or impersonate others; use the platform for commercial solicitation; attempt to hack or compromise our systems.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">4. Subscriptions & Payments</h2><p>ConnectHub offers free and paid subscription plans (Plus at $12/month, Premium at $25/month). Subscriptions auto-renew unless cancelled. Refunds are handled on a case-by-case basis. All prices are in USD.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">5. Virtual Currency (Coins)</h2><p>ConnectHub coins are virtual currency used within the platform for gifts, boosts, and features. Coins have no real-world monetary value and cannot be exchanged for cash. Purchases of coins are final and non-refundable.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">6. Content Ownership</h2><p>You retain ownership of content you post. By posting, you grant ConnectHub a license to display and distribute your content within the platform. We may remove content that violates our guidelines.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">7. Privacy</h2><p>Your privacy is important. Please review our <a href="/privacy" className="text-rose-600 hover:underline">Privacy Policy</a> for details on how we collect, use, and protect your data.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">8. Limitation of Liability</h2><p>ConnectHub is provided "as is." We're not liable for any damages arising from your use of the platform, interactions with other users, or any content posted by users.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">9. Contact</h2><p>Questions about these terms? Email us at <a href="mailto:support@connecthub.love" className="text-rose-600 hover:underline">support@connecthub.love</a></p></section>
        </div>
      </div>
    </div>
  );
}
