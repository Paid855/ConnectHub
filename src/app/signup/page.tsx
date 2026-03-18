"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Check, ArrowRight, ArrowLeft, Phone, Mail, User, Lock, Globe, Shield, AtSign, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];
const HEARTS = ["💕","💖","💗","💘","💝","❤️","🥰","😍","💑","💏"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [form, setForm] = useState({
    name:"", username:"", email:"", phone:"", password:"", confirmPassword:"",
    age:"", gender:"", lookingFor:"", country:"",
    securityQuestion:"What city were you born in?", securityAnswer:""
  });

  const set = (k: string, v: string) => setForm(f => ({...f,[k]:v}));

  const validateStep1 = () => {
    if (!form.name.trim()) return "Enter your full name";
    if (!form.username.trim() || form.username.length < 3) return "Username must be at least 3 characters";
    if (!/^[a-zA-Z0-9_]+$/.test(form.username)) return "Username: letters, numbers, underscores only";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email";
    if (!form.phone.trim() || form.phone.length < 7) return "Enter a valid phone number";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    if (!acceptTerms) return "You must accept the Terms & Conditions";
    return null;
  };

  const goStep2 = () => { const err = validateStep1(); if (err) { setError(err); return; } setError(""); setStep(2); };

  const handleSignup = async () => {
    if (!form.age || !form.gender || !form.securityAnswer.trim()) { setError("Please fill all fields"); return; }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left - Romantic visual */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600" />
        <div className="absolute inset-0 opacity-20" style={{backgroundImage:"url('https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&fit=crop')", backgroundSize:"cover", backgroundPosition:"center"}} />
        <div className="absolute inset-0 bg-gradient-to-t from-rose-900/80 via-rose-600/40 to-purple-600/60" />
        {/* Floating hearts */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {HEARTS.map((h,i) => (
            <motion.div key={i} className="absolute text-2xl" initial={{x:Math.random()*400, y:600+Math.random()*200, opacity:0}} animate={{y:-100, opacity:[0,1,1,0]}} transition={{duration:6+Math.random()*4, repeat:Infinity, delay:i*0.8, ease:"linear"}} style={{left:Math.random()*100+"%"}}>
              {h}
            </motion.div>
          ))}
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30"><Heart className="w-5 h-5 text-white fill-white" /></div>
            <span className="text-2xl font-bold text-white">ConnectHub</span>
          </Link>
          <div className="max-w-md">
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} transition={{delay:0.3}}>
              <h2 className="text-5xl font-bold text-white mb-6 leading-tight">Your Love Story<br />Starts Here</h2>
              <p className="text-lg text-rose-100 leading-relaxed mb-8">Join thousands of real, verified people finding meaningful connections every day.</p>
            </motion.div>
            <div className="space-y-4">
              {[
                { icon:Shield, text:"Video-verified profiles for safety" },
                { icon:Sparkles, text:"AI-powered compatibility matching" },
                { icon:Heart, text:"10,000+ success stories and counting" },
              ].map((item,i) => (
                <motion.div key={i} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:0.5+i*0.15}} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center"><item.icon className="w-4 h-4 text-white" /></div>
                  <span className="text-rose-100 text-sm">{item.text}</span>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20 max-w-md">
            <p className="text-rose-100 italic text-sm mb-3">"ConnectHub changed my life. I found my soulmate within 2 months of joining!"</p>
            <div className="flex items-center gap-3">
              <img src="https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop" className="w-10 h-10 rounded-full object-cover border-2 border-white/30" alt="" />
              <div><p className="text-white font-semibold text-sm">Sarah & James</p><p className="text-rose-200 text-xs">Married 2025</p></div>
            </div>
          </div>
        </div>
      </div>

      {/* Right - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gradient-to-b from-white to-rose-50/30">
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span>
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 mb-6 text-sm">Step {step} of 2 — {step===1?"Personal Info":"Profile & Security"}</p>

          <div className="flex gap-2 mb-6">
            <div className={"flex-1 h-1.5 rounded-full transition-all duration-500 " + (step>=1?"bg-gradient-to-r from-rose-500 to-pink-500":"bg-gray-200")} />
            <div className={"flex-1 h-1.5 rounded-full transition-all duration-500 " + (step>=2?"bg-gradient-to-r from-rose-500 to-pink-500":"bg-gray-200")} />
          </div>

          {error && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</motion.div>}

          {step === 1 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative"><input className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} /><User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                <div className="relative"><input className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Choose a unique username" value={form.username} onChange={e=>set("username",e.target.value.replace(/[^a-zA-Z0-9_]/g,""))} /><AtSign className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
                {form.username && form.username.length >= 3 && <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> @{form.username.toLowerCase()}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative"><input type="email" className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="hello@example.com" value={form.email} onChange={e=>set("email",e.target.value)} /><Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative"><input type="tel" className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="+1 234 567 8900" value={form.phone} onChange={e=>set("phone",e.target.value)} /><Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative"><input type={showPw?"text":"password"} className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Min 6 characters" value={form.password} onChange={e=>set("password",e.target.value)} /><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><button type="button" onClick={()=>setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative"><input type={showConfirmPw?"text":"password"} className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm bg-white" placeholder="Re-enter password" value={form.confirmPassword} onChange={e=>set("confirmPassword",e.target.value)} /><Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><button type="button" onClick={()=>setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPw?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length >= 6 && <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>}
              </div>

              <div className="flex items-start gap-3 p-4 bg-rose-50 rounded-xl border border-rose-100">
                <input type="checkbox" checked={acceptTerms} onChange={e=>setAcceptTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-rose-500 focus:ring-rose-300 accent-rose-500" />
                <p className="text-xs text-gray-600 leading-relaxed">I agree to ConnectHub's <a href="/terms" target="_blank" className="text-rose-500 font-semibold hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-rose-500 font-semibold hover:underline">Privacy Policy</a>. I confirm I am at least 18 years old.</p>
              </div>

              <button onClick={goStep2} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2 hover:-translate-y-0.5">Continue <ArrowRight className="w-4 h-4" /></button>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" min="18" max="99" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm bg-white" placeholder="18+" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Interested In</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Question</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.securityQuestion} onChange={e=>set("securityQuestion",e.target.value)}><option>What city were you born in?</option><option>What is your mother maiden name?</option><option>What was your first pet name?</option><option>What is your favorite movie?</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Answer</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm bg-white" placeholder="For password reset" value={form.securityAnswer} onChange={e=>set("securityAnswer",e.target.value)} /></div>
              <div className="flex gap-3">
                <button onClick={()=>{setStep(1);setError("");}} className="flex-1 py-3.5 border-2 border-gray-200 rounded-full font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><ArrowLeft className="w-4 h-4" /> Back</button>
                <button onClick={handleSignup} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2 hover:-translate-y-0.5">{loading?<><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Creating...</>:<><Shield className="w-4 h-4"/>Create Account</>}</button>
              </div>
            </motion.div>
          )}

          <p className="text-center mt-6 text-sm text-gray-500">Already have an account? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign In</Link></p>
        </motion.div>
      </div>
    </div>
  );
}
