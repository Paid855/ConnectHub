"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Shield, Camera, Check, Sparkles, Heart, Edit3, Calendar, User, Mail, Crown, Star, Settings, MapPin, Globe, Gem } from "lucide-react";
import Link from "next/link";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];

export default function ProfilePage() {
  const { user, reload } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name:"", bio:"", age:"", gender:"", lookingFor:"", country:"" });
  const [activeTab, setActiveTab] = useState("about");

  useEffect(() => {
    if (user) setForm({ name:user.name||"", bio:user.bio||"", age:user.age?.toString()||"", gender:user.gender||"", lookingFor:user.lookingFor||"", country:user.country||"" });
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
    if (file.size > 5 * 1024 * 1024) { alert("Max 5MB"); return; }
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

  const tierIcon = user.tier === "gold" ? Crown : user.tier === "premium" ? Gem : user.tier === "verified" ? Shield : Sparkles;
  const tierColor = user.tier === "gold" ? "text-amber-500" : user.tier === "premium" ? "text-rose-500" : user.tier === "verified" ? "text-blue-500" : "text-gray-500";

  return (
    <div className="max-w-3xl">
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

      <div className="relative rounded-3xl overflow-hidden mb-8 shadow-sm">
        <div className={"h-44 " + (user.tier === "gold" ? "bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500" : user.tier === "premium" ? "bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500" : "bg-gradient-to-br from-rose-500 via-pink-500 to-purple-500")} />
        <div className="bg-white px-6 pb-6 pt-16 relative">
          <div className="absolute -top-14 left-6">
            <div className="relative group">
              <input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              {user.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-28 h-28 rounded-2xl object-cover border-4 border-white shadow-lg" /> : <div className="w-28 h-28 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 border-4 border-white shadow-lg flex items-center justify-center text-white text-4xl font-bold">{user.name[0]}</div>}
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"><div className="opacity-0 group-hover:opacity-100 text-center"><Camera className="w-6 h-6 text-white mx-auto" /><span className="text-white text-[10px] font-bold">{uploading?"...":"Change"}</span></div></button>
            </div>
          </div>

          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1"><h1 className="text-2xl font-bold text-gray-900">{user.name}</h1></div>
              <p className="text-sm text-gray-500 flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</p>
              <div className="flex items-center gap-2 mt-2">
                <TierBadge tier={user.tier} />
                {user.country && <span className="text-xs text-gray-400 flex items-center gap-1"><Globe className="w-3 h-3" /> {user.country}</span>}
                <span className="text-xs text-gray-400">Joined {new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
              </div>
            </div>
            <button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-200 transition-all"><Edit3 className="w-4 h-4" /> {editing?"Cancel":"Edit"}</button>
          </div>

          <div className="grid grid-cols-5 gap-3 mt-6">
            {[
              { icon:Calendar, label:"Age", value:user.age || "--", bg:"bg-rose-50", color:"text-rose-500" },
              { icon:User, label:"Gender", value:user.gender || "--", bg:"bg-violet-50", color:"text-violet-500" },
              { icon:Heart, label:"Seeking", value:user.lookingFor || "--", bg:"bg-pink-50", color:"text-pink-500" },
              { icon:Globe, label:"Country", value:user.country || "--", bg:"bg-sky-50", color:"text-sky-500" },
              { icon:tierIcon, label:"Plan", value:user.tier.charAt(0).toUpperCase()+user.tier.slice(1), bg:user.tier==="gold"?"bg-amber-50":user.tier==="premium"?"bg-rose-50":"bg-gray-50", color:tierColor },
            ].map((s, i) => (
              <div key={i} className={"rounded-xl p-3 text-center " + s.bg}>
                <s.icon className={"w-4 h-4 mx-auto mb-1 " + s.color} />
                <p className="text-[10px] text-gray-500">{s.label}</p>
                <p className="text-sm font-bold text-gray-900 truncate">{s.value}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-1 mb-6 bg-gray-100 rounded-xl p-1">
        {[{k:"about",l:"About",icon:User},{k:"settings",l:"Settings",icon:Settings}].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab === t.k ? "bg-white text-gray-900 shadow-sm" : "text-gray-500")}><t.icon className="w-4 h-4" /> {t.l}</button>
        ))}
      </div>

      {activeTab === "about" && (
        <>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-5">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">About Me</h3>
            <p className="text-gray-700 leading-relaxed">{user.bio || "No bio yet. Click Edit to tell people about yourself!"}</p>
          </div>

          {editing && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-5">
              <h3 className="font-bold text-gray-900 mb-5">Edit Profile</h3>
              <div className="space-y-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Name</label><input className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm" value={form.name} onChange={e=>set("name",e.target.value)} /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Bio</label><textarea className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 focus:border-transparent outline-none text-sm h-28 resize-none" placeholder="Tell people what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Age</label><input type="number" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-rose-300 outline-none text-sm" value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Gender</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Looking For</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                  <div><label className="block text-sm font-medium text-gray-700 mb-1">Country</label><select className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none text-sm bg-white" value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select country</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEditing(false)} className="px-5 py-2.5 border-2 border-gray-200 rounded-full text-sm font-semibold text-gray-600">Cancel</button>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all disabled:opacity-60">{saving ? "Saving..." : "Save Changes"}</button>
              </div>
            </div>
          )}

          {!user.profilePhoto && (
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-5">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center"><Camera className="w-6 h-6 text-amber-600" /></div><div className="flex-1"><h3 className="font-bold text-amber-900">Add a Profile Photo</h3><p className="text-sm text-amber-700">Get 10x more matches!</p></div><button onClick={() => fileRef.current?.click()} className="px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-bold">Upload</button></div>
            </div>
          )}
        </>
      )}

      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-3">Account</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Email</span><span className="text-gray-900 font-medium">{user.email}</span></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Plan</span><TierBadge tier={user.tier} /></div>
              <div className="flex justify-between py-2 border-b border-gray-50"><span className="text-gray-500">Country</span><span className="text-gray-900 font-medium">{user.country || "Not set"}</span></div>
              <div className="flex justify-between py-2"><span className="text-gray-500">Verification</span><span className={"font-medium " + (user.verified ? "text-blue-600" : "text-gray-500")}>{user.verificationStatus}</span></div>
            </div>
          </div>

          {user.verificationStatus !== "approved" && user.tier !== "verified" && (
            <Link href="/dashboard/verify" className="block bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-5 hover:shadow-md transition-all">
              <div className="flex items-center gap-4"><div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center"><Shield className="w-6 h-6 text-blue-500" /></div><div className="flex-1"><h3 className="font-bold text-blue-900">Get Verified</h3><p className="text-sm text-blue-600">Complete face scan + ID</p></div></div>
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
