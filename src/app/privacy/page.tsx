"use client";
import PageHeader from "@/components/PageHeader";
export default function PrivacyPage() {
  const sections = [
    {t:"1. Information We Collect",c:"We collect information you provide directly: name, email, phone number, date of birth, profile photos, bio, interests, and location. We also collect usage data including device information, IP address, browsing patterns, and interaction data to improve our matching algorithms and services."},
    {t:"2. How We Use Your Data",c:"Your data is used to: provide and improve our dating services, match you with compatible users, process payments securely, send important notifications and updates, ensure platform safety and prevent fraud, personalize your experience, and comply with legal obligations."},
    {t:"3. Data Protection",c:"We employ industry-standard security measures including: AES-256 encryption for data at rest, SSL/TLS encryption for data in transit, bcrypt password hashing (we never store plain text passwords), regular security audits, and access controls limiting employee data access. We never sell your personal data to third parties."},
    {t:"4. Your Privacy Controls",c:"You have full control over your data: hide your phone number, email, and date of birth from other users; control who can see your profile; download a copy of all your data; delete your account and all associated data at any time; opt out of marketing communications."},
    {t:"5. Data Retention",c:"We retain your data for as long as your account is active. Upon account deletion, all personal data is permanently removed within 30 days. Anonymized usage data may be retained for analytical purposes. Payment records are retained as required by law."},
    {t:"6. Third-Party Services",c:"We use trusted third-party services: Flutterwave for secure payment processing, Cloudinary for image hosting, Agora for video calling, and Neon for database hosting. Each service has their own privacy policies and we ensure they meet our security standards."},
    {t:"7. Cookies & Tracking",c:"We use essential cookies for authentication and session management. We do not use third-party advertising cookies. You can manage cookie preferences in your browser settings."},
    {t:"8. Children's Privacy",c:"ConnectHub is not intended for users under 18 years of age. We do not knowingly collect data from minors. If we discover a user is under 18, their account will be immediately terminated."},
    {t:"9. Changes to This Policy",c:"We may update this Privacy Policy from time to time. We will notify you of significant changes via email or in-app notification. Continued use of ConnectHub after changes constitutes acceptance of the updated policy."},
    {t:"10. Contact Us",c:"For privacy-related inquiries, contact our Privacy Team at privacy@connecthub.love. For general support, reach us at support@connecthub.love. We aim to respond within 24 hours."},
  ];
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@400;500;600&display=swap');`}</style>
      <div className="min-h-screen bg-white">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Privacy <span className="italic">Policy</span></h1>
            <p className="text-rose-100/80" style={{fontFamily:"'DM Sans',sans-serif"}}>Last updated: March 2026 · Your privacy matters to us</p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-4 py-16" style={{fontFamily:"'DM Sans',sans-serif"}}>
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 mb-10">
            <div className="flex items-start gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-bold text-emerald-900 mb-1">Your Data is Safe</h3>
                <p className="text-emerald-700 text-sm leading-relaxed">We use bank-level encryption, never sell your data, and give you full control over your privacy settings. You can delete your account and all data at any time.</p>
              </div>
            </div>
          </div>
          <div className="space-y-6">
            {sections.map((s,i) => (
              <section key={i} className="bg-white rounded-2xl p-7 shadow-sm border border-gray-100 hover:shadow-md transition-all">
                <h2 className="text-lg font-bold text-gray-900 mb-3" style={{fontFamily:"'Playfair Display',serif"}}>{s.t}</h2>
                <p className="text-gray-600 text-sm leading-relaxed">{s.c}</p>
              </section>
            ))}
          </div>
          <div className="text-center mt-12">
            <p className="text-gray-400 text-sm">Privacy concerns? Email <a href="mailto:privacy@connecthub.love" className="text-rose-500 font-semibold hover:text-rose-600">privacy@connecthub.love</a></p>
          </div>
        </div>
      </div>
    </>
  );
}
