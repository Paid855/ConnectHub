"use client";
import { useState } from "react";
import { useUser, TierBadge } from "../layout";
import { Search, Globe, Shield, Crown, Gem, Tag } from "lucide-react";
import Link from "next/link";

const ALL_INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Swimming","Football","Basketball","Fashion","Coffee","Wine","Dogs","Cats"];

export default function SearchPage() {
  const { dark } = useUser();
  const dc = dark;
  const [query, setQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async (q?: string, interest?: string) => {
    const searchQ = q ?? query;
    const searchI = interest ?? selectedInterest;
    if (!searchQ && !searchI) return;
    setSearching(true); setSearched(true);
    try {
      const params = new URLSearchParams();
      if (searchQ) params.set("q", searchQ);
      if (searchI) params.set("interest", searchI);
      const res = await fetch("/api/search?" + params.toString());
      if (res.ok) { const d = await res.json(); setResults(d.users || []); }
    } catch {} finally { setSearching(false); }
  };

  const isOnline = (d: string) => d && Date.now() - new Date(d).getTime() < 5 * 60 * 1000;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-6 " + (dc?"text-white":"text-gray-900")}>Search Users</h1>

      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="relative mb-4">
          <input className={"w-full px-4 py-3.5 pl-11 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-rose-500":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Search by name, username, or country..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} />
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        </div>

        <p className={"text-xs font-semibold mb-2 " + (dc?"text-gray-400":"text-gray-500")}>Filter by interest:</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ALL_INTERESTS.map(t => (
            <button key={t} onClick={() => { const newI = selectedInterest === t ? "" : t; setSelectedInterest(newI); doSearch(query, newI); }} className={"px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " + (selectedInterest === t ? "bg-rose-500 text-white border-rose-500" : (dc?"bg-gray-700 text-gray-300 border-gray-600 hover:border-rose-400":"bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"))}>{t}</button>
          ))}
        </div>

        <button onClick={() => doSearch()} disabled={searching} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"><Search className="w-4 h-4" /> {searching ? "Searching..." : "Search"}</button>
      </div>

      {searched && (
        <div>
          <p className={"text-sm mb-3 " + (dc?"text-gray-400":"text-gray-500")}>{results.length} {results.length === 1 ? "user" : "users"} found</p>
          {results.length === 0 ? (
            <div className={"text-center py-12 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><p className={dc?"text-gray-500":"text-gray-400"}>No users found matching your search</p></div>
          ) : (
            <div className="space-y-2">
              {results.map(u => (
                <Link key={u.id} href={"/dashboard/user?id=" + u.id} className={"flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700 hover:border-gray-600":"bg-white border-gray-100 hover:border-rose-200")}>
                  <div className="relative">
                    {u.profilePhoto ? <img src={u.profilePhoto} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">{u.name?.[0]}</div>}
                    {isOnline(u.lastSeen) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{u.name}{u.age ? ", "+u.age : ""}</p><TierBadge tier={u.tier} /></div>
                    {u.username && <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>@{u.username}</p>}
                    {u.bio && <p className={"text-xs truncate mt-0.5 " + (dc?"text-gray-400":"text-gray-500")}>{u.bio}</p>}
                    {u.interests?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{u.interests.slice(0, 4).map((t: string) => <span key={t} className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500")}>{t}</span>)}{u.interests.length > 4 && <span className={"text-[10px] " + (dc?"text-gray-500":"text-gray-400")}>+{u.interests.length-4}</span>}</div>}
                  </div>
                  {u.country && <span className={"text-xs flex items-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><Globe className="w-3 h-3" />{u.country}</span>}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
