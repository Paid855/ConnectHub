"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, ArrowLeft, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", email:"", password:"", confirmPassword:"", age:"", gender:"", lookingFor:"", securityQuestion:"", securityAnswer:"" });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const goStep2 = () => {
    if (!form.name || !form.email || !form.password || !form.confirmPassword) return setError("All fields are required");
    if (form.password.length < 6) return setError("Password must be at least 6 characters");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match");
    if (!/\S+@\S+\.\S+/.test(form.email)) return setError("Enter a valid email");
    setError(""); setStep(2);
  };

  const handleSubmit = async () => {
    if (!form.age || !form.gender || !form.lookingFor) return setError("Complete all fields");
    if (!form.securityQuestion || !form.securityAnswer) return setError("Security question required for password reset");
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("Network error. Please try again."); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-rose-500 to-pink-600 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Link href="/" className="flex items-center gap-3 mb-12"><div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Heart className="w-5 h-5 fill-white" /></div><span className="text-2xl font-bold">ConnectHub</span></Link>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Start Your Love Story</h2>
          <p className="text-lg text-rose-100 mb-10 leading-relaxed">Video-verified profiles ensure you are connecting with real people. Your journey to finding love starts here.</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border-l-4 border-white/30">
            <p className="italic text-rose-50 leading-relaxed">"ConnectHub video verification made me feel safe. I met my soulmate within 3 months!"</p>
            <p className="text-sm text-rose-200 mt-3">— Jessica and David, 2025</p>
          </div>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-gray-50">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8"><Heart className="w-6 h-6 text-rose-500 fill-rose-500" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <h2 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 mb-2 text-sm">Step {step} of 2 — {step===1?"Basic Info":"Profile and Security"}</p>
          <div className="flex gap-2 mb-6"><div className={`flex-1 h-1.5 rounded-full ${step>=1?"bg-rose-500":"bg-gray-200"}`}/><div className={`flex-1 h-1.5 rounded-full ${step>=2?"bg-rose-500":"bg-gray-200"}`}/></div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}
          {step===1 ? (<>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label><input type="email" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="hello@example.com" value={form.email} onChange={e=>set("email",e.target.value)} /></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><input type={showPw?"text":"password"} className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm pr-12" placeholder="Min 6 characters" value={form.password} onChange={e=>set("password",e.target.value)} /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff className="w-5 h-5"/>:<Eye className="w-5 h-5"/>}</button></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label><input type="password" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Re-enter password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)} /></div>
            </div>
            <button onClick={goStep2} className="w-full mt-6 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2">Continue <ArrowLeft className="w-4 h-4 rotate-180" /></button>
          </>) : (<>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="25" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option><option>Other</option></select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Interested In</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Question (for password reset)</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" value={form.securityQuestion} onChange={e=>set("securityQuestion",e.target.value)}><option value="">Select a question</option><option>What city were you born in?</option><option>What is your pet name?</option><option>What is your mother maiden name?</option><option>What was your first school?</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Answer</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Your answer" value={form.securityAnswer} onChange={e=>set("securityAnswer",e.target.value)} /></div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={()=>{setStep(1);setError("");}} className="flex-1 py-3.5 border-2 border-gray-200 rounded-full font-semibold text-gray-600 hover:bg-gray-50 transition-all">Back</button>
              <button onClick={handleSubmit} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2">{loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</>:"Create Account"}</button>
            </div>
          </>)}
          <p className="text-center mt-6 text-sm text-gray-500">Already have an account? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign In</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
