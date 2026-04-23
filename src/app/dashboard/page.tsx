"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "./layout";
import { Heart, X, Shield, MapPin, Sparkles, Eye, MessageCircle, Star, Crown, Gem, ChevronLeft, ChevronRight, Zap } from "lucide-react";
import Link from "next/link";

export default function DiscoverPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [profiles, setProfiles] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<string|null>(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetch("/api/users").then(r => r.ok ? r.json() : { users: [] }).then(d => {
      setProfiles(d.users || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleAction = async (type: string) => {
    if (!profiles[current]) return;
    setAction(type);
    if (type === "like" || type === "superlike") {
      fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId: profiles[current].id }) }).catch(()=>{});
    }
    setTimeout(() => { setAction(null); setCurrent(p => p + 1); setShowDetails(false); }, 500);
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const profile = profiles[current];

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>;

  if (!profile) return (
    <div className={"rounded-3xl border p-12 text-center max-w-md mx-auto mt-10 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-5"><Heart className="w-10 h-10 text-rose-500" /></div>
      <h2 className={"text-2xl font-extrabold mb-2 " + (dc?"text-white":"text-gray-900")}>All Caught Up!</h2>
      <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>You have seen everyone for now. Check back later for new profiles!</p>
      <div className="flex flex-col gap-3">
        <Link href="/dashboard/browse" className="py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg">Browse All People</Link>
        <button onClick={()=>setCurrent(0)} className={"py-3 border-2 rounded-full font-bold text-sm " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Start Over</button>
      </div>
    </div>
  );

  const tierGrad = profile.tier==="gold"?"from-amber-400 to-orange-500":profile.tier==="premium"?"from-rose-500 to-purple-500":"from-rose-400 to-pink-500";

  return (
    <div className="max-w-lg mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between mb-4">
        <h1 className={"text-xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Discover</span>
        </h1>
        <div className={"flex items-center gap-2 text-xs " + (dc?"text-gray-500":"text-gray-400")}>
          <Sparkles className="w-4 h-4 text-rose-500" />
          {profiles.length - current} left today
        </div>
      </div>

      {/* Main card */}
      <div className={"relative rounded-3xl overflow-hidden shadow-2xl border " + (dc?"border-gray-700 shadow-black/50":"border-gray-100 shadow-rose-100/50") + " " + (action==="like"?"translate-x-20 rotate-6 opacity-0":action==="pass"?"-translate-x-20 -rotate-6 opacity-0":"") + " transition-all duration-500"}>
        {/* Photo */}
        <div className="relative aspect-[3/4]" onClick={()=>setShowDetails(!showDetails)}>
          {profile.profilePhoto ? (
            <img src={profile.profilePhoto} className="w-full h-full object-cover" />
          ) : (
            <div className={"w-full h-full bg-gradient-to-br " + tierGrad + " flex items-center justify-center"}>
              <span className="text-8xl font-bold text-white/20">{profile.name[0]}</span>
            </div>
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

          {/* Online badge */}
          {isOnline(profile.lastSeen) && (
            <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Online now
            </div>
          )}

          {/* Tier badge */}
          {profile.verified && <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Verified</div>}

          {/* Bottom info */}
          <div className="absolute bottom-0 left-0 right-0 p-6">
            <div className="flex items-end justify-between">
              <div>
                <h2 className="text-white text-3xl font-extrabold mb-1">{profile.name}{profile.age ? <span className="font-normal text-2xl">, {profile.age}</span> : ""}</h2>
                <div className="flex items-center gap-3 text-white/80 text-sm">
                  {profile.country && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.country}</span>}
                  {profile.gender && <span>{profile.gender}</span>}
                </div>
              </div>
              <button onClick={(e)=>{e.stopPropagation();setShowDetails(!showDetails);}} className="w-10 h-10 bg-white/20 backdrop-blur rounded-full flex items-center justify-center text-white">
                <Eye className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Expandable details */}
        {showDetails && (
          <div className={"p-5 " + (dc?"bg-gray-800":"bg-white")}>
            {profile.bio && <p className={"text-sm leading-relaxed mb-4 " + (dc?"text-gray-300":"text-gray-600")}>{profile.bio}</p>}
            {profile.interests && profile.interests.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {profile.interests.map((t:string) => (
                  <span key={t} className={"text-xs font-semibold px-3 py-1 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-600 border border-rose-100")}>{t}</span>
                ))}
              </div>
            )}
            {profile.lookingFor && <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Looking for: <span className="font-semibold">{profile.lookingFor}</span></p>}
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button onClick={()=>handleAction("pass")} className={"w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 " + (dc?"border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500 bg-gray-800":"border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500 bg-white shadow-lg")}>
          <X className="w-7 h-7" />
        </button>
        <button onClick={()=>handleAction("superlike")} className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-200/50 hover:scale-110 transition-all">
          <Star className="w-6 h-6" />
        </button>
        <button onClick={()=>handleAction("like")} className="w-16 h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-rose-200/50 hover:scale-110 transition-all">
          <Heart className="w-8 h-8" />
        </button>
        <Link href={"/dashboard/messages"} className={"w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 " + (dc?"border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 bg-gray-800":"border-gray-200 text-gray-400 hover:border-purple-400 hover:text-purple-500 bg-white shadow-lg")}>
          <MessageCircle className="w-6 h-6" />
        </Link>
      </div>

      {/* Navigation hint */}
      <p className={"text-center text-xs mt-4 " + (dc?"text-gray-600":"text-gray-400")}>
        Tap photo to see details · {current + 1} of {profiles.length}
      </p>
    </div>
  );
}
