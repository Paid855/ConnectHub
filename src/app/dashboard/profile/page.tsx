"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Shield, Camera, Check, Heart, Edit3, Calendar, User, Mail, Crown, Settings, Globe, Gem, Phone, MessageCircle, Rss, Tag, X, AlertTriangle, ChevronDown, Eye, Lock, Coins, Sparkles, MapPin } from "lucide-react";
import Link from "next/link";
import PhotoGallery from "@/components/PhotoGallery";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];
const ALL_INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Swimming","Football","Basketball","Fashion","Coffee","Wine","Dogs","Cats","Gardening","Meditation","Writing","Singing","Comedy","Cycling","Running","Beach","Mountains","Camping","Foodie","Netflix","Anime","Tech","Startups","Volunteering"];
const PHONE_CODES = [{code:"+1",flag:"🇺🇸",name:"USA"},{code:"+1",flag:"🇨🇦",name:"Canada"},{code:"+44",flag:"🇬🇧",name:"UK"},{code:"+234",flag:"🇳🇬",name:"Nigeria"},{code:"+233",flag:"🇬🇭",name:"Ghana"},{code:"+254",flag:"🇰🇪",name:"Kenya"},{code:"+27",flag:"🇿🇦",name:"South Africa"},{code:"+256",flag:"🇺🇬",name:"Uganda"},{code:"+255",flag:"🇹🇿",name:"Tanzania"},{code:"+91",flag:"🇮🇳",name:"India"},{code:"+92",flag:"🇵🇰",name:"Pakistan"},{code:"+880",flag:"🇧🇩",name:"Bangladesh"},{code:"+61",flag:"🇦🇺",name:"Australia"},{code:"+86",flag:"🇨🇳",name:"China"},{code:"+81",flag:"🇯🇵",name:"Japan"},{code:"+82",flag:"🇰🇷",name:"S.Korea"},{code:"+60",flag:"🇲🇾",name:"Malaysia"},{code:"+65",flag:"🇸🇬",name:"Singapore"},{code:"+66",flag:"🇹🇭",name:"Thailand"},{code:"+63",flag:"🇵🇭",name:"Philippines"},{code:"+62",flag:"🇮🇩",name:"Indonesia"},{code:"+49",flag:"🇩🇪",name:"Germany"},{code:"+33",flag:"🇫🇷",name:"France"},{code:"+39",flag:"🇮🇹",name:"Italy"},{code:"+34",flag:"🇪🇸",name:"Spain"},{code:"+55",flag:"🇧🇷",name:"Brazil"},{code:"+52",flag:"🇲🇽",name:"Mexico"},{code:"+20",flag:"🇪🇬",name:"Egypt"},{code:"+212",flag:"🇲🇦",name:"Morocco"},{code:"+966",flag:"🇸🇦",name:"Saudi Arabia"},{code:"+971",flag:"🇦🇪",name:"UAE"},{code:"+90",flag:"🇹🇷",name:"Turkey"},{code:"+7",flag:"🇷🇺",name:"Russia"},{code:"+380",flag:"🇺🇦",name:"Ukraine"}];

export default function ProfilePage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name:"",bio:"",age:"",gender:"",lookingFor:"",country:"",phone:"" });
  const [phoneCode, setPhoneCode] = useState("+234");
  const [phoneNum, setPhoneNum] = useState("");
  const [showPhoneCodes, setShowPhoneCodes] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [interests, setInterests] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState("about");
  const [postCount, setPostCount] = useState(0);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user) {
      setForm({ name:user.name||"",bio:user.bio||"",age:user.age?.toString()||"",gender:user.gender||"",lookingFor:user.lookingFor||"",country:user.country||"",phone:user.phone||"" });
      setInterests(user.interests||[]);
      // Parse phone code from stored phone
      const ph = user.phone || "";
      const match = PHONE_CODES.find(c => ph.startsWith(c.code));
      if (match) { setPhoneCode(match.code); setPhoneNum(ph.replace(match.code, "")); }
      else { setPhoneNum(ph); }
    }
    fetch("/api/feed").then(r=>r.json()).then(d=>{ if(d.feed) setPostCount(d.feed.filter((p:any)=>p.userId===user?.id).length); }).catch(()=>{});
  }, [user]);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));
  const toggleInterest = (tag:string) => setInterests(p => p.includes(tag)?p.filter(t=>t!==tag):p.length<10?[...p,tag]:p);
  const filteredPhoneCodes = PHONE_CODES.filter(c => !phoneSearch || c.name.toLowerCase().includes(phoneSearch.toLowerCase()) || c.code.includes(phoneSearch));

  const save = async () => {
    setSaving(true);
    const fullPhone = phoneCode + phoneNum;
    try {
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, phone:fullPhone, interests}) });
      if (res.ok) { setSuccess("Profile updated!"); setEditing(false); reload(); setTimeout(()=>setSuccess(""),3000); }
    } catch {} finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size>5*1024*1024) { alert("Max 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ profilePhoto:ev.target?.result }) });
      if (res.ok) { setSuccess("Photo uploaded!"); reload(); setTimeout(()=>setSuccess(""),3000); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE MY ACCOUNT") { setDeleteError("Type DELETE MY ACCOUNT exactly"); return; }
    if (!deletePassword) { setDeleteError("Enter your password"); return; }
    setDeleteError(""); setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password:deletePassword, confirm:deleteConfirm }) });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error); setDeleting(false); return; }
      window.location.href = "/";
    } catch { setDeleteError("Network error"); setDeleting(false); }
  };

  if (!user) return null;
  const tierColor = user.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":user.tier==="premium"?"from-rose-500 via-pink-500 to-purple-500":"from-rose-400 via-pink-400 to-purple-400";

  return (
    <div className="max-w-3xl mx-auto">
      {success && <div className={"border px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2 " + (dc?"bg-emerald-500/10 border-emerald-500/30 text-emerald-400":"bg-emerald-50 border-emerald-200 text-emerald-700")}><Check className="w-4 h-4" /> {success}</div>}

      {/* Hero */}
      <div className={"relative rounded-3xl overflow-hidden mb-6 shadow-lg border " + (dc?"border-gray-700":"border-gray-100")}>
        <div className={"h-44 bg-gradient-to-br " + tierColor + " relative"}>
          <div className="absolute inset-0 bg-black/10" /><div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" /><div className="absolute -top-5 -left-5 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-5 right-5"><button onClick={()=>setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold hover:bg-white/30 border border-white/20"><Edit3 className="w-4 h-4" /> {editing?"Cancel":"Edit Profile"}</button></div>
        </div>
        <div className={(dc?"bg-gray-800":"bg-white") + " px-6 pb-8 pt-20 relative"}>
          <div className="absolute -top-16 left-6">
            <div className="relative group"><input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className={"ring-4 rounded-2xl shadow-xl " + (dc?"ring-gray-800":"ring-white")}>{user.profilePhoto ? <img src={user.profilePhoto} className="w-28 h-28 rounded-2xl object-cover" /> : <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-4xl font-bold">{user.name[0]}</div>}</div>
              <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"><div className="opacity-0 group-hover:opacity-100 text-center"><Camera className="w-6 h-6 text-white mx-auto" /><span className="text-white text-xs font-bold mt-1 block">{uploading?"...":"Change"}</span></div></button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>{user.name}</h1>
              {user.verified && <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />}
              {user.tier==="gold" && <Crown className="w-5 h-5 text-amber-500" />}
              {user.tier==="premium" && <Gem className="w-5 h-5 text-rose-500" />}
            </div>
            {user.username && <p className={"text-sm mb-1 " + (dc?"text-gray-500":"text-gray-400")}>@{user.username}</p>}
            {user.bio && <p className={"text-sm mb-3 max-w-md leading-relaxed " + (dc?"text-gray-300":"text-gray-600")}>{user.bio}</p>}
            {interests.length > 0 && <div className="flex flex-wrap gap-1.5 mb-3">{interests.map(t => <span key={t} className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500 border border-rose-100")}>{t}</span>)}</div>}
            <div className={"flex flex-wrap items-center gap-x-4 gap-y-1 text-xs " + (dc?"text-gray-500":"text-gray-500")}>
              {user.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {user.country}</span>}
              {user.gender && <span>{user.gender}{user.age ? ", "+user.age : ""}</span>}
              {user.lookingFor && <span>Looking for {user.lookingFor}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
            </div>
          </div>
          <div className={"grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-5 pt-5 border-t " + (dc?"border-gray-700":"border-gray-100")}>
            <div className="text-center"><p className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{postCount}</p><p className="text-[11px] text-gray-500">Posts</p></div>
            <div className="text-center"><p className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{interests.length}</p><p className="text-[11px] text-gray-500">Interests</p></div>
            <div className="text-center"><div className="flex justify-center"><TierBadge tier={user.tier} /></div><p className="text-[11px] text-gray-500 mt-1">Plan</p></div>
            <div className="text-center"><div className="flex items-center justify-center gap-1"><Coins className="w-4 h-4 text-amber-500" /><span className={"text-xl font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user.coins?.toLocaleString()||0}</span></div><p className="text-[11px] text-gray-500">Coins</p></div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className={"flex gap-1 mb-6 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[{k:"about",l:"About",icon:User},{k:"interests",l:"Interests",icon:Tag},{k:"settings",l:"Settings",icon:Settings}].map(t => (
          <button key={t.k} onClick={()=>setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab===t.k?(dc?"bg-gray-700 text-white shadow":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}><t.icon className="w-4 h-4" />{t.l}</button>
        ))}
      </div>

      {/* ABOUT */}
      {activeTab === "about" && (
        <>
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6 mb-5"}>
            <h3 className={"text-xs font-bold uppercase tracking-wider mb-3 " + (dc?"text-gray-500":"text-gray-400")}>About Me</h3>
            <p className={(dc?"text-gray-300":"text-gray-700") + " leading-relaxed"}>{user.bio || "No bio yet. Click Edit Profile to tell people about yourself!"}</p>
          </div>

          {/* Quick stats cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
            {[
              { icon:Mail, label:"Email", value:user.email, color:"text-blue-500", bg:dc?"bg-blue-500/10":"bg-blue-50" },
              { icon:Phone, label:"Phone", value:user.phone||"Not set", color:"text-emerald-500", bg:dc?"bg-emerald-500/10":"bg-emerald-50" },
              { icon:Globe, label:"Country", value:user.country||"Not set", color:"text-violet-500", bg:dc?"bg-violet-500/10":"bg-violet-50" },
              { icon:Eye, label:"Looking For", value:user.lookingFor||"Not set", color:"text-rose-500", bg:dc?"bg-rose-500/10":"bg-rose-50" },
            ].map((item,i) => (
              <div key={i} className={"rounded-xl p-4 " + item.bg}>
                <div className="flex items-center gap-2 mb-1"><item.icon className={"w-4 h-4 " + item.color} /><span className={"text-xs font-semibold " + (dc?"text-gray-400":"text-gray-500")}>{item.label}</span></div>
                <p className={"text-sm font-medium truncate " + (dc?"text-white":"text-gray-900")}>{item.value}</p>
              </div>
            ))}
          </div>

          {editing && (
            <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6 mb-5"}>
              <h3 className={"font-bold mb-5 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Edit3 className="w-5 h-5 text-rose-500" /> Edit Profile</h3>
              <div className="space-y-4">
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Name</label><input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} value={form.name} onChange={e=>set("name",e.target.value)} /></div>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Bio</label><textarea className={"w-full px-4 py-3 rounded-xl border outline-none text-sm h-24 resize-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Tell people what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} /></div>

                {/* Phone with country code */}
                <div>
                  <label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button type="button" onClick={()=>setShowPhoneCodes(!showPhoneCodes)} className={"flex items-center gap-1.5 px-3 py-3 rounded-xl border text-sm min-w-[110px] " + (dc?"bg-gray-700 border-gray-600 text-white hover:bg-gray-600":"bg-white border-gray-200 hover:bg-gray-50")}>
                        <span className="text-lg">{PHONE_CODES.find(c=>c.code===phoneCode)?.flag||"🌍"}</span>
                        <span className="font-medium">{phoneCode}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                      {showPhoneCodes && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={()=>setShowPhoneCodes(false)} />
                          <div className={"absolute top-full left-0 mt-1 w-72 rounded-xl border shadow-2xl z-50 max-h-64 overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                            <div className="p-2 border-b border-gray-100 dark:border-gray-700"><input className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Search country..." value={phoneSearch} onChange={e=>setPhoneSearch(e.target.value)} autoFocus /></div>
                            <div className="max-h-48 overflow-y-auto">{filteredPhoneCodes.map((c,i)=>(
                              <button key={i} type="button" onClick={()=>{setPhoneCode(c.code);setShowPhoneCodes(false);setPhoneSearch("");}} className={"w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left " + (phoneCode===c.code?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-rose-50"))}><span className="text-lg">{c.flag}</span><span className="flex-1 font-medium">{c.name}</span><span className="text-gray-400">{c.code}</span></button>
                            ))}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <input type="tel" className={"flex-1 px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Phone number" value={phoneNum} onChange={e=>setPhoneNum(e.target.value.replace(/[^0-9]/g,""))} />
                  </div>
                  {phoneNum && <p className={"text-xs mt-1 " + (dc?"text-gray-500":"text-gray-400")}>Full: {phoneCode}{phoneNum}</p>}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Age</label><input type="number" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Gender</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Looking For</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Country</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={()=>setEditing(false)} className={"px-5 py-2.5 border-2 rounded-full text-sm font-semibold " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-60">{saving?"Saving...":"Save Changes"}</button>
              </div>
            </div>
          )}
        </>
      )}

            {/* PHOTOS */}
      {activeTab === "about" && user && (
        <div className="mb-5"><PhotoGallery userId={user.id} editable={true} dark={dc} /></div>
      )}

      {/* INTERESTS */}
      {activeTab === "interests" && (
        <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6"}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>My Interests</h3><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Select up to 10 interests — visible to everyone</p></div>
            <span className="text-xs font-bold text-rose-500">{interests.length}/10</span>
          </div>
          {interests.length > 0 && <div className="flex flex-wrap gap-2 mb-6">{interests.map(t=><button key={t} onClick={()=>toggleInterest(t)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-xs font-semibold hover:shadow-lg">{t} <X className="w-3 h-3"/></button>)}</div>}
          <h4 className={"text-sm font-semibold mb-3 " + (dc?"text-gray-400":"text-gray-600")}>Choose your interests:</h4>
          <div className="flex flex-wrap gap-2 mb-6">{ALL_INTERESTS.map(t=>{const sel=interests.includes(t);return <button key={t} onClick={()=>toggleInterest(t)} className={"px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " + (sel?"bg-rose-500 text-white border-rose-500":(dc?"bg-gray-700 text-gray-300 border-gray-600 hover:border-rose-400":"bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"))}>{t}</button>;})}</div>
          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-60">{saving?"Saving...":"Save Interests"}</button>
        </div>
      )}

      {/* SETTINGS */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          {/* Account info card */}
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6"}>
            <h3 className={"font-bold mb-4 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Settings className="w-5 h-5 text-gray-400" /> Account Information</h3>
            <div className="space-y-3 text-sm">
              {[
                { label:"Email", value:user.email, icon:Mail },
                { label:"Username", value:user.username ? "@"+user.username : "Not set", icon:User },
                { label:"Phone", value:user.phone||"Not set", icon:Phone },
                { label:"Plan", value:null, icon:Crown, custom:<TierBadge tier={user.tier}/> },
                { label:"Coins", value:null, icon:Coins, custom:<span className="flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500"/><span className={"font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user.coins?.toLocaleString()||0}</span></span> },
                { label:"Verification", value:null, icon:Shield, custom:<span className={"font-medium " + (user.verified?"text-emerald-500":"text-gray-500")}>{user.verified?"Verified":user.verificationStatus||"Not verified"}</span> },
                { label:"Joined", value:new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}), icon:Calendar },
              ].map((item,i) => (
                <div key={i} className={"flex items-center justify-between py-3 border-b last:border-0 " + (dc?"border-gray-700":"border-gray-50")}>
                  <span className={"flex items-center gap-2 " + (dc?"text-gray-400":"text-gray-500")}><item.icon className="w-4 h-4" /> {item.label}</span>
                  {item.custom || <span className={"font-medium " + (dc?"text-white":"text-gray-900")}>{item.value}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-2 gap-3">
            <Link href="/dashboard/verify" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-blue-500/10 border-blue-500/30":"bg-blue-50 border-blue-200")}>
              <Shield className={"w-8 h-8 mb-2 " + (dc?"text-blue-400":"text-blue-500")} />
              <h3 className={"font-bold text-sm " + (dc?"text-white":"text-blue-900")}>Get Verified</h3>
              <p className={"text-xs " + (dc?"text-blue-300":"text-blue-600")}>Face scan + ID</p>
            </Link>
            <Link href="/dashboard/coins" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-amber-500/10 border-amber-500/30":"bg-amber-50 border-amber-200")}>
              <Crown className={"w-8 h-8 mb-2 " + (dc?"text-amber-400":"text-amber-600")} />
              <h3 className={"font-bold text-sm " + (dc?"text-white":"text-amber-900")}>Upgrade Plan</h3>
              <p className={"text-xs " + (dc?"text-amber-300":"text-amber-700")}>Buy coins & upgrade</p>
            </Link>
            <Link href="/dashboard/views" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-violet-500/10 border-violet-500/30":"bg-violet-50 border-violet-200")}>
              <Eye className={"w-8 h-8 mb-2 " + (dc?"text-violet-400":"text-violet-500")} />
              <h3 className={"font-bold text-sm " + (dc?"text-white":"text-violet-900")}>Who Viewed Me</h3>
              <p className={"text-xs " + (dc?"text-violet-300":"text-violet-600")}>Premium feature</p>
            </Link>
            <Link href="/dashboard/leaderboard" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-rose-500/10 border-rose-500/30":"bg-rose-50 border-rose-200")}>
              <Sparkles className={"w-8 h-8 mb-2 " + (dc?"text-rose-400":"text-rose-500")} />
              <h3 className={"font-bold text-sm " + (dc?"text-white":"text-rose-900")}>Leaderboard</h3>
              <p className={"text-xs " + (dc?"text-rose-300":"text-rose-600")}>Top gifters & popular</p>
            </Link>
          </div>

          {/* Delete Account */}
          <div className={(dc?"bg-red-500/10 border-red-500/20":"bg-red-50 border-red-200") + " rounded-2xl border p-5"}>
            <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Delete Account</h3>
            <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-600")}>Permanently delete your account and all data. <span className="font-bold text-red-500">You will NOT be able to create a new account with the same email, phone, or username for 30 days.</span></p>
            {!showDelete ? (
              <button onClick={()=>setShowDelete(true)} className="px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600">Delete My Account</button>
            ) : (
              <div className={"rounded-xl border p-4 space-y-3 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                <p className="text-sm font-semibold text-red-500">This action is permanent and cannot be undone!</p>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Enter your password</label><input type="password" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} placeholder="Your current password" /></div>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Type <span className="font-bold text-red-500">DELETE MY ACCOUNT</span></label><input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" /></div>
                {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={()=>{setShowDelete(false);setDeletePassword("");setDeleteConfirm("");setDeleteError("");}} className={"flex-1 py-2.5 rounded-full text-sm font-semibold border " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleting} className="flex-[2] py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 disabled:opacity-60">{deleting?"Deleting...":"Delete Forever"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
