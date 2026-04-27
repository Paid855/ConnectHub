"use client";
import { useState, useEffect } from "react";
import { Globe, X, ChevronRight } from "lucide-react";

const COMMON = [
  { code: "en", name: "English" }, { code: "fr", name: "Français" },
  { code: "es", name: "Español" }, { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" }, { code: "it", name: "Italiano" },
  { code: "ar", name: "العربية" }, { code: "hi", name: "हिन्दी" },
  { code: "zh-CN", name: "中文" }, { code: "ja", name: "日本語" },
];
const ALL = [
  ...COMMON,
  { code: "ko", name: "한국어" }, { code: "ru", name: "Русский" }, { code: "tr", name: "Türkçe" },
  { code: "nl", name: "Nederlands" }, { code: "pl", name: "Polski" }, { code: "sv", name: "Svenska" },
  { code: "el", name: "Ελληνικά" }, { code: "th", name: "ไทย" }, { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Indonesia" }, { code: "sw", name: "Kiswahili" }, { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yorùbá" }, { code: "uk", name: "Українська" }, { code: "bn", name: "বাংলা" },
  { code: "am", name: "አማርኛ" }, { code: "ur", name: "اردو" }, { code: "ta", name: "தமிழ்" },
];

export default function LanguageSelector({ dark }: { dark?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const [current, setCurrent] = useState("en");
  const dc = dark;

  useEffect(() => {
    setCurrent(localStorage.getItem("ch_lang") || "en");
  }, []);

  const switchLang = (code: string) => {
    setCurrent(code);
    setShowAll(false);
    localStorage.setItem("ch_lang", code);
    // Set googtrans cookie on all domains
    const host = location.hostname;
    if (code === "en") {
      document.cookie = "googtrans=;path=/;expires=Thu, 01 Jan 1970 00:00:00 UTC";
      document.cookie = "googtrans=;path=/;domain=." + host + ";expires=Thu, 01 Jan 1970 00:00:00 UTC";
      document.cookie = "googtrans=;path=/;domain=" + host + ";expires=Thu, 01 Jan 1970 00:00:00 UTC";
    } else {
      const val = "/en/" + code;
      document.cookie = "googtrans=" + val + ";path=/";
      document.cookie = "googtrans=" + val + ";path=/;domain=." + host;
      document.cookie = "googtrans=" + val + ";path=/;domain=" + host;
    }
    location.reload();
  };

  return (
    <>
      <div className={"border-t py-5 px-4 notranslate " + (dc ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Globe className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} />
            <span className={"text-xs font-medium " + (dc ? "text-gray-400" : "text-gray-500")}>{ALL.find(l => l.code === current)?.name || "English"}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {COMMON.map(l => (
              <button key={l.code} onClick={() => switchLang(l.code)} className={"text-xs transition-colors " + (current === l.code ? "font-bold text-rose-500" : (dc ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"))}>{l.name}</button>
            ))}
            <button onClick={() => setShowAll(true)} className={"text-xs font-medium flex items-center gap-0.5 " + (dc ? "text-rose-400" : "text-rose-500")}>More <ChevronRight className="w-3 h-3" /></button>
          </div>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 notranslate" onClick={() => setShowAll(false)}>
          <div className={"w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")} onClick={e => e.stopPropagation()}>
            <div className={"flex items-center justify-between px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-200")}>
              <h3 className={"text-lg font-bold " + (dc ? "text-white" : "text-gray-900")}>Select your language</h3>
              <button onClick={() => setShowAll(false)} className={"p-2 rounded-full " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><X className={"w-5 h-5 " + (dc ? "text-gray-400" : "text-gray-500")} /></button>
            </div>
            <div className="overflow-y-auto max-h-[65vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 px-4 py-2">
              {ALL.map(l => (
                <button key={l.code} onClick={() => switchLang(l.code)} className={"px-3 py-2.5 rounded-xl text-sm text-left transition-all " + (current === l.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>{l.name} {current === l.code && "✓"}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
