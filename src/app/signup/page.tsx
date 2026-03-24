"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronDown, Shield, Globe } from "lucide-react";

const COUNTRIES = ["USA","UK","Canada","Nigeria","Ghana","Kenya","South Africa","Uganda","India","Pakistan","Australia","Germany","France","Brazil","Japan"];
const PHONE_CODES = [{c:"+1",f:"🇺🇸",n:"USA"},{c:"+1",f:"🇨🇦",n:"Canada"},{c:"+44",f:"🇬🇧",n:"UK"},{c:"+234",f:"🇳🇬",n:"Nigeria"},{c:"+233",f:"🇬🇭",n:"Ghana"},{c:"+254",f:"🇰🇪",n:"Kenya"},{c:"+27",f:"🇿🇦",n:"S.Africa"},{c:"+256",f:"🇺🇬",n:"Uganda"},{c:"+91",f:"🇮🇳",n:"India"},{c:"+92",f:"🇵🇰",n:"Pakistan"},{c:"+61",f:"🇦🇺",n:"Australia"},{c:"+49",f:"🇩🇪",n:"Germany"},{c:"+33",f:"🇫🇷",n:"France"},{c:"+55",f:"🇧🇷",n:"Brazil"},{c:"+81",f:"🇯🇵",n:"Japan"},{c:"+86",f:"🇨🇳",n:"China"},{c:"+82",f:"🇰🇷",n:"S.Korea"},{c:"+971",f:"🇦🇪",n:"UAE"},{c:"+966",f:"🇸🇦",n:"Saudi"},{c:"+90",f:"🇹🇷",n:"Turkey"},{c:"+52",f:"🇲🇽",n:"Mexico"},{c:"+62",f:"🇮🇩",n:"Indonesia"},{c:"+63",f:"🇵🇭",n:"Philippines"},{c:"+66",f:"🇹🇭",n:"Thailand"},{c:"+60",f:"🇲🇾",n:"Malaysia"}];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [phoneCode, setPhoneCode] = useState("+234");
  const [showCodes, setShowCodes] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [form, setForm] = useState({ name:"", email:"", username:"", password:"", phone:"", age:"", gender:"", lookingFor:"", country:"", securityQuestion:"What is your pet name?", securityAnswer:"" });

  const set = (k:string, v:string) => setForm(f=>({...f,[k]:v}));
  const filtered = PHONE_CODES.filter(p => !codeSearch || p.n.toLowerCase().includes(codeSearch.toLowerCase()) || p.c.includes(codeSearch));

  const handleSignup = async () => {
    setLoading(true); setError("");
    try {
      const fullPhone = phoneCode + form.phone;
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, phone:fullPhone}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      router.push("/login");
    } catch { setError("Network error"); setLoading(false); }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <Heart className="w-16 h-16 text-white/80 mx-auto mb-6 fill-white/30" />
          <h1 className="text-4xl font-bold text-white mb-4">Join ConnectHub</h1>
          <p className="text-pink-100 text-lg mb-8">Create your profile in 60 seconds and start meeting amazing people.</p>
          <div className="space-y-4">
            {[{icon:Shield,t:"100% Verified Profiles"},{icon:Heart,t:"AI-Powered Matching"},{icon:Globe,t:"150+ Countries"}].map(f => <div key={f.t} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"><f.icon className="w-6 h-6 text-white" /><span className="text-white font-medium">{f.t}</span></div>)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-6"><Heart className="w-6 h-6 text-rose-500 fill-rose-500" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>
          <div className="flex items-center gap-3 mb-6">{[1,2].map(s => <div key={s} className="flex items-center gap-2"><div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + (step>=s?"bg-rose-500 text-white":"bg-gray-100 text-gray-400")}>{s}</div>{s<2&&<div className={"w-12 h-0.5 " + (step>1?"bg-rose-500":"bg-gray-200")} />}</div>)}</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-1">{step===1?"Create your account":"Complete your profile"}</h2>
          <p className="text-gray-500 text-sm mb-6">Already have an account? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign in</Link></p>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          {step === 1 && (
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label><div className="relative"><input required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} /><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Username</label><div className="relative"><input required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Choose a username" value={form.username} onChange={e=>set("username",e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} /><span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Email</label><div className="relative"><input type="email" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} /><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Password</label><div className="relative"><input type={show?"text":"password"} required minLength={6} className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Min 6 characters" value={form.password} onChange={e=>set("password",e.target.value)} /><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <div className="flex gap-2">
                  <div className="relative"><button type="button" onClick={()=>setShowCodes(!showCodes)} className="flex items-center gap-1 px-3 py-3 border border-gray-200 rounded-xl text-sm min-w-[100px] hover:bg-gray-50"><span>{PHONE_CODES.find(p=>p.c===phoneCode)?.f||"🌍"}</span><span className="font-medium">{phoneCode}</span><ChevronDown className="w-3 h-3 text-gray-400" /></button>
                    {showCodes && (<><div className="fixed inset-0 z-40" onClick={()=>setShowCodes(false)} /><div className="absolute top-full left-0 mt-1 w-64 bg-white rounded-xl border shadow-2xl z-50 max-h-60 overflow-hidden"><div className="p-2 border-b"><input className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-rose-300" placeholder="Search country..." value={codeSearch} onChange={e=>setCodeSearch(e.target.value)} autoFocus /></div><div className="max-h-44 overflow-y-auto">{filtered.map((p,i)=><button key={i} type="button" onClick={()=>{setPhoneCode(p.c);setShowCodes(false);setCodeSearch("");}} className={"w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left " + (phoneCode===p.c?"bg-rose-50 text-rose-600":"hover:bg-gray-50")}><span>{p.f}</span><span className="flex-1">{p.n}</span><span className="text-gray-400">{p.c}</span></button>)}</div></div></>)}
                  </div>
                  <input type="tel" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Phone number" value={form.phone} onChange={e=>set("phone",e.target.value.replace(/[^0-9]/g,""))} />
                </div>
              </div>
              <button onClick={()=>{if(!form.name||!form.email||!form.password){setError("Fill all fields");return;}setError("");setStep(2);}} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" min="18" max="99" required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="18+" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Man</option><option>Woman</option><option>Non-binary</option></select></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Men</option><option>Women</option><option>Everyone</option></select></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
              </div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Question</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.securityQuestion} onChange={e=>set("securityQuestion",e.target.value)}><option>What is your pet name?</option><option>What city were you born in?</option><option>What is your mother's maiden name?</option><option>What was your first school?</option></select></div>
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Answer</label><input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Your answer" value={form.securityAnswer} onChange={e=>set("securityAnswer",e.target.value)} /></div>
              <div className="flex gap-3">
                <button onClick={()=>setStep(1)} className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                <button onClick={handleSignup} disabled={loading} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{loading?<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />:<>Create Account <ArrowRight className="w-4 h-4" /></>}</button>
              </div>
              <p className="text-center text-xs text-gray-400">By creating an account you agree to our <Link href="/terms" className="text-rose-500 hover:underline">Terms</Link> and <Link href="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link></p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
