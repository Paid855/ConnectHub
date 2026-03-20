"use client";
import { useState, useEffect, useRef } from "react";
import { useUser, TierBadge } from "../layout";
import { Shield, Camera, Check, Heart, Edit3, Calendar, User, Mail, Crown, Star, Settings, Globe, Gem, Phone, MapPin, MessageCircle, Rss, Tag, X, AlertTriangle } from "lucide-react";
import Link from "next/link";

const COUNTRIES = ["Afghanistan","Albania","Algeria","Argentina","Australia","Bangladesh","Brazil","Canada","China","Colombia","Egypt","Ethiopia","France","Germany","Ghana","India","Indonesia","Iran","Iraq","Italy","Japan","Kenya","Malaysia","Mexico","Morocco","Nepal","Netherlands","New Zealand","Nigeria","Pakistan","Philippines","Poland","Russia","Saudi Arabia","Singapore","South Africa","South Korea","Spain","Sri Lanka","Sudan","Sweden","Switzerland","Tanzania","Thailand","Turkey","UAE","Uganda","UK","Ukraine","USA","Vietnam","Zimbabwe"];

const ALL_INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Swimming","Football","Basketball","Fashion","Coffee","Wine","Dogs","Cats","Gardening","Meditation","Writing","Singing","Comedy","Cycling","Running","Beach","Mountains","Camping","Foodie","Netflix","Anime","Tech","Startups","Volunteering"];

export default function ProfilePage() {
  const { user, reload, dark } = useUser();
  const fileRef = useRef<HTMLInputElement>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState({ name:"", bio:"", age:"", gender:"", lookingFor:"", country:"", phone:"" });
  const [interests, setInterests] = useState<string[]>([]);
  const [showInterests, setShowInterests] = useState(false);
  const [activeTab, setActiveTab] = useState("about");
  const [showDelete, setShowDelete] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [postCount, setPostCount] = useState(0);

  useEffect(() => {
    if (user) {
      setForm({ name:user.name||"", bio:user.bio||"", age:user.age?.toString()||"", gender:user.gender||"", lookingFor:user.lookingFor||"", country:user.country||"", phone:user.phone||"" });
      setInterests(user.interests||[]);
    }
    fetch("/api/feed").then(r=>r.json()).then(d=>{ if(d.feed) setPostCount(d.feed.filter((p:any)=>p.userId===user?.id).length); }).catch(()=>{});
  }, [user]);

  const set = (k:string,v:string) => setForm(f=>({...f,[k]:v}));

  const toggleInterest = (tag: string) => {
    setInterests(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : prev.length < 10 ? [...prev, tag] : prev);
  };

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({...form, interests}) });
      if (res.ok) { setSuccess("Profile updated!"); setEditing(false); setShowInterests(false); reload(); setTimeout(()=>setSuccess(""),3000); }
    } catch {} finally { setSaving(false); }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "DELETE MY ACCOUNT") { setDeleteError("Please type DELETE MY ACCOUNT exactly"); return; }
    if (!deletePassword) { setDeleteError("Enter your password"); return; }
    setDeleteError(""); setDeleting(true);
    try {
      const res = await fetch("/api/auth/delete", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ password: deletePassword, confirm: deleteConfirm }) });
      const data = await res.json();
      if (!res.ok) { setDeleteError(data.error); setDeleting(false); return; }
      window.location.href = "/";
    } catch { setDeleteError("Network error"); setDeleting(false); }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    if (file.size > 5*1024*1024) { alert("Max 5MB"); return; }
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const photo = ev.target?.result as string;
      const res = await fetch("/api/auth/profile", { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ profilePhoto:photo }) });
      if (res.ok) { setSuccess("Photo uploaded!"); reload(); setTimeout(()=>setSuccess(""),3000); }
      setUploading(false);
    };
    reader.readAsDataURL(file);
  };

  if (!user) return null;
  const tierColor = user.tier==="gold"?"from-amber-400 via-yellow-500 to-orange-500":user.tier==="premium"?"from-rose-500 via-pink-500 to-purple-500":"from-rose-500 via-pink-500 to-purple-500";
  const dc = dark;

  return (
    <div className="max-w-3xl mx-auto">
      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

      {/* Hero Card */}
      <div className="relative rounded-3xl overflow-hidden mb-6 shadow-lg">
        <div className={"h-48 bg-gradient-to-br " + tierColor + " relative"}><div className="absolute inset-0 bg-black/10" /><div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full" /><div className="absolute -top-5 -left-5 w-24 h-24 bg-white/10 rounded-full" />
          <div className="absolute top-5 right-5"><button onClick={() => setEditing(!editing)} className="flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-md text-white rounded-xl text-sm font-semibold hover:bg-white/30 border border-white/20"><Edit3 className="w-4 h-4" /> {editing?"Cancel":"Edit Profile"}</button></div>
        </div>
        <div className={(dc?"bg-gray-800":"bg-white") + " px-6 pb-8 pt-20 relative"}>
          <div className="absolute -top-16 left-6">
            <div className="relative group"><input ref={fileRef} type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
              <div className="ring-4 ring-white rounded-2xl shadow-xl">{user.profilePhoto ? <img src={user.profilePhoto} alt={user.name} className="w-32 h-32 rounded-2xl object-cover" /> : <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-rose-300 to-pink-300 flex items-center justify-center text-white text-5xl font-bold">{user.name[0]}</div>}</div>
              <button onClick={() => fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/40 flex items-center justify-center transition-all cursor-pointer"><div className="opacity-0 group-hover:opacity-100 text-center"><Camera className="w-7 h-7 text-white mx-auto" /><span className="text-white text-xs font-bold mt-1 block">{uploading?"...":"Change"}</span></div></button>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap"><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>{user.name}</h1>{user.tier==="verified"&&<Shield className="w-5 h-5 text-blue-500 fill-blue-100"/>}{user.tier==="gold"&&<Crown className="w-5 h-5 text-amber-500"/>}{user.tier==="premium"&&<Gem className="w-5 h-5 text-rose-500"/>}</div>
            {user.bio && <p className={"text-sm mb-3 max-w-md leading-relaxed " + (dc?"text-gray-400":"text-gray-600")}>{user.bio}</p>}

            {/* Interest Tags */}
            {interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {interests.map(tag => <span key={tag} className={"text-xs font-semibold px-2.5 py-1 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500 border border-rose-100")}>{tag}</span>)}
              </div>
            )}

            <div className={"flex flex-wrap items-center gap-x-4 gap-y-1 text-xs " + (dc?"text-gray-500":"text-gray-500")}>
              {user.country && <span className="flex items-center gap-1"><Globe className="w-3.5 h-3.5" /> {user.country}</span>}
              <span className="flex items-center gap-1"><Mail className="w-3.5 h-3.5" /> {user.email}</span>
              {user.phone && <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {user.phone}</span>}
              <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Joined {new Date(user.createdAt).toLocaleDateString("en-US",{month:"long",year:"numeric"})}</span>
            </div>
          </div>

          <div className={"flex items-center gap-6 mt-5 pt-5 border-t " + (dc?"border-gray-700":"border-gray-100")}>
            <div className="text-center"><p className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{user.age||"--"}</p><p className="text-[11px] text-gray-500">Age</p></div>
            <div className={"w-px h-8 " + (dc?"bg-gray-700":"bg-gray-200")} />
            <div className="text-center"><p className={"text-xl font-bold " + (dc?"text-white":"text-gray-900")}>{postCount}</p><p className="text-[11px] text-gray-500">Posts</p></div>
            <div className={"w-px h-8 " + (dc?"bg-gray-700":"bg-gray-200")} />
            <div className="text-center"><TierBadge tier={user.tier} /></div>
            <div className={"w-px h-8 " + (dc?"bg-gray-700":"bg-gray-200")} />
            <div className="text-center"><p className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>{interests.length}</p><p className="text-[11px] text-gray-500">Interests</p></div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {[
          { icon:Rss, label:"My Feed", href:"/dashboard/feed", color:"text-violet-500", bg:dc?"bg-violet-500/10 hover:bg-violet-500/20":"bg-violet-50 hover:bg-violet-100" },
          { icon:MessageCircle, label:"Messages", href:"/dashboard/messages", color:"text-rose-500", bg:dc?"bg-rose-500/10 hover:bg-rose-500/20":"bg-rose-50 hover:bg-rose-100" },
          { icon:Shield, label:"Verify", href:"/dashboard/verify", color:"text-blue-500", bg:dc?"bg-blue-500/10 hover:bg-blue-500/20":"bg-blue-50 hover:bg-blue-100" },
          { icon:Crown, label:"Upgrade", href:"/dashboard/upgrade", color:"text-amber-500", bg:dc?"bg-amber-500/10 hover:bg-amber-500/20":"bg-amber-50 hover:bg-amber-100" },
        ].map((a,i) => (
          <Link key={i} href={a.href} className={"flex flex-col items-center gap-1.5 p-4 rounded-2xl transition-all " + a.bg}>
            <a.icon className={"w-6 h-6 " + a.color} /><span className={"text-xs font-semibold " + (dc?"text-gray-300":"text-gray-700")}>{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Tabs */}
      <div className={"flex gap-1 mb-6 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[{k:"about",l:"About",icon:User},{k:"interests",l:"Interests",icon:Tag},{k:"settings",l:"Settings",icon:Settings}].map(t => (
          <button key={t.k} onClick={() => setActiveTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (activeTab===t.k?(dc?"bg-gray-700 text-white shadow-sm":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}><t.icon className="w-4 h-4" /> {t.l}</button>
        ))}
      </div>

      {/* ABOUT TAB */}
      {activeTab === "about" && (
        <>
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-5 mb-5"}>
            <h3 className={"text-xs font-bold uppercase tracking-wider mb-3 " + (dc?"text-gray-500":"text-gray-400")}>About Me</h3>
            <p className={(dc?"text-gray-300":"text-gray-700") + " leading-relaxed"}>{user.bio || "No bio yet. Click Edit Profile to tell people about yourself!"}</p>
          </div>

          {editing && (
            <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6 mb-5"}>
              <h3 className={"font-bold mb-5 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Edit3 className="w-5 h-5 text-rose-500" /> Edit Profile</h3>
              <div className="space-y-4">
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Name</label><input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} value={form.name} onChange={e=>set("name",e.target.value)} /></div>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Bio</label><textarea className={"w-full px-4 py-3 rounded-xl border outline-none text-sm h-28 resize-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Tell people what makes you unique..." value={form.bio} onChange={e=>set("bio",e.target.value)} /></div>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Phone</label><input type="tel" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} value={form.phone} onChange={e=>set("phone",e.target.value)} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Age</label><input type="number" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.age} onChange={e=>set("age",e.target.value)} /></div>
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Gender</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.gender} onChange={e=>set("gender",e.target.value)}><option value="">Select</option><option>Woman</option><option>Man</option><option>Non-binary</option></select></div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Looking For</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.lookingFor} onChange={e=>set("lookingFor",e.target.value)}><option value="">Select</option><option>Women</option><option>Men</option><option>Everyone</option></select></div>
                  <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Country</label><select className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={form.country} onChange={e=>set("country",e.target.value)}><option value="">Select</option>{COUNTRIES.map(c => <option key={c}>{c}</option>)}</select></div>
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button onClick={() => setEditing(false)} className={"px-5 py-2.5 border-2 rounded-full text-sm font-semibold " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-60">{saving?"Saving...":"Save Changes"}</button>
              </div>
            </div>
          )}
        </>
      )}

      {/* INTERESTS TAB */}
      {activeTab === "interests" && (
        <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-6"}>
          <div className="flex items-center justify-between mb-4">
            <div><h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>My Interests</h3><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Select up to 10 interests</p></div>
            <span className="text-xs font-bold text-rose-500">{interests.length}/10</span>
          </div>

          <div className="flex flex-wrap gap-2 mb-6">
            {interests.map(tag => (
              <button key={tag} onClick={() => toggleInterest(tag)} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-xs font-semibold hover:shadow-lg transition-all">
                {tag} <X className="w-3 h-3" />
              </button>
            ))}
            {interests.length === 0 && <p className={"text-sm " + (dc?"text-gray-500":"text-gray-400")}>No interests selected yet</p>}
          </div>

          <h4 className={"text-sm font-semibold mb-3 " + (dc?"text-gray-400":"text-gray-600")}>Choose your interests:</h4>
          <div className="flex flex-wrap gap-2 mb-6">
            {ALL_INTERESTS.map(tag => {
              const selected = interests.includes(tag);
              return (
                <button key={tag} onClick={() => toggleInterest(tag)} className={"px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " + (selected ? "bg-rose-500 text-white border-rose-500" : (dc?"bg-gray-700 text-gray-300 border-gray-600 hover:border-rose-400":"bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"))}>
                  {tag}
                </button>
              );
            })}
          </div>

          <button onClick={save} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg disabled:opacity-60">{saving?"Saving...":"Save Interests"}</button>
        </div>
      )}

      {/* SETTINGS TAB */}
      {activeTab === "settings" && (
        <div className="space-y-4">
          <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-5"}>
            <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Account</h3>
            <div className="space-y-3 text-sm">
              <div className={"flex justify-between py-2 border-b " + (dc?"border-gray-700":"border-gray-50")}><span className={dc?"text-gray-400":"text-gray-500"}>Email</span><span className={"font-medium " + (dc?"text-white":"text-gray-900")}>{user.email}</span></div>
              {user.username && <div className={"flex justify-between py-2 border-b " + (dc?"border-gray-700":"border-gray-50")}><span className={dc?"text-gray-400":"text-gray-500"}>Username</span><span className={"font-medium " + (dc?"text-white":"text-gray-900")}>@{user.username}</span></div>}
              <div className={"flex justify-between py-2 border-b " + (dc?"border-gray-700":"border-gray-50")}><span className={dc?"text-gray-400":"text-gray-500"}>Phone</span><span className={"font-medium " + (dc?"text-white":"text-gray-900")}>{user.phone||"Not set"}</span></div>
              <div className={"flex justify-between py-2 border-b " + (dc?"border-gray-700":"border-gray-50")}><span className={dc?"text-gray-400":"text-gray-500"}>Plan</span><TierBadge tier={user.tier} /></div>
              <div className={"flex justify-between py-2 " + (dc?"border-gray-700":"border-gray-50")}><span className={dc?"text-gray-400":"text-gray-500"}>Verification</span><span className={"font-medium " + (user.verified?"text-blue-600":"text-gray-500")}>{user.verificationStatus}</span></div>
            </div>
          </div>

          <Link href="/dashboard/verify" className={"block rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-blue-500/10 border-blue-500/30":"bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200")}>
            <div className="flex items-center gap-4"><div className={"w-12 h-12 rounded-xl flex items-center justify-center " + (dc?"bg-blue-500/20":"bg-blue-100")}><Shield className="w-6 h-6 text-blue-500" /></div><div className="flex-1"><h3 className={"font-bold " + (dc?"text-white":"text-blue-900")}>Get Verified</h3><p className={"text-sm " + (dc?"text-blue-300":"text-blue-600")}>Face scan + ID for verified badge</p></div></div>
          </Link>

          <Link href="/dashboard/upgrade" className={"block rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-amber-500/10 border-amber-500/30":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
            <div className="flex items-center gap-4"><div className={"w-12 h-12 rounded-xl flex items-center justify-center " + (dc?"bg-amber-500/20":"bg-amber-100")}><Crown className="w-6 h-6 text-amber-600" /></div><div className="flex-1"><h3 className={"font-bold " + (dc?"text-white":"text-amber-900")}>Upgrade Plan</h3><p className={"text-sm " + (dc?"text-amber-300":"text-amber-700")}>Unlock unlimited features</p></div></div>
          </Link>

          {/* Account Deletion */}
          <div className={(dc?"bg-red-500/10 border-red-500/20":"bg-red-50 border-red-200") + " rounded-2xl border p-5"}>
            <h3 className="font-bold text-red-600 mb-2 flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> Delete Account</h3>
            <p className={"text-sm mb-4 " + (dc?"text-gray-400":"text-gray-600")}>Permanently delete your account and all data. <span className="font-bold text-red-500">You will NOT be able to create a new account with the same email, phone, or username for 30 days.</span></p>
            {!showDelete ? (
              <button onClick={() => setShowDelete(true)} className="px-5 py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 transition-all">Delete My Account</button>
            ) : (
              <div className={"rounded-xl border p-4 space-y-3 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
                <p className={"text-sm font-semibold text-red-500"}>This action is permanent and cannot be undone!</p>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Enter your password</label><input type="password" className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={deletePassword} onChange={e => setDeletePassword(e.target.value)} placeholder="Your current password" /></div>
                <div><label className={"block text-sm font-medium mb-1 " + (dc?"text-gray-300":"text-gray-700")}>Type <span className="font-bold text-red-500">DELETE MY ACCOUNT</span> to confirm</label><input className={"w-full px-4 py-3 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={deleteConfirm} onChange={e => setDeleteConfirm(e.target.value)} placeholder="DELETE MY ACCOUNT" /></div>
                {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={() => { setShowDelete(false); setDeletePassword(""); setDeleteConfirm(""); setDeleteError(""); }} className={"flex-1 py-2.5 rounded-full text-sm font-semibold border " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleting} className="flex-[2] py-2.5 bg-red-500 text-white rounded-full text-sm font-semibold hover:bg-red-600 disabled:opacity-60">{deleting ? "Deleting..." : "Delete Forever"}</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
