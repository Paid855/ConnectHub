"use client";
import { useState } from "react";
import Link from "next/link";
import PageHeader from "@/components/PageHeader";
const FAQS = [
  {q:"How do I create an account?",a:"Tap Get Started on the homepage. Enter your details. You must be 18+. After signing up, upload a photo and start discovering!"},
  {q:"Is ConnectHub free?",a:"Yes! Basic features are free. Upgrade to Plus ($12/month) or Premium ($25/month) for enhanced features."},
  {q:"How do I verify my profile?",a:"Go to Profile, tap Verify. Complete a live selfie following instructions to prove you are real."},
  {q:"Is my data safe?",a:"Yes. Encryption, secure hashing, SSL. Phone and email hidden by default. We never sell data."},
  {q:"How do video calls work?",a:"Add someone as a friend. Once accepted, go to Video, select them, tap Call."},
  {q:"How do I go live?",a:"Go to Video, Go Live tab, enter a title, tap Go Live. You keep 80% of gift coins!"},
  {q:"How do coins work?",a:"Earn through daily login (10/day), referrals (50/invite), gifts. Buy coins for gifts, boosts, upgrades."},
  {q:"Plus vs Premium?",a:"Plus ($12/mo): No ads, unlimited likes, rewind, live streaming. Premium ($25/mo): All Plus + see who likes you, Super Likes, Top Picks, read receipts."},
  {q:"How do I report someone?",a:"Open their profile, tap three dots, Report. Team reviews within 24 hours."},
  {q:"How do I delete my account?",a:"Profile, Settings, Delete Account. All data removed within 30 days."},
  {q:"Can I hide personal info?",a:"Yes! Profile, Privacy Settings. Hide phone, email, DOB. Age always visible."},
  {q:"How to cancel subscription?",a:"Profile, Subscription, Cancel. Features remain until billing period ends."},
];
export default function HelpPage() {
  const [open, setOpen] = useState<number|null>(null);
  const [search, setSearch] = useState("");
  const filtered = search ? FAQS.filter(f => f.q.toLowerCase().includes(search.toLowerCase()) || f.a.toLowerCase().includes(search.toLowerCase())) : FAQS;
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url("https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap")`}</style>
      <div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
        <div className="max-w-3xl mx-auto px-4 py-16">
          <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-24 overflow-hidden -mx-4 sm:-mx-0 mb-8">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Help <span className="italic">Center</span></h1>
            <p className="text-rose-100/80" style={{fontFamily:"'DM Sans',sans-serif"}}>Find answers to common questions</p>
          </div>
        </div>
          
          <input className="w-full px-5 py-4 rounded-2xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm shadow-sm mb-8" placeholder="Search for help..." value={search} onChange={e=>setSearch(e.target.value)} />
          <div className="space-y-3 mb-12">
            {filtered.map((faq,i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <button onClick={()=>setOpen(open===i?null:i)} className="w-full flex items-center justify-between p-5 text-left">
                  <span className="font-semibold text-gray-900 text-sm pr-4">{faq.q}</span>
                  <span className={"text-rose-500 text-xl transition-transform "+(open===i?"rotate-45":"")}>+</span>
                </button>
                {open===i && <div className="px-5 pb-5"><p className="text-gray-600 text-sm leading-relaxed">{faq.a}</p></div>}
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl p-8 border border-gray-100 shadow-sm text-center">
            <h3 className="font-bold text-gray-900 mb-2">Still need help?</h3>
            <p className="text-gray-500 text-sm mb-4">Our support team is here for you</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="mailto:support@connecthub.love" className="px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg">Email Support</a>
              <Link href="/contact" className="px-6 py-3 border-2 border-rose-500 text-rose-600 rounded-full text-sm font-bold hover:bg-rose-50">Contact Form</Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
