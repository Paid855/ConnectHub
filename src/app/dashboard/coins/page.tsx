"use client";
import { useState, useEffect } from "react";
import { useUser, TierBadge } from "../layout";
import { Coins, Crown, Gem, Zap, Gift, Check, Sparkles, ShoppingBag, CreditCard, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

const PACKAGES = [
  { id:"coins_100", coins:100, price:"₦1,500", sub:"~$0.99", popular:false, color:"from-blue-500 to-cyan-500" },
  { id:"coins_500", coins:500, price:"₦6,000", sub:"~$3.99", popular:false, color:"from-violet-500 to-purple-500" },
  { id:"coins_1000", coins:1000, price:"₦10,500", sub:"~$6.99", popular:true, color:"from-rose-500 to-pink-500" },
  { id:"coins_5000", coins:5000, price:"₦45,000", sub:"~$29.99", popular:false, color:"from-amber-500 to-orange-500" },
];

const UPGRADES = [
  { tier:"premium", label:"Premium", coins:2000, icon:Gem, color:"from-rose-500 to-pink-500", features:["Unlimited matches","Unlimited messages","Video calls","Advanced filters","See who likes you","Ad-free experience"] },
  { tier:"gold", label:"Gold", coins:5000, icon:Crown, color:"from-amber-400 to-orange-500", features:["Everything in Premium","VIP profile badge","Live streaming","Profile boost","Priority support","Ad-free experience"] },
];

export default function CoinsPage() {
  const { user, reload, dark } = useUser();
  const dc = dark;
  const params = useSearchParams();
  const [buying, setBuying] = useState("");
  const [upgrading, setUpgrading] = useState("");
  const [boosting, setBoosting] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successCoins, setSuccessCoins] = useState(0);

  useEffect(() => {
    fetch("/api/coins").then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
    // Check for Paystack redirect
    const ref = params.get("verify") || params.get("reference") || params.get("trxref");
    const coinCount = parseInt(params.get("coins") || "0");
    if (ref) {
      setShowSuccess(true);
      fetch("/api/stripe/verify?reference=" + ref + "&coins=" + coinCount)
        .then(r => r.json())
        .then(d => {
          if (d.success) { setSuccessCoins(d.coins || coinCount); reload(); }
          else { setSuccessCoins(0); }
          fetch("/api/coins").then(r => r.json()).then(d => setHistory(d.history || [])).catch(() => {});
        })
        .catch(() => {});
      setTimeout(() => setShowSuccess(false), 6000);
    }
    if (params.get("success") === "true") {
      const c = parseInt(params.get("coins") || "0");
      setSuccessCoins(c); setShowSuccess(true);
      reload();
      setTimeout(() => setShowSuccess(false), 5000);
    }
  }, []);

  const buyCoins = async (packageId: string) => {
    setBuying(packageId);
    try {
      const res = await fetch("/api/stripe", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ packageId }) });
      const data = await res.json();
      if (data.url) { window.location.href = data.url; }
      else { alert(data.error || "Payment failed"); setBuying(""); }
    } catch { alert("Network error"); setBuying(""); }
  };

  const upgrade = async (tier: string, coins: number) => {
    if ((user?.coins || 0) < coins) { alert("Not enough coins. Buy more first!"); return; }
    if (!confirm("Upgrade to " + tier.charAt(0).toUpperCase() + tier.slice(1) + " for " + coins.toLocaleString() + " coins? This is permanent!")) return;
    setUpgrading(tier);
    try {
      const res = await fetch("/api/upgrade", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({ tier }) });
      if (res.ok) { reload(); alert("Upgraded to " + tier + "!"); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch {} finally { setUpgrading(""); }
  };

  const boost = async () => {
    if ((user?.coins || 0) < 100) { alert("Need 100 coins. Buy more!"); return; }
    setBoosting(true);
    try {
      const res = await fetch("/api/boost", { method:"POST" });
      if (res.ok) { reload(); alert("Profile boosted for 30 minutes!"); }
      else { const d = await res.json(); alert(d.error || "Failed"); }
    } catch {} finally { setBoosting(false); }
  };

  if (!user) return null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Success banner */}
      {showSuccess && (
        <div className="mb-6 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl p-5 text-white text-center animate-pulse">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold">Payment Successful!</h2>
          <p className="text-emerald-100">+{successCoins.toLocaleString()} coins added to your account</p>
        </div>
      )}

      {params.get("canceled") === "true" && (
        <div className={"mb-6 rounded-2xl border p-4 text-center " + (dc?"bg-amber-500/10 border-amber-500/30 text-amber-400":"bg-amber-50 border-amber-200 text-amber-700")}>Payment canceled. No charges were made.</div>
      )}

      {/* Balance card */}
      <div className="bg-gradient-to-br from-amber-400 via-yellow-500 to-orange-500 rounded-2xl p-6 mb-6 text-white shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div><p className="text-amber-100 text-sm font-medium">Your Balance</p><div className="flex items-center gap-2"><Coins className="w-8 h-8" /><span className="text-4xl font-bold">{user.coins?.toLocaleString() || 0}</span><span className="text-lg">coins</span></div></div>
          <div className="text-right"><TierBadge tier={user.tier} /></div>
        </div>
        <div className="flex gap-2">
          <button onClick={boost} disabled={boosting} className="flex-1 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-white/30 flex items-center justify-center gap-2"><Zap className="w-4 h-4" /> {boosting ? "Boosting..." : "Boost (100)"}</button>
          <Link href="/dashboard/upgrade" className="flex-1 py-2.5 bg-white/20 backdrop-blur-sm rounded-xl text-sm font-semibold hover:bg-white/30 flex items-center justify-center gap-2"><Crown className="w-4 h-4" /> Upgrade</Link>
        </div>
      </div>

      {/* Buy coins with Stripe */}
      <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <div className="flex items-center gap-2 mb-1"><CreditCard className={"w-5 h-5 " + (dc?"text-rose-400":"text-rose-500")} /><h2 className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>Buy Coins</h2></div>
        <p className={"text-xs mb-5 " + (dc?"text-gray-500":"text-gray-400")}>Secure payment via Stripe. Coins are added instantly.</p>
        <div className="grid grid-cols-2 gap-3">
          {PACKAGES.map(pkg => (
            <button key={pkg.id} onClick={() => buyCoins(pkg.id)} disabled={buying === pkg.id} className={"relative rounded-2xl border p-5 text-center transition-all hover:shadow-lg hover:scale-[1.02] " + (pkg.popular ? "border-rose-300 ring-2 ring-rose-200" : (dc?"border-gray-600 hover:border-gray-500":"border-gray-200 hover:border-rose-200"))}>
              {pkg.popular && <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-rose-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">BEST VALUE</span>}
              <div className={"w-12 h-12 rounded-xl bg-gradient-to-br " + pkg.color + " flex items-center justify-center mx-auto mb-3"}><Coins className="w-6 h-6 text-white" /></div>
              <p className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>{pkg.coins.toLocaleString()}</p>
              <p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>coins</p>{pkg.sub&&<p className={"text-[10px] mb-2 " + (dc?"text-gray-600":"text-gray-400")}>{pkg.sub}</p>}
              <div className={"py-2 rounded-xl font-bold text-sm " + (buying === pkg.id ? "bg-gray-200 text-gray-500" : "bg-gradient-to-r " + pkg.color + " text-white")}>
                {buying === pkg.id ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</span> : <><span>{pkg.price}</span></>}
              </div>
            </button>
          ))}
        </div>
        <p className={"text-[11px] text-center mt-3 flex items-center justify-center gap-1 " + (dc?"text-gray-500":"text-gray-400")}><CreditCard className="w-3 h-3" /> Powered by Paystack · Secured & Encrypted</p>
      </div>

      {/* Upgrade plans */}
      <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h2 className={"text-lg font-bold mb-4 " + (dc?"text-white":"text-gray-900")}>Upgrade Your Plan</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {UPGRADES.map(up => {
            const isActive = user.tier === up.tier || (up.tier === "premium" && user.tier === "gold");
            return (
              <div key={up.tier} className={"rounded-2xl border overflow-hidden " + (isActive ? (dc?"border-emerald-500/30":"border-emerald-200") : (dc?"border-gray-700":"border-gray-200"))}>
                <div className={"bg-gradient-to-r " + up.color + " p-5 text-center"}>
                  <up.icon className="w-10 h-10 text-white mx-auto mb-2" />
                  <h3 className="text-xl font-bold text-white">{up.label}</h3>
                  {!isActive && <p className="text-white/80 text-sm">{up.coins.toLocaleString()} coins · one-time</p>}
                  {isActive && <p className="text-white/80 text-sm flex items-center justify-center gap-1"><Check className="w-4 h-4" /> Active</p>}
                </div>
                <div className={"p-4 " + (dc?"bg-gray-800":"bg-white")}>
                  <ul className="space-y-2 mb-4">{up.features.map((f,i) => <li key={i} className={"flex items-center gap-2 text-sm " + (dc?"text-gray-300":"text-gray-600")}><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />{f}</li>)}</ul>
                  {!isActive ? (
                    <button onClick={() => upgrade(up.tier, up.coins)} disabled={upgrading===up.tier} className={"w-full py-2.5 rounded-xl font-bold text-sm " + ((user?.coins||0) >= up.coins ? "bg-gradient-to-r " + up.color + " text-white hover:shadow-lg" : (dc?"bg-gray-700 text-gray-500":"bg-gray-100 text-gray-400"))}>
                      {upgrading===up.tier ? "Upgrading..." : (user?.coins||0) >= up.coins ? "Upgrade Now" : "Need " + (up.coins-(user?.coins||0)).toLocaleString() + " more coins"}
                    </button>
                  ) : (
                    <div className={"w-full py-2.5 rounded-xl text-center font-bold text-sm " + (dc?"bg-emerald-500/10 text-emerald-400":"bg-emerald-50 text-emerald-600")}>Current Plan ✓</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* What coins are for */}
      <div className={"rounded-2xl border p-6 mb-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
        <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>What Can You Do With Coins?</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon:Gift, label:"Send Gifts", desc:"🌹 10 to 🏝️ 5,000 coins", color:"text-rose-500", bg:dc?"bg-rose-500/10":"bg-rose-50" },
            { icon:Crown, label:"Upgrade Plan", desc:"Premium 2,000 · Gold 5,000", color:"text-amber-500", bg:dc?"bg-amber-500/10":"bg-amber-50" },
            { icon:Zap, label:"Profile Boost", desc:"100 coins for 30 min", color:"text-violet-500", bg:dc?"bg-violet-500/10":"bg-violet-50" },
            { icon:Sparkles, label:"Earn More", desc:"Daily reward + referrals", color:"text-emerald-500", bg:dc?"bg-emerald-500/10":"bg-emerald-50" },
          ].map((item,i) => (
            <div key={i} className={"rounded-xl p-4 " + item.bg}>
              <item.icon className={"w-6 h-6 mb-2 " + item.color} />
              <p className={"text-sm font-bold " + (dc?"text-white":"text-gray-900")}>{item.label}</p>
              <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction history */}
      {history.length > 0 && (
        <div className={"rounded-2xl border p-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-100 shadow-sm")}>
          <h3 className={"font-bold mb-3 " + (dc?"text-white":"text-gray-900")}>Transaction History</h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {history.slice(0, 20).map((t: any) => (
              <div key={t.id} className={"flex items-center justify-between py-2.5 px-3 rounded-xl " + (dc?"bg-gray-700/50":"bg-gray-50")}>
                <div className="flex-1 min-w-0"><p className={"text-sm truncate " + (dc?"text-gray-300":"text-gray-700")}>{t.description || t.type}</p><p className={"text-xs " + (dc?"text-gray-500":"text-gray-400")}>{new Date(t.createdAt).toLocaleDateString()}</p></div>
                <span className={"font-bold text-sm flex-shrink-0 " + (t.amount > 0 ? "text-emerald-500" : "text-red-400")}>{t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
