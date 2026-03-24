"use client";
import { useState, useEffect } from "react";
import { X, Crown } from "lucide-react";
import Link from "next/link";

type Ad = { id:string; title:string; description:string; link:string; sponsor:string };

const SUBTLE_ADS: Ad[] = [
  { id:"1", title:"Upgrade to Premium for ad-free experience", description:"Unlimited messages, video calls & more", link:"/dashboard/coins", sponsor:"ConnectHub" },
  { id:"2", title:"Go Gold for the ultimate dating experience", description:"VIP badge, live streaming, priority support", link:"/dashboard/coins", sponsor:"ConnectHub" },
];

export default function AdBanner({ dark = false }: { dark?: boolean }) {
  const [ad, setAd] = useState<Ad|null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [adFree, setAdFree] = useState(false);
  const dc = dark;

  useEffect(() => {
    fetch("/api/ads?placement=feed").then(r=>r.json()).then(d=>{
      if (d.adFree) { setAdFree(true); return; }
      setAd(SUBTLE_ADS[Math.floor(Math.random()*SUBTLE_ADS.length)]);
    }).catch(()=>{});
  }, []);

  if (adFree || dismissed || !ad) return null;

  return (
    <div className={"relative rounded-xl border px-4 py-3 mb-4 flex items-center gap-3 " + (dc?"bg-gradient-to-r from-gray-800 to-gray-750 border-gray-700":"bg-gradient-to-r from-rose-50 to-pink-50 border-rose-100")}>
      <Crown className={"w-5 h-5 flex-shrink-0 " + (dc?"text-amber-400":"text-amber-500")} />
      <Link href={ad.link} className="flex-1 min-w-0">
        <p className={"text-sm font-semibold " + (dc?"text-white":"text-gray-900")}>{ad.title}</p>
        <p className={"text-xs " + (dc?"text-gray-400":"text-gray-500")}>{ad.description}</p>
      </Link>
      <button onClick={()=>setDismissed(true)} className="p-1 flex-shrink-0"><X className="w-3.5 h-3.5 text-gray-400" /></button>
    </div>
  );
}
