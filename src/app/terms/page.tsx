"use client";
import Link from "next/link";
import { Shield, ArrowLeft } from "lucide-react";

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm text-rose-500 font-medium mb-8 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to ConnectHub</Link>
        <div className="flex items-center gap-3 mb-8"><Shield className="w-8 h-8 text-rose-500" /><h1 className="text-3xl font-bold text-gray-900">Terms of Service</h1></div>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Acceptance of Terms</h2>
          <p className="text-gray-600 leading-relaxed mb-4">By accessing or using ConnectHub, you agree to be bound by these Terms of Service. If you do not agree, do not use our service. You must be at least 18 years old to use ConnectHub.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. Account Registration</h2>
          <p className="text-gray-600 leading-relaxed mb-4">You must provide accurate, complete information when creating your account. You are responsible for maintaining the security of your password. You may not create multiple accounts or use another person's identity.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. User Conduct</h2>
          <p className="text-gray-600 leading-relaxed mb-4">You agree not to: post false or misleading information, harass or threaten other users, upload inappropriate or illegal content, use automated systems to access the service, impersonate another person, or violate any applicable laws.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Identity Verification</h2>
          <p className="text-gray-600 leading-relaxed mb-4">ConnectHub uses face verification and government ID checks to ensure user authenticity. By completing verification, you consent to our processing of your biometric data and ID documents solely for identity confirmation purposes.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Virtual Currency (Coins)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">ConnectHub coins are virtual currency purchased with real money. Coins are non-refundable and have no cash value outside the platform. Coins are used for gifts, upgrades, and boosts. ConnectHub retains a 20% platform fee on all gift transactions.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Premium & Gold Plans</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Premium and Gold plans are one-time purchases with lifetime access. These plans unlock additional features including unlimited messaging, video calls, and advanced filters. Plans are non-transferable.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Content Ownership</h2>
          <p className="text-gray-600 leading-relaxed mb-4">You retain ownership of content you post. By posting content, you grant ConnectHub a license to display and distribute that content within the service. Stories automatically expire after 24 hours.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Account Termination</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We may suspend or terminate accounts that violate these terms. Users may delete their account at any time through Settings. After deletion, the same email, phone, or username cannot be used to create a new account for 30 days.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Limitation of Liability</h2>
          <p className="text-gray-600 leading-relaxed mb-4">ConnectHub is provided "as is." We are not liable for any damages resulting from your use of the service, interactions with other users, or loss of data. Use ConnectHub at your own risk and always exercise caution when meeting someone in person.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">For questions about these terms, contact us at <a href="mailto:support@connecthub.com" className="text-rose-500 hover:underline">support@connecthub.com</a></p>
        </div>
      </div>
    </div>
  );
}
