"use client";
import { useState } from "react";
import { useUser, TierBadge } from "../layout";
import { Search, Globe, Shield, MapPin, Filter, X, ChevronDown } from "lucide-react";
import Link from "next/link";

const ALL_INTERESTS = ["Travel","Music","Cooking","Fitness","Photography","Art","Reading","Movies","Gaming","Dancing","Yoga","Hiking","Swimming","Football","Basketball","Fashion","Coffee","Wine","Dogs","Cats","Gardening","Meditation","Writing","Singing","Comedy","Cycling","Running","Beach","Mountains","Camping"];

export default function SearchPage() {
  const { user, dark } = useUser();
  const dc = dark;
  const [query, setQuery] = useState("");
  const [selectedInterest, setSelectedInterest] = useState("");
  const [ageMin, setAgeMin] = useState("");
  const [ageMax, setAgeMax] = useState("");
  const [country, setCountry] = useState("");
  const [gender, setGender] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);

  const doSearch = async () => {
    if (!query && !selectedInterest && !country && !gender && !ageMin && !ageMax) return;
    setSearching(true); setSearched(true);
    try {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (selectedInterest) params.set("interest", selectedInterest);
      if (ageMin) params.set("ageMin", ageMin);
      if (ageMax) params.set("ageMax", ageMax);
      if (country) params.set("country", country);
      if (gender) params.set("gender", gender);
      const res = await fetch("/api/search?" + params.toString());
      if (res.ok) { const d = await res.json(); setResults(d.users || []); }
    } catch {} finally { setSearching(false); }
  };

  const clearFilters = () => { setSelectedInterest(""); setAgeMin(""); setAgeMax(""); setCountry(""); setGender(""); };
  const hasFilters = selectedInterest || ageMin || ageMax || country || gender;
  const isOnline = (d: string) => d && Date.now() - new Date(d).getTime() < 5 * 60 * 1000;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-6 " + (dc?"text-white":"text-gray-900")}>Search Users</h1>

      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        {/* Main search bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <input className={"w-full px-4 py-3.5 pl-11 rounded-xl border outline-none text-sm " + (dc?"bg-gray-700 border-gray-600 text-white focus:ring-2 focus:ring-rose-500":"bg-white border-gray-200 focus:ring-2 focus:ring-rose-300")} placeholder="Search by name, username, or country..." value={query} onChange={e => setQuery(e.target.value)} onKeyDown={e => e.key === "Enter" && doSearch()} />
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>
          <button onClick={() => setShowFilters(!showFilters)} className={"w-11 h-11 rounded-xl border flex items-center justify-center flex-shrink-0 transition-all " + (showFilters || hasFilters ? (dc?"bg-rose-500/20 border-rose-500/30 text-rose-400":"bg-rose-50 border-rose-200 text-rose-500") : (dc?"bg-gray-700 border-gray-600 text-gray-400 hover:text-white":"bg-white border-gray-200 text-gray-400 hover:text-gray-600"))}>
            <Filter className="w-4 h-4" />
          </button>
        </div>

        {/* Filters panel */}
        {showFilters && (
          <div className={"rounded-xl border p-4 mb-4 " + (dc?"bg-gray-700/50 border-gray-600":"bg-gray-50 border-gray-200")}>
            <div className="flex items-center justify-between mb-3">
              <p className={"text-xs font-bold uppercase tracking-wider " + (dc?"text-gray-400":"text-gray-500")}>Filters</p>
              {hasFilters && <button onClick={clearFilters} className="text-xs text-rose-500 font-medium hover:underline flex items-center gap-1"><X className="w-3 h-3" /> Clear all</button>}
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className={"block text-xs font-medium mb-1 " + (dc?"text-gray-400":"text-gray-500")}>Age Range</label>
                <div className="flex items-center gap-2">
                  <input type="number" min="18" max="99" className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} placeholder="Min" value={ageMin} onChange={e => setAgeMin(e.target.value)} />
                  <span className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>to</span>
                  <input type="number" min="18" max="99" className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} placeholder="Max" value={ageMax} onChange={e => setAgeMax(e.target.value)} />
                </div>
              </div>
              <div>
                <label className={"block text-xs font-medium mb-1 " + (dc?"text-gray-400":"text-gray-500")}>Gender</label>
                <select className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} value={gender} onChange={e => setGender(e.target.value)}>
                  <option value="">Any gender</option><option>Man</option><option>Woman</option><option>Non-binary</option>
                </select>
              </div>
            </div>
            <div className="mb-3">
              <label className={"block text-xs font-medium mb-1 " + (dc?"text-gray-400":"text-gray-500")}>Country</label>
              <input className={"w-full px-3 py-2 rounded-lg border text-sm outline-none " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200")} placeholder="Type a country name..." value={country} onChange={e => setCountry(e.target.value)} />
            </div>
          </div>
        )}

        {/* Interest tags */}
        <p className={"text-xs font-semibold mb-2 " + (dc?"text-gray-400":"text-gray-500")}>Filter by interest:</p>
        <div className="flex flex-wrap gap-1.5 mb-4">
          {ALL_INTERESTS.slice(0, 15).map(t => (
            <button key={t} onClick={() => { setSelectedInterest(selectedInterest === t ? "" : t); }} className={"px-3 py-1.5 rounded-full text-xs font-semibold border transition-all " + (selectedInterest === t ? "bg-rose-500 text-white border-rose-500" : (dc?"bg-gray-700 text-gray-300 border-gray-600 hover:border-rose-400":"bg-gray-50 text-gray-600 border-gray-200 hover:border-rose-300"))}>{t}</button>
          ))}
        </div>

        <button onClick={doSearch} disabled={searching} className="w-full py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"><Search className="w-4 h-4" /> {searching ? "Searching..." : "Search"}</button>
      </div>

      {searched && (
        <div>
          <p className={"text-sm mb-3 " + (dc?"text-gray-400":"text-gray-500")}>{results.length} {results.length === 1 ? "user" : "users"} found</p>
          {results.length === 0 ? (
            <div className={"text-center py-12 rounded-2xl border " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100")}><Search className={"w-10 h-10 mx-auto mb-3 " + (dc?"text-gray-600":"text-gray-300")} /><p className={dc?"text-gray-500":"text-gray-400"}>No users found</p></div>
          ) : (
            <div className="space-y-2">
              {results.map(u => (
                <Link key={u.id} href={"/dashboard/user?id=" + u.id} className={"flex items-center gap-3 p-4 rounded-xl border transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700 hover:border-gray-600":"bg-white border-gray-100 hover:border-rose-200")}>
                  <div className="relative">
                    {u.profilePhoto ? <img src={u.profilePhoto} className="w-14 h-14 rounded-xl object-cover" /> : <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-lg">{u.name?.[0]}</div>}
                    {isOnline(u.lastSeen) && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className={"font-bold text-sm " + (dc?"text-white":"text-gray-900")}>{u.name}{u.age ? ", "+u.age : ""}</p>{u.verified&&<Shield className="w-3.5 h-3.5 text-blue-500 fill-blue-100"/>}<TierBadge tier={u.tier} /></div>
                    {u.username && <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>@{u.username}</p>}
                    {u.bio && <p className={"text-xs truncate mt-0.5 " + (dc?"text-gray-400":"text-gray-500")}>{u.bio}</p>}
                    {u.interests?.length > 0 && <div className="flex flex-wrap gap-1 mt-1">{u.interests.slice(0, 4).map((t: string) => <span key={t} className={"text-[10px] font-semibold px-2 py-0.5 rounded-full " + (dc?"bg-rose-500/20 text-rose-400":"bg-rose-50 text-rose-500")}>{t}</span>)}</div>}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    {u.country && <span className={"text-xs flex items-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><MapPin className="w-3 h-3" />{u.country}</span>}
                    {u.gender && <span className={"text-[10px] " + (dc?"text-gray-600":"text-gray-400")}>{u.gender}</span>}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
