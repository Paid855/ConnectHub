"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, ArrowLeft, User, Calendar, Globe, Shield, Camera, Sparkles, Check, Phone, ChevronDown, MapPin, HelpCircle } from "lucide-react";

const COUNTRIES = ["United States","United Kingdom","Canada","Nigeria","Ghana","South Africa","India","Brazil","Germany","France","Australia","Japan","South Korea","Mexico","Italy","Spain","Netherlands","Sweden","Norway","Denmark","Turkey","Egypt","UAE","Saudi Arabia","Kenya","Tanzania","Philippines","Indonesia","Malaysia","Thailand","Vietnam","China","Russia","Poland","Ukraine","Romania","Colombia","Argentina","Chile","Peru","Morocco","Tunisia","Pakistan","Bangladesh","Sri Lanka","Singapore","New Zealand","Ireland","Portugal","Czech Republic","Hungary","Austria","Switzerland","Belgium","Finland","Greece","Israel","Jamaica","Trinidad and Tobago","Other"];
const GENDERS = ["Man","Woman","Non-binary","Other"];
const LOOKING = ["Men","Women","Everyone"];
const SECURITY_QS = ["What is the name of your first pet?","What city were you born in?","What is your mother's maiden name?","What was the name of your first school?","What is your favorite movie?","What street did you grow up on?"];
const INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Football","Basketball","Fashion","Coffee","Dogs","Cats","Beach","Mountains","Foodie","Netflix","Anime","Tech"];
const INTEREST_ICONS: Record<string,string> = {Travel:"✈️",Music:"🎵",Cooking:"🍳",Fitness:"💪",Photography:"📸",Art:"🎨",Reading:"📚",Movies:"🎬",Gaming:"🎮",Dancing:"💃",Yoga:"🧘",Hiking:"🥾",Football:"⚽",Basketball:"🏀",Fashion:"👗",Coffee:"☕",Dogs:"🐕",Cats:"🐱",Beach:"🏖️",Mountains:"⛰️",Foodie:"🍕",Netflix:"📺",Anime:"🎌",Tech:"💻"};

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({ name:"",email:"",password:"",username:"",phone:"",dateOfBirth:"",gender:"",lookingFor:"",country:"",bio:"",securityQuestion:"",securityAnswer:"" });
  const [photo, setPhoto] = useState<string|null>(null);
  const [usernameStatus, setUsernameStatus] = useState<""|"checking"|"available"|"taken">("");
  const [showPwd, setShowPwd] = useState(false);
  const [confirmPwd, setConfirmPwd] = useState("");
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [dobMonth, setDobMonth] = useState("");
  const [dobDay, setDobDay] = useState("");
  const [dobYear, setDobYear] = useState("");
  const [customQuestion, setCustomQuestion] = useState("");
  const [isCustomQuestion, setIsCustomQuestion] = useState(false);
  const updateDob = (m:string, d:string, y:string) => {
    if (m && d && y) set("dateOfBirth", y + "-" + m + "-" + d);
  };
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);

  useEffect(() => { setMounted(true); }, []);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

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
    const b = new Date(form.dateOfBirth); const t = new Date();
    let a = t.getFullYear() - b.getFullYear();
    if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
    return a;
  })() : null;

  const toggleInterest = (t:string) => setSelectedInterests(p => p.includes(t)?p.filter(x=>x!==t):p.length<8?[...p,t]:p);

  const validateStep = () => {
    setError("");
    if (step === 1) {
      if (!form.name.trim()) { setError("Please enter your name"); return false; }
      if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) { setError("Please enter a valid email"); return false; }
      if (form.password.length < 6) { setError("Password must be at least 6 characters"); return false; }
      if (form.password !== confirmPwd) { setError("Passwords do not match"); return false; }
      return true;
    }
    if (step === 2) {
      if (!form.dateOfBirth) { setError("Please enter your date of birth"); return false; }
      if (age !== null && age < 18) { setError("You must be 18 or older to join ConnectHub"); return false; }
      if (!form.gender) { setError("Please select your gender"); return false; }
      if (!form.lookingFor) { setError("Please select who you are looking for"); return false; }
      return true;
    }
    if (step === 3) {
      if (!form.securityQuestion || (isCustomQuestion && !customQuestion.trim())) { setError("Please provide a security question"); return false; }
      if (!form.securityAnswer.trim()) { setError("Please answer your security question"); return false; }
      return true;
    }
    return true;
  };

  const nextStep = () => { if (validateStep()) setStep(s => Math.min(s+1, 4)); };
  const prevStep = () => { setError(""); setStep(s => Math.max(s-1, 1)); };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { setError("Max 5MB"); return; }
    const reader = new FileReader();
    reader.onload = ev => setPhoto(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSignup = async () => {
    if (!validateStep()) return;
    setLoading(true); setError("");
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, profilePhoto: photo, interests: selectedInterests }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Registration failed"); setLoading(false); return; }

      // Upload photo if provided
      if (photo && data.userId) {
        try {
          await fetch("/api/profile/photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo }) });
        } catch {}
      }

      // Signup API already sets session cookie — go to welcome
      setStep(5);
      setLoading(false);
    } catch { setError("Network error. Please try again."); setLoading(false); }
  };

  const images = [
    "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1529634597503-139d3726fed5?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1545912452-8aea7e25a3d3?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=1200&q=80&fit=crop",
    "https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=80&fit=crop",
  ];

  const totalSteps = 4;

  return (
    <div className="min-h-screen flex font-sans">
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600;700&display=swap');
        .font-display { font-family: 'Playfair Display', serif; }
        .font-body { font-family: 'DM Sans', sans-serif; }
      `}</style>

      {/* Left — Image */}
      <div className="hidden lg:flex flex-1 relative overflow-hidden">
        <img src={images[step-1] || images[0]} alt="Love" className="absolute inset-0 w-full h-full object-cover transition-all duration-700" />
        <div className="absolute inset-0 bg-gradient-to-r from-rose-900/80 via-pink-900/50 to-purple-900/70" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize:"24px 24px" }} />

        <div className={"relative z-10 flex flex-col justify-between p-12 transition-all duration-700 " + (mounted ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8")}>
          <a href="/" className="flex items-center gap-3 group">
            <div className="w-12 h-12 bg-white/15 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-105 transition-transform">
              <span className="text-2xl">💕</span>
            </div>
            <span className="text-2xl font-extrabold text-white tracking-tight">ConnectHub</span>
          </a>

          <div className="max-w-md">
            <h1 className="text-5xl font-extrabold text-white leading-tight mb-6 font-display">
              {step===1 && <>Start Your<br/><span className="italic text-rose-200">Love Story</span></>}
              {step===2 && <>Tell Us About<br/><span className="italic text-rose-200">Yourself</span></>}
              {step===3 && <>Keep Your<br/><span className="italic text-rose-200">Account Safe</span></>}
              {step===4 && <>Almost<br/><span className="italic text-rose-200">There!</span></>}
              {step===5 && <>Welcome<br/><span className="italic text-rose-200">Aboard!</span></>}
            </h1>
            <p className="text-lg text-rose-100/80 leading-relaxed">
              {step===1 && "Create your free account and join thousands finding meaningful connections."}
              {step===2 && "Help us find your perfect match by sharing a few details about you."}
              {step===3 && "Set up a security question to protect your account."}
              {step===4 && "Add a photo and interests to get 3x more matches!"}
              {step===5 && "Your journey to finding love starts now!"}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {[{icon:Shield,text:"Verified Profiles"},{icon:Lock,text:"256-bit Encrypted"},{icon:Heart,text:"Real Connections"}].map((b,i) => (
              <div key={i} className="flex items-center gap-1.5 px-3 py-2 bg-white/10 backdrop-blur rounded-full border border-white/10">
                <b.icon className="w-3.5 h-3.5 text-white/70" />
                <span className="text-[10px] font-medium text-white/70">{b.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — Form */}
      <div className={"flex-1 flex flex-col bg-white transition-all duration-500 " + (mounted ? "opacity-100" : "opacity-0")}>
        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between p-4 border-b border-gray-100">
          <a href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-gradient-to-br from-rose-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md"><span className="text-lg">💕</span></div>
            <span className="text-lg font-extrabold bg-gradient-to-r from-rose-600 to-pink-600 bg-clip-text text-transparent">ConnectHub</span>
          </a>
          {step <= 4 && <span className="text-xs font-bold text-gray-400">Step {step} of {totalSteps}</span>}
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-12 overflow-y-auto">
          <div className="w-full max-w-md font-body">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-8">
              {[1,2,3,4].map(s => (
                <div key={s} className="flex-1 flex items-center gap-2">
                  <div className={"h-1.5 flex-1 rounded-full transition-all duration-500 " + (s <= step ? "bg-gradient-to-r from-rose-500 to-pink-500" : "bg-gray-100")} />
                </div>
              ))}
              {step <= 4 && <span className="text-xs font-bold text-gray-400 ml-2">{step}/{totalSteps}</span>}
            </div>

            {step === 5 && (
              <div className="text-center py-8">
                <div className="w-24 h-24 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-6">
                  <span className="text-5xl">🎉</span>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-2 font-display">Welcome to ConnectHub!</h2>
                <p className="text-gray-500 text-sm mb-6">Your account has been created successfully</p>
                
                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-bold text-amber-900 mb-2">🎁 Your Welcome Gifts:</p>
                  <p className="text-xs text-amber-700 mb-1">✅ 20 free coins added to your wallet</p>
                  <p className="text-xs text-amber-700 mb-1">✅ Welcome email sent to your inbox</p>
                  <p className="text-xs text-amber-700">✅ Profile ready for your first match!</p>
                </div>

                <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 mb-6 text-left">
                  <p className="text-sm font-bold text-rose-900 mb-2">📋 Recommended Next Steps:</p>
                  <p className="text-xs text-rose-700 mb-1">1. Complete your profile to attract more matches</p>
                  <p className="text-xs text-rose-700 mb-1">2. Verify your identity for a trusted badge ✓</p>
                  <p className="text-xs text-rose-700">3. Start swiping and find your perfect match!</p>
                </div>

                <a href="/dashboard" className="block w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-center hover:shadow-lg transition-all mb-3">
                  Start Exploring 💕
                </a>
                <a href="/dashboard/verify" className="block text-xs text-rose-500 hover:text-rose-700 font-medium underline underline-offset-4">
                  Verify your profile now →
                </a>
              </div>
            )}

                        {step < 5 && error && (
              <div className="mb-5 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 flex items-center gap-2">
                <span className="w-5 h-5 bg-red-100 rounded-full flex items-center justify-center text-red-500 text-xs flex-shrink-0">!</span>
                {error}
              </div>
            )}

            {/* STEP 1 — Account */}
            {step === 1 && (
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1 font-display">Create Account</h2>
                <p className="text-gray-400 text-sm mb-7">Join ConnectHub — it only takes a minute.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full Name</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><User className="w-4 h-4 text-gray-400" /></div>
                      <input className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email Address</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Mail className="w-4 h-4 text-gray-400" /></div>
                      <input type="email" className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Username</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><span className="text-gray-400 text-sm font-bold">@</span></div>
                      <input className="w-full pl-11 pr-20 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="username" value={form.username} onChange={e=>{set("username",e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""));checkUsername(e.target.value);}} />
                      {usernameStatus && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2">
                          {usernameStatus==="checking" && <div className="w-4 h-4 border-2 border-gray-300 border-t-rose-500 rounded-full animate-spin" />}
                          {usernameStatus==="available" && <Check className="w-4 h-4 text-emerald-500" />}
                          {usernameStatus==="taken" && <span className="text-xs text-red-500 font-semibold">Taken</span>}
                        </div>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                      <input type={showPwd?"text":"password"} className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Min 6 characters" value={form.password} onChange={e=>set("password",e.target.value)} />
                      <button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                      <input type={showConfirmPwd?"text":"password"} className="w-full pl-11 pr-12 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Confirm your password" value={confirmPwd} onChange={e=>setConfirmPwd(e.target.value)} />
                      <button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">{confirmPwd && form.password === confirmPwd ? <Check className="w-4 h-4 text-emerald-500" /> : showConfirmPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 2 — Personal */}
            {step === 2 && (
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1 font-display">About You</h2>
                <p className="text-gray-400 text-sm mb-7">Help us find your perfect match.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Date of Birth</label>
                    <div className="grid grid-cols-3 gap-2">
                      <select className="px-3 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={dobMonth} onChange={e=>{setDobMonth(e.target.value); updateDob(e.target.value, dobDay, dobYear);}}>
                        <option value="">Month</option>
                        {["January","February","March","April","May","June","July","August","September","October","November","December"].map((m,i)=><option key={m} value={String(i+1).padStart(2,"0")}>{m}</option>)}
                      </select>
                      <select className="px-3 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={dobDay} onChange={e=>{setDobDay(e.target.value); updateDob(dobMonth, e.target.value, dobYear);}}>
                        <option value="">Day</option>
                        {Array.from({length:31},(_,i)=>i+1).map(d=><option key={d} value={String(d).padStart(2,"0")}>{d}</option>)}
                      </select>
                      <select className="px-3 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={dobYear} onChange={e=>{setDobYear(e.target.value); updateDob(dobMonth, dobDay, e.target.value);}}>
                        <option value="">Year</option>
                        {Array.from({length:80},(_,i)=>new Date().getFullYear()-18-i).map(y=><option key={y} value={String(y)}>{y}</option>)}
                      </select>
                    </div>
                    {age !== null && <p className={"text-xs mt-1.5 font-medium " + (age>=18?"text-emerald-500":"text-red-500")}>{age >= 18 ? `You are ${age} years old ✓` : "You must be 18 or older"}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">I am a</label>
                      <select className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={form.gender} onChange={e=>set("gender",e.target.value)}>
                        <option value="">Select</option>
                        {GENDERS.map(g=><option key={g}>{g}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Looking for</label>
                      <select className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}>
                        <option value="">Select</option>
                        {LOOKING.map(l=><option key={l}>{l}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Country</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Globe className="w-4 h-4 text-gray-400" /></div>
                      <select className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all appearance-none" value={form.country} onChange={e=>set("country",e.target.value)}>
                        <option value="">Select your country</option>
                        {COUNTRIES.map(c=><option key={c}>{c}</option>)}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Bio <span className="text-gray-400 font-normal">(optional)</span></label>
                    <textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all resize-none h-24" placeholder="Tell people what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} />
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3 — Security */}
            {step === 3 && (
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1 font-display">Security</h2>
                <p className="text-gray-400 text-sm mb-7">Set up a security question to protect your account.</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Security Question</label>
                    <select className="w-full px-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" value={isCustomQuestion ? "custom" : form.securityQuestion} onChange={e=>{if(e.target.value === "custom"){setIsCustomQuestion(true);set("securityQuestion","");setCustomQuestion("");}else{setIsCustomQuestion(false);set("securityQuestion",e.target.value);setCustomQuestion("");}}}>
                      <option value="">Choose a question</option>
                      <option value="What is the name of your first pet?">What is the name of your first pet?</option>
                      <option value="What city were you born in?">What city were you born in?</option>
                      <option value="What is your mother's maiden name?">What is your mother&apos;s maiden name?</option>
                      <option value="What was the name of your first school?">What was the name of your first school?</option>
                      <option value="What is your favorite movie?">What is your favorite movie?</option>
                      <option value="What is your childhood nickname?">What is your childhood nickname?</option>
                      <option value="custom">✏️ Write my own question</option>
                    </select>
                  </div>

                  {isCustomQuestion && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Custom Question</label>
                      <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2"><HelpCircle className="w-4 h-4 text-gray-400" /></div>
                        <input className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Write your own security question..." value={customQuestion} onChange={e=>{setCustomQuestion(e.target.value); set("securityQuestion", e.target.value || "");}} />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Your Answer</label>
                    <div className="relative">
                      <div className="absolute left-4 top-1/2 -translate-y-1/2"><Lock className="w-4 h-4 text-gray-400" /></div>
                      <input className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-gray-200 bg-gray-50 text-sm outline-none focus:ring-2 focus:ring-rose-200 focus:border-rose-300 focus:bg-white transition-all" placeholder="Your answer (case-sensitive)" value={form.securityAnswer} onChange={e=>set("securityAnswer",e.target.value)} />
                    </div>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-blue-700 font-medium">🔒 This question will be used to recover your account if you forget your password. Choose something only you would know.</p>
                  </div>
                </div>
              </div>
            )}

            {step === 4 && (
              <div>
                <h2 className="text-2xl font-extrabold text-gray-900 mb-1 font-display">Final Touches</h2>
                <p className="text-gray-400 text-sm mb-7">Add a photo and interests to attract more matches!</p>

                {/* Photo upload */}
                <div className="flex items-center gap-5 mb-7">
                  <label className="cursor-pointer group">
                    <input type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
                    {photo ? (
                      <div className="relative">
                        <img src={photo} className="w-24 h-24 rounded-2xl object-cover shadow-lg border-2 border-rose-100" />
                        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                          <Camera className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-50 to-pink-50 border-2 border-dashed border-rose-200 flex flex-col items-center justify-center group-hover:border-rose-400 group-hover:bg-rose-50 transition-all">
                        <Camera className="w-6 h-6 text-rose-400 mb-1" />
                        <span className="text-[10px] font-semibold text-rose-400">Add Photo</span>
                      </div>
                    )}
                  </label>
                  <div>
                    <p className="text-sm font-bold text-gray-900">Profile Photo</p>
                    <p className="text-xs text-gray-400 mt-0.5">Profiles with photos get 10x more matches</p>
                    <p className="text-[10px] text-gray-300 mt-1">Max 5MB · JPG, PNG</p>
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-semibold text-gray-700">Pick Your Interests</label>
                    <span className={"text-xs font-bold " + (selectedInterests.length >= 5 ? "text-emerald-500" : "text-gray-400")}>{selectedInterests.length}/8</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map(t => {
                      const sel = selectedInterests.includes(t);
                      return (
                        <button key={t} onClick={()=>toggleInterest(t)} className={"flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 " + (sel?"bg-gradient-to-r from-rose-500 to-pink-500 text-white border-rose-500 shadow-md shadow-rose-200/30":"bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500")}>
                          <span>{INTEREST_ICONS[t]||"•"}</span> {t}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            {step < 5 && <div className="flex gap-3 mt-8">
              {step > 1 && (
                <button onClick={prevStep} className="px-5 py-3.5 border-2 border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-all flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Back
                </button>
              )}
              {step < 4 ? (
                <button onClick={nextStep} className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all flex items-center justify-center gap-2 active:scale-[0.98]">
                  Continue <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button onClick={handleSignup} disabled={loading} className="flex-1 py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-xl text-sm font-bold hover:shadow-xl hover:shadow-rose-200/50 transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]">
                  {loading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Sparkles className="w-4 h-4" /> Create Account</>}
                </button>
              )}
            </div>

            }

            {/* Sign in link */}
            {step < 5 && (
              <div className="text-center mt-6">
                <p className="text-sm text-gray-400">
                  Already have an account?{" "}
                  <a href="/login" className="text-rose-500 font-semibold hover:text-rose-600 transition-colors">Sign In</a>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
