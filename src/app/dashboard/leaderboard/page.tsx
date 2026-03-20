"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Trophy, Gift, Eye, Crown, Coins, Medal } from "lucide-react";

export default function LeaderboardPage() {
  const { dark } = useUser();
  const dc = dark;
  const [data, setData] = useState<any>({ topGifters:[], topReceivers:[], mostPopular:[] });
  const [tab, setTab] = useState("gifters");

  useEffect(() => { fetch("/api/leaderboard").then(r=>r.json()).then(setData).catch(()=>{}); }, []);

  const medals = ["🥇","🥈","🥉"];

  const renderList = (items: any[], valueKey: string, valueLabel: string) => (
    items.length === 0 ? <p className={"text-center py-10 text-sm " + (dc?"text-gray-500":"text-gray-400")}>No data yet. Be the first!</p> :
    items.map((item: any, i: number) => (
      <div key={i} className={"flex items-center gap-3 p-3 rounded-xl " + (i<3?(dc?"bg-amber-500/10":"bg-amber-50"):(dc?"bg-gray-700/50":"bg-gray-50")) + " mb-2"}>
        <span className="text-xl w-8 text-center">{i < 3 ? medals[i] : <span className={"text-sm font-bold " + (dc?"text-gray-500":"text-gray-400")}>#{i+1}</span>}</span>
        {item.user?.profilePhoto ? <img src={item.user.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{item.user?.name?.[0]||"?"}</div>}
        <div className="flex-1 min-w-0">
          <p className={"text-sm font-bold truncate " + (dc?"text-white":"text-gray-900")}>{item.user?.name||"User"}</p>
          <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{item.user?.country||""}</p>
        </div>
        <div className="text-right">
          <p className={"text-sm font-bold " + (i<3?"text-amber-500":(dc?"text-gray-300":"text-gray-700"))}>{item[valueKey]?.toLocaleString()}</p>
          <p className={"text-[10px] " + (dc?"text-gray-500":"text-gray-400")}>{valueLabel}</p>
        </div>
      </div>
    ))
  );

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6"><Trophy className="w-7 h-7 text-amber-500" /><h1 className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>Leaderboard</h1></div>

      <div className={"flex gap-1 mb-6 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        {[{k:"gifters",l:"Top Gifters",icon:Gift},{k:"receivers",l:"Most Gifted",icon:Crown},{k:"popular",l:"Most Popular",icon:Eye}].map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} className={"flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab===t.k?(dc?"bg-gray-700 text-white shadow":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}><t.icon className="w-4 h-4" /> {t.l}</button>
        ))}
      </div>

      <div className={(dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100") + " rounded-2xl border shadow-sm p-5"}>
        {tab === "gifters" && renderList(data.topGifters, "coins", "coins gifted")}
        {tab === "receivers" && renderList(data.topReceivers, "coins", "coins received")}
        {tab === "popular" && renderList(data.mostPopular, "views", "profile views")}
      </div>
    </div>
  );
}
