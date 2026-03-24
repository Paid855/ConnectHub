"use client";
import AdBanner from "@/components/AdBanner";
import { useState, useEffect } from "react";
import { Shield, Search, Heart, MessageCircle, Crown, Gem, Globe } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = { id:string; name:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; };
const gradients = ["from-rose-400 to-pink-400","from-violet-400 to-purple-400","from-amber-400 to-orange-400","from-emerald-400 to-teal-400","from-sky-400 to-blue-400","from-fuchsia-400 to-pink-400"];

export default function BrowsePage() {
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");

  useEffect(() => { fetch("/api/users").then(r=>r.json()).then(d=>{setProfiles(d.users||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const filtered = profiles.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter==="verified"&&p.tier!=="verified"&&p.tier!=="premium"&&p.tier!=="gold") return false;
    if (filter==="women"&&p.gender!=="Woman") return false;
    if (filter==="men"&&p.gender!=="Man") return false;
    return true;
  });

  const sendMessage = async (receiverId: string) => {
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId, content:"Hey! I saw your profile and wanted to say hi! 👋" }) });
    router.push("/dashboard/messages");
  };

  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-gray-900">Browse</h1>
      <AdBanner placement="browse" /><p className="text-sm text-gray-500">{profiles.length} people on ConnectHub</p></div>
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-4 py-2.5"><Search className="w-4 h-4 text-gray-400" /><input className="bg-transparent border-none outline-none text-sm w-full" placeholder="Search by name..." value={search} onChange={e=>setSearch(e.target.value)} /></div>
        <div className="flex gap-2">
          {[{k:"",l:"All"},{k:"verified",l:"Verified"},{k:"women",l:"Women"},{k:"men",l:"Men"}].map(f => (
            <button key={f.k} onClick={()=>setFilter(f.k)} className={"px-4 py-2.5 rounded-xl text-sm font-medium border transition-all " + (filter===f.k?"bg-rose-50 border-rose-200 text-rose-600":"bg-white border-gray-200 text-gray-600 hover:bg-gray-50")}>{f.l}</button>
          ))}
        </div>
      </div>
      {loading ? <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p,i) => (
            <div key={p.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group">
              <Link href={"/dashboard/user?id="+p.id} className="block relative h-48">
                {p.profilePhoto ? <img src={p.profilePhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" /> : <div className={"w-full h-full bg-gradient-to-br "+gradients[i%gradients.length]+" flex items-center justify-center"}><span className="text-5xl font-bold text-white/30">{p.name[0]}</span></div>}
                {p.tier==="verified"&&<div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Shield className="w-3 h-3"/>Verified</div>}
                {p.tier==="gold"&&<div className="absolute top-3 right-3 bg-amber-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Crown className="w-3 h-3"/>Gold</div>}
                {p.tier==="premium"&&<div className="absolute top-3 right-3 bg-rose-500 text-white text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Gem className="w-3 h-3"/>Pro</div>}
                <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
                <div className="absolute bottom-3 left-4"><h3 className="text-white font-bold text-lg">{p.name}{p.age?", "+p.age:""}</h3></div>
              </Link>
              <div className="p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500 mb-2">
                  <span>{p.gender||"Member"}</span>
                  {p.country && <span className="flex items-center gap-1"><Globe className="w-3 h-3"/>{p.country}</span>}
                </div>
                <p className="text-sm text-gray-600 line-clamp-2 mb-4">{p.bio||"No bio yet"}</p>
                <div className="flex gap-2">
                  <button onClick={()=>sendMessage(p.id)} className="flex-1 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:shadow-lg transition-all"><MessageCircle className="w-4 h-4"/>Message</button>
                  <Link href={"/dashboard/user?id="+p.id} className="w-10 h-10 border-2 border-gray-200 rounded-xl flex items-center justify-center text-gray-400 hover:bg-gray-50 hover:text-rose-500 transition-all"><Heart className="w-5 h-5"/></Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
