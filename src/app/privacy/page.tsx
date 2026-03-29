"use client";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-center text-gray-500 mb-12">Last updated: March 2026</p>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2><p>Account info (name, email, phone, DOB), profile data (photos, bio, interests), usage data, device info, and payment info processed securely through Paystack.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</h2><p>To provide services, match users, process payments, send notifications, ensure safety, and comply with law.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Protection</h2><p>Industry-standard encryption, bcrypt password hashing, SSL/TLS. We never sell your personal data.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">4. Your Controls</h2><p>Hide phone/email from others, control DOB visibility, download your data (GDPR), delete account anytime.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing</h2><p>Only with Paystack (payments), Cloudinary (images), and law enforcement when required. We never sell data.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">6. Contact</h2><p>Privacy concerns: <a href="mailto:privacy@connecthub.love" className="text-rose-600 hover:underline">privacy@connecthub.love</a></p></section>
        </div>
      </div>
    </div>
  );
}
