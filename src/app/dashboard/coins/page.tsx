"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useUser } from "../layout";
import { Crown, Coins, Zap, Star, Check, Shield, Heart, Eye, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

const COIN_PACKAGES = [
  { id:"100", coins:100, price:"$1.99", amount:199 },
  { id:"500", coins:500, price:"$7.99", amount:799 },
  { id:"1000", coins:1000, price:"$12.99", amount:1299 },
  { id:"5000", coins:5000, price:"$49.99", amount:4999 },
];

export default function CoinsPage() {
  const { user, reload, dark } = useUser();
  const searchParams = useSearchParams();
  const success = searchParams.get("success");
  const cancelled = searchParams.get("cancelled");
  const upgradedTier = searchParams.get("tier");
  const addedCoins = searchParams.get("coins");
  const dc = dark;
  useEffect(() => {
    if (success === "true") {
      if (upgradedTier) { setMsg("Successfully upgraded to " + upgradedTier.charAt(0).toUpperCase() + upgradedTier.slice(1) + "! Enjoy your new features."); reload(); }
      else if (addedCoins) { setMsg("Successfully added " + addedCoins + " coins to your account!"); reload(); }
    }
    if (cancelled === "true") setErr("Payment was cancelled. No charges were made.");
  }, [success, cancelled]);

  const [tab, setTab] = useState<"plans"|"coins">("plans");
  const [upgrading, setUpgrading] = useState("");
  const [buying, setBuying] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const handleUpgrade = async (tier: string) => {
    setUpgrading(tier); setErr(""); setMsg("");
    try {
      const res = await fetch("/api/upgrade", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ tier })
      });
      const data = await res.json();
      if (data.url || data.paymentUrl) {
        window.location.href = data.url || data.paymentUrl;
      } else if (data.error) {
        setErr(data.error);
      }
    } catch { setErr("Network error. Try again."); }
    finally { setUpgrading(""); }
  };

  const handleBuyCoins = async (packageId: string, amount: number) => {
    setBuying(packageId); setErr("");
    try {
      const res = await fetch("/api/flutterwave", {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ type:"coins", coinPackage: packageId })
      });
      const data = await res.json();
      if (data.url || data.paymentUrl || data.authorization_url) {
        window.location.href = data.url || data.paymentUrl || data.authorization_url;
      } else {
        setErr(data.error || "Payment failed");
      }
    } catch { setErr("Network error"); }
    finally { setBuying(""); }
  };

  if (!user) return null;
  const currentTier = user.tier || "free";

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className={"text-2xl font-bold mb-2 " + (dc?"text-white":"text-gray-900")}>Upgrade & Coins</h1>
      <p className={"text-sm mb-6 " + (dc?"text-gray-400":"text-gray-500")}>Current plan: <span className="font-bold capitalize">{currentTier}</span> · Balance: <span className="font-bold">{user.coins || 0} coins</span></p>

      {err && <div className={"mb-4 px-4 py-3 rounded-xl text-sm " + (dc?"bg-red-500/10 text-red-400 border border-red-500/30":"bg-red-50 text-red-600 border border-red-200")}>{err}</div>}
      {msg && <div className={"mb-4 px-4 py-3 rounded-xl text-sm " + (dc?"bg-emerald-500/10 text-emerald-400 border border-emerald-500/30":"bg-emerald-50 text-emerald-600 border border-emerald-200")}>{msg}</div>}

      {/* Tabs */}
      <div className={"flex gap-1 mb-6 rounded-xl p-1 " + (dc?"bg-gray-800":"bg-gray-100")}>
        <button onClick={()=>setTab("plans")} className={"flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab==="plans"?(dc?"bg-gray-700 text-white":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}>Membership Plans</button>
        <button onClick={()=>setTab("coins")} className={"flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all " + (tab==="coins"?(dc?"bg-gray-700 text-white":"bg-white text-gray-900 shadow-sm"):(dc?"text-gray-500":"text-gray-500"))}>Buy Coins</button>
      </div>

      {/* PLANS TAB */}
      {tab === "plans" && (
        <div className="space-y-4">
          {/* FREE */}
          <div className={"rounded-2xl border p-6 " + (dc?"bg-gray-800 border-gray-700":"bg-white border-gray-200") + (currentTier==="free"?" ring-2 ring-gray-300":"")}>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>Free</h3><p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Basic features</p></div>
              <span className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>$0</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {["Browse profiles","Limited matches","5 messages/day","Voice & video calls","Basic search"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-emerald-500 flex-shrink-0" /><span className={dc?"text-gray-300":"text-gray-700"}>{f}</span></div>
              ))}
              {["Ads shown","No rewinds","No live stream","No profile boost","Limited photos"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><span className="w-4 h-4 text-gray-300 flex-shrink-0 text-center">✗</span><span className="text-gray-400">{f}</span></div>
              ))}
            </div>
            {currentTier==="free" && <div className="mt-4 py-2 text-center text-sm font-medium text-gray-400">Current Plan</div>}
          </div>

          {/* PLUS */}
          <div className={"rounded-2xl border-2 p-6 relative " + (dc?"bg-gray-800 border-blue-500":"bg-white border-blue-500") + (currentTier==="plus"?" ring-2 ring-blue-300":"")}>
            <div className="absolute -top-3 left-6 bg-blue-500 text-white text-xs px-3 py-1 rounded-full font-bold">RECOMMENDED</div>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>Plus</h3><p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>For active daters</p></div>
              <div className="text-right"><span className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>$12</span><span className={dc?"text-gray-400":"text-gray-500"}>/mo</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Everything in Free","No ads anywhere","16 photo uploads","Unlimited likes","Rewind last swipe","Extended profile views","Live streaming access","Priority matching"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-blue-500 flex-shrink-0" /><span className={dc?"text-gray-300":"text-gray-700"}>{f}</span></div>
              ))}
            </div>
            {currentTier==="plus" ? (
              <div className="py-2 text-center text-sm font-medium text-blue-500">Current Plan ✓</div>
            ) : currentTier==="premium"||currentTier==="gold" ? (
              <div className="py-2 text-center text-sm font-medium text-gray-400">Included in your plan</div>
            ) : (
              <button onClick={()=>handleUpgrade("plus")} disabled={!!upgrading} className="w-full py-3.5 bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                {upgrading==="plus" ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : <>Upgrade to Plus — $12/mo</>}
              </button>
            )}
          </div>

          {/* PREMIUM */}
          <div className={"rounded-2xl border p-6 relative " + (dc?"bg-gradient-to-br from-gray-800 to-gray-800 border-amber-500":"bg-gradient-to-br from-amber-50 to-orange-50 border-amber-400") + " border-2" + (currentTier==="premium"||currentTier==="gold"?" ring-2 ring-amber-300":"")}>
            <div className="absolute -top-3 left-6 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs px-3 py-1 rounded-full font-bold">BEST VALUE</div>
            <div className="flex items-center justify-between mb-4">
              <div><h3 className={"text-lg font-bold " + (dc?"text-white":"text-gray-900")}>Premium</h3><p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>The ultimate experience</p></div>
              <div className="text-right"><span className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>$25</span><span className={dc?"text-gray-400":"text-gray-500"}>/mo</span></div>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              {["Everything in Plus","See who likes you","5 Super Likes/week","Daily Top Picks","Read receipts","Higher visibility","Monthly profile boost","Priority support"].map(f => (
                <div key={f} className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-amber-500 flex-shrink-0" /><span className={dc?"text-gray-300":"text-gray-700"}>{f}</span></div>
              ))}
            </div>
            {currentTier==="premium"||currentTier==="gold" ? (
              <div className="py-2 text-center text-sm font-medium text-amber-500">Current Plan ✓</div>
            ) : (
              <button onClick={()=>handleUpgrade("premium")} disabled={!!upgrading} className="w-full py-3.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl font-bold text-sm hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2">
                {upgrading==="premium" ? <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing...</> : <>Go Premium — $25/mo</>}
              </button>
            )}
          </div>
        </div>
      )}

      {/* COINS TAB */}
      {tab === "coins" && (
        <div>
          <div className={"rounded-2xl border p-6 mb-6 text-center " + (dc?"bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/20":"bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200")}>
            <Coins className={"w-10 h-10 mx-auto mb-2 " + (dc?"text-amber-400":"text-amber-500")} />
            <p className={"text-3xl font-bold " + (dc?"text-white":"text-gray-900")}>{user.coins || 0}</p>
            <p className={"text-sm " + (dc?"text-gray-400":"text-gray-500")}>Your coin balance</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {COIN_PACKAGES.map(pkg => (
              <button key={pkg.id} onClick={()=>handleBuyCoins(pkg.id, pkg.amount)} disabled={!!buying} className={"rounded-2xl border p-5 text-center transition-all hover:shadow-md " + (dc?"bg-gray-800 border-gray-700 hover:border-amber-500":"bg-white border-gray-200 hover:border-amber-400")}>
                <div className="flex items-center justify-center gap-1 mb-2"><Coins className="w-5 h-5 text-amber-500" /><span className={"text-2xl font-bold " + (dc?"text-white":"text-gray-900")}>{pkg.coins}</span></div>
                <p className={"text-lg font-bold " + (dc?"text-amber-400":"text-amber-600")}>{pkg.price}</p>
                {buying===pkg.id && <div className="mt-2"><div className="w-5 h-5 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" /></div>}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
