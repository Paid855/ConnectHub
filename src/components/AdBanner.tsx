"use client";
import { useState, useEffect } from "react";
import { X, ExternalLink } from "lucide-react";

type Ad = { id: string; title: string; description: string; image: string; link: string; sponsor: string };

export default function AdBanner({ placement = "feed", dark = false }: { placement?: string; dark?: boolean }) {
  const [ad, setAd] = useState<Ad | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const [adFree, setAdFree] = useState(false);
  const dc = dark;

  useEffect(() => {
    fetch("/api/ads?placement=" + placement)
      .then(r => r.json())
      .then(d => {
        if (d.adFree) { setAdFree(true); return; }
        if (d.ads?.length > 0) setAd(d.ads[0]);
      })
      .catch(() => {});
  }, [placement]);

  if (adFree || dismissed || !ad) return null;

  return (
    <div className={"relative rounded-2xl border overflow-hidden mb-5 " + (dc ? "bg-gray-800 border-gray-700" : "bg-white border-gray-100 shadow-sm")}>
      <div className="flex items-center justify-between px-3 py-1.5 border-b border-gray-100 dark:border-gray-700">
        <span className={"text-[10px] font-medium " + (dc ? "text-gray-500" : "text-gray-400")}>Sponsored · {ad.sponsor}</span>
        <div className="flex items-center gap-2">
          <a href="/dashboard/coins" className={"text-[10px] font-bold hover:underline " + (dc ? "text-rose-400" : "text-rose-500")}>Remove ads ↗</a>
          <button onClick={() => setDismissed(true)} className="p-0.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"><X className="w-3 h-3 text-gray-400" /></button>
        </div>
      </div>
      <a href={ad.link} target="_blank" rel="noopener noreferrer" className="block hover:opacity-90 transition-opacity">
        <img src={ad.image} alt={ad.title} className="w-full h-36 object-cover" />
        <div className="p-3">
          <h4 className={"font-bold text-sm " + (dc ? "text-white" : "text-gray-900")}>{ad.title}</h4>
          <p className={"text-xs mt-0.5 " + (dc ? "text-gray-400" : "text-gray-500")}>{ad.description}</p>
          <span className="flex items-center gap-1 text-rose-500 text-xs font-semibold mt-2">Learn more <ExternalLink className="w-3 h-3" /></span>
        </div>
      </a>
    </div>
  );
}
