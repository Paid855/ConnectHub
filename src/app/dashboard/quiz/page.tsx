"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Heart, Sparkles, Crown, Globe, Coins, Trophy, Gift, Zap, Star, Users, ArrowRight, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function EntertainmentPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [topGifters, setTopGifters] = useState<any[]>([]);

  useEffect(() => {
    fetch("/api/leaderboard").then(r=>r.json()).then(d => {
      setLeaderboard(d.popular || []);
      setTopGifters(d.gifters || []);
    }).catch(() => {});
  }, []);

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-6 " + (dc?"text-white":"text-gray-900")}>Explore</h1>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <Link href="/dashboard/coins" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-amber-500/30":"bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200")}>
          <Coins className={"w-8 h-8 mb-2 " + (dc?"text-amber-400":"text-amber-500")} />
          <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Buy Coins</h3>
          <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Get coins for gifts & upgrades</p>
        </Link>
        <Link href="/dashboard/referral" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-gradient-to-br from-violet-500/10 to-purple-500/10 border-violet-500/30":"bg-gradient-to-br from-violet-50 to-purple-50 border-violet-200")}>
          <Gift className={"w-8 h-8 mb-2 " + (dc?"text-violet-400":"text-violet-500")} />
          <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Invite Friends</h3>
          <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Earn 50 coins per invite</p>
        </Link>
        <Link href="/dashboard/stories" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-gradient-to-br from-rose-500/10 to-pink-500/10 border-rose-500/30":"bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200")}>
          <Sparkles className={"w-8 h-8 mb-2 " + (dc?"text-rose-400":"text-rose-500")} />
          <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Stories</h3>
          <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Share moments that disappear</p>
        </Link>
        <Link href="/dashboard/video" className={"rounded-2xl border p-5 hover:shadow-md transition-all " + (dc?"bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-blue-500/30":"bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200")}>
          <Zap className={"w-8 h-8 mb-2 " + (dc?"text-blue-400":"text-blue-500")} />
          <h3 className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>Go Live</h3>
          <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Stream & earn coins</p>
        </Link>
      </div>

      {/* Daily bonus */}
      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
        <div className="flex items-center gap-3">
          <div className="text-3xl">🎁</div>
          <div className="flex-1">
            <h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>Daily Login Reward</h3>
            <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>Come back every day for free coins!</p>
          </div>
          <div className="flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500" /><span className={"font-bold " + (dc?"text-amber-400":"text-amber-600")}>+10/day</span></div>
        </div>
      </div>

      {/* How to earn */}
      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>How to Earn Coins</h3>
        <div className="space-y-3">
          {[
            { emoji:"🎁", action:"Daily login", reward:"+10 coins/day" },
            { emoji:"👫", action:"Invite a friend", reward:"+50 coins" },
            { emoji:"📸", action:"Complete profile", reward:"+25 coins" },
            { emoji:"✅", action:"Get verified", reward:"+100 coins" },
            { emoji:"📱", action:"Go live & receive gifts", reward:"80% of gift value" },
          ].map((item, i) => (
            <div key={i} className={"flex items-center gap-3 p-3 rounded-xl " + (dc?"bg-gray-700/50":"bg-gray-50")}>
              <span className="text-xl">{item.emoji}</span>
              <span className={"flex-1 text-sm " + (dc?"text-gray-300":"text-gray-700")}>{item.action}</span>
              <span className={"text-xs font-bold " + (dc?"text-emerald-400":"text-emerald-600")}>{item.reward}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Leaderboard preview */}
      {leaderboard.length > 0 && (
        <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <div className="flex items-center justify-between mb-4">
            <h3 className={"font-bold flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Trophy className="w-5 h-5 text-amber-500" /> Top Popular</h3>
            <Link href="/dashboard/leaderboard" className="text-xs text-rose-500 font-semibold hover:underline">View all →</Link>
          </div>
          <div className="space-y-2">
            {leaderboard.slice(0, 5).map((u: any, i: number) => (
              <Link key={u.id} href={"/dashboard/user?id=" + u.id} className={"flex items-center gap-3 p-3 rounded-xl " + (dc?"bg-gray-700/50 hover:bg-gray-700":"bg-gray-50 hover:bg-gray-100")}>
                <span className="text-lg w-6 text-center">{i<3?["🥇","🥈","🥉"][i]:"#"+(i+1)}</span>
                {u.profilePhoto ? <img src={u.profilePhoto} className="w-9 h-9 rounded-full object-cover" /> : <div className="w-9 h-9 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">{u.name?.[0]}</div>}
                <div className="flex-1"><p className={"text-sm font-medium " + (dc?"text-white":"text-gray-900")}>{u.name}</p></div>
                <TierBadge tier={u.tier} />
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
