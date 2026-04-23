"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Eye, Shield, Crown, Gem, Lock, MessageCircle, Sparkles } from "lucide-react";
import Link from "next/link";

export default function ViewsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [views, setViews] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [isPremium, setIsPremium] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile-views").then(r => r.json()).then(d => {
      setViews(d.views || []);
      setTotal(d.total || 0);
      setIsPremium(d.isPremium || false);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className={"text-2xl sm:text-3xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          Who <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Viewed</span> You
        </h1>
        <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>{total} profile view{total!==1?"s":""}</p>
      </div>

      {/* Premium upsell for free users */}
      {!isPremium && total > 0 && (
        <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg"><Sparkles className="w-7 h-7 text-white" /></div>
            <div>
              <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>{total} people viewed your profile!</h3>
              <p className={"text-sm mt-1 " + (dc?"text-gray-400":"text-gray-600")}>Upgrade to Plus or Premium to see who is checking you out</p>
              <Link href="/dashboard/coins" className="inline-block mt-3 px-6 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-sm font-bold hover:shadow-lg transition-all">Upgrade Now</Link>
            </div>
          </div>
        </div>
      )}

      {!isPremium && total > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
          {views.slice(0, 6).map((v: any, i: number) => (
            <div key={v.id} className={"relative rounded-2xl border overflow-hidden aspect-square " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
              <div className={"w-full h-full bg-gradient-to-br from-rose-200 to-pink-200 flex items-center justify-center " + (dc?"from-gray-700 to-gray-600":"")}>
                <Lock className={"w-10 h-10 " + (dc?"text-gray-500":"text-gray-300")} />
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
                <p className="text-white text-xs font-bold">Hidden Profile</p>
                <p className="text-white/60 text-[10px]">{new Date(v.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : total === 0 ? (
        <div className={"rounded-2xl border p-10 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Eye className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>No profile views yet</h3>
          <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>Complete your profile and add a great photo to attract visitors!</p>
          <Link href="/dashboard/profile" className="inline-block mt-4 px-6 py-2.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full text-sm font-bold">Edit Profile</Link>
        </div>
      ) : isPremium ? (
        <div className="space-y-2">
          {views.map((v: any) => (
            <div key={v.id} className={"flex items-center gap-3 p-4 rounded-2xl border transition-all " + (dc?"bg-gray-800 border-gray-700 hover:bg-gray-700/50":"bg-white border-gray-100 hover:shadow-md")}>
              <Link href={"/dashboard/user?id="+v.viewerId} className="relative flex-shrink-0">
                {v.viewer?.profilePhoto ? (
                  <img src={v.viewer.profilePhoto} className="w-14 h-14 rounded-xl object-cover" />
                ) : (
                  <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold text-lg">{v.viewer?.name?.[0]||"?"}</div>
                )}
                {isOnline(v.viewer?.lastSeen) && <div className={"absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 " + (dc?"border-gray-800":"border-white")} />}
              </Link>
              <Link href={"/dashboard/user?id="+v.viewerId} className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{v.viewer?.name || "User"}</p>
                  {v.viewer?.verified && <Shield className="w-3.5 h-3.5 text-blue-500" />}
                  {v.viewer?.tier==="gold" && <Crown className="w-3.5 h-3.5 text-amber-500" />}
                  {v.viewer?.tier==="premium" && <Gem className="w-3.5 h-3.5 text-rose-500" />}
                </div>
                <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>
                  {v.viewer?.country || ""} {v.viewer?.age ? "· "+v.viewer.age : ""} · Viewed {new Date(v.createdAt).toLocaleDateString()}
                </p>
              </Link>
              <Link href={"/dashboard/messages?user="+v.viewerId} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all">
                <MessageCircle className="w-5 h-5" />
              </Link>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
