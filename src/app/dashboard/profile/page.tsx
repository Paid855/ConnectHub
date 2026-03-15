"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Shield, Camera, Check, Sparkles, Heart, Edit3, Calendar, User, Mail, Crown, Star, Settings, Globe, Gem, Phone, MapPin, MessageCircle, Image as ImageIcon, Rss } from "lucide-react";
import Link from "next/link";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];

export default function ProfilePage() {
  const { user, reload } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name:"", bio:"", age:"", gender:"", lookingFor:"", country:"", phone:"" });
  const [activeTab, setActiveTab] = useState("about");
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (user) setForm({ name:user.name||"", bio:user.bio||"", age:user.age?.toString()||"", gender:user.gender||"", lookingFor:user.lookingFor||"", country:user.country||"", phone:user.phone||"" });
    fetch("/api/feed").then(r=>r.json()).then(d=>{ if(d.feed) setPostCount(d.feed.filter((p:any)=>p.userId===user?.id).length); }).catch(()=>{});
  }, [user]);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
      if (res.ok) { setSuccess("Profile updated!"); setEditing(false); reload(); setTimeout(()=>setSuccess(""),3000); }
    } catch {} finally { setSaving(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const photo = ev.target?.result as string;
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ profilePhoto: photo }) });
      if (res.ok) { setSuccess("Photo uploaded!"); reload(); setTimeout(()=>setSuccess(""),3000); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;
  const tierColor = user.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":user.tier==="premium"?"from-rose-500 via-pink-500 to-purple-500":"from-rose-500 via-pink-500 to-purple-500";

  return (
    <div className="max-w-3xl mx-auto">
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

      {/* Hero Card */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-lg">
        <div className={"h-48 bg-gradient-to-br " + tierColor + " relative"}>
          <div className="absolute inset-0 bg-black/10" />
          <div className="absolute top-5 right-5">
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold hover:bg-white/30 transition-all border border-white/20">
              <Edit3 className="w-4 h-4" /> {editing?"Cancel":"Edit Profile"}
            </button>
          </div>
          {/* Decorative circles */}
          <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -top-5 -left-5 w-24 h-24 bg-white/10 rounded-full" />
        </div>

        <div className="bg-white px-6 pb-8 pt-20 relative">
          {/* Avatar */}
          <div className="absolute -top-16 left-6">
            <div className="relative group">
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="ring-4 ring-white rounded-2xl shadow-xl">
                {user.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-32 h-32 rounded-2xl object-cover" /> : <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-5xl font-bold">{user.name[0]}</div>}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer">
                <div className="opacity-0 group-hover:opacity-100 text-center"><Camera className="w-7 h-7 text-white mx-auto" /><span className="text-white text-xs font-bold mt-1 block">{uploading?"...":"Change"}</span></div>
              </button>
            </div>
          </div>

          {/* Name & Info */}
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-gray-900">{user.name}</h1>
                {user.tier === "verified" && <Shield className="w-5 h-5 text-blue-500 fill-blue-100" />}
                {user.tier === "gold" && <Crown className="w-5 h-5 text-amber-500" />}
                {user.tier === "premium" && <Gem className="w-5 h-5 text-rose-500" />}
              </div>
              {user.bio && <p className="text-sm text-gray-600 mb-3 max-w-md leading-relaxed">{user.bio}</p>}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                {user.country && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {user.country}</span>}
                <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
                {user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
                <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
              </div>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-6 mt-5 pt-5 border-t border-gray-100">
            <div className="text-center"><p className="text-xl font-bold text-gray-900">{user.age || "--"}</p><p className="text-[11px] text-gray-500 font-medium">Age</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-xl font-bold text-gray-900">{postCount}</p><p className="text-[11px] text-gray-500 font-medium">Posts</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><TierBadge tier={user.tier} /></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-sm font-bold text-gray-900">{user.gender || "--"}</p><p className="text-[11px] text-gray-500 font-medium">Gender</p></div>
            <div className="w-px h-8 bg-gray-200" />
            <div className="text-center"><p className="text-sm font-bold text-gray-900">{user.lookingFor || "--"}</p><p className="text-[11px] text-gray-500 font-medium">Seeking</p></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon:Rss, label:"My Feed", href:"/dashboard/feed", color:"text-violet-500", bg:"bg-violet-50 hover:bg-violet-100" },
          { icon:MessageCircle, label:"Messages", href:"/dashboard/messages", color:"text-rose-500", bg:"bg-rose-50 hover:bg-rose-100" },
          { icon:Shield, label:"Verify", href:"/dashboard/verify", color:"text-blue-500", bg:"bg-blue-50 hover:bg-blue-100" },
          { icon:Crown, label:"Upgrade", href:"/dashboard/upgrade", color:"text-amber-500", bg:"bg-amber-50 hover:bg-amber-100" },
        ].map((a,i) => (
          <Link key={i} href={a.href} className={"flex flex-col items-center gap-1.5 p-4 rounded-2xl transition-all " + a.bg}>
            <a.icon className={"w-6 h-6 " + a.color} />
            <span className="text-xs font-semibold text-gray-700">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[{k:"about",l:"About",icon:User},{k:"details",l:"Details",icon:MapPin},{k:"settings",l:"Settings",icon:Settings}].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab === t.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}><t.icon className="w-4 h-4" /> {t.l}</button>
        ))}
      </div>

      {/* ABOUT TAB */}
      {activeTab === "about" && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About Me</h3>
            <p className="text-gray-700 leading-relaxed">{user.bio || "No bio yet. Click Edit Profile to tell people about yourself!"}</p>
          </div>

          {!user.profilePhoto && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><Camera className="w-6 h-6 text-amber-600" /></div><div className="flex-1"><h3 className="font-bold text-amber-900">Add a Profile Photo</h3><p className="text-sm text-amber-700">Get 10x more matches!</p></div><button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold">Upload</button></div>
            </div>
          )}

          {editing && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <h3 className="font-bold text-gray-900 mb-5 flex items-center gap-2"><Edit3 className="w-5 h-5 text-rose-500" /> Edit Profile</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm h-28 resize-none" placeholder="Tell people what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Phone</label><input type="tel" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" placeholder="+1 234 567 8900" value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEditing(false)} className="px-5 py-2.5 border-2 border-gray-200 rounded-full text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">{saving?"Saving...":"Save Changes"}</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* DETAILS TAB */}
      {activeTab === "details" && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h3 className="font-bold text-gray-900 mb-5">Personal Details</h3>
          <div className="space-y-4">
            {[
              { icon:User, label:"Full Name", value:user.name },
              { icon:Mail, label:"Email", value:user.email },
              { icon:Phone, label:"Phone", value:user.phone || "Not set" },
              { icon:Calendar, label:"Age", value:user.age ? user.age + " years old" : "Not set" },
              { icon:User, label:"Gender", value:user.gender || "Not set" },
              { icon:Heart, label:"Looking For", value:user.lookingFor || "Not set" },
              { icon:Globe, label:"Country", value:user.country || "Not set" },
              { icon:Shield, label:"Verification", value:user.verificationStatus === "approved" ? "Verified" : user.verificationStatus },
              { icon:Star, label:"Plan", value:user.tier.charAt(0).toUpperCase() + user.tier.slice(1) },
              { icon:Calendar, label:"Joined", value:new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"}) },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-4 py-3 border-b border-gray-50 last:border-0">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0"><item.icon className="w-5 h-5 text-gray-400" /></div>
                <div className="flex-1"><p className="text-xs text-gray-500 font-medium">{item.label}</p><p className="text-sm font-semibold text-gray-900">{item.value}</p></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Account</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Email</span><span className="text-gray-900 font-medium">{user.email}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Phone</span><span className="text-gray-900 font-medium">{user.phone || "Not set"}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Plan</span><TierBadge tier={user.tier} /></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Verification</span><span className={"font-medium " + (user.verified ? "text-blue-600" : "text-gray-500")}>{user.verificationStatus}</span></div>
            </div>
          </div>

          {user.verificationStatus !== "approved" && user.tier !== "verified" && (
            <Link href="/dashboard/verify" className="block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Shield className="w-6 h-6 text-blue-500" /></div><div className="flex-1"><h3 className="font-bold text-blue-900">Get Verified</h3><p className="text-sm text-blue-600">Face scan + ID for verified badge</p></div></div>
            </Link>
          )}

          <Link href="/dashboard/upgrade" className="block bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><Crown className="w-6 h-6 text-amber-600" /></div><div className="flex-1"><h3 className="font-bold text-amber-900">Upgrade Plan</h3><p className="text-sm text-amber-700">Unlock unlimited features</p></div></div>
          </Link>

          <Link href="/dashboard/support" className="block bg-white border border-gray-200 rounded-2xl p-5 hover:shadow-md transition-all">
            <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center"><Mail className="w-6 h-6 text-gray-500" /></div><div className="flex-1"><h3 className="font-bold text-gray-900">Contact Support</h3><p className="text-sm text-gray-500">Get help with your account</p></div></div>
          </Link>
        </div>
      )}
    </div>
  );
}
