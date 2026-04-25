"use client";
import { useUser } from "../layout";
import { Check, X, Crown, Shield, Sparkles, Heart, Star, Lock } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function UpgradePage() {
  const { user, reload } = useUser();
  const router = useRouter();
  const [yearly, setYearly] = useState(false);
  const [upgrading, setUpgrading] = useState("");
  const [success, setSuccess] = useState("");

  const handleUpgrade = async (plan: string) => {
    setUpgrading(plan);
    try {
      const amount = plan === "gold" ? (yearly ? 39 * 12 * 0.8 : 49) : plan === "premium" ? (yearly ? 23 * 12 * 0.8 : 29) : 0;
      if (amount === 0) { setUpgrading(""); return; }

      const res = await fetch("/api/flutterwave/pay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "upgrade",
          plan,
          amount,
          period: yearly ? "yearly" : "monthly"
        })
      });
      const data = await res.json();
      if (data.link) {
        window.location.href = data.link;
      } else {
        setSuccess(""); setUpgrading("");
      }
    } catch { setUpgrading(""); }
  };

  const currentTier = user?.tier || "basic";
  const tierRank: Record<string, number> = { basic: 0, verified: 1, premium: 2, gold: 3 };
  const currentRank = tierRank[currentTier] || 0;

  const plans = [
    {
      key: "basic", name: "Basic", price: "$0", yearlyPrice: "$0", color: "from-gray-500 to-gray-600", badge: "bg-gray-100 text-gray-600", rank: 0,
      features: [
        { name: "5 daily swipes", included: true },
        { name: "Basic profile", included: true },
        { name: "3 messages per day", included: true },
        { name: "See who likes you", included: false },
        { name: "Unlimited messages", included: false },
        { name: "Video calls", included: false },
        { name: "Priority matching", included: false },
        { name: "Profile boost", included: false },
      ],
    },
    {
      key: "premium", name: "Premium", price: "$12", yearlyPrice: "$10", color: "from-rose-500 to-pink-500", badge: "bg-rose-100 text-rose-600", popular: true, rank: 2,
      features: [
        { name: "Unlimited swipes", included: true },
        { name: "Enhanced profile", included: true },
        { name: "Unlimited messages", included: true },
        { name: "See who likes you", included: true },
        { name: "Video calls", included: true },
        { name: "Priority matching", included: true },
        { name: "5 profile boosts/month", included: true },
        { name: "Personal dating coach", included: false },
      ],
    },
    {
      key: "gold", name: "Gold", price: "$25", yearlyPrice: "$20", color: "from-amber-500 to-orange-500", badge: "bg-amber-100 text-amber-600", rank: 3,
      features: [
        { name: "Everything in Premium", included: true },
        { name: "VIP profile badge", included: true },
        { name: "Personal dating coach", included: true },
        { name: "Exclusive events access", included: true },
        { name: "Unlimited boosts", included: true },
        { name: "Read receipts", included: true },
        { name: "Advanced filters", included: true },
        { name: "Priority support", included: true },
      ],
    }
  ];

  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-100 to-orange-100 border border-amber-200 rounded-full px-4 py-1.5 mb-4"><Crown className="w-4 h-4 text-amber-600" /><span className="text-sm font-bold text-amber-700">Upgrade Your Experience</span></div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Plan</h1>
        <p className="text-gray-500">Unlock premium features and find love faster</p>
      </div>

      {success && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 px-5 py-4 rounded-2xl text-center mb-6 font-semibold flex items-center justify-center gap-2"><Check className="w-5 h-5" /> {success}</div>}

      <div className="flex justify-center mb-8">
        <div className="inline-flex bg-gray-100 rounded-full p-1">
          <button onClick={() => setYearly(false)} className={"px-6 py-2 rounded-full text-sm font-semibold transition-all " + (!yearly ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Monthly</button>
          <button onClick={() => setYearly(true)} className={"px-6 py-2 rounded-full text-sm font-semibold transition-all " + (yearly ? "bg-white shadow-sm text-gray-900" : "text-gray-500")}>Yearly <span className="text-emerald-500 text-xs">Save 20%</span></button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan, i) => {
          const isCurrent = currentTier === plan.key || (currentTier === "verified" && plan.key === "basic");
          const isDowngrade = plan.rank < currentRank;
          const isUpgrade = plan.rank > currentRank;

          return (
            <div key={i} className={"relative bg-white rounded-2xl border shadow-sm overflow-hidden transition-all hover:shadow-md " + (plan.popular ? "border-rose-300 ring-2 ring-rose-100" : isCurrent ? "border-emerald-300 ring-2 ring-emerald-100" : "border-gray-200")}>
              {plan.popular && !isCurrent && <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-rose-500 to-pink-500 text-white text-xs font-bold text-center py-1.5">MOST POPULAR</div>}
              {isCurrent && <div className="absolute top-0 left-0 right-0 bg-emerald-500 text-white text-xs font-bold text-center py-1.5">YOUR CURRENT PLAN</div>}

              <div className={"p-6 " + (plan.popular || isCurrent ? "pt-10" : "")}>
                <div className="flex items-center gap-2 mb-2"><span className={"text-xs font-bold px-2.5 py-1 rounded-full " + plan.badge}>{plan.name}</span></div>
                <div className="flex items-baseline gap-1 mb-1"><span className="text-4xl font-bold text-gray-900">{yearly ? plan.yearlyPrice : plan.price}</span><span className="text-gray-500 text-sm">/month</span></div>
                {yearly && plan.price !== "$0" && <p className="text-xs text-emerald-500 font-semibold mb-4">Billed annually</p>}
                {(!yearly || plan.price === "$0") && <div className="h-5 mb-4" />}

                <div className="space-y-3 mb-6">
                  {plan.features.map((f, j) => (
                    <div key={j} className="flex items-center gap-2.5">
                      {f.included ? <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0"><Check className="w-3 h-3 text-emerald-600" /></div> : <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"><X className="w-3 h-3 text-gray-400" /></div>}
                      <span className={"text-sm " + (f.included ? "text-gray-700" : "text-gray-400")}>{f.name}</span>
                    </div>
                  ))}
                </div>

                {isCurrent ? (
                  <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-emerald-100 text-emerald-600 cursor-not-allowed flex items-center justify-center gap-2"><Check className="w-4 h-4" /> Current Plan</button>
                ) : isUpgrade ? (
                  <button onClick={() => handleUpgrade(plan.key)} disabled={!!upgrading} className={"w-full py-3 rounded-xl font-semibold text-sm text-white hover:shadow-lg transition-all bg-gradient-to-r " + plan.color + (upgrading === plan.key ? " opacity-60" : "")}>
                    {upgrading === plan.key ? "Upgrading..." : "Upgrade to " + plan.name}
                  </button>
                ) : (
                  <button disabled className="w-full py-3 rounded-xl font-semibold text-sm bg-gray-100 text-gray-400 cursor-not-allowed">Current or Lower Plan</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-8 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-6 text-center">
        
      </div>
    </div>
  );
}
