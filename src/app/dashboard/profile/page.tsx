"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Shield, Camera, Check, Heart, Edit3, Calendar, User, Mail, Crown, Settings, Globe, Gem, Phone, MessageCircle, Rss, Tag, X, AlertTriangle, ChevronDown, Eye, Lock, Coins, Sparkles, MapPin, Star, Zap, Image as ImageIcon, ExternalLink, Award, TrendingUp } from "lucide-react";
import Link from "next/link";
import PhotoGallery from "@/components/PhotoGallery";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];
const ALL_INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Swimming","Football","Basketball","Fashion","Coffee","Wine","Dogs","Cats","Gardening","Meditation","Writing","Singing","Comedy","Cycling","Running","Beach","Mountains","Camping","Foodie","Netflix","Anime","Tech","Startups","Volunteering"];
const INTEREST_ICONS: Record<string,string> = {Travel:"✈️",Music:"🎵",Cooking:"🍳",Fitness:"💪",Photography:"📸",Art:"🎨",Reading:"📚",Movies:"🎬",Gaming:"🎮",Dancing:"💃",Yoga:"🧘",Hiking:"🥾",Swimming:"🏊",Football:"⚽",Basketball:"🏀",Fashion:"👗",Coffee:"☕",Wine:"🍷",Dogs:"🐕",Cats:"🐱",Gardening:"🌱",Meditation:"🧘",Writing:"✍️",Singing:"🎤",Comedy:"😂",Cycling:"🚴",Running:"🏃",Beach:"🏖️",Mountains:"⛰️",Camping:"⛺",Foodie:"🍕",Netflix:"📺",Anime:"🎌",Tech:"💻",Startups:"🚀",Volunteering:"🤝"};
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
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [friendCount, setFriendCount] = useState(0);

  useEffect(() => {
    if (user) {
      setForm({ name:user.name||"",bio:user.bio||"",age:user.age?.toString()||"",gender:user.gender||"",lookingFor:user.lookingFor||"",country:user.country||"",phone:user.phone||"" });
      setInterests(user.interests||[]);
      const ph = user.phone || "";
      const match = PHONE_CODES.find(c => ph.startsWith(c.code));
      if (match) { setPhoneCode(match.code); setPhoneNum(ph.replace(match.code, "")); }
      else { setPhoneNum(ph); }
    }
    fetch("/api/feed").then(r=>r.json()).then(d=>{ const mine = (d.feed||[]).filter((p:any)=>p.userId===user?.id); setPostCount(mine.length); setMyPosts(mine.slice(0,10)); }).catch(()=>{});
    fetch("/api/friends").then(r=>r.json()).then(d=>{ setFriendCount((d.friends||[]).length); }).catch(()=>{});
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

  const completionPercent = () => {
    let done = 0, total = 7;
    if (user?.name) done++;
    if (user?.bio) done++;
    if (user?.profilePhoto) done++;
    if (user?.age) done++;
    if (user?.gender) done++;
    if (user?.country) done++;
    if ((user?.interests||[]).length > 0) done++;
    return Math.round((done/total)*100);
  };

  if (!user) return null;
  const completion = completionPercent();
  const tierColor = user.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":user.tier==="premium"?"from-rose-500 via-pink-500 to-purple-600":user.tier==="plus"?"from-rose-400 via-pink-500 to-violet-500":"from-rose-400 via-pink-400 to-purple-400";
  const tierName = user.tier==="gold"?"Gold":user.tier==="premium"?"Premium":user.tier==="plus"?"Plus":"Free";

  return (
    <div className="max-w-3xl mx-auto pb-10">
      {/* Success toast */}
      {success && (
        <div className={"fixed top-20 left-1/2 -translate-x-1/2 z-50 px-6 py-3 rounded-full text-sm font-semibold shadow-xl flex items-center gap-2 " + (dc?"bg-emerald-500 text-white":"bg-emerald-500 text-white")}>
          <Check className="w-4 h-4" /> {success}
        </div>
      )}

      {/* ═══ HERO SECTION ═══ */}
      <div className={"relative rounded-3xl overflow-hidden mb-6 " + (dc?"shadow-2xl shadow-black/50":"shadow-xl shadow-rose-100/50")}>
        {/* Banner */}
        <div className={"relative h-52 sm:h-60 bg-gradient-to-br " + tierColor}>
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage:"radial-gradient(circle at 2px 2px, white 1px, transparent 0)", backgroundSize:"20px 20px" }} />
          <div className="absolute -bottom-16 -right-16 w-56 h-56 bg-white/10 rounded-full blur-xl" />
          <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-xl" />
          <div className="absolute top-10 right-10 w-20 h-20 bg-white/10 rounded-full blur-lg" />

          {/* Edit button */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={()=>setEditing(!editing)} className="flex items-center gap-2 px-4 py-2.5 bg-white/15 backdrop-blur-xl text-white rounded-xl text-sm font-semibold hover:bg-white/25 border border-white/20 transition-all active:scale-95">
              <Edit3 className="w-4 h-4" /> {editing?"Cancel":"Edit Profile"}
            </button>
          </div>

          {/* Tier badge on banner */}
          <div className="absolute top-4 left-4">
            <div className={"px-4 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 backdrop-blur-xl border border-white/20 " + (user.tier==="gold"?"bg-amber-500/30 text-amber-100":user.tier==="premium"?"bg-purple-500/30 text-purple-100":"bg-white/15 text-white/80")}>
              {user.tier==="gold"?<Crown className="w-3.5 h-3.5"/>:user.tier==="premium"?<Gem className="w-3.5 h-3.5"/>:<Star className="w-3.5 h-3.5"/>}
              {tierName} Member
            </div>
          </div>
        </div>

        {/* Profile info area */}
        <div className={(dc?"bg-gray-800":"bg-white") + " px-5 sm:px-8 pb-8 pt-20 relative"}>
          {/* Profile photo */}
          <div className="absolute -top-16 left-5 sm:left-8">
            <div className="relative group">
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className={"p-1 rounded-2xl bg-gradient-to-br " + tierColor + " shadow-xl"}>
                <div className={"rounded-[14px] overflow-hidden " + (dc?"ring-4 ring-gray-800":"ring-4 ring-white")}>
                  {user.profilePhoto ? (
                    <img src={user.profilePhoto} className="w-28 h-28 sm:w-32 sm:h-32 object-cover" />
                  ) : (
                    <div className="w-28 h-28 sm:w-32 sm:h-32 bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center text-rose-500 text-4xl font-bold">{user.name?.[0]}</div>
                  )}
                </div>
              </div>
              <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 text-center transition-opacity">
                  <Camera className="w-6 h-6 text-white mx-auto" />
                  <span className="text-white text-[10px] font-bold mt-1 block">{uploading?"Uploading...":"Change Photo"}</span>
                </div>
              </button>
              {/* Online indicator */}
              <div className={"absolute bottom-1 right-1 w-5 h-5 rounded-full border-[3px] bg-emerald-400 " + (dc?"border-gray-800":"border-white")} />
            </div>
          </div>

          {/* Name and details */}
          <div className="sm:pl-36">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <h1 className={"text-2xl sm:text-3xl font-extrabold tracking-tight " + (dc?"text-white":"text-gray-900")}>{user.name}</h1>
              {user.verified && <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center"><Shield className="w-3.5 h-3.5 text-white" /></div>}
              {user.age && <span className={"text-lg font-medium " + (dc?"text-gray-400":"text-gray-500")}>, {user.age}</span>}
            </div>

            {user.username && <p className={"text-sm font-medium mb-2 " + (dc?"text-rose-400":"text-rose-500")}>@{user.username}</p>}

            {user.bio && <p className={"text-sm mb-4 max-w-md leading-relaxed " + (dc?"text-gray-300":"text-gray-600")}>{user.bio}</p>}

            {/* Location & info pills */}
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {user.detectedCity && user.detectedCountry ? (
                <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"bg-emerald-50 text-emerald-700 border border-emerald-200")}>
                  <MapPin className="w-3 h-3" /> {user.detectedCity}, {user.detectedCountry}
                </span>
              ) : user.detectedCountry ? (
                <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-emerald-500/20 text-emerald-400 border border-emerald-500/30":"bg-emerald-50 text-emerald-700 border border-emerald-200")}>
                  <MapPin className="w-3 h-3" /> {user.detectedCountry}
                </span>
              ) : user.country ? (
                <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-gray-700 text-gray-300":"bg-gray-100 text-gray-600")}>
                  <MapPin className="w-3 h-3" /> {user.country}
                </span>
              ) : null}
              {user.gender && (
                <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-gray-700 text-gray-300":"bg-gray-100 text-gray-600")}>
                  <User className="w-3 h-3" /> {user.gender}
                </span>
              )}
            </div>
            {user.detectedCountry && user.country && user.detectedCountry.toLowerCase() !== user.country.toLowerCase() && (
              <div className={"flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium mb-2 " + (dc?"bg-amber-500/10 border border-amber-500/30 text-amber-400":"bg-amber-50 border border-amber-200 text-amber-700")}>
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>Location mismatch — signed up from {user.country}, detected in {user.detectedCountry}</span>
              </div>
            )}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {user.lookingFor && (
                <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600 border border-rose-100")}>
                  <Heart className="w-3 h-3" /> Looking for {user.lookingFor}
                </span>
              )}
              <span className={"inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium " + (dc?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500")}>
                <Calendar className="w-3 h-3" /> Joined {new Date(user.createdAt).toLocaleDateString("en-US",{month:"short",year:"numeric"})}
              </span>
            </div>

            {/* Interests preview */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {interests.slice(0,6).map(t => (
                  <span key={t} className={"inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-rose-500/15 text-rose-400 border border-rose-500/20":"bg-gradient-to-r from-rose-50 to-pink-50 text-rose-600 border border-rose-100")}>
                    {INTEREST_ICONS[t]||"•"} {t}
                  </span>
                ))}
                {interests.length > 6 && <span className={"px-3 py-1.5 rounded-full text-xs font-semibold " + (dc?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500")}>+{interests.length-6} more</span>}
              </div>
            )}
          </div>

          {/* Stats bar */}
          <div className={"grid grid-cols-4 gap-4 mt-6 pt-6 border-t " + (dc?"border-gray-700":"border-gray-100")}>
            {[
              { value: postCount, label: "Posts", icon: Rss, color: dc?"text-blue-400":"text-blue-600" },
              { value: friendCount, label: "Friends", icon: Heart, color: dc?"text-rose-400":"text-rose-500" },
              { value: interests.length, label: "Interests", icon: Tag, color: dc?"text-violet-400":"text-violet-500" },
              { value: user.coins?.toLocaleString()||"0", label: "Coins", icon: Coins, color: dc?"text-amber-400":"text-amber-500" },
            ].map((s,i) => (
              <div key={i} className="text-center group cursor-pointer">
                <div className="flex items-center justify-center gap-1 mb-1">
                  <s.icon className={"w-4 h-4 " + s.color} />
                  <p className={"text-xl sm:text-2xl font-extrabold " + (dc?"text-white":"text-gray-900")}>{s.value}</p>
                </div>
                <p className={"text-[11px] font-medium " + (dc?"text-gray-500":"text-gray-400")}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile completion */}
      {completion < 100 && (
        <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gradient-to-r from-gray-800 to-gray-800/80 border-gray-700":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className={"w-5 h-5 " + (dc?"text-rose-400":"text-rose-500")} />
              <span className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>Complete Your Profile</span>
            </div>
            <span className={"text-sm font-extrabold " + (dc?"text-rose-400":"text-rose-600")}>{completion}%</span>
          </div>
          <div className={"w-full h-2 rounded-full overflow-hidden " + (dc?"bg-gray-700":"bg-rose-100")}>
            <div className="h-full bg-gradient-to-r from-rose-500 to-pink-500 rounded-full transition-all duration-700" style={{width:completion+"%"}} />
          </div>
          <p className={"text-xs mt-2 " + (dc?"text-gray-500":"text-gray-500")}>Complete profiles get 3x more matches!</p>
        </div>
      )}

      {/* ═══ TABS ═══ */}
      <div className={"flex gap-1 mb-6 rounded-2xl p-1.5 " + (dc?"bg-gray-800":"bg-gray-100/80")}>
        {[
          {k:"about",l:"About",icon:User},
          {k:"posts",l:"Posts",icon:Rss},
          {k:"interests",l:"Interests",icon:Tag},
          {k:"settings",l:"Settings",icon:Settings},
        ].map(t => (
          <button key={t.k} onClick={()=>setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-1.5 py-3 rounded-xl text-sm font-semibold transition-all " + (activeTab===t.k?(dc?"bg-gray-700 text-white shadow-lg":"bg-white text-gray-900 shadow-md"):(dc?"text-gray-500 hover:text-gray-300":"text-gray-500 hover:text-gray-700"))}>
            <t.icon className="w-4 h-4" /><span className="hidden sm:inline">{t.l}</span>
          </button>
        ))}
      </div>

      {/* ═══ ABOUT TAB ═══ */}
      {activeTab === "about" && (
        <>
          {/* Bio card */}
          <div className={"rounded-2xl border p-6 mb-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
            <h3 className={"text-xs font-bold uppercase tracking-[0.15em] mb-4 flex items-center gap-2 " + (dc?"text-gray-500":"text-gray-400")}>
              <Heart className="w-3.5 h-3.5 text-rose-500" /> About Me
            </h3>
            <p className={"leading-relaxed " + (dc?"text-gray-300":"text-gray-700") + (user.bio ? " text-sm" : " text-sm italic text-gray-400")}>
              {user.bio || "No bio yet — click Edit Profile to share your story!"}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3 mb-5">
            {[
              { icon:Mail, label:"Email", value:user.email, color:"text-blue-500", bg:dc?"bg-blue-500/10 border-blue-500/20":"bg-blue-50 border-blue-100" },
              { icon:Phone, label:"Phone", value:user.phone||"Not set", color:"text-emerald-500", bg:dc?"bg-emerald-500/10 border-emerald-500/20":"bg-emerald-50 border-emerald-100" },
              { icon:Globe, label:"Country", value:user.country||"Not set", color:"text-violet-500", bg:dc?"bg-violet-500/10 border-violet-500/20":"bg-violet-50 border-violet-100" },
              { icon:Eye, label:"Looking For", value:user.lookingFor||"Not set", color:"text-rose-500", bg:dc?"bg-rose-500/10 border-rose-500/20":"bg-rose-50 border-rose-100" },
            ].map((item,i) => (
              <div key={i} className={"rounded-xl p-4 border transition-all hover:shadow-md " + item.bg}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={"w-8 h-8 rounded-lg flex items-center justify-center " + (dc?"bg-white/5":"bg-white shadow-sm")}>
                    <item.icon className={"w-4 h-4 " + item.color} />
                  </div>
                </div>
                <p className={"text-[10px] font-bold uppercase tracking-wider mb-0.5 " + (dc?"text-gray-500":"text-gray-400")}>{item.label}</p>
                <p className={"text-sm font-semibold truncate " + (dc?"text-white":"text-gray-900")}>{item.value}</p>
              </div>
            ))}
          </div>

          {/* Photo gallery */}
          {user && <div className="mb-5"><PhotoGallery userId={user.id} editable={true} dark={dc} /></div>}

          {/* Edit form */}
          {editing && (
            <div className={"rounded-2xl border p-6 mb-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
              <h3 className={"font-bold mb-6 flex items-center gap-2 text-lg " + (dc?"text-white":"text-gray-900")}><Edit3 className="w-5 h-5 text-rose-500" /> Edit Profile</h3>
              <div className="space-y-5">
                <div>
                  <label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Display Name</label>
                  <input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm transition-all " + (dc?"bg-gray-700 border-gray-600 text-white focus:border-rose-500":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:bg-white")} value={form.name} onChange={e=>set("name",e.target.value)} />
                </div>
                <div>
                  <label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Bio</label>
                  <textarea className={"w-full px-4 py-3 rounded-xl border outline-none text-sm h-28 resize-none transition-all " + (dc?"bg-gray-700 border-gray-600 text-white focus:border-rose-500":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200 focus:bg-white")} placeholder="Share what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} />
                  <p className={"text-xs mt-1 text-right " + (dc?"text-gray-600":"text-gray-400")}>{(form.bio||"").length}/300</p>
                </div>

                {/* Phone with country code */}
                <div>
                  <label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Phone Number</label>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button type="button" onClick={()=>setShowPhoneCodes(!showPhoneCodes)} className={"flex items-center gap-1.5 px-3 py-3 rounded-xl border text-sm min-w-[110px] transition-all " + (dc?"bg-gray-700 border-gray-600 text-white hover:bg-gray-600":"bg-gray-50 border-gray-200 hover:bg-white")}>
                        <span className="text-lg">{PHONE_CODES.find(c=>c.code===phoneCode)?.flag||"🌍"}</span>
                        <span className="font-medium">{phoneCode}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                      {showPhoneCodes && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={()=>setShowPhoneCodes(false)} />
                          <div className={"absolute top-full left-0 mt-1 w-72 rounded-xl border shadow-2xl z-50 max-h-64 overflow-hidden " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                            <div className={"p-2 border-b " + (dc?"border-gray-700":"border-gray-100")}>
                              <input className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Search country..." value={phoneSearch} onChange={e=>setPhoneSearch(e.target.value)} autoFocus />
                            </div>
                            <div className="max-h-48 overflow-y-auto">{filteredPhoneCodes.map((c,i)=>(
                              <button key={i} type="button" onClick={()=>{setPhoneCode(c.code);setShowPhoneCodes(false);setPhoneSearch("");}} className={"w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-colors " + (phoneCode===c.code?(dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600"):(dc?"text-gray-300 hover:bg-gray-700":"text-gray-700 hover:bg-rose-50"))}><span className="text-lg">{c.flag}</span><span className="flex-1 font-medium">{c.name}</span><span className="text-gray-400">{c.code}</span></button>
                            ))}</div>
                          </div>
                        </>
                      )}
                    </div>
                    <input type="tel" className={"flex-1 px-4 py-3 rounded-xl border outline-none text-sm transition-all " + (dc?"bg-gray-700 border-gray-600 text-white focus:border-rose-500":"bg-gray-50 border-gray-200 focus:ring-2 focus:ring-rose-200")} placeholder="Phone number" value={phoneNum} onChange={e=>setPhoneNum(e.target.value.replace(/[^0-9]/g,""))} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Age</label><input type="number" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Gender</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Looking For</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                  <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Country</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c=><option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={()=>setEditing(false)} className={"px-6 py-3 border-2 rounded-full text-sm font-semibold transition-all " + (dc?"border-gray-600 text-gray-400 hover:bg-gray-700":"border-gray-200 text-gray-600 hover:bg-gray-50")}>Cancel</button>
                <button onClick={save} disabled={saving} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-xl hover:shadow-rose-200/40 disabled:opacity-60 transition-all">{saving?"Saving...":"Save Changes"}</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ═══ POSTS TAB ═══ */}
      {activeTab === "posts" && (
        <div>
          <div className="flex items-center justify-between mb-5">
            <h3 className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>My Posts</h3>
            <Link href="/dashboard/feed" className={"text-sm font-semibold flex items-center gap-1 " + (dc?"text-rose-400":"text-rose-500")}>Create Post <ExternalLink className="w-3.5 h-3.5" /></Link>
          </div>
          {myPosts.length === 0 ? (
            <div className={"text-center py-16 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <div className={"w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 " + (dc?"bg-gray-700":"bg-rose-50")}><Rss className={"w-8 h-8 " + (dc?"text-gray-500":"text-rose-300")} /></div>
              <p className={"font-bold mb-1 " + (dc?"text-white":"text-gray-900")}>No posts yet</p>
              <p className={"text-sm mb-5 " + (dc?"text-gray-500":"text-gray-400")}>Share your first post with the community!</p>
              <Link href="/dashboard/feed" className="inline-block px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all">Go to Feed</Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myPosts.map((p:any) => (
                <div key={p.id} className={"rounded-2xl overflow-hidden border group cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
                  {p.image && !p.image.startsWith("[VID]") && !p.image.startsWith("[VOICE]") ? (
                    <div className="aspect-square overflow-hidden"><img src={p.image.replace("[IMG]","")} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" /></div>
                  ) : p.image && p.image.startsWith("[VID]") ? (
                    <div className="aspect-square overflow-hidden bg-black flex items-center justify-center"><video src={p.image.replace("[VID]","")} className="w-full h-full object-cover" /></div>
                  ) : (
                    <div className={"aspect-square flex items-center justify-center p-4 " + (dc?"bg-gray-700":"bg-gradient-to-br from-rose-50 to-pink-50")}>
                      <p className={"text-xs text-center line-clamp-4 " + (dc?"text-gray-300":"text-gray-600")}>{p.content}</p>
                    </div>
                  )}
                  <div className="p-3">
                    <div className="flex items-center justify-between">
                      <span className={"text-xs flex items-center gap-1 " + (dc?"text-rose-400":"text-rose-500")}><Heart className="w-3 h-3" /> {p.likeCount||0}</span>
                      <span className={"text-xs flex items-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><MessageCircle className="w-3 h-3" /> {p.commentCount||0}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ INTERESTS TAB ═══ */}
      {activeTab === "interests" && (
        <div className={"rounded-2xl border p-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className={"font-bold text-lg " + (dc?"text-white":"text-gray-900")}>My Interests</h3>
              <p className={"text-xs mt-0.5 " + (dc?"text-gray-500":"text-gray-400")}>Choose up to 10 — helps find better matches</p>
            </div>
            <div className={"px-3 py-1.5 rounded-full text-xs font-bold " + (interests.length >= 8 ? "bg-emerald-100 text-emerald-700" : interests.length >= 5 ? "bg-amber-100 text-amber-700" : "bg-gray-100 text-gray-500")}>
              {interests.length}/10
            </div>
          </div>

          {/* Selected interests */}
          {interests.length > 0 && (
            <div className="mb-6">
              <p className={"text-xs font-semibold uppercase tracking-wider mb-3 " + (dc?"text-gray-500":"text-gray-400")}>Your Interests</p>
              <div className="flex flex-wrap gap-2">
                {interests.map(t => (
                  <button key={t} onClick={()=>toggleInterest(t)} className="group flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-xs font-bold hover:shadow-lg hover:shadow-rose-200/40 transition-all active:scale-95">
                    <span>{INTEREST_ICONS[t]||"•"}</span> {t} <X className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* All interests */}
          <p className={"text-xs font-semibold uppercase tracking-wider mb-3 " + (dc?"text-gray-500":"text-gray-400")}>Choose Your Interests</p>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_INTERESTS.map(t => {
              const sel = interests.includes(t);
              return (
                <button key={t} onClick={()=>toggleInterest(t)} className={"flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold border transition-all active:scale-95 " + (sel?"bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-200/30":(dc?"bg-gray-700 text-gray-300 border-gray-600 hover:border-rose-400 hover:text-rose-400":"bg-white text-gray-600 border-gray-200 hover:border-rose-300 hover:text-rose-500 hover:bg-rose-50"))}>
                  <span>{INTEREST_ICONS[t]||"•"}</span> {t}
                </button>
              );
            })}
          </div>
          <button onClick={save} disabled={saving} className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold hover:shadow-xl hover:shadow-rose-200/40 disabled:opacity-60 transition-all">{saving?"Saving...":"Save Interests"}</button>
        </div>
      )}

      {/* ═══ SETTINGS TAB ═══ */}
      {activeTab === "settings" && (
        <div className="space-y-5">
          {/* Account info */}
          <div className={"rounded-2xl border p-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
            <h3 className={"font-bold mb-5 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Settings className="w-5 h-5 text-gray-400" /> Account Information</h3>
            <div className="space-y-1">
              {[
                { label:"Email", value:user.email, icon:Mail, color:"text-blue-500" },
                { label:"Username", value:user.username?"@"+user.username:"Not set", icon:User, color:"text-violet-500" },
                { label:"Phone", value:user.phone||"Not set", icon:Phone, color:"text-emerald-500" },
                { label:"Plan", value:null, icon:Crown, color:"text-amber-500", custom:<TierBadge tier={user.tier}/> },
                { label:"Coins", value:null, icon:Coins, color:"text-amber-500", custom:<span className="flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500"/><span className={"font-bold " + (dc?"text-amber-400":"text-amber-600")}>{user.coins?.toLocaleString()||0}</span></span> },
                { label:"Verification", value:null, icon:Shield, color:"text-blue-500", custom:<span className={"font-semibold flex items-center gap-1.5 " + (user.verified?"text-emerald-500":"text-gray-400")}>{user.verified?<><Check className="w-3.5 h-3.5"/>Verified</>:user.verificationStatus||"Not verified"}</span> },
                { label:"Joined", value:new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}), icon:Calendar, color:"text-gray-500" },
              ].map((item,i) => (
                <div key={i} className={"flex items-center justify-between py-3.5 border-b last:border-0 " + (dc?"border-gray-700":"border-gray-50")}>
                  <span className={"flex items-center gap-2.5 text-sm " + (dc?"text-gray-400":"text-gray-500")}><item.icon className={"w-4 h-4 " + item.color} /> {item.label}</span>
                  {item.custom || <span className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{item.value}</span>}
                </div>
              ))}
            </div>
          </div>

          {/* Quick actions */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { href:"/dashboard/verify", icon:Shield, title:"Get Verified", desc:"Face scan + ID", color:dc?"bg-blue-500/10 border-blue-500/20":"bg-blue-50 border-blue-100", iconColor:"text-blue-500" },
              { href:"/dashboard/coins", icon:Crown, title:"Upgrade Plan", desc:"Buy coins & upgrade", color:dc?"bg-amber-500/10 border-amber-500/20":"bg-amber-50 border-amber-100", iconColor:"text-amber-500" },
              { href:"/dashboard/liked", icon:Heart, title:"Who Likes You", desc:"See your admirers", color:dc?"bg-rose-500/10 border-rose-500/20":"bg-rose-50 border-rose-100", iconColor:"text-rose-500" },
              { href:"/dashboard/friends", icon:MessageCircle, title:"Friends", desc:"Manage connections", color:dc?"bg-violet-500/10 border-violet-500/20":"bg-violet-50 border-violet-100", iconColor:"text-violet-500" },
            ].map((item,i) => (
              <Link key={i} href={item.href} className={"rounded-2xl border p-5 hover:shadow-md hover:-translate-y-0.5 transition-all group " + item.color}>
                <item.icon className={"w-8 h-8 mb-3 group-hover:scale-110 transition-transform " + item.iconColor} />
                <h4 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{item.title}</h4>
                <p className={"text-xs mt-0.5 " + (dc?"text-gray-500":"text-gray-500")}>{item.desc}</p>
              </Link>
            ))}
          </div>

          {/* Delete Account */}
          <div className={"rounded-2xl border p-6 " + (dc?"bg-red-500/5 border-red-500/20":"bg-red-50/50 border-red-100")}>
            <h3 className="font-bold text-red-500 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Danger Zone</h3>
            <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-600")}>Permanently delete your account and all data. <span className="font-bold text-red-500">You cannot create a new account with the same email for 30 days.</span></p>
            {!showDelete ? (
              <button onClick={()=>setShowDelete(true)} className="px-5 py-2.5 bg-red-500/10 text-red-500 border border-red-200 rounded-full text-sm font-semibold hover:bg-red-500 hover:text-white hover:border-red-500 transition-all">Delete My Account</button>
            ) : (
              <div className={"rounded-xl border p-5 space-y-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                <p className="text-sm font-bold text-red-500">⚠️ This action is permanent and cannot be undone!</p>
                <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Your password</label><input type="password" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={deletePassword} onChange={e=>setDeletePassword(e.target.value)} placeholder="Enter your current password" /></div>
                <div><label className={"block text-sm font-semibold mb-1.5 " + (dc?"text-gray-300":"text-gray-700")}>Type <span className="text-red-500 font-bold">DELETE MY ACCOUNT</span></label><input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-gray-50 border-gray-200")} value={deleteConfirm} onChange={e=>setDeleteConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" /></div>
                {deleteError && <p className="text-sm text-red-500 font-medium">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={()=>{setShowDelete(false);setDeletePassword("");setDeleteConfirm("");setDeleteError("");}} className={"flex-1 py-3 rounded-full text-sm font-semibold border " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleting} className="flex-[2] py-3 bg-red-500 text-white rounded-full text-sm font-bold hover:bg-red-600 disabled:opacity-60 transition-all">{deleting?"Deleting...":"Delete Forever"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
