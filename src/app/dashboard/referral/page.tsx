"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Gift, Copy, Check, Users, Coins, Share2, ArrowRight } from "lucide-react";

export default function ReferralPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const [data, setData] = useState<any>({ referralCode:"", referralCount:0, referrals:[], totalEarned:0 });
  const [inputCode, setInputCode] = useState("");
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { fetch("/api/referral").then(r=>r.json()).then(setData).catch(()=>{}); }, [msg]);

  const copyCode = () => {
    navigator.clipboard.writeText(data.referralCode);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const shareCode = () => {
    const text = "Join me on ConnectHub! Use my referral code " + data.referralCode + " to get 25 free coins. Download now at https://connecthub.com";
    if (navigator.share) navigator.share({ text }).catch(() => {});
    else { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); }
  };

  const applyCode = async () => {
    if (!inputCode.trim()) return;
    setApplying(true); setErr(""); setMsg("");
    try {
      const res = await fetch("/api/referral", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ referralCode:inputCode }) });
      const d = await res.json();
      if (res.ok) { setMsg("Code applied! +25 coins added!"); setInputCode(""); reload(); }
      else { setErr(d.error); }
    } catch { setErr("Network error"); } finally { setApplying(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className={"text-2xl font-bold mb-6 " + (dc?"text-white":"text-gray-900")}>Invite Friends</h1>

      {/* Reward card */}
      <div className="bg-gradient-to-br from-violet-500 via-purple-500 to-pink-500 rounded-2xl p-6 mb-6 text-white">
        <div className="flex items-center gap-3 mb-4"><Gift className="w-8 h-8" /><div><h2 className="text-xl font-bold">Earn 50 Coins Per Invite</h2><p className="text-purple-100 text-sm">Your friend gets 25 coins too!</p></div></div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"><p className="text-3xl font-bold">{data.referralCount}</p><p className="text-purple-100 text-xs">Friends Invited</p></div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"><div className="flex items-center justify-center gap-1"><Coins className="w-5 h-5" /><p className="text-3xl font-bold">{data.totalEarned}</p></div><p className="text-purple-100 text-xs">Coins Earned</p></div>
        </div>
      </div>

      {/* Your code */}
      <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Your Referral Code</h3>
        <div className={"flex items-center gap-3 p-4 rounded-xl mb-4 " + (dc?"bg-gray-700":"bg-gray-50")}>
          <p className={"text-2xl font-bold tracking-wider flex-1 " + (dc?"text-white":"text-gray-900")}>{data.referralCode}</p>
          <button onClick={copyCode} className={"px-4 py-2 rounded-xl text-sm font-semibold flex items-center gap-2 " + (copied?(dc?"bg-emerald-500/20 text-emerald-400":"bg-emerald-100 text-emerald-600"):(dc?"bg-gray-600 text-white hover:bg-gray-500":"bg-gray-200 text-gray-700 hover:bg-gray-300"))}>
            {copied ? <><Check className="w-4 h-4" /> Copied!</> : <><Copy className="w-4 h-4" /> Copy</>}
          </button>
        </div>
        <button onClick={shareCode} className="w-full py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full font-semibold hover:shadow-lg flex items-center justify-center gap-2"><Share2 className="w-4 h-4" /> Share with Friends</button>
      </div>

      {/* Enter code */}
      <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Have a Referral Code?</h3>
        {msg && <div className={"mb-3 px-4 py-3 rounded-xl text-sm " + (dc?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30":"bg-emerald-50 text-emerald-600 border border-emerald-200")}>{msg}</div>}
        {err && <div className={"mb-3 px-4 py-3 rounded-xl text-sm " + (dc?"bg-red-500/10 text-red-400 border border-red-500/30":"bg-red-50 text-red-600 border border-red-200")}>{err}</div>}
        <div className="flex gap-2">
          <input className={"flex-1 px-4 py-3 rounded-xl border outline-none text-sm uppercase " + (dc?"bg-gray-700 border-gray-600 text-white":"bg-white border-gray-200 focus:ring-2 focus:ring-violet-300")} placeholder="Enter code (e.g. CHABC123)" value={inputCode} onChange={e=>setInputCode(e.target.value)} />
          <button onClick={applyCode} disabled={applying||!inputCode.trim()} className="px-5 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl font-semibold disabled:opacity-60 flex items-center gap-2">{applying?"...":<><ArrowRight className="w-4 h-4" />Apply</>}</button>
        </div>
      </div>

      {/* Referral list */}
      {data.referrals?.length > 0 && (
        <div className={"rounded-2xl border p-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><Users className="w-5 h-5" /> Friends You Invited</h3>
          <div className="space-y-2">
            {data.referrals.map((r:any) => (
              <div key={r.id} className={"flex items-center gap-3 p-3 rounded-xl " + (dc?"bg-gray-700":"bg-gray-50")}>
                {r.profilePhoto ? <img src={r.profilePhoto} className="w-10 h-10 rounded-full object-cover" /> : <div className="w-10 h-10 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center text-white font-bold text-sm">{r.name?.[0]}</div>}
                <div className="flex-1"><p className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>{r.name}</p><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>Joined {new Date(r.createdAt).toLocaleDateString()}</p></div>
                <div className="flex items-center gap-1"><Coins className="w-4 h-4 text-amber-500" /><span className={"text-sm font-bold " + (dc?"text-amber-400":"text-amber-600")}>+50</span></div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
