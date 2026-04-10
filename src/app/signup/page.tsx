"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const COUNTRIES = ["United States","United Kingdom","Canada","Nigeria","Ghana","South Africa","India","Brazil","Germany","France","Australia","Japan","South Korea","Mexico","Italy","Spain","Netherlands","Sweden","Norway","Denmark","Turkey","Egypt","UAE","Saudi Arabia","Kenya","Tanzania","Philippines","Indonesia","Malaysia","Thailand","Vietnam","China","Russia","Poland","Ukraine","Romania","Colombia","Argentina","Chile","Peru","Morocco","Tunisia","Pakistan","Bangladesh","Sri Lanka","Singapore","New Zealand","Ireland","Portugal","Czech Republic","Hungary","Austria","Switzerland","Belgium","Finland","Greece","Israel","Jamaica","Trinidad and Tobago","Other"];
const GENDERS = ["Man","Woman","Non-binary","Other"];
const LOOKING = ["Men","Women","Everyone"];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({ name:"", email:"", password:"", username:"", phone:"", dateOfBirth:"", gender:"", lookingFor:"", country:"", bio:"" });
  const [photo, setPhoto] = useState<string|null>(null);
  const [usernameStatus, setUsernameStatus] = useState<""|"checking"|"available"|"taken">("");
  const [showPwd, setShowPwd] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");

  const checkUsername = async (u: string) => {
    if (!u || u.length < 3) { setUsernameStatus(""); return; }
    setUsernameStatus("checking");
    try {
      const res = await fetch("/api/auth/check-username?username=" + u);
      const d = await res.json();
      setUsernameStatus(d.available ? "available" : "taken");
    } catch { setUsernameStatus(""); }
  };

  const age = form.dateOfBirth ? (() => {
    const b = new Date(form.dateOfBirth);
    const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  })() : null;

  const handleSignup = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, age: age })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setStep(3); // Go to photo upload
      } else {
        if (data.ageRestricted) {
          setStep(-1); // Age restricted page
        } else {
          setError(data.error || "Signup failed");
        }
      }
    } catch { setError("Network error"); }
    finally { setLoading(false); }
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) { setError("Photo must be under 5MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadPhoto = async () => {
    if (!photo) { setStep(4); return; }
    setLoading(true);
    try {
      await fetch("/api/auth/profile", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profilePhoto: photo })
      });
    } catch {}
    setLoading(false);
    setStep(4); // Go to upgrade prompt
  };

  // Age restricted page (#23)
  if (step === -1) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50 to-pink-50 p-6">
      <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-lg border border-gray-100 text-center">
        <div className="text-6xl mb-4">🔞</div>
        <h1 className="text-2xl font-bold text-gray-900 mb-3">Age Restriction</h1>
        <p className="text-gray-600 mb-4">ConnectHub is designed for adults aged 18 and above. This is to ensure the safety and well-being of all our users.</p>
        <p className="text-gray-500 text-sm mb-6">We take age verification seriously to maintain a safe and respectful community for everyone.</p>
        <div className="bg-rose-50 rounded-xl p-4 mb-6">
          <p className="text-rose-700 text-sm font-medium">You must be at least 18 years old to create an account on ConnectHub.</p>
        </div>
        <Link href="/" className="inline-block px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold hover:shadow-lg">Return Home</Link>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex">
      {/* Left visual */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-rose-500 via-pink-500 to-purple-600 relative overflow-hidden items-center justify-center">
        <div className="absolute inset-0"><div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl" /><div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl" /></div>
        <div className="relative z-10 text-center px-12">
          <div className="text-7xl mb-6">💕</div>
          <h2 className="text-4xl font-bold text-white mb-4">Start Your Love Story</h2>
          <p className="text-xl text-rose-100 leading-relaxed">Join millions of people finding meaningful connections on ConnectHub</p>
          <div className="mt-12 space-y-4">
            {[{icon:"🔒",text:"100% safe and secure"},{icon:"🌍",text:"Available in 190+ countries"},{icon:"💎",text:"50 free coins on signup"}].map((item,i) => (
              <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-5 py-3">
                <span className="text-xl">{item.icon}</span>
                <span className="text-white font-medium">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between mb-6"><Link href="/" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center"><span className="text-white text-xl">💕</span></div>
            <span className="text-2xl font-bold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
          </Link></div>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            {[1,2,3,4].map(s => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={"w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold " + (step >= s ? "bg-rose-500 text-white" : "bg-gray-100 text-gray-400")}>{step > s ? "✓" : s}</div>
                {s < 4 && <div className={"flex-1 h-1 rounded " + (step > s ? "bg-rose-500" : "bg-gray-100")} />}
              </div>
            ))}
          </div>

          {/* STEP 1: Basic info */}
          {step === 1 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
              <p className="text-gray-500 text-sm mb-6">Start your journey to finding love</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="Your full name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="you@example.com" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username</label>
                  <input value={form.username} onChange={e => { const v = e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ""); setForm({...form, username: v}); checkUsername(v); }} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="choose_a_username" />
                {usernameStatus === "checking" && <p className="text-xs text-gray-400 mt-1">Checking...</p>}
                  {usernameStatus === "available" && <p className="text-xs text-emerald-500 mt-1">Username available ✓</p>}
                  {usernameStatus === "taken" && <p className="text-xs text-red-500 mt-1">Username already taken</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative"><input type={showPwd?"text":"password"} required minLength={6} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm pr-14" placeholder="Minimum 6 characters" /><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">{showPwd?"Hide":"Show"}</button></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                  <input type={showPwd?"text":"password"} required value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="Re-enter password" />
                  {confirmPwd && confirmPwd !== form.password && <p className="text-xs text-red-500 mt-1">Passwords do not match</p>}
                  {confirmPwd && confirmPwd === form.password && <p className="text-xs text-emerald-500 mt-1">Passwords match ✓</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth *</label>
                  <input type="date" required value={form.dateOfBirth} onChange={e => setForm({...form, dateOfBirth: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split("T")[0]} />
                  {age !== null && age < 18 && <p className="text-red-500 text-xs mt-1">You must be 18 or older</p>}
                  {age !== null && age >= 18 && <p className="text-emerald-500 text-xs mt-1">Age: {age} years old ✓</p>}
                </div>
                <button onClick={() => {
                  if (!form.name || !form.email || !form.password || !form.dateOfBirth) { setError("Please fill all required fields"); return; }
                  if (form.password.length < 6) { setError("Password must be at least 6 characters"); return; }
                  if (confirmPwd !== form.password) { setError("Passwords do not match"); return; }
                  if (age !== null && age < 18) { setStep(-1); return; }
                  setError(""); setStep(2);
                }} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg transition-all">Continue</button>
              </div>
            </>
          )}

          {/* STEP 2: Profile details */}
          {step === 2 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">About You</h1>
              <p className="text-gray-500 text-sm mb-6">Help us find your best matches</p>
              {error && <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">{error}</div>}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">I am a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {GENDERS.map(g => <button key={g} type="button" onClick={() => setForm({...form, gender: g})} className={"py-3 rounded-xl border text-sm font-medium transition-all " + (form.gender === g ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-700 hover:border-rose-300")}>{g}</button>)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Looking for</label>
                  <div className="grid grid-cols-3 gap-2">
                    {LOOKING.map(l => <button key={l} type="button" onClick={() => setForm({...form, lookingFor: l})} className={"py-3 rounded-xl border text-sm font-medium transition-all " + (form.lookingFor === l ? "bg-rose-500 text-white border-rose-500" : "border-gray-200 text-gray-700 hover:border-rose-300")}>{l}</button>)}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select value={form.country} onChange={e => setForm({...form, country: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm bg-white">
                    <option value="">Select your country</option>
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none focus:ring-2 focus:ring-rose-300 text-sm" placeholder="+1 234 567 8900" />
                </div>
                <div className="flex gap-3">
                  <button onClick={() => setStep(1)} className="flex-1 py-3.5 border-2 border-gray-200 text-gray-700 rounded-xl font-bold text-sm hover:bg-gray-50">Back</button>
                  <button onClick={handleSignup} disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                    {loading ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Creating...</> : "Create Account"}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* STEP 3: Photo upload (#11) */}
          {step === 3 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Add Your Photo</h1>
              <p className="text-gray-500 text-sm mb-6">Profiles with photos get 10x more matches!</p>
              <div className="text-center">
                <div className="relative w-40 h-40 mx-auto mb-6">
                  {photo ? (
                    <img src={photo} className="w-full h-full rounded-full object-cover border-4 border-rose-200" />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-rose-100 to-pink-100 flex items-center justify-center border-4 border-dashed border-rose-200">
                      <span className="text-4xl">📷</span>
                    </div>
                  )}
                  <label className="absolute bottom-0 right-0 w-12 h-12 bg-rose-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-rose-600 shadow-lg">
                    <span className="text-white text-lg">+</span>
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                  </label>
                </div>
                <p className="text-gray-400 text-xs mb-8">JPG, PNG. Max 5MB.</p>
                <button onClick={uploadPhoto} disabled={loading} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 mb-3">
                  {loading ? "Uploading..." : photo ? "Save & Continue" : "Skip for Now"}
                </button>
              </div>
            </>
          )}

          {/* STEP 4: Upgrade prompt (#15) */}
          {step === 4 && (
            <>
              <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome to ConnectHub! 🎉</h1>
              <p className="text-gray-500 text-sm mb-6">You earned 50 free coins! Upgrade for the best experience:</p>
              <div className="space-y-4 mb-6">
                <div className="border-2 border-rose-500 rounded-2xl p-5 relative">
                  <span className="absolute -top-3 left-4 bg-rose-500 text-white text-xs px-3 py-1 rounded-full font-bold">RECOMMENDED</span>
                  <h3 className="font-bold text-gray-900">Plus — $12/month</h3>
                  <p className="text-gray-500 text-sm mb-3">No ads, unlimited likes, live streaming, rewinds</p>
                  <button onClick={() => router.push("/dashboard/coins?upgrade=plus")} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-bold text-sm hover:shadow-lg">Upgrade to Plus</button>
                </div>
                <div className="border border-gray-200 rounded-2xl p-5">
                  <h3 className="font-bold text-gray-900">Premium — $25/month</h3>
                  <p className="text-gray-500 text-sm mb-3">Everything in Plus + see who likes you, Super Likes, Top Picks</p>
                  <button onClick={() => router.push("/dashboard/coins?upgrade=premium")} className="w-full py-3 border-2 border-rose-500 text-rose-600 rounded-xl font-bold text-sm hover:bg-rose-50">Go Premium</button>
                </div>
              </div>
              <button onClick={() => router.push("/dashboard")} className="w-full py-3 text-gray-500 text-sm font-medium hover:text-gray-700">Skip — Continue with Free Plan</button>
            </>
          )}

          {step <= 2 && <p className="text-center text-gray-500 text-sm mt-6">Already have an account? <Link href="/login" className="text-rose-600 font-semibold hover:underline">Sign In</Link></p>}
        </div>
      </div>
    </div>
  );
}
