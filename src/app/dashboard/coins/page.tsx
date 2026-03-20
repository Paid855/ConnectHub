"use client";
import { useState, useEffect } from "react";
import { useUser } from "../layout";
import { Coins, Gem, Crown, Gift, ArrowRight, Check, History, TrendingUp, TrendingDown } from "lucide-react";

const PACKAGES = [
  { name:"100 Coins", coins:100, price:"$0.99", popular:false },
  { name:"500 Coins", coins:500, price:"$3.99", popular:true },
  { name:"1000 Coins", coins:1000, price:"$6.99", popular:false },
  { name:"5000 Coins", coins:5000, price:"$29.99", popular:false },
];

export default function CoinsPage() {
  const { user, reload, dark } = useUser();
  const [buying, setBuying] = useState("");
  const [success, setSuccess] = useState("");
  const [transactions, setTransactions] = useState<any[]>([]);
  const [giftsReceived, setGiftsReceived] = useState<any[]>([]);
  const dc = dark;

  useEffect(() => {
    fetch("/api/coins").then(r => r.json()).then(d => {
      setTransactions(d.transactions || []);
      setGiftsReceived(d.giftsReceived || []);
    }).catch(() => {});
  }, [success]);

  const buyCoins = async (pkg: string) => {
    setBuying(pkg);
    try {
      const res = await fetch("/api/coins", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ action:"buy", packageName:pkg }) });
      const data = await res.json();
      if (res.ok) { setSuccess("Purchased " + pkg + "!"); reload(); setTimeout(() => setSuccess(""), 3000); }
    } catch {} finally { setBuying(""); }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={"text-2xl font-bold mb-6 " + (dc?"text-white":"text-gray-900")}>Coins & Wallet</h1>

      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-4 py-3 rounded-xl text-sm mb-5 flex items-center gap-2"><Check className="w-4 h-4" /> {success}</div>}

      {/* Balance card */}
      <div className="bg-gradient-to-r from-amber-500 via-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <p className="text-sm text-amber-100 mb-1">Your Balance</p>
        <div className="flex items-center gap-3 mb-4">
          <Coins className="w-10 h-10" />
          <span className="text-4xl font-bold">{user?.coins?.toLocaleString() || 0}</span>
          <span className="text-lg text-amber-100">coins</span>
        </div>
        <p className="text-xs text-amber-100">Use coins to send gifts, upgrade your plan, or boost your profile</p>
      </div>

      {/* Upgrade with coins */}
      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h2 className={"font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>Upgrade Plan (Permanent)</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className={"rounded-xl p-5 border " + (dc?"bg-rose-500/10 border-rose-500/30":"bg-gradient-to-br from-rose-50 to-pink-50 border-rose-200")}>
            <div className="flex items-center gap-2 mb-2"><Gem className="w-5 h-5 text-rose-500" /><h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>Premium</h3></div>
            <p className={"text-xs mb-3 " + (dc?"text-gray-400":"text-gray-500")}>Unlimited matches, messages, video calls, filters</p>
            <p className="text-lg font-bold text-rose-500 mb-3">2,000 coins</p>
            <UpgradeBtn tier="premium" cost={2000} userCoins={user?.coins||0} currentTier={user?.tier||"basic"} reload={reload} dc={dc} />
          </div>
          <div className={"rounded-xl p-5 border " + (dc?"bg-amber-500/10 border-amber-500/30":"bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200")}>
            <div className="flex items-center gap-2 mb-2"><Crown className="w-5 h-5 text-amber-500" /><h3 className={"font-bold " + (dc?"text-white":"text-gray-900")}>Gold</h3></div>
            <p className={"text-xs mb-3 " + (dc?"text-gray-400":"text-gray-500")}>Everything + VIP badge, live streaming, profile boost</p>
            <p className="text-lg font-bold text-amber-500 mb-3">5,000 coins</p>
            <UpgradeBtn tier="gold" cost={5000} userCoins={user?.coins||0} currentTier={user?.tier||"basic"} reload={reload} dc={dc} />
          </div>
        </div>
      </div>

      {/* Buy Coins */}
      <div className={"rounded-2xl border p-5 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h2 className={"font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>Buy Coins</h2>
        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.name} onClick={() => buyCoins(pkg.name)} disabled={buying===pkg.name} className={"relative rounded-xl p-4 border text-left transition-all hover:shadow-md " + (pkg.popular?(dc?"bg-rose-500/10 border-rose-500/30":"bg-rose-50 border-rose-200"):(dc?"bg-gray-700 border-gray-600 hover:border-gray-500":"bg-gray-50 border-gray-200 hover:border-rose-200"))}>
              {pkg.popular && <span className="absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 bg-rose-500 text-white rounded-full">BEST VALUE</span>}
              <Coins className="w-6 h-6 text-amber-500 mb-2" />
              <p className={"font-bold " + (dc?"text-white":"text-gray-900")}>{pkg.coins.toLocaleString()}</p>
              <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>coins</p>
              <p className="text-sm font-bold text-rose-500 mt-2">{pkg.price}</p>
              {buying === pkg.name && <span className="text-[10px] text-rose-500 animate-pulse">Processing...</span>}
            </button>
          ))}
        </div>
        <p className={"text-xs mt-3 " + (dc?"text-gray-500":"text-gray-400")}>Coins are added instantly. No subscriptions — buy once, use anytime.</p>
      </div>

      {/* Transaction History */}
      <div className={"rounded-2xl border p-5 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h2 className={"font-bold mb-4 flex items-center gap-2 " + (dc?"text-white":"text-gray-900")}><History className="w-5 h-5" /> Transaction History</h2>
        {transactions.length === 0 ? (
          <p className={"text-sm text-center py-6 " + (dc?"text-gray-500":"text-gray-400")}>No transactions yet</p>
        ) : (
          <div className="space-y-2">
            {transactions.slice(0, 20).map(t => (
              <div key={t.id} className={"flex items-center gap-3 p-3 rounded-xl " + (dc?"bg-gray-700/50":"bg-gray-50")}>
                {t.amount > 0 ? <TrendingUp className="w-5 h-5 text-emerald-500 flex-shrink-0" /> : <TrendingDown className="w-5 h-5 text-red-400 flex-shrink-0" />}
                <div className="flex-1 min-w-0"><p className={"text-sm font-medium truncate " + (dc?"text-white":"text-gray-900")}>{t.description}</p><p className={"text-[10px] " + (dc?"text-gray-500":"text-gray-400")}>{new Date(t.createdAt).toLocaleString()}</p></div>
                <span className={"text-sm font-bold " + (t.amount > 0 ? "text-emerald-500" : "text-red-400")}>{t.amount > 0 ? "+" : ""}{t.amount}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradeBtn({ tier, cost, userCoins, currentTier, reload, dc }: any) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  if (currentTier === "gold") return <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="w-4 h-4" /> You have Gold</p>;
  if (currentTier === tier) return <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="w-4 h-4" /> Already {tier}</p>;
  if (currentTier === "premium" && tier === "premium") return <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="w-4 h-4" /> Already Premium</p>;

  const upgrade = async () => {
    setLoading(true);
    const res = await fetch("/api/auth/upgrade", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tier }) });
    const data = await res.json();
    if (res.ok) { setDone(true); reload(); } else { alert(data.error); }
    setLoading(false);
  };

  if (done) return <p className="text-xs font-bold text-emerald-500 flex items-center gap-1"><Check className="w-4 h-4" /> Upgraded!</p>;

  return (
    <button onClick={upgrade} disabled={loading || userCoins < cost} className={"w-full py-2.5 rounded-full text-sm font-semibold transition-all " + (userCoins >= cost ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white hover:shadow-lg" : (dc?"bg-gray-600 text-gray-400 cursor-not-allowed":"bg-gray-200 text-gray-400 cursor-not-allowed"))}>
      {loading ? "Upgrading..." : userCoins < cost ? "Need " + (cost - userCoins) + " more coins" : "Upgrade Now"}
    </button>
  );
}
