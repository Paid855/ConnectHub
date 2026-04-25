"use client";
import { useState, useEffect } from "react";
import { Wallet, ArrowUpRight, ArrowDownLeft, Clock, CheckCircle, XCircle, DollarSign, TrendingUp, Gift, Coins, CreditCard, AlertCircle, Building, Send } from "lucide-react";

export default function WalletPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview"|"withdraw"|"history">("overview");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [method, setMethod] = useState("bank");
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<{type:"success"|"error";text:string}|null>(null);

  const load = async () => {
    try { const r = await fetch("/api/wallet"); const d = await r.json(); setData(d); } catch {}
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const submitWithdrawal = async () => {
    if (!withdrawAmount || !details.trim()) { setMsg({ type: "error", text: "Fill in all fields" }); return; }
    const amt = parseInt(withdrawAmount);
    if (isNaN(amt) || amt < (data?.minWithdrawal || 1000)) { setMsg({ type: "error", text: `Minimum ${data?.minWithdrawal || 1000} coins` }); return; }
    if (amt > (data?.availableForWithdrawal || 0)) { setMsg({ type: "error", text: "Not enough coins" }); return; }
    setSubmitting(true); setMsg(null);
    try {
      const r = await fetch("/api/wallet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ amount: amt, method, details }) });
      const d = await r.json();
      if (d.success) {
        setMsg({ type: "success", text: "Withdrawal request submitted! Admin will review within 24-48 hours." });
        setWithdrawAmount(""); setDetails("");
        load();
      } else { setMsg({ type: "error", text: d.error || "Failed" }); }
    } catch { setMsg({ type: "error", text: "Network error" }); }
    setSubmitting(false);
  };

  const fmt = (coins: number) => "$" + (coins * (data?.coinsToUsd || 0.01)).toFixed(2);
  const statusColor = (s: string) => s === "pending" ? "text-amber-600 bg-amber-50" : s === "approved" || s === "completed" ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50";
  const statusIcon = (s: string) => s === "pending" ? <Clock className="w-4 h-4" /> : s === "approved" || s === "completed" ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />;

  if (loading) return <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-rose-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50/30 to-white pb-24">
      <div className="max-w-3xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 flex items-center gap-2">
            <Wallet className="text-rose-500" /> My Wallet
          </h1>
          <p className="text-gray-500 text-sm mt-1">Track your earnings and withdraw coins</p>
        </div>

        {/* Balance Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <div className="bg-gradient-to-br from-rose-500 to-pink-500 rounded-2xl p-4 text-white col-span-2 sm:col-span-1">
            <Coins className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-2xl font-extrabold">{(data?.coins || 0).toLocaleString()}</p>
            <p className="text-[10px] opacity-70 uppercase font-medium mt-1">Balance</p>
            <p className="text-xs font-bold mt-0.5">{fmt(data?.coins || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <TrendingUp className="w-5 h-5 text-green-500 mb-2" />
            <p className="text-lg font-extrabold text-gray-900">{(data?.totalEarned || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase font-medium mt-1">Total Earned</p>
            <p className="text-xs text-green-600 font-bold">{fmt(data?.totalEarned || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <ArrowUpRight className="w-5 h-5 text-blue-500 mb-2" />
            <p className="text-lg font-extrabold text-gray-900">{(data?.totalWithdrawn || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase font-medium mt-1">Withdrawn</p>
            <p className="text-xs text-blue-600 font-bold">{fmt(data?.totalWithdrawn || 0)}</p>
          </div>
          <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
            <Clock className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-lg font-extrabold text-gray-900">{(data?.pendingWithdrawals || 0).toLocaleString()}</p>
            <p className="text-[10px] text-gray-400 uppercase font-medium mt-1">Pending</p>
            <p className="text-xs text-amber-600 font-bold">{fmt(data?.pendingWithdrawals || 0)}</p>
          </div>
        </div>

        {/* How it works info */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-5 mb-6">
          <h3 className="font-bold text-amber-900 text-sm mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-amber-500" /> How Earnings Work</h3>
          <div className="space-y-2 text-xs text-amber-800">
            <p className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">1.</span> Viewers send you gifts during live streams</p>
            <p className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">2.</span> You receive <span className="font-bold">80%</span> of each gift's coin value (20% platform fee)</p>
            <p className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">3.</span> 100 coins = $1.00 USD</p>
            <p className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">4.</span> Minimum withdrawal: {(data?.minWithdrawal || 1000).toLocaleString()} coins ({fmt(data?.minWithdrawal || 1000)})</p>
            <p className="flex items-start gap-2"><span className="text-amber-500 mt-0.5">5.</span> Withdrawals are processed within 24-48 hours</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          {[
            { id: "overview" as const, label: "Transactions", icon: ArrowDownLeft },
            { id: "withdraw" as const, label: "Withdraw", icon: Send },
            { id: "history" as const, label: "Withdrawals", icon: Clock },
          ].map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} className={"flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-bold transition-all " + (tab === t.id ? "bg-white text-rose-600 shadow-sm" : "text-gray-500 hover:text-gray-700")}>
              <t.icon className="w-3.5 h-3.5" /> {t.label}
            </button>
          ))}
        </div>

        {/* Transactions Tab */}
        {tab === "overview" && (
          <div className="space-y-2">
            {(data?.recentTransactions || []).length === 0 ? (
              <div className="text-center py-12">
                <Coins className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No transactions yet</p>
                <p className="text-gray-400 text-xs mt-1">Start streaming to earn coins from gifts!</p>
              </div>
            ) : (
              (data?.recentTransactions || []).map((t: any) => (
                <div key={t.id} className="flex items-center gap-3 bg-white rounded-xl p-4 border border-gray-100">
                  <div className={"w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 " + (t.amount > 0 ? "bg-green-50" : "bg-red-50")}>
                    {t.amount > 0 ? <ArrowDownLeft className="w-5 h-5 text-green-500" /> : <ArrowUpRight className="w-5 h-5 text-red-500" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{t.description}</p>
                    <p className="text-xs text-gray-400">{new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className={"text-sm font-bold " + (t.amount > 0 ? "text-green-600" : "text-red-500")}>
                      {t.amount > 0 ? "+" : ""}{t.amount.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400">{t.amount > 0 ? "+" : ""}{fmt(t.amount)}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Withdraw Tab */}
        {tab === "withdraw" && (
          <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-green-500" /> Request Withdrawal</h3>
            
            <div className="bg-rose-50 rounded-xl p-4 mb-5">
              <p className="text-xs text-rose-600 font-medium">Available to withdraw</p>
              <p className="text-2xl font-extrabold text-rose-600">{(data?.availableForWithdrawal || 0).toLocaleString()} coins</p>
              <p className="text-xs text-rose-400">{fmt(data?.availableForWithdrawal || 0)}</p>
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">Amount (coins)</label>
            <input type="number" value={withdrawAmount} onChange={e => setWithdrawAmount(e.target.value)} placeholder={`Min ${data?.minWithdrawal || 1000} coins`} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none mb-1" />
            {withdrawAmount && <p className="text-xs text-gray-400 mb-4">= {fmt(parseInt(withdrawAmount) || 0)}</p>}

            <label className="block text-sm font-semibold text-gray-700 mb-2 mt-3">Payment Method</label>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {[
                { id: "bank", label: "Bank Transfer", icon: Building },
                { id: "paypal", label: "PayPal", icon: CreditCard },
                { id: "mobile", label: "Mobile Money", icon: DollarSign },
              ].map(m => (
                <button key={m.id} onClick={() => setMethod(m.id)} className={"p-3 rounded-xl text-center transition-all border-2 " + (method === m.id ? "border-rose-500 bg-rose-50 text-rose-600" : "border-gray-200 text-gray-600 hover:border-gray-300")}>
                  <m.icon className="w-5 h-5 mx-auto mb-1" />
                  <p className="text-[10px] font-bold">{m.label}</p>
                </button>
              ))}
            </div>

            <label className="block text-sm font-semibold text-gray-700 mb-2">Payment Details</label>
            <textarea value={details} onChange={e => setDetails(e.target.value)} placeholder={method === "bank" ? "Bank name, account number, account name..." : method === "paypal" ? "PayPal email address..." : "Mobile money number, provider..."} className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-rose-300 focus:border-rose-400 outline-none resize-none h-24 mb-4" />

            {msg && (
              <div className={"p-3 rounded-xl text-sm mb-4 flex items-center gap-2 " + (msg.type === "success" ? "bg-green-50 text-green-700 border border-green-200" : "bg-red-50 text-red-700 border border-red-200")}>
                {msg.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />} {msg.text}
              </div>
            )}

            <button onClick={submitWithdrawal} disabled={submitting} className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full font-bold disabled:opacity-50 hover:shadow-lg transition-all flex items-center justify-center gap-2">
              {submitting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Request Withdrawal</>}
            </button>

            <p className="text-[10px] text-gray-400 text-center mt-3">Withdrawals are reviewed and processed within 24-48 hours</p>
          </div>
        )}

        {/* Withdrawal History Tab */}
        {tab === "history" && (
          <div className="space-y-2">
            {(data?.withdrawals || []).length === 0 ? (
              <div className="text-center py-12">
                <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No withdrawals yet</p>
              </div>
            ) : (
              (data?.withdrawals || []).map((w: any) => (
                <div key={w.id} className="bg-white rounded-xl p-4 border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <DollarSign className="w-4 h-4 text-gray-400" />
                      <span className="font-bold text-gray-900">{w.amount.toLocaleString()} coins</span>
                      <span className="text-xs text-gray-400">{fmt(w.amount)}</span>
                    </div>
                    <span className={"text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 " + statusColor(w.status)}>
                      {statusIcon(w.status)} {w.status.charAt(0).toUpperCase() + w.status.slice(1)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">{w.method === "bank" ? "🏦" : w.method === "paypal" ? "💳" : "📱"} {w.method.charAt(0).toUpperCase() + w.method.slice(1)} • {new Date(w.createdAt).toLocaleDateString()}</p>
                  {w.adminNote && <p className="text-xs text-gray-400 mt-1 italic">Admin: {w.adminNote}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
