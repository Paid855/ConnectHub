"use client";
import { useState } from "react";
import { useUser } from "../layout";
import { HelpCircle, MessageCircle, Mail, Send, Check, ChevronDown, Shield, AlertCircle, CreditCard, User, Heart } from "lucide-react";

const FAQS = [
  { q: "How do I verify my account?", a: "Go to the Verification page from the sidebar. You need to upload a profile photo first, then complete the 3-pose face scan and upload a government ID. Our team reviews submissions within 24-48 hours.", cat: "account" },
  { q: "Why was my verification rejected?", a: "Common reasons: blurry photos, face not clearly visible in all 3 poses, ID name does not match your account name, or suspected fake documents. You can try again with clearer photos.", cat: "account" },
  { q: "How do I upgrade to Premium or Gold?", a: "Go to the Upgrade page from your sidebar or profile settings. During our beta period, upgrades are available for testing. Once we launch publicly, secure payment via Stripe will be enabled.", cat: "billing" },
  { q: "Can I cancel my subscription?", a: "Yes, you can downgrade or cancel anytime from the Upgrade page. No long-term contracts or hidden fees.", cat: "billing" },
  { q: "How do I report a user?", a: "If someone is behaving inappropriately, contact our support team using the form below with the user name and details. We take all reports seriously and will investigate immediately.", cat: "safety" },
  { q: "My account was banned. What do I do?", a: "If your account was banned, you can appeal by emailing support@connecthub.com with a valid government ID. Our team will review your case within 72 hours.", cat: "safety" },
  { q: "How do I delete my account?", a: "Contact our support team using the form below and request account deletion. We will process your request within 48 hours and permanently remove all your data.", cat: "account" },
  { q: "Is my data safe on ConnectHub?", a: "Yes. We use encryption for all messages, never share your personal data with third parties, and our verification system ensures only real people can use the platform.", cat: "safety" },
];

export default function SupportPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState("faq");
  const [activeCat, setActiveCat] = useState("all");
  const [openFaq, setOpenFaq] = useState<number|null>(null);
  const [form, setForm] = useState({ subject: "", message: "" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.subject.trim() || !form.message.trim()) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true);
    setSending(false);
    setForm({ subject: "", message: "" });
    setTimeout(() => setSent(false), 5000);
  };

  const filteredFaqs = activeCat === "all" ? FAQS : FAQS.filter(f => f.cat === activeCat);

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Help & Support</h1>
        <p className="text-sm text-gray-500">Get help with your ConnectHub account</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[{k:"faq",l:"FAQ",icon:HelpCircle},{k:"contact",l:"Contact Us",icon:Mail}].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab === t.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}><t.icon className="w-4 h-4" /> {t.l}</button>
        ))}
      </div>

      {activeTab === "faq" && (
        <>
          <div className="flex gap-2 mb-5 flex-wrap">
            {[{k:"all",l:"All"},{k:"account",l:"Account",icon:User},{k:"billing",l:"Billing",icon:CreditCard},{k:"safety",l:"Safety",icon:Shield}].map(c => (
              <button key={c.k} onClick={() => setActiveCat(c.k)} className={"px-4 py-2 rounded-xl text-sm font-medium border transition-all " + (activeCat === c.k ? "bg-rose-50 border-rose-200 text-rose-600" : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>{c.l}</button>
            ))}
          </div>
          <div className="space-y-3">
            {filteredFaqs.map((f, i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-5 text-left">
                  <h3 className="font-semibold text-gray-900 pr-4 text-sm">{f.q}</h3>
                  <ChevronDown className={"w-5 h-5 text-gray-400 transition-transform flex-shrink-0 " + (openFaq === i ? "rotate-180" : "")} />
                </button>
                {openFaq === i && <div className="px-5 pb-5"><p className="text-sm text-gray-600 leading-relaxed">{f.a}</p></div>}
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === "contact" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          {sent && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> Your message has been sent! Our team will respond within 24-48 hours.</div>}

          <div className="flex items-center gap-3 mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
            <Mail className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <div><p className="text-sm font-bold text-blue-800">Email us directly</p><p className="text-xs text-blue-600">support@connecthub.com — We respond within 24 hours</p></div>
          </div>

          <h3 className="font-bold text-gray-900 mb-4">Send a Message</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Your Email</label>
              <input className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-500" value={user.email} disabled />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
              <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.subject} onChange={e => setForm(f => ({...f, subject: e.target.value}))}>
                <option value="">Select a topic</option>
                <option>Account Issue</option>
                <option>Verification Problem</option>
                <option>Report a User</option>
                <option>Billing Question</option>
                <option>Bug Report</option>
                <option>Feature Request</option>
                <option>Account Deletion</option>
                <option>Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm h-32 resize-none focus:ring-2 focus:ring-rose-300 focus:border-transparent" placeholder="Describe your issue in detail..." value={form.message} onChange={e => setForm(f => ({...f, message: e.target.value}))} />
            </div>
          </div>
          <button onClick={handleSubmit} disabled={!form.subject || !form.message.trim() || sending} className="mt-5 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-2">
            {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Message</>}
          </button>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <h4 className="font-bold text-gray-900 mb-3">Other Ways to Reach Us</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><Mail className="w-5 h-5 text-gray-400" /><div><p className="text-sm font-semibold text-gray-900">Email</p><p className="text-xs text-gray-500">support@connecthub.com</p></div></div>
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl"><MessageCircle className="w-5 h-5 text-gray-400" /><div><p className="text-sm font-semibold text-gray-900">Response Time</p><p className="text-xs text-gray-500">Within 24 hours</p></div></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
