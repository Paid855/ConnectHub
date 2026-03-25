"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "./layout";
import { Heart, X, Shield, MapPin, Star, Sparkles, Eye, MessageCircle, ChevronLeft, ChevronRight, Zap, Crown } from "lucide-react";
import Link from "next/link";
import AdBanner from "@/components/AdBanner";

export default function DiscoverPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [profiles, setProfiles] = useState<any[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [action, setAction] = useState<"like"|"pass"|null>(null);
  const [recentPosts, setRecentPosts] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      const [uRes, fRes] = await Promise.all([
        fetch("/api/users"),
        fetch("/api/feed")
      ]);
      if (uRes.ok) { const d = await uRes.json(); setProfiles(d.users || []); }
      if (fRes.ok) { const d = await fRes.json(); setRecentPosts((d.feed || []).slice(0, 10)); }
      setLoading(false);
    };
    load();
  }, []);

  const handleAction = async (type: "like"|"pass") => {
    if (!profiles[current]) return;
    setAction(type);
    if (type === "like") {
      await fetch("/api/friends", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ friendId: profiles[current].id }) }).catch(()=>{});
    }
    setTimeout(() => { setAction(null); setCurrent(p => p + 1); }, 300);
  };

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const profile = profiles[current];

  if (!user) return null;
  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto">
      <AdBanner dark={dc} />

      {/* Swipe cards */}
      {profile ? (
        <div className="mb-6">
          <div className={"rounded-3xl overflow-hidden shadow-lg border relative " + (dc?"border-gray-700":"border-gray-100") + (action === "like" ? " translate-x-4 opacity-80" : action === "pass" ? " -translate-x-4 opacity-80" : "") + " transition-all duration-300"}>
            {/* Photo */}
            <div className="relative h-[350px] sm:h-[420px]">
              {profile.profilePhoto ? (
                <img src={profile.profilePhoto} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-rose-400 via-pink-400 to-purple-400 flex items-center justify-center"><span className="text-white text-8xl font-bold">{profile.name?.[0]}</span></div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

              {/* Top badges */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                <div className="flex gap-2">
                  {isOnline(profile.lastSeen) && <span className="bg-emerald-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Online</span>}
                  {profile.verified && <span className="bg-blue-500 text-white text-xs px-2.5 py-1 rounded-full font-bold flex items-center gap-1"><Shield className="w-3 h-3" /> Verified</span>}
                </div>
                <TierBadge tier={profile.tier} />
              </div>

              {/* Bottom info */}
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h2 className="text-2xl font-bold text-white">{profile.name}{profile.age ? ", " + profile.age : ""}</h2>
                {profile.country && <p className="text-white/80 text-sm flex items-center gap-1 mt-1"><MapPin className="w-3.5 h-3.5" /> {profile.country}</p>}
                {profile.bio && <p className="text-white/70 text-sm mt-2 line-clamp-2">{profile.bio}</p>}
                {profile.interests?.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">{profile.interests.slice(0, 5).map((t: string) => <span key={t} className="bg-white/20 backdrop-blur-sm text-white text-xs px-2.5 py-1 rounded-full">{t}</span>)}</div>
                )}
              </div>

              {/* Like/Pass overlay */}
              {action === "like" && <div className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"><Heart className="w-24 h-24 text-emerald-500 fill-emerald-500" /></div>}
              {action === "pass" && <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center"><X className="w-24 h-24 text-red-500" /></div>}
            </div>

            {/* Action buttons */}
            <div className={"flex items-center justify-center gap-4 py-4 " + (dc?"bg-gray-800":"bg-white")}>
              <button onClick={() => handleAction("pass")} className="w-14 h-14 rounded-full border-2 border-red-200 flex items-center justify-center text-red-400 hover:bg-red-50 hover:scale-110 transition-all"><X className="w-7 h-7" /></button>
              <Link href={"/dashboard/user?id=" + profile.id} className="w-11 h-11 rounded-full border-2 border-blue-200 flex items-center justify-center text-blue-400 hover:bg-blue-50 hover:scale-110 transition-all"><Eye className="w-5 h-5" /></Link>
              <button onClick={() => handleAction("like")} className="w-14 h-14 rounded-full bg-gradient-to-r from-rose-500 to-pink-500 flex items-center justify-center text-white hover:scale-110 transition-all shadow-lg"><Heart className="w-7 h-7" /></button>
            </div>
          </div>
          <p className={"text-center text-xs mt-3 " + (dc?"text-gray-500":"text-gray-400")}>{current + 1} of {profiles.length} profiles</p>
        </div>
      ) : (
        <div className={"rounded-2xl border p-12 text-center mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Sparkles className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <h3 className={"text-lg font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>{profiles.length > 0 ? "You've seen everyone!" : "No profiles yet"}</h3>
          <p className={"text-sm mb-4 " + (dc?"text-gray-500":"text-gray-400")}>{profiles.length > 0 ? "Check back later for new matches" : "Invite friends to join ConnectHub!"}</p>
          {profiles.length > 0 && <button onClick={() => setCurrent(0)} className="px-5 py-2 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-semibold hover:shadow-lg">Start Over</button>}
        </div>
      )}

      {/* Recent activity feed */}
      {recentPosts.length > 0 && (
        <div>
          <h3 className={"font-bold mb-3 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Sparkles className="w-5 h-5 text-rose-500" /> Recent Activity</h3>
          <div className="space-y-3">
            {recentPosts.map((post: any) => (
              <div key={post.id} className={"rounded-2xl border p-4 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
                <div className="flex items-center gap-3 mb-2">
                  <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)}>
                    {post.user?.profilePhoto ? <img src={post.user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{post.user?.name?.[0] || "?"}</div>}
                  </Link>
                  <div className="flex-1">
                    <Link href={"/dashboard/user?id=" + (post.user?.id || post.userId)} className={"text-sm font-bold hover:text-rose-500 " + (dc?"text-white":"text-gray-900")}>{post.user?.name || "User"}</Link>
                    <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                {post.content && <p className={"text-sm mb-2 " + (dc?"text-gray-300":"text-gray-700")}>{post.content}</p>}
                {post.image && !post.image.startsWith("[VID]") && !post.image.startsWith("[VOICE]") && (
                  <img src={post.image.replace("[IMG]", "")} className="w-full rounded-xl max-h-64 object-cover" />
                )}
                {post.image && post.image.startsWith("[VID]") && (
                  <video src={post.image.replace("[VID]", "")} controls className="w-full rounded-xl max-h-64" />
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
