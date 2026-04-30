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

  const [matchPopup, setMatchPopup] = useState<any>(null);
  const [superLikeError, setSuperLikeError] = useState("");
  const [lastPassed, setLastPassed] = useState<number|null>(null);
  const [todayLikes, setTodayLikes] = useState(0);
  const [todayPasses, setTodayPasses] = useState(0);
  const [superLikeAnim, setSuperLikeAnim] = useState(false);

  const handleAction = async (type: string) => {
    if (!profiles[current]) return;
    setAction(type);
    setSuperLikeError("");

    if (type === "like" || type === "superlike") {
      try {
        const res = await fetch("/api/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetId: profiles[current].id, type }),
        });
        const data = await res.json();

        if (!res.ok) {
          if (data.upgrade && type === "superlike") { setSuperLikeError("Super Likes require Plus or Premium. Upgrade to unlock!"); }
          else if (data.upgrade) { setSuperLikeError("Daily like limit reached! Upgrade for unlimited likes."); }
          else if (data.limit) { setSuperLikeError(data.error); }
          else if (data.error) { setSuperLikeError(data.error); }
          setAction(null);
          return;
        }

        if (data.match) {
          setMatchPopup(profiles[current]);
          setTimeout(() => setMatchPopup(null), 4000);
        }
      } catch {}
    }

    setTimeout(() => { setAction(null); setCurrent(p => p + 1); setShowDetails(false); }, 500);
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const profile = profiles[current];

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin"/></div>;

  if (!profile) return (
    <div className={"rounded-3xl border p-8 sm:p-12 text-center max-w-md mx-auto mt-6 sm:mt-10 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-lg")}>
      <div className="w-20 h-20 mx-auto bg-gradient-to-br from-rose-100 to-pink-100 rounded-full flex items-center justify-center mb-5"><Heart className="w-10 h-10 text-rose-500" /></div>
      <h2 className={"text-2xl font-extrabold mb-2 " + (dc?"text-white":"text-gray-900")}>All Caught Up!</h2>
      <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>You have seen everyone for now. Check back later for new profiles!</p>
      <div className="flex flex-col gap-3">
        <Link href="/dashboard/browse" className="py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg">Browse All People</Link>
        <button onClick={()=>setCurrent(0)} className={"py-3 border-2 rounded-full font-bold text-sm " + (dc?"border-gray-600 text-gray-400":"border-gray-200 text-gray-600")}>Start Over</button>
      </div>
    </div>
  );

  // Match popup
  const MatchPopup = () => matchPopup ? (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setMatchPopup(null)}>
      <div className={"p-8 rounded-3xl text-center max-w-sm mx-4 w-[92%] shadow-2xl " + (dc ? "bg-gray-800" : "bg-white")} onClick={e => e.stopPropagation()}>
        <div className="flex justify-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-rose-200/50 border-4 border-white">
            {user.profilePhoto ? <img src={user.profilePhoto} className="w-full h-full rounded-full object-cover" /> : user.name?.[0] || "?"}
          </div>
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-3xl shadow-xl shadow-purple-200/50 border-4 border-white">
            {matchPopup.profilePhoto ? <img src={matchPopup.profilePhoto} className="w-full h-full rounded-full object-cover" /> : matchPopup.name?.[0] || "?"}
          </div>
        </div>
        <div className="relative">
          <p className="text-5xl mb-2 animate-bounce">💕</p>
          <span className="absolute -top-2 -left-4 text-2xl animate-ping" style={{animationDuration:"1.5s"}}>💖</span>
          <span className="absolute -top-1 -right-3 text-xl animate-ping" style={{animationDuration:"2s"}}>💗</span>
          <span className="absolute top-4 -right-6 text-lg animate-ping" style={{animationDuration:"2.5s"}}>✨</span>
          <span className="absolute top-3 -left-5 text-lg animate-ping" style={{animationDuration:"1.8s"}}>💘</span>
        </div>
        <h2 className={"text-3xl font-extrabold mb-2 bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent"}>It&apos;s a Match!</h2>
        <p className={"text-sm mb-6 " + (dc ? "text-gray-400" : "text-gray-500")}>You and {matchPopup.name} liked each other</p>
        <div className="flex gap-3">
          <Link href={"/dashboard/messages?chat=" + matchPopup.id} className="flex-1 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold text-sm hover:shadow-lg transition-all">Send Message</Link>
          <button onClick={() => setMatchPopup(null)} className={"flex-1 py-3 rounded-full font-bold text-sm border-2 " + (dc ? "border-gray-600 text-gray-400" : "border-gray-200 text-gray-600")}>Keep Swiping</button>
        </div>
      </div>
    </div>
  ) : null;

  const tierGrad = profile.tier==="gold"?"from-amber-400 to-orange-500":profile.tier==="premium"?"from-rose-500 to-purple-500":"from-rose-400 to-pink-500";

  return (
    <div className="max-w-lg lg:max-w-4xl mx-auto">
      {/* Greeting */}
      <div className="mb-5">
        <h1 className={"text-xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          {new Date().getHours() < 12 ? "Good morning" : new Date().getHours() < 18 ? "Good afternoon" : "Good evening"}, <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">{user?.name?.split(" ")[0] || "there"}</span> 👋
        </h1>
        <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-400")}>
          {profiles.length - current > 0 ? <><Sparkles className="w-3.5 h-3.5 text-rose-500 inline mr-1" />{profiles.length - current} people waiting to meet you</> : "Check back soon for new matches!"}
        </p>
      </div>

      {/* Online Now */}
      {(() => {
        const onlineNow = profiles.filter(p => p.lastSeen && Date.now() - new Date(p.lastSeen).getTime() < 300000 && p.profilePhoto);
        if (onlineNow.length === 0) return null;
        return (
          <div className="mb-4 -mx-1">
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className={"text-xs font-bold " + (dc?"text-gray-300":"text-gray-700")}>Online Now</span>
            </div>
            <div className="flex gap-2.5 overflow-x-auto pb-2 px-1 scrollbar-none">
              {onlineNow.slice(0, 10).map(u => (
                <Link key={u.id} href={"/dashboard/user?id=" + u.id} className="flex-shrink-0 text-center">
                  <div className="relative">
                    <img src={u.profilePhoto} className="w-14 h-14 rounded-full object-cover border-2 border-emerald-400" alt="" />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-400 rounded-full border-2 border-white" />
                  </div>
                  <p className={"text-[9px] font-medium mt-1 truncate max-w-[60px] " + (dc?"text-gray-400":"text-gray-600")}>{u.name?.split(" ")[0]}</p>
                </Link>
              ))}
            </div>
          </div>
        );
      })()}

      {/* ═══ TOP PICKS ═══ */}
      {profiles.length > 1 && (
        <div className="mb-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>Top Picks For You ✨</h2>
            <Link href="/dashboard/browse" className="text-xs text-rose-500 font-medium">See all</Link>
          </div>
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
            {profiles.filter((_, i) => i !== current).slice(0, 8).map(p => (
              <Link key={p.id} href={"/dashboard/user?id=" + p.id} className="flex-shrink-0 group">
                <div className="relative w-[72px]">
                  <div className={"w-[72px] h-[96px] rounded-2xl overflow-hidden border-2 transition-all " + (dc ? "border-gray-700 group-hover:border-rose-500/50" : "border-gray-100 group-hover:border-rose-300")}>
                    {p.profilePhoto ? (
                      <img src={p.profilePhoto} className="w-full h-full object-cover group-hover:scale-105 transition-transform" alt="" />
                    ) : (
                      <div className={"w-full h-full bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg"}>{p.name?.[0]}</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <p className="absolute bottom-1.5 left-0 right-0 text-[9px] font-bold text-white text-center truncate px-1">{p.name?.split(" ")[0]}{p.age ? ", " + p.age : ""}</p>
                  </div>
                  {p.lastSeen && Date.now() - new Date(p.lastSeen).getTime() < 300000 && (
                    <div className={"absolute -top-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 " + (dc?"border-gray-900":"border-gray-50")} />
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Main cards — two side by side on desktop */}
      <div className="lg:grid lg:grid-cols-2 lg:gap-6">
      <div className={"relative rounded-3xl overflow-hidden shadow-2xl border mx-auto max-w-sm sm:max-w-md lg:max-w-none " + (dc?"border-gray-700 shadow-black/50":"border-gray-100 shadow-rose-100/50") + " " + (action==="like"?"translate-x-20 rotate-6 opacity-0":action==="pass"?"-translate-x-20 -rotate-6 opacity-0":"") + " transition-all duration-500"}>
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
                  {(profile.detectedCity || profile.detectedCountry || profile.country) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {profile.detectedCity ? profile.detectedCity + ", " + (profile.detectedCountry || profile.country) : profile.detectedCountry || profile.country}</span>}
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
      {/* Action buttons */}
      <div className="flex items-center justify-center gap-4 mt-4 pb-4">
        {lastPassed !== null && (
          <button onClick={rewind} className={"w-10 h-10 sm:w-11 sm:h-11 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 " + (dc?"border-gray-600 text-amber-400 hover:border-amber-500 bg-gray-800":"border-gray-200 text-amber-500 hover:border-amber-400 bg-white shadow-lg")} title="Rewind">
            <RotateCcw className="w-5 h-5" />
          </button>
        )}
        <button onClick={()=>handleAction("pass")} className={"w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 " + (dc?"border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500 bg-gray-800":"border-gray-200 text-gray-400 hover:border-red-400 hover:text-red-500 bg-white shadow-lg")}>
          <X className="w-7 h-7" />
        </button>
        <button onClick={()=>handleAction("superlike")} className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 text-white flex items-center justify-center shadow-lg shadow-blue-200/50 hover:scale-110 transition-all">
          <Star className="w-6 h-6" />
        </button>
        <button onClick={()=>handleAction("like")} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-xl shadow-rose-200/50 hover:scale-110 transition-all">
          <Heart className="w-8 h-8" />
        </button>
        <Link href={"/dashboard/messages"} className={"w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all hover:scale-110 " + (dc?"border-gray-600 text-gray-400 hover:border-purple-500 hover:text-purple-400 bg-gray-800":"border-gray-200 text-gray-400 hover:border-purple-400 hover:text-purple-500 bg-white shadow-lg")}>
          <MessageCircle className="w-6 h-6" />
        </Link>
      </div>
      </div>

      {/* Second card — desktop only */}
      {profiles[current + 1] && (
        <div className={"hidden lg:block relative rounded-3xl overflow-hidden shadow-2xl border " + (dc?"border-gray-700 shadow-black/50":"border-gray-100 shadow-rose-100/50")}>
          {(() => {
            const p2 = profiles[current + 1];
            const t2 = p2.tier==="gold"?"from-amber-400 to-orange-500":p2.tier==="premium"?"from-rose-500 to-purple-500":"from-rose-400 to-pink-500";
            return (
              <>
                <div className="relative aspect-[3/4] cursor-pointer" onClick={() => setCurrent(current + 1)}>
                  {p2.profilePhoto ? <img src={p2.profilePhoto} className="w-full h-full object-cover" /> : <div className={"w-full h-full bg-gradient-to-br " + t2 + " flex items-center justify-center"}><span className="text-8xl font-bold text-white/20">{p2.name[0]}</span></div>}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                  {p2.lastSeen && Date.now() - new Date(p2.lastSeen).getTime() < 300000 && <div className="absolute top-4 left-4 bg-emerald-500 text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><span className="w-2 h-2 bg-white rounded-full animate-pulse" /> Online</div>}
                  {p2.verified && <div className="absolute top-4 right-4 bg-blue-500/90 backdrop-blur text-white text-[11px] font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5"><Shield className="w-3.5 h-3.5" /> Verified</div>}
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h2 className="text-white text-3xl font-extrabold mb-1">{p2.name}{p2.age ? <span className="font-normal text-2xl">, {p2.age}</span> : ""}</h2>
                    <div className="flex items-center gap-3 text-white/80 text-sm">
                      {(p2.detectedCity || p2.country) && <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {p2.detectedCity || p2.country}</span>}
                      {p2.gender && <span>{p2.gender}</span>}
                    </div>
                  </div>
                </div>
                <div className={"p-4 flex justify-center gap-3 " + (dc?"bg-gray-800":"bg-white")}>
                  <button onClick={() => { setCurrent(c => c + 1); }} className={"w-12 h-12 rounded-full flex items-center justify-center border-2 hover:scale-110 transition-transform " + (dc?"border-gray-600 text-gray-400 hover:border-red-500 hover:text-red-500":"border-gray-200 text-gray-400 hover:border-red-500 hover:text-red-500")}><X className="w-6 h-6" /></button>
                  <button onClick={async () => { const res = await fetch("/api/discover", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({targetId:p2.id, type:"like"}) }); const data = await res.json(); if(data.match) setMatchPopup(p2); setCurrent(c => c + 1); }} className="w-14 h-14 rounded-full bg-gradient-to-br from-rose-500 to-pink-500 text-white flex items-center justify-center shadow-lg shadow-rose-300/40 hover:scale-110 transition-transform"><Heart className="w-7 h-7" /></button>
                  <Link href={"/dashboard/user?id=" + p2.id} className={"w-12 h-12 rounded-full flex items-center justify-center border-2 hover:scale-110 transition-transform " + (dc?"border-gray-600 text-blue-400":"border-gray-200 text-blue-500")}><Eye className="w-5 h-5" /></Link>
                </div>
              </>
            );
          })()}
        </div>
      )}
      </div>
      {/* Navigation hint */}
      <p className={"text-center text-xs mt-4 " + (dc?"text-gray-600":"text-gray-400")}>
        {todayLikes + todayPasses > 0 && <><span className="text-rose-500">♥ {todayLikes}</span> · <span>✕ {todayPasses}</span> · </>}Card {current + 1} of {profiles.length}
      </p>

      {/* Quick Actions Bar */}
      <div className="flex gap-2 mt-5">
        <button onClick={async () => {
          const res = await fetch("/api/boost", { method: "POST" });
          const data = await res.json();
          if (res.ok) { alert("🚀 Profile boosted for 30 minutes! You'll appear at the top of everyone's feed."); }
          else if (data.upgrade) { setSuperLikeError("Profile boost requires Plus or Premium. Upgrade to stand out!"); }
          else { alert(data.error || "Could not boost"); }
        }} className={"flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:shadow-md " + (dc?"bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 text-amber-600 hover:bg-amber-100")}>
          <Zap className="w-4 h-4" /> Boost Profile
        </button>
        <Link href="/dashboard/liked" className={"flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:shadow-md " + (dc?"bg-gradient-to-r from-rose-500/10 to-pink-500/10 border-rose-500/30 text-rose-400 hover:bg-rose-500/20":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-200 text-rose-600 hover:bg-rose-100")}>
          <Heart className="w-4 h-4" /> Who Likes Me
        </Link>
        <Link href="/dashboard/video" className={"flex-1 py-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 border transition-all hover:shadow-md " + (dc?"bg-gradient-to-r from-purple-500/10 to-violet-500/10 border-purple-500/30 text-purple-400 hover:bg-purple-500/20":"bg-gradient-to-r from-purple-50 to-violet-50 border-purple-200 text-purple-600 hover:bg-violet-100")}>
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" /> Go Live
        </Link>
      </div>
      {/* Super Like error */}
      {superLikeError && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSuperLikeError("")}>
          <div className={(dc ? "bg-gray-900 border-gray-700" : "bg-white border-gray-100") + " rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl border"} onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 mx-auto bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-rose-200/50">
              <span className="text-3xl">👑</span>
            </div>
            <h3 className={"text-xl font-extrabold mb-2 " + (dc ? "text-white" : "text-gray-900")}>Upgrade Your Experience</h3>
            <p className={"text-sm mb-5 leading-relaxed " + (dc ? "text-gray-400" : "text-gray-500")}>{superLikeError}</p>
            <div className={"rounded-xl p-3 mb-5 " + (dc ? "bg-gray-800" : "bg-rose-50")}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className={dc ? "text-gray-400" : "text-gray-500"}>✨ Unlimited likes</span>
                <span className={dc ? "text-gray-400" : "text-gray-500"}>💬 Unlimited messages</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={dc ? "text-gray-400" : "text-gray-500"}>⭐ Super Likes</span>
                <span className={dc ? "text-gray-400" : "text-gray-500"}>🔴 Go Live</span>
              </div>
            </div>
            <a href="/dashboard/upgrade" className="block w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-rose-600 text-white rounded-full font-bold text-sm shadow-lg shadow-rose-200/50 hover:shadow-xl transition-all mb-3">See Plans & Pricing</a>
            <button onClick={() => setSuperLikeError("")} className={"text-xs font-medium " + (dc ? "text-gray-500" : "text-gray-400")}>Maybe later</button>
          </div>
        </div>
      )}

      {/* Match Popup */}
      <MatchPopup />
    </div>
  );
}
