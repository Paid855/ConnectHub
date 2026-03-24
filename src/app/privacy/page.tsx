"use client";
import Link from "next/link";
import { Lock, ArrowLeft } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <Link href="/" className="flex items-center gap-2 text-sm text-rose-500 font-medium mb-8 hover:underline"><ArrowLeft className="w-4 h-4" /> Back to ConnectHub</Link>
        <div className="flex items-center gap-3 mb-8"><Lock className="w-8 h-8 text-rose-500" /><h1 className="text-3xl font-bold text-gray-900">Privacy Policy</h1></div>
        <div className="prose prose-gray max-w-none">
          <p className="text-gray-500 text-sm mb-8">Last updated: March 2026</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">1. Information We Collect</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We collect information you provide: name, email, phone number, date of birth, gender, photos, bio, interests, and preferences. We also collect verification data including face photos and government ID images for identity confirmation.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">2. How We Use Your Information</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We use your information to: provide and improve our service, match you with compatible users, verify your identity, send notifications and updates, process transactions, prevent fraud and ensure safety, and comply with legal obligations.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">3. Profile Visibility</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Your profile is visible to other ConnectHub users by default. You can control privacy settings in your profile. Premium users can make their profile private. Blocked users cannot see your profile.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">4. Data Storage & Security</h2>
          <p className="text-gray-600 leading-relaxed mb-4">Your data is stored securely using industry-standard encryption. Passwords are hashed with bcrypt. We use SSL/TLS for all data transmission. Verification documents are stored encrypted and only accessible to authorized admin personnel.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">5. Data Sharing</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We do not sell your personal data to third parties. We may share data with: service providers who help operate our platform, law enforcement when legally required, and in connection with a business transfer.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">6. Cookies & Tracking</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We use cookies and session tokens for authentication and user experience. We use analytics to understand how our service is used. You can manage cookie preferences in your browser settings.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">7. Your Rights (GDPR)</h2>
          <p className="text-gray-600 leading-relaxed mb-4">You have the right to: access your personal data, correct inaccurate data, delete your account and all associated data, export your data, withdraw consent for data processing, and object to automated decision-making. To exercise these rights, go to Profile → Settings or contact support.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">8. Data Retention</h2>
          <p className="text-gray-600 leading-relaxed mb-4">We retain your data as long as your account is active. After account deletion, all personal data is permanently removed within 30 days. Stories are automatically deleted after 24 hours. Chat messages are retained while accounts are active.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">9. Children's Privacy</h2>
          <p className="text-gray-600 leading-relaxed mb-4">ConnectHub is not intended for users under 18 years of age. We do not knowingly collect personal information from minors. If we discover a user is under 18, their account will be immediately terminated.</p>
          <h2 className="text-xl font-bold text-gray-900 mt-8 mb-3">10. Contact</h2>
          <p className="text-gray-600 leading-relaxed mb-4">For privacy concerns, contact our Data Protection Officer at <a href="mailto:privacy@connecthub.com" className="text-rose-500 hover:underline">privacy@connecthub.com</a> or <a href="mailto:support@connecthub.com" className="text-rose-500 hover:underline">support@connecthub.com</a></p>
        </div>
      </div>
    </div>
  );
}
