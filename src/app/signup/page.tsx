"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Mail, Lock, Eye, EyeOff, ArrowRight, User, ChevronDown, Shield, Globe, Check, X as XIcon, Camera, Upload, AlertCircle } from "lucide-react";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Angola","Argentina","Australia","Austria","Bahamas","Bahrain","Bangladesh","Barbados","Belgium","Benin","Bolivia","Botswana","Brazil","Brunei","Bulgaria","Burkina Faso","Burundi","Cambodia","Cameroon","Canada","Chad","Chile","China","Colombia","Congo","Costa Rica","Croatia","Cuba","Cyprus","Czech Republic","Denmark","Dominican Republic","Ecuador","Egypt","El Salvador","Eritrea","Estonia","Ethiopia","Fiji","Finland","France","Gabon","Gambia","Germany","Ghana","Greece","Guatemala","Guinea","Haiti","Honduras","Hungary","Iceland","India","Indonesia","Iran","Iraq","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kenya","Kuwait","Laos","Latvia","Lebanon","Liberia","Libya","Lithuania","Luxembourg","Madagascar","Malawi","Malaysia","Mali","Malta","Mauritius","Mexico","Moldova","Mongolia","Morocco","Mozambique","Myanmar","Namibia","Nepal","Netherlands","New Zealand","Nicaragua","Niger","Nigeria","North Korea","Norway","Oman","Pakistan","Palestine","Panama","Papua New Guinea","Paraguay","Peru","Philippines","Poland","Portugal","Qatar","Romania","Russia","Rwanda","Saudi Arabia","Senegal","Serbia","Sierra Leone","Singapore","Slovakia","Slovenia","Somalia","South Africa","South Korea","South Sudan","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Syria","Taiwan","Tanzania","Thailand","Togo","Trinidad and Tobago","Tunisia","Turkey","UAE","Uganda","UK","Ukraine","Uruguay","USA","Uzbekistan","Venezuela","Vietnam","Yemen","Zambia","Zimbabwe"];

const PHONE_CODES = [
  {c:"+1",f:"🇺🇸",n:"USA"},{c:"+1",f:"🇨🇦",n:"Canada"},{c:"+7",f:"🇷🇺",n:"Russia"},{c:"+20",f:"🇪🇬",n:"Egypt"},{c:"+27",f:"🇿🇦",n:"South Africa"},{c:"+30",f:"🇬🇷",n:"Greece"},{c:"+31",f:"🇳🇱",n:"Netherlands"},{c:"+32",f:"🇧🇪",n:"Belgium"},{c:"+33",f:"🇫🇷",n:"France"},{c:"+34",f:"🇪🇸",n:"Spain"},{c:"+36",f:"🇭🇺",n:"Hungary"},{c:"+39",f:"🇮🇹",n:"Italy"},{c:"+40",f:"🇷🇴",n:"Romania"},{c:"+41",f:"🇨🇭",n:"Switzerland"},{c:"+43",f:"🇦🇹",n:"Austria"},{c:"+44",f:"🇬🇧",n:"UK"},{c:"+45",f:"🇩🇰",n:"Denmark"},{c:"+46",f:"🇸🇪",n:"Sweden"},{c:"+47",f:"🇳🇴",n:"Norway"},{c:"+48",f:"🇵🇱",n:"Poland"},{c:"+49",f:"🇩🇪",n:"Germany"},{c:"+51",f:"🇵🇪",n:"Peru"},{c:"+52",f:"🇲🇽",n:"Mexico"},{c:"+53",f:"🇨🇺",n:"Cuba"},{c:"+54",f:"🇦🇷",n:"Argentina"},{c:"+55",f:"🇧🇷",n:"Brazil"},{c:"+56",f:"🇨🇱",n:"Chile"},{c:"+57",f:"🇨🇴",n:"Colombia"},{c:"+58",f:"🇻🇪",n:"Venezuela"},{c:"+60",f:"🇲🇾",n:"Malaysia"},{c:"+61",f:"🇦🇺",n:"Australia"},{c:"+62",f:"🇮🇩",n:"Indonesia"},{c:"+63",f:"🇵🇭",n:"Philippines"},{c:"+64",f:"🇳🇿",n:"New Zealand"},{c:"+65",f:"🇸🇬",n:"Singapore"},{c:"+66",f:"🇹🇭",n:"Thailand"},{c:"+81",f:"🇯🇵",n:"Japan"},{c:"+82",f:"🇰🇷",n:"South Korea"},{c:"+84",f:"🇻🇳",n:"Vietnam"},{c:"+86",f:"🇨🇳",n:"China"},{c:"+90",f:"🇹🇷",n:"Turkey"},{c:"+91",f:"🇮🇳",n:"India"},{c:"+92",f:"🇵🇰",n:"Pakistan"},{c:"+93",f:"🇦🇫",n:"Afghanistan"},{c:"+94",f:"🇱🇰",n:"Sri Lanka"},{c:"+95",f:"🇲🇲",n:"Myanmar"},{c:"+211",f:"🇸🇸",n:"South Sudan"},{c:"+212",f:"🇲🇦",n:"Morocco"},{c:"+213",f:"🇩🇿",n:"Algeria"},{c:"+216",f:"🇹🇳",n:"Tunisia"},{c:"+218",f:"🇱🇾",n:"Libya"},{c:"+220",f:"🇬🇲",n:"Gambia"},{c:"+221",f:"🇸🇳",n:"Senegal"},{c:"+223",f:"🇲🇱",n:"Mali"},{c:"+224",f:"🇬🇳",n:"Guinea"},{c:"+225",f:"🇨🇮",n:"Ivory Coast"},{c:"+226",f:"🇧🇫",n:"Burkina Faso"},{c:"+227",f:"🇳🇪",n:"Niger"},{c:"+228",f:"🇹🇬",n:"Togo"},{c:"+229",f:"🇧🇯",n:"Benin"},{c:"+230",f:"🇲🇺",n:"Mauritius"},{c:"+231",f:"🇱🇷",n:"Liberia"},{c:"+232",f:"🇸🇱",n:"Sierra Leone"},{c:"+233",f:"🇬🇭",n:"Ghana"},{c:"+234",f:"🇳🇬",n:"Nigeria"},{c:"+235",f:"🇹🇩",n:"Chad"},{c:"+237",f:"🇨🇲",n:"Cameroon"},{c:"+249",f:"🇸🇩",n:"Sudan"},{c:"+250",f:"🇷🇼",n:"Rwanda"},{c:"+251",f:"🇪🇹",n:"Ethiopia"},{c:"+252",f:"🇸🇴",n:"Somalia"},{c:"+254",f:"🇰🇪",n:"Kenya"},{c:"+255",f:"🇹🇿",n:"Tanzania"},{c:"+256",f:"🇺🇬",n:"Uganda"},{c:"+258",f:"🇲🇿",n:"Mozambique"},{c:"+260",f:"🇿🇲",n:"Zambia"},{c:"+261",f:"🇲🇬",n:"Madagascar"},{c:"+263",f:"🇿🇼",n:"Zimbabwe"},{c:"+265",f:"🇲🇼",n:"Malawi"},{c:"+267",f:"🇧🇼",n:"Botswana"},{c:"+269",f:"🇰🇲",n:"Comoros"},{c:"+880",f:"🇧🇩",n:"Bangladesh"},{c:"+960",f:"🇲🇻",n:"Maldives"},{c:"+961",f:"🇱🇧",n:"Lebanon"},{c:"+962",f:"🇯🇴",n:"Jordan"},{c:"+963",f:"🇸🇾",n:"Syria"},{c:"+964",f:"🇮🇶",n:"Iraq"},{c:"+965",f:"🇰🇼",n:"Kuwait"},{c:"+966",f:"🇸🇦",n:"Saudi Arabia"},{c:"+967",f:"🇾🇪",n:"Yemen"},{c:"+968",f:"🇴🇲",n:"Oman"},{c:"+970",f:"🇵🇸",n:"Palestine"},{c:"+971",f:"🇦🇪",n:"UAE"},{c:"+972",f:"🇮🇱",n:"Israel"},{c:"+973",f:"🇧🇭",n:"Bahrain"},{c:"+974",f:"🇶🇦",n:"Qatar"},{c:"+975",f:"🇧🇹",n:"Bhutan"},{c:"+976",f:"🇲🇳",n:"Mongolia"},{c:"+977",f:"🇳🇵",n:"Nepal"},{c:"+992",f:"🇹🇯",n:"Tajikistan"},{c:"+993",f:"🇹🇲",n:"Turkmenistan"},{c:"+994",f:"🇦🇿",n:"Azerbaijan"},{c:"+995",f:"🇬🇪",n:"Georgia"},{c:"+998",f:"🇺🇿",n:"Uzbekistan"}
];

const SECURITY_QS = ["What is your pet's name?","What city were you born in?","What is your mother's maiden name?","What was your first school?","What is your favorite movie?","What is your childhood nickname?","What street did you grow up on?","What was your first car?","What is your favorite food?","What is your best friend's name?","[Custom] Type your own question"];

export default function SignupPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [step, setStep] = useState(1);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [phoneCode, setPhoneCode] = useState("+234");
  const [showCodes, setShowCodes] = useState(false);
  const [codeSearch, setCodeSearch] = useState("");
  const [usernameStatus, setUsernameStatus] = useState<"idle"|"checking"|"available"|"taken">("idle");
  const [pwdStrength, setPwdStrength] = useState<""|"weak"|"moderate"|"strong">("");
  const [customQ, setCustomQ] = useState("");
  const [profilePhoto, setProfilePhoto] = useState<string|null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [userId, setUserId] = useState("");
  const [form, setForm] = useState({ name:"",email:"",username:"",password:"",phone:"",age:"",gender:"",lookingFor:"",country:"",securityQuestion:"What is your pet's name?",securityAnswer:"" });

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));
  const filtered = PHONE_CODES.filter(p => !codeSearch || p.n.toLowerCase().includes(codeSearch.toLowerCase()) || p.c.includes(codeSearch));

  // Username availability check
  useEffect(() => {
    if (!form.username || form.username.length < 3) { setUsernameStatus("idle"); return; }
    setUsernameStatus("checking");
    const t = setTimeout(async () => {
      try {
        const res = await fetch("/api/auth/check-username?username=" + form.username);
        const d = await res.json();
        setUsernameStatus(d.available ? "available" : "taken");
      } catch { setUsernameStatus("idle"); }
    }, 500);
    return () => clearTimeout(t);
  }, [form.username]);

  // Password strength checker
  useEffect(() => {
    const p = form.password;
    if (!p) { setPwdStrength(""); return; }
    if (p.length < 6) { setPwdStrength("weak"); return; }
    let score = 0;
    if (p.length >= 8) score++;
    if (/[A-Z]/.test(p)) score++;
    if (/[0-9]/.test(p)) score++;
    if (/[^A-Za-z0-9]/.test(p)) score++;
    setPwdStrength(score >= 3 ? "strong" : score >= 2 ? "moderate" : "weak");
  }, [form.password]);

  const handleSignup = async () => {
    if (usernameStatus === "taken") { setError("Username already taken"); return; }
    setLoading(true); setError("");
    try {
      const fullPhone = phoneCode + form.phone;
      const sq = form.securityQuestion === "[Custom] Type your own question" ? customQ : form.securityQuestion;
      const res = await fetch("/api/auth/signup", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, phone:fullPhone, securityQuestion:sq}) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Signup failed"); setLoading(false); return; }
      setUserId(data.userId);
      setSuccess(data.message || "Account created successfully!");
      setStep(3); // Go to photo upload step
    } catch { setError("Network error"); }
    setLoading(false);
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    setUploadingPhoto(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      setProfilePhoto(ev.target?.result as string);
      // Login first to set session, then upload
      try {
        const loginRes = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ emailOrUsername:form.email, password:form.password }) });
        if (loginRes.ok) {
          await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ profilePhoto:ev.target?.result }) });
        }
      } catch {}
      setUploadingPhoto(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-purple-600 via-pink-500 to-rose-500 items-center justify-center p-12">
        <div className="max-w-md text-center">
          <img src="/logo.png" alt="ConnectHub" className="w-24 h-24 mx-auto mb-6 rounded-2xl" />
          <h1 className="text-4xl font-bold text-white mb-4">Join ConnectHub</h1>
          <p className="text-pink-100 text-lg mb-8">Create your profile in 60 seconds and start meeting amazing people.</p>
          <div className="space-y-4">
            {[{icon:Shield,t:"100% Verified Profiles"},{icon:Heart,t:"AI-Powered Matching"},{icon:Globe,t:"150+ Countries"}].map(f=><div key={f.t} className="flex items-center gap-3 bg-white/10 backdrop-blur-sm rounded-xl p-4"><f.icon className="w-6 h-6 text-white"/><span className="text-white font-medium">{f.t}</span></div>)}
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 bg-white overflow-y-auto">
        <div className="w-full max-w-md">
          <Link href="/" className="flex items-center gap-2 mb-6"><img src="/logo.png" alt="ConnectHub" className="w-8 h-8 rounded-lg" /><span className="text-xl font-bold bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">ConnectHub</span></Link>

          {/* Progress */}
          <div className="flex items-center gap-2 mb-6">{[1,2,3].map(s=><div key={s} className="flex items-center gap-2"><div className={"w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold " + (step>=s?"bg-rose-500 text-white":"bg-gray-100 text-gray-400")}>{step>s?<Check className="w-4 h-4"/>:s}</div>{s<3&&<div className={"w-8 h-0.5 " + (step>s?"bg-rose-500":"bg-gray-200")} />}</div>)}</div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}
          {success && step !== 3 && <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2"><Check className="w-4 h-4 flex-shrink-0" />{success}</div>}

          {/* STEP 1 */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Create your account</h2>
              <p className="text-gray-500 text-sm mb-6">Already have an account? <Link href="/login" className="text-rose-500 font-semibold hover:underline">Sign in</Link></p>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label><div className="relative"><input required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Your full name" value={form.name} onChange={e=>set("name",e.target.value)} /><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Username *</label>
                  <div className="relative">
                    <input required className={"w-full pl-10 pr-24 py-3 border rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 " + (usernameStatus==="taken"?"border-red-300":"usernameStatus"==="available"?"border-emerald-300":"border-gray-200")} placeholder="Choose a username" value={form.username} onChange={e=>set("username",e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))} />
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                    {usernameStatus !== "idle" && <span className={"absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold " + (usernameStatus==="checking"?"text-gray-400":usernameStatus==="available"?"text-emerald-500":"text-red-500")}>{usernameStatus==="checking"?"Checking...":usernameStatus==="available"?"✓ Available":"✗ Taken"}</span>}
                  </div>
                </div>

                <div><label className="block text-sm font-medium text-gray-700 mb-1">Email *</label><div className="relative"><input type="email" required className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="you@example.com" value={form.email} onChange={e=>set("email",e.target.value)} /><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /></div></div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="relative"><input type={show?"text":"password"} required minLength={6} className="w-full pl-10 pr-12 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Min 6 characters" value={form.password} onChange={e=>set("password",e.target.value)} /><Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><button type="button" onClick={()=>setShow(!show)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">{show?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}</button></div>
                  {pwdStrength && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">{[1,2,3].map(i=><div key={i} className={"flex-1 h-1.5 rounded-full " + (i<=((pwdStrength==="weak"?1:pwdStrength==="moderate"?2:3))?(pwdStrength==="weak"?"bg-red-400":pwdStrength==="moderate"?"bg-amber-400":"bg-emerald-400"):"bg-gray-200")} />)}</div>
                      <span className={"text-xs font-medium " + (pwdStrength==="weak"?"text-red-500":pwdStrength==="moderate"?"text-amber-500":"text-emerald-500")}>{pwdStrength==="weak"?"Weak — add uppercase, numbers, symbols":pwdStrength==="moderate"?"Moderate — getting better!":"Strong password ✓"}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative"><button type="button" onClick={()=>setShowCodes(!showCodes)} className="flex items-center gap-1 px-3 py-3 border border-gray-200 rounded-xl text-sm min-w-[100px] hover:bg-gray-50"><span>{PHONE_CODES.find(p=>p.c===phoneCode)?.f||"🌍"}</span><span className="font-medium">{phoneCode}</span><ChevronDown className="w-3 h-3 text-gray-400" /></button>
                      {showCodes && (<><div className="fixed inset-0 z-40" onClick={()=>setShowCodes(false)}/><div className="absolute top-full left-0 mt-1 w-72 bg-white rounded-xl border border-gray-200 shadow-2xl z-50 max-h-60 overflow-hidden"><div className="p-2 border-b"><input className="w-full px-3 py-2 rounded-lg border text-sm outline-none focus:ring-2 focus:ring-rose-300" placeholder="Search country..." value={codeSearch} onChange={e=>setCodeSearch(e.target.value)} autoFocus /></div><div className="max-h-44 overflow-y-auto">{filtered.map((p,i)=><button key={i} type="button" onClick={()=>{setPhoneCode(p.c);setShowCodes(false);setCodeSearch("");}} className={"w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left " + (phoneCode===p.c?"bg-rose-50 text-rose-600":"hover:bg-gray-50")}><span>{p.f}</span><span className="flex-1">{p.n}</span><span className="text-gray-400">{p.c}</span></button>)}</div></div></>)}
                    </div>
                    <input type="tel" className="flex-1 px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Phone number" value={form.phone} onChange={e=>set("phone",e.target.value.replace(/[^0-9]/g,""))} />
                  </div>
                </div>

                <button onClick={()=>{if(!form.name||!form.email||!form.password){setError("Fill all required fields");return;}if(form.password.length<6){setError("Password must be at least 6 characters");return;}if(usernameStatus==="taken"){setError("Choose a different username");return;}setError("");setStep(2);}} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg flex items-center justify-center gap-2">Continue <ArrowRight className="w-4 h-4" /></button>
              </div>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">Complete your profile</h2>
              <p className="text-gray-500 text-sm mb-6">Tell us about yourself to get better matches</p>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Age *</label><input type="number" min="18" max="99" required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="18+" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Man</option><option>Woman</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Looking For *</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Men</option><option>Women</option><option>Everyone</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Country *</label><select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Security Question *</label>
                  <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 mb-2" value={form.securityQuestion} onChange={e=>set("securityQuestion",e.target.value)}>
                    {SECURITY_QS.map(q=><option key={q} value={q}>{q}</option>)}
                  </select>
                  {form.securityQuestion === "[Custom] Type your own question" && (
                    <input className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300 mb-2" placeholder="Type your custom security question" value={customQ} onChange={e=>setCustomQ(e.target.value)} />
                  )}
                </div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Security Answer *</label><input required className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none text-sm focus:ring-2 focus:ring-rose-300" placeholder="Your answer (remember this!)" value={form.securityAnswer} onChange={e=>set("securityAnswer",e.target.value)} /></div>
                <div className="flex gap-3">
                  <button onClick={()=>setStep(1)} className="flex-1 py-3.5 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50">Back</button>
                  <button onClick={handleSignup} disabled={loading||!form.age||!form.gender||!form.securityAnswer} className="flex-[2] py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">{loading?<div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"/>:<>Create Account <ArrowRight className="w-4 h-4"/></>}</button>
                </div>
                <p className="text-center text-xs text-gray-400">By creating an account you agree to our <Link href="/terms" className="text-rose-500 hover:underline">Terms</Link> and <Link href="/privacy" className="text-rose-500 hover:underline">Privacy Policy</Link></p>
              </div>
            </div>
          )}

          {/* STEP 3 — Profile Photo */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8 text-emerald-500" /></div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Account Created!</h2>
              <p className="text-gray-500 text-sm mb-2">{success}</p>
              <p className="text-rose-500 text-sm font-semibold mb-8">🎁 You received 50 welcome coins!</p>

              <div className="bg-gray-50 rounded-2xl p-8 mb-6">
                <h3 className="font-bold text-gray-900 mb-4">Add a Profile Photo</h3>
                <p className="text-xs text-gray-500 mb-4">Profiles with photos get 10x more matches!</p>
                <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                {profilePhoto ? (
                  <div className="relative inline-block">
                    <img src={profilePhoto} className="w-32 h-32 rounded-2xl object-cover mx-auto border-4 border-rose-200" />
                    <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center"><Check className="w-4 h-4 text-white" /></div>
                  </div>
                ) : (
                  <button onClick={()=>fileRef.current?.click()} disabled={uploadingPhoto} className="w-32 h-32 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center mx-auto hover:border-rose-300 hover:bg-rose-50 transition-all">
                    {uploadingPhoto ? <div className="w-8 h-8 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /> : <><Camera className="w-8 h-8 text-gray-400 mb-1" /><span className="text-xs text-gray-400">Upload Photo</span></>}
                  </button>
                )}
              </div>

              <div className="space-y-3">
                <Link href="/login" className="block w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl font-semibold hover:shadow-lg text-center">{profilePhoto ? "Continue to Login" : "Skip & Login"}</Link>
                {!profilePhoto && <button onClick={()=>fileRef.current?.click()} className="w-full py-3 border-2 border-gray-200 rounded-xl font-semibold text-gray-600 hover:bg-gray-50 flex items-center justify-center gap-2"><Upload className="w-4 h-4" /> Upload Photo First</button>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
