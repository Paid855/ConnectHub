"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Eye, Shield, Crown, Gem, Lock, Sparkles, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function ViewsPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [views, setViews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/profile-views").then(r=>r.json()).then(d=>{setViews(d.views||[]);setLoading(false);}).catch(()=>setLoading(false));
  }, []);

  const isOnline = (d: string|null) => d ? Date.now() - new Date(d).getTime() < 5*60*1000 : false;
  const isPremium = user?.tier === "premium" || user?.tier === "gold";

  if (!user) return null;

  return (
    <div>
      <div className="mb-6">
        <h1 className={"text-2xl sm:text-3xl font-extrabold " + (dc?"text-white":"text-gray-900")}>
          Who <span className="bg-gradient-to-r from-rose-500 to-pink-500 bg-clip-text text-transparent">Viewed</span> You
        </h1>
        <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>{views.length} profile view{views.length!==1?"s":""}</p>
      </div>

      {!isPremium && (
        <div className={"rounded-2xl border p-6 mb-6 bg-gradient-to-r " + (dc?"from-amber-500/10 to-orange-500/10 border-amber-500/30":"from-amber-50 to-orange-50 border-amber-200")}>
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-xl flex items-center justify-center flex-shrink-0"><Lock className="w-6 h-6 text-white" /></div>
            <div>
              <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Upgrade to see who viewed you</h3>
              <p className={"text-xs mt-0.5 " + (dc?"text-gray-400":"text-gray-600")}>Premium and Gold members can see everyone who visits their profile</p>
              <Link href="/dashboard/coins" className="inline-block mt-3 px-5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-full text-xs font-bold hover:shadow-lg">Upgrade Now</Link>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12"><div className="w-10 h-10 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" /></div>
      ) : views.length === 0 ? (
        <div className={"rounded-2xl border p-10 text-center " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}>
          <Eye className={"w-12 h-12 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} />
          <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>No profile views yet</h3>
          <p className={"text-sm mt-1 " + (dc?"text-gray-500":"text-gray-500")}>Complete your profile to attract more visitors!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {views.map((v: any) => (
            <div key={v.id} className={"flex items-center gap-3 p-4 rounded-2xl border transition-all " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 hover:shadow-md")}>
              <Link href={isPremium ? "/dashboard/user?id="+v.viewerId : "#"} className="relative flex-shrink-0">
                {isPremium ? (
                  v.viewer?.profilePhoto ? <img src={v.viewer.profilePhoto} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center text-white font-bold">{v.viewer?.name?.[0]||"?"}</div>
                ) : (
                  <div className={"w-14 h-14 rounded-xl flex items-center justify-center " + (dc?"bg-gray-700":"bg-gray-200")}><Lock className="w-6 h-6 text-gray-400" /></div>
                )}
                {isPremium && isOnline(v.viewer?.lastSeen) && <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white dark:border-gray-800" />}
              </Link>
              <div className="flex-1 min-w-0">
                <p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{isPremium ? v.viewer?.name || "User" : "Hidden"}</p>
                <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Viewed {new Date(v.createdAt).toLocaleDateString()}</p>
              </div>
              {isPremium && (
                <Link href={"/dashboard/messages?user="+(v.viewerId||v.viewer?.id)} className="w-10 h-10 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-xl flex items-center justify-center hover:shadow-lg transition-all">
                  <MessageCircle className="w-5 h-5" />
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
