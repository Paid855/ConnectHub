"use client";
import { useState } from "react";
import PageHeader from "@/components/PageHeader";
import { Send, Mail, MessageCircle, Shield, Phone } from "lucide-react";
export default function ContactPage() {
  const [form, setForm] = useState({name:"",email:"",subject:"",message:""});
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);
  return (
    <>
      <PageHeader />
      <style jsx global>{`@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');`}</style>
      <div className="min-h-screen bg-white">
        <div className="relative bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 py-20 sm:py-24 overflow-hidden">
          <div className="absolute inset-0 opacity-10" style={{backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)",backgroundSize:"24px 24px"}} />
          <div className="relative max-w-4xl mx-auto px-4 text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-white mb-4" style={{fontFamily:"'Playfair Display',serif"}}>Contact <span className="italic">Us</span></h1>
            <p className="text-lg text-rose-100/80" style={{fontFamily:"'DM Sans',sans-serif"}}>We would love to hear from you. Our team responds within 24 hours.</p>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-16" style={{fontFamily:"'DM Sans',sans-serif"}}>
          <div className="grid md:grid-cols-3 gap-5 mb-12">
            {[
              {icon:"📧",title:"Email Support",desc:"Get help with your account",email:"support@connecthub.love",color:"from-blue-50 to-indigo-50",border:"border-blue-100"},
              {icon:"📢",title:"Advertising",desc:"Partner with ConnectHub",email:"ads@connecthub.love",color:"from-amber-50 to-orange-50",border:"border-amber-100"},
              {icon:"🔒",title:"Privacy Team",desc:"Data and privacy inquiries",email:"privacy@connecthub.love",color:"from-violet-50 to-purple-50",border:"border-violet-100"},
            ].map((c,i) => (
              <a key={i} href={"mailto:"+c.email} className={"bg-gradient-to-br "+c.color+" rounded-2xl p-6 border "+c.border+" hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group text-center"}>
                <div className="text-3xl mb-3">{c.icon}</div>
                <h3 className="font-bold text-gray-900 mb-1">{c.title}</h3>
                <p className="text-xs text-gray-500 mb-2">{c.desc}</p>
                <p className="text-xs text-rose-500 font-semibold group-hover:text-rose-600">{c.email}</p>
              </a>
            ))}
          </div>

          <div className="bg-white rounded-2xl p-8 sm:p-10 shadow-sm border border-gray-100">
            <h2 className="text-2xl font-extrabold text-gray-900 mb-6" style={{fontFamily:"'Playfair Display',serif"}}>Send a Message</h2>
            {sent ? (
              <div className="text-center py-12">
                <div className="w-20 h-20 mx-auto bg-emerald-100 rounded-full flex items-center justify-center mb-5"><span className="text-3xl">✅</span></div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Message Sent!</h3>
                <p className="text-gray-500 text-sm">We will respond within 24 hours.</p>
              </div>
            ) : (
              <form onSubmit={e=>{e.preventDefault();setLoading(true);setTimeout(()=>{setSent(true);setLoading(false);setTimeout(()=>{setSent(false);setForm({name:"",email:"",subject:"",message:""});},3000);},1000);}} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Name</label>
                    <input required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white text-sm transition-all" placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <input required type="email" className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white text-sm transition-all" placeholder="you@example.com" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Subject</label>
                  <input required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white text-sm transition-all" placeholder="What is this about?" value={form.subject} onChange={e=>setForm({...form,subject:e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message</label>
                  <textarea required className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white text-sm h-36 resize-none transition-all" placeholder="Tell us how we can help..." value={form.message} onChange={e=>setForm({...form,message:e.target.value})} />
                </div>
                <button type="submit" disabled={loading} className="w-full sm:w-auto px-10 py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl font-bold text-sm hover:shadow-xl hover:shadow-rose-200/50 transition-all disabled:opacity-60 flex items-center justify-center gap-2 active:scale-[0.98]">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Send Message</>}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <div className="py-8 text-center">
        <p className="text-sm text-gray-500 mb-3">Or reach us on social media</p>
        <div className="flex justify-center gap-3">
          <a href="https://www.facebook.com/share/1BFqFtAP5X/?mibextid=wwXIfr" target="_blank" rel="noopener" className="px-5 py-2.5 bg-blue-500 text-white rounded-full text-sm font-bold hover:bg-blue-600 transition-all flex items-center gap-2">📘 Facebook</a>
          <a href="https://www.instagram.com/connecthub.love" target="_blank" rel="noopener" className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all flex items-center gap-2">📷 Instagram</a>
        </div>
      </div>
    </>
  );
}
