import Link from "next/link";
import { Heart } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">1. Acceptance of Terms</h2><p>By creating an account on ConnectHub, you agree to be bound by these Terms of Service. You must be at least 18 years old to use this platform. If you do not agree to these terms, do not use ConnectHub.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">2. Account Registration</h2><p>You must provide accurate information during registration including your real name, valid email, and phone number. You are responsible for maintaining the security of your account credentials. Creating fake accounts or using false identity information will result in permanent account termination.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">3. Identity Verification</h2><p>ConnectHub requires identity verification through face scanning and government-issued ID upload. By submitting verification documents, you confirm that you are the person depicted and that the documents are authentic. Submitting fraudulent documents is a criminal offense and will be reported to authorities.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">4. User Conduct</h2><p>Users must treat others with respect. Harassment, hate speech, threats, spam, scams, solicitation, and any illegal activity are strictly prohibited. Violations will result in immediate account suspension or permanent ban.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">5. Privacy & Data</h2><p>We collect and process personal data as described in our Privacy Policy. Your verification photos and ID documents are stored securely and used only for identity verification purposes. We do not share your personal information with third parties without your consent.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">6. Subscriptions & Payments</h2><p>Premium and Gold subscriptions are billed monthly or annually as selected. You may cancel your subscription at any time. Refunds are handled on a case-by-case basis. Free tier users have limited access to platform features.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">7. Content Ownership</h2><p>You retain ownership of content you upload. By posting content, you grant ConnectHub a non-exclusive license to display it on the platform. You must not upload content that infringes on others intellectual property rights.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">8. Limitation of Liability</h2><p>ConnectHub is not responsible for the actions of its users. We provide a platform for connection but cannot guarantee the safety of in-person meetings. Always exercise caution when meeting someone for the first time.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">9. Changes to Terms</h2><p>We may update these terms periodically. Continued use of the platform after changes constitutes acceptance of the updated terms.</p></section>
          <p className="text-gray-400 pt-4 border-t border-gray-100">Last updated: March 2026</p>
        </div>
      </div>
    </div>
  );
}
