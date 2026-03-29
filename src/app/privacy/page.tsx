"use client";
export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Privacy Policy</h1>
        <p className="text-center text-gray-500 mb-12">Last updated: March 2026</p>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 space-y-6 text-gray-600 leading-relaxed">
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">1. Information We Collect</h2><p>We collect: account information (name, email, phone, date of birth), profile data (photos, bio, interests), usage data (how you interact with the app), device information (browser type, IP address), and payment information (processed securely through Paystack).</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">2. How We Use Your Data</h2><p>We use your data to: provide and improve our services, match you with compatible users, process payments, send notifications, ensure platform safety, and comply with legal requirements.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">3. Data Protection</h2><p>We use industry-standard encryption to protect your data. Passwords are hashed using bcrypt. All connections use SSL/TLS encryption. We never sell your personal data to third parties.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">4. Your Privacy Controls</h2><p>You can: hide your phone number from other users, hide your email address, control who sees your date of birth, download all your data (GDPR export), delete your account and all associated data at any time.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">5. Data Sharing</h2><p>We only share data with: payment processors (Paystack) for transactions, cloud services (Cloudinary) for image storage, and law enforcement when legally required. We never sell your data.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">6. Cookies</h2><p>We use essential cookies for authentication and session management. We do not use tracking cookies for advertising purposes.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">7. Data Retention</h2><p>We retain your data as long as your account is active. When you delete your account, we remove your personal data within 30 days. Some anonymized data may be retained for analytics.</p></section>
          <section><h2 className="text-xl font-bold text-gray-900 mb-3">8. Contact</h2><p>For privacy concerns, contact our Privacy Officer at <a href="mailto:privacy@connecthub.love" className="text-rose-600 hover:underline">privacy@connecthub.love</a></p></section>
        </div>
      </div>
    </div>
  );
}
