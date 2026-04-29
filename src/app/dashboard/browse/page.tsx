"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Shield, Search, Heart, MessageCircle, Crown, Gem, Globe, MapPin, Sparkles, Filter, X } from "lucide-react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Profile = { id:string; name:string; age:number|null; gender:string|null; lookingFor:string|null; bio:string|null; country:string|null; profilePhoto:string|null; tier:string; verified:boolean; interests:string[]; lastSeen?:string; };
const gradients = ["from-rose-400 to-pink-500","from-violet-400 to-purple-500","from-amber-400 to-orange-500","from-emerald-400 to-teal-500","from-sky-400 to-blue-500","from-fuchsia-400 to-pink-500"];

export default function BrowsePage() {
  const { user, dark } = useUser();
  const dc = dark;
  const router = useRouter();
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("");
  const [heartAnim, setHeartAnim] = useState<string|null>(null);

  const doubleTapLike = async (userId: string) => {
    setHeartAnim(userId);
    try {
      await fetch("/api/discover", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetId: userId, type: "like" }) });
    } catch {}
    setTimeout(() => setHeartAnim(null), 1500);
  };
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => { fetch("/api/users").then(r=>r.json()).then(d=>{setProfiles(d.users||[]);setLoading(false);}).catch(()=>setLoading(false)); }, []);

  const timeAgo = (d: string|null|undefined) => {
    if (!d) return "";
    const ms = Date.now() - new Date(d).getTime();
    if (ms < 300000) return "";
    if (ms < 3600000) return Math.floor(ms / 60000) + "m ago";
    if (ms < 86400000) return Math.floor(ms / 3600000) + "h ago";
    if (ms < 604800000) return Math.floor(ms / 86400000) + "d ago";
    return "";
  };
  const isOnline = (d: string|null|undefined) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  const filtered = profiles.filter(p => {
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filter==="verified" && !p.verified) return false;
    if (filter==="women" && p.gender!=="Woman") return false;
    if (filter==="men" && p.gender!=="Man") return false;
    if (filter==="online" && !isOnline(p.lastSeen)) return false;
    return true;
  });

  const sendMessage = async (receiverId: string) => {
    await fetch("/api/messages", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ receiverId, content:"Hey! I saw your profile and wanted to say hi! 👋" }) });
    router.push("/dashboard/messages");
  };

  const sendLike = async (friendId: string) => {
    fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId }) }).catch(()=>{});
  };

  if (!user) return null;

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className={"text-2xl sm:text-3xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          Browse <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">People</span>
        </h1>
        <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>{profiles.length} singles on ConnectHub</p>
      </div>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className={"flex-1 flex items-center gap-2 rounded-xl px-4 py-3 border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200")}>
          <Search className={"w-4 h-4 " + (dc?"text-gray-500":"text-gray-400")} />
          <input className={"bg-transparent border-none outline-none text-sm w-full " + (dc?"text-white placeholder:text-gray-500":"text-gray-900 placeholder:text-gray-400")} placeholder="Search by name..." value={search} onChange={e=>setSearch(e.target.value)} />
          {search && <button onClick={()=>setSearch("")}><X className="w-4 h-4 text-gray-400" /></button>}
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {[{k:"",l:"All",emoji:"✨"},{k:"online",l:"Online",emoji:"🟢"},{k:"verified",l:"Verified",emoji:"✓"},{k:"women",l:"Women",emoji:"👩"},{k:"men",l:"Men",emoji:"👨"}].map(f => (
            <button key={f.k} onClick={()=>setFilter(f.k)} className={"px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-xl text-xs sm:text-sm font-medium border transition-all whitespace-nowrap " + (filter===f.k?(dc?"bg-rose-500/20 border-rose-500/50 text-rose-400":"bg-rose-50 border-rose-200 text-rose-600"):(dc?"bg-gray-800 border-gray-700 text-gray-400 hover:bg-gray-700":"bg-white border-gray-200 text-gray-600 hover:bg-gray-50"))}>
              {f.l}
            </button>
          ))}
        </div>
      </div>

      {/* Results count */}
      {/* Online Now bar */}
      {(() => {
        const onlineUsers = profiles.filter(p => isOnline(p.lastSeen) && p.profilePhoto);
        if (onlineUsers.length === 0) return null;
        return (
          <div className="mb-5">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <h2 className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>Online Now</h2>
              <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{onlineUsers.length}</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {onlineUsers.map(u => (
                <Link key={u.id} href={"/dashboard/user?id=" + u.id} className="flex-shrink-0 text-center group">
                  <div className="relative">
                    <img src={u.profilePhoto} className="w-16 h-16 rounded-full object-cover border-2 border-emerald-400 group-hover:scale-105 transition-transform" alt={u.name} />
                    <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-400 rounded-full border-2 border-white dark:border-gray-900" />
                  </div>
                  <p className={"text-[10px] font-medium mt-1 truncate max-w-[70px] " + (dc?"text-gray-300":"text-gray-700")}>{u.name?.split(" ")[0]}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      <p className={"text-xs font-medium mb-4 " + (dc?"text-gray-500":"text-gray-400")}>{filtered.length} result{filtered.length!==1?"s":""} found</p>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : filtered.length === 0 ? (
        <div className={"rounded-2xl border p-12 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Search className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>No matches found</h3>
          <p className={"text-sm " + (dc?"text-gray-500":"text-gray-500")}>Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((p,i) => (
            <div key={p.id} className={"rounded-2xl border overflow-hidden hover:shadow-xl transition-all duration-300 group " + (dc?"bg-gray-800 border-gray-700 hover:border-rose-500/30":"bg-white border-gray-100 hover:border-rose-200")}>
              <Link href={"/dashboard/user?id="+p.id} className="block relative aspect-[4/5]" onDoubleClick={(e) => { e.preventDefault(); doubleTapLike(p.id); }}>
                {/* Double-tap heart animation */}
                {heartAnim === p.id && (
                  <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                    <Heart className="w-20 h-20 text-rose-500 fill-rose-500 animate-ping" style={{animationDuration:"0.8s"}} />
                  </div>
                )}
                {p.profilePhoto ? (
                  <img src={p.profilePhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className={"w-full h-full bg-gradient-to-br "+gradients[i%gradients.length]+" flex items-center justify-center"}>
                    <span className="text-6xl font-bold text-white/30">{p.name[0]}</span>
                  </div>
                )}
                {/* Online indicator */}
                {isOnline(p.lastSeen) && (
                  <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Online
                  </div>
                )}
                {/* Tier badge */}
                {p.verified && <div className="absolute top-3 right-3 bg-blue-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Shield className="w-3 h-3" />Verified</div>}
                {p.tier==="gold" && !p.verified && <div className="absolute top-3 right-3 bg-amber-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Crown className="w-3 h-3" />Gold</div>}
                {p.tier==="premium" && !p.verified && <div className="absolute top-3 right-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1"><Gem className="w-3 h-3" />Pro</div>}
                {/* Bottom gradient */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-black/70 to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h3 className="text-white font-bold text-sm sm:text-lg">{p.name}{p.age ? ", "+p.age : ""}</h3>
                  <div className="flex items-center gap-2 text-xs text-white/70">
                    {p.country && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{p.country}</span>}
                    {p.gender && <span>{p.gender}</span>}
                    {!isOnline(p.lastSeen) && timeAgo(p.lastSeen) && <span className="text-white/50">{timeAgo(p.lastSeen)}</span>}
                  </div>
                </div>
              </Link>
              <div className={"p-4 " + (dc?"":"")}>
                {p.bio && <p className={"text-sm line-clamp-2 mb-3 " + (dc?"text-gray-400":"text-gray-600")}>{p.bio}</p>}
                {p.interests && p.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {p.interests.slice(0,3).map(t => (
                      <span key={t} className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500")}>{t}</span>
                    ))}
                    {p.interests.length > 3 && <span className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (dc?"bg-gray-700 text-gray-400":"bg-gray-100 text-gray-500")}>+{p.interests.length-3}</span>}
                  </div>
                )}
                <div className="flex gap-2">
                  <button onClick={()=>sendMessage(p.id)} className="flex-1 py-2 sm:py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-1 sm:gap-1.5 hover:shadow-lg hover:shadow-rose-200/30 transition-all">
                    <MessageCircle className="w-4 h-4" />Say Hi
                  </button>
                  <button onClick={()=>sendLike(p.id)} className={"w-11 h-11 border-2 rounded-xl flex items-center justify-center transition-all hover:scale-110 " + (dc?"border-gray-600 text-gray-400 hover:border-rose-500 hover:text-rose-500":"border-gray-200 text-gray-400 hover:border-rose-400 hover:text-rose-500")}>
                    <Heart className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
