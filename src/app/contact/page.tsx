"use client";
import PageHeader from "@/components/PageHeader";
import { useState } from "react";
export default function ContactPage() {
  const [form, setForm] = useState({name:"",email:"",subject:"",message:""});
  const [sent, setSent] = useState(false);
  return (
    <div className="min-h-screen"><PageHeader /><div className="min-h-screen bg-gradient-to-b from-rose-50 to-white">
      <div className="max-w-2xl mx-auto px-4 py-16">
        <h1 className="text-4xl font-bold text-center mb-4 bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">Contact Us</h1>
        <p className="text-center text-gray-500 mb-8">We would love to hear from you</p>
        <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 mb-8">
          <div className="grid sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-rose-50 rounded-xl p-4 text-center"><p className="text-2xl mb-1">📧</p><p className="font-bold text-sm">Support</p><a href="mailto:support@connecthub.love" className="text-rose-600 text-xs">support@connecthub.love</a></div>
            <div className="bg-rose-50 rounded-xl p-4 text-center"><p className="text-2xl mb-1">📢</p><p className="font-bold text-sm">Advertising</p><a href="mailto:ads@connecthub.love" className="text-rose-600 text-xs">ads@connecthub.love</a></div>
            <div className="bg-rose-50 rounded-xl p-4 text-center"><p className="text-2xl mb-1">🔒</p><p className="font-bold text-sm">Privacy</p><a href="mailto:privacy@connecthub.love" className="text-rose-600 text-xs">privacy@connecthub.love</a></div>
            <div className="bg-rose-50 rounded-xl p-4 text-center"><p className="text-2xl mb-1">ℹ️</p><p className="font-bold text-sm">General</p><a href="mailto:info@connecthub.love" className="text-rose-600 text-xs">info@connecthub.love</a></div>
          </div>
          {sent ? (
            <div className="text-center py-8"><p className="text-4xl mb-2">✅</p><p className="font-bold text-gray-900">Message Sent!</p><p className="text-gray-500 text-sm">We will respond within 24 hours.</p></div>
          ) : (
            <form onSubmit={e=>{e.preventDefault();setSent(true);setTimeout(()=>setSent(false),3000);}} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="Your name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                <input required type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="Your email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
              </div>
              <input required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="Subject" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
              <textarea required className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm h-32 resize-none" placeholder="Your message..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} />
              <button type="submit" className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg">Send Message</button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
</div>
}