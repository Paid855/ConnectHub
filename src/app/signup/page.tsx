"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { Heart, Eye, EyeOff, Check, ArrowRight, ArrowLeft, Phone, Mail, User, Lock, Globe, Shield } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "", confirmPassword: "",
    age: "", gender: "", lookingFor: "", country: "",
    securityQuestion: "What city were you born in?", securityAnswer: ""
  });

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  const validateStep1 = () => {
    if (!form.name.trim()) return "Enter your full name";
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) return "Enter a valid email";
    if (!form.phone.trim() || form.phone.length < 7) return "Enter a valid phone number";
    if (form.password.length < 6) return "Password must be at least 6 characters";
    if (form.password !== form.confirmPassword) return "Passwords do not match";
    if (!acceptTerms) return "You must accept the Terms & Conditions";
    return null;
  };

  const goStep2 = () => {
    const err = validateStep1();
    if (err) { setError(err); return; }
    setError("");
    setStep(2);
  };

  const handleSignup = async () => {
    if (!form.age || !form.gender || !form.securityAnswer.trim()) {
      setError("Please fill all fields"); return;
    }
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); setLoading(false); return; }
      router.push("/login?registered=true");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 items-center justify-center p-12">
        <div className="max-w-md text-white">
          <Link href="/" className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center"><Heart className="w-5 h-5 fill-white" /></div>
            <span className="text-2xl font-bold">ConnectHub</span>
          </Link>
          <h2 className="text-4xl font-bold mb-4 leading-tight">Start Your Love Story</h2>
          <p className="text-lg text-rose-100 leading-relaxed mb-8">Video-verified profiles ensure you are connecting with real people. Your journey to finding love starts here.</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <p className="text-rose-100 italic mb-3">"ConnectHub video verification made me feel safe. I met my soulmate within 3 months!"</p>
            <p className="text-white font-semibold">— Jessica and David, 2025</p>
          </div>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-gray-50">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
          <Link href="/" className="lg:hidden flex items-center gap-2 mb-8">
            <Heart className="w-6 h-6 text-rose-500 fill-rose-500" />
            <span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span>
          </Link>

          <h2 className="text-3xl font-bold text-gray-900 mb-1">Create Account</h2>
          <p className="text-gray-500 mb-6 text-sm">Step {step} of 2 — {step === 1 ? "Personal Info" : "Profile & Security"}</p>

          {/* Progress */}
          <div className="flex gap-2 mb-6">
            <div className={"flex-1 h-1.5 rounded-full " + (step >= 1 ? "bg-rose-500" : "bg-gray-200")} />
            <div className={"flex-1 h-1.5 rounded-full " + (step >= 2 ? "bg-rose-500" : "bg-gray-200")} />
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <div className="relative">
                  <input className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Your full name" value={form.name} onChange={e => set("name", e.target.value)} />
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <input type="email" className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="hello@example.com" value={form.email} onChange={e => set("email", e.target.value)} />
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <div className="relative">
                  <input type="tel" className="w-full px-4 py-3 pl-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="+1 234 567 8900" value={form.phone} onChange={e => set("phone", e.target.value)} />
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                  <input type={showPw ? "text" : "password"} className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Min 6 characters" value={form.password} onChange={e => set("password", e.target.value)} />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <div className="relative">
                  <input type={showConfirmPw ? "text" : "password"} className="w-full px-4 py-3 pl-11 pr-11 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Re-enter password" value={form.confirmPassword} onChange={e => set("confirmPassword", e.target.value)} />
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showConfirmPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button>
                </div>
                {form.confirmPassword && form.password !== form.confirmPassword && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                {form.confirmPassword && form.password === form.confirmPassword && form.confirmPassword.length >= 6 && <p className="text-xs text-emerald-500 mt-1 flex items-center gap-1"><Check className="w-3 h-3" /> Passwords match</p>}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
                <input type="checkbox" checked={acceptTerms} onChange={e => setAcceptTerms(e.target.checked)} className="w-4 h-4 mt-0.5 rounded border-gray-300 text-rose-500 focus:ring-rose-300 accent-rose-500" />
                <p className="text-xs text-gray-600 leading-relaxed">
                  I agree to ConnectHub's <a href="/terms" target="_blank" className="text-rose-500 font-semibold hover:underline">Terms of Service</a> and <a href="/privacy" target="_blank" className="text-rose-500 font-semibold hover:underline">Privacy Policy</a>. I confirm I am at least 18 years old and understand that my data will be processed as described.
                </p>
              </div>

              <button onClick={goStep2} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all flex items-center justify-center gap-2">
                Continue <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                  <input type="number" min="18" max="99" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="18+" value={form.age} onChange={e => set("age", e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.gender} onChange={e => set("gender", e.target.value)}>
                    <option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Interested In</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.lookingFor} onChange={e => set("lookingFor", e.target.value)}>
                    <option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.country} onChange={e => set("country", e.target.value)}>
                    <option value="">Select</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Question</label>
                <select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.securityQuestion} onChange={e => set("securityQuestion", e.target.value)}>
                  <option>What city were you born in?</option>
                  <option>What is your mother maiden name?</option>
                  <option>What was your first pet name?</option>
                  <option>What is your favorite movie?</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Security Answer</label>
                <input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="Your answer (for password reset)" value={form.securityAnswer} onChange={e => set("securityAnswer", e.target.value)} />
              </div>

              <div className="flex gap-3">
                <button onClick={() => { setStep(1); setError(""); }} className="flex-1 py-3.5 border-2 border-gray-200 rounded-full font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
                <button onClick={handleSignup} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg hover:shadow-rose-200 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                  {loading ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Creating...</> : <><Shield className="w-4 h-4" /> Create Account</>}
                </button>
              </div>
            </div>
          )}

          <p className="text-center mt-6 text-sm text-gray-500">
            Already have an account? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign In</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
