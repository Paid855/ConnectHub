import Link from "next/link";
import { Heart } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 space-y-6 text-gray-700 text-sm leading-relaxed">
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">Information We Collect</h2><p>We collect information you provide during registration (name, email, phone, age, gender, country), profile content (photos, bio), verification documents (face scans, ID), and usage data (messages, interactions).</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">How We Use Your Data</h2><p>Your data is used to provide the ConnectHub service, verify your identity, match you with compatible users, improve our algorithms, and communicate important updates. We do not sell your personal data to advertisers.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">Data Storage & Security</h2><p>All data is stored securely using industry-standard encryption. Verification documents and ID photos are stored in our secure database and are only accessible to authorized admin personnel for review purposes.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">Your Rights</h2><p>You have the right to access, correct, or delete your personal data at any time. Contact our support team to exercise these rights. Account deletion will permanently remove all your data from our systems.</p></section>
          <section><h2 className="text-lg font-bold text-gray-900 mb-2">Cookies</h2><p>We use essential cookies to maintain your login session and preferences. No third-party tracking cookies are used.</p></section>
          <p className="text-gray-400 pt-4 border-t border-gray-100">Last updated: March 2026</p>
        </div>
      </div>
    </div>
  );
}
