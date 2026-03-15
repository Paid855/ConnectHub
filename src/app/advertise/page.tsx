"use client";
import { useState } from "react";
import { Heart, Send, Check, Building2, Mail, Globe, DollarSign } from "lucide-react";
import Link from "next/link";

export default function AdvertisePage() {
  const [form, setForm] = useState({ company:"", email:"", website:"", budget:"", message:"" });
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const handleSubmit = async () => {
    if (!form.company || !form.email || !form.message) return;
    setSending(true);
    await new Promise(r => setTimeout(r, 1500));
    setSent(true); setSending(false);
    setForm({ company:"", email:"", website:"", budget:"", message:"" });
    setTimeout(() => setSent(false), 5000);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-500 to-pink-500 flex items-center justify-center"><Heart className="w-4 h-4 text-white fill-white" /></div><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700">Back to Home</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-100 border border-amber-200 rounded-full px-4 py-1.5 mb-4"><DollarSign className="w-4 h-4 text-amber-600" /><span className="text-sm font-bold text-amber-700">Advertising</span></div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Advertise with ConnectHub</h1>
          <p className="text-lg text-gray-500 max-w-lg mx-auto">Reach thousands of engaged users looking for meaningful connections. Partner with the fastest-growing dating platform.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-12">
          {[
            { icon:Building2, title:"Brand Partners", desc:"Showcase your brand to our engaged community", color:"text-violet-500", bg:"bg-violet-50" },
            { icon:Globe, title:"Global Reach", desc:"Users from 50+ countries worldwide", color:"text-blue-500", bg:"bg-blue-50" },
            { icon:DollarSign, title:"Flexible Budgets", desc:"Plans starting from $99/month", color:"text-emerald-500", bg:"bg-emerald-50" },
          ].map((f,i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-6 text-center shadow-sm">
              <div className={"w-12 h-12 rounded-xl " + f.bg + " flex items-center justify-center mx-auto mb-3"}><f.icon className={"w-6 h-6 " + f.color} /></div>
              <h3 className="font-bold text-gray-900 mb-1">{f.title}</h3>
              <p className="text-sm text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Get in Touch</h2>
          {sent && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> Your inquiry has been sent! We will respond within 24-48 hours.</div>}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="Your company" value={form.company} onChange={e => setForm(f=>({...f,company:e.target.value}))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="contact@company.com" value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Website</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" placeholder="https://yoursite.com" value={form.website} onChange={e => setForm(f=>({...f,website:e.target.value}))} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Monthly Budget</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.budget} onChange={e => setForm(f=>({...f,budget:e.target.value}))}><option value="">Select</option><option>$99 - $499</option><option>$500 - $1,999</option><option>$2,000 - $4,999</option><option>$5,000+</option></select></div>
            </div>
            <div><label className="block text-sm font-medium text-gray-700 mb-1">Message *</label><textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm h-32 resize-none" placeholder="Tell us about your advertising goals..." value={form.message} onChange={e => setForm(f=>({...f,message:e.target.value}))} /></div>
          </div>
          <button onClick={handleSubmit} disabled={!form.company || !form.email || !form.message || sending} className="mt-5 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg transition-all disabled:opacity-40 flex items-center gap-2">
            {sending ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Sending...</> : <><Send className="w-4 h-4" /> Send Inquiry</>}
          </button>
        </div>
      </div>
    </div>
  );
}
