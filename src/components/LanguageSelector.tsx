"use client";
import { useState } from "react";
import { Globe, X, ChevronRight } from "lucide-react";

const COMMON_LANGS = [
  { code: "en", name: "English", native: "English" },
  { code: "fr", name: "French", native: "Français" },
  { code: "es", name: "Spanish", native: "Español" },
  { code: "pt", name: "Portuguese", native: "Português" },
  { code: "de", name: "German", native: "Deutsch" },
  { code: "it", name: "Italian", native: "Italiano" },
  { code: "ar", name: "Arabic", native: "العربية" },
  { code: "hi", name: "Hindi", native: "हिन्दी" },
  { code: "zh", name: "Chinese", native: "中文" },
  { code: "ja", name: "Japanese", native: "日本語" },
];

const ALL_LANGS = [
  ...COMMON_LANGS,
  { code: "ko", name: "Korean", native: "한국어" },
  { code: "ru", name: "Russian", native: "Русский" },
  { code: "tr", name: "Turkish", native: "Türkçe" },
  { code: "nl", name: "Dutch", native: "Nederlands" },
  { code: "pl", name: "Polish", native: "Polski" },
  { code: "sv", name: "Swedish", native: "Svenska" },
  { code: "da", name: "Danish", native: "Dansk" },
  { code: "no", name: "Norwegian", native: "Norsk" },
  { code: "fi", name: "Finnish", native: "Suomi" },
  { code: "el", name: "Greek", native: "Ελληνικά" },
  { code: "cs", name: "Czech", native: "Čeština" },
  { code: "ro", name: "Romanian", native: "Română" },
  { code: "hu", name: "Hungarian", native: "Magyar" },
  { code: "th", name: "Thai", native: "ไทย" },
  { code: "vi", name: "Vietnamese", native: "Tiếng Việt" },
  { code: "id", name: "Indonesian", native: "Bahasa Indonesia" },
  { code: "ms", name: "Malay", native: "Bahasa Melayu" },
  { code: "tl", name: "Filipino", native: "Filipino" },
  { code: "sw", name: "Swahili", native: "Kiswahili" },
  { code: "ha", name: "Hausa", native: "Hausa" },
  { code: "yo", name: "Yoruba", native: "Yorùbá" },
  { code: "ig", name: "Igbo", native: "Igbo" },
  { code: "am", name: "Amharic", native: "አማርኛ" },
  { code: "uk", name: "Ukrainian", native: "Українська" },
  { code: "bg", name: "Bulgarian", native: "Български" },
  { code: "he", name: "Hebrew", native: "עברית" },
  { code: "ur", name: "Urdu", native: "اردو" },
  { code: "bn", name: "Bengali", native: "বাংলা" },
  { code: "ta", name: "Tamil", native: "தமிழ்" },
  { code: "te", name: "Telugu", native: "తెలుగు" },
];

export default function LanguageSelector({ dark }: { dark?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const dc = dark;

  const currentLang = typeof window !== "undefined" 
    ? new URLSearchParams(window.location.search).get("lang") || "en" 
    : "en";

  const switchLang = (code: string) => {
    if (code === "en") {
      // Remove lang param, reload as English
      const url = new URL(window.location.href);
      url.searchParams.delete("lang");
      window.location.href = url.toString();
    } else {
      // Google Translate approach — reload with translation
      const url = new URL(window.location.href);
      url.searchParams.set("lang", code);
      // Use Google Translate widget
      window.location.href = `https://translate.google.com/translate?sl=en&tl=${code}&u=${encodeURIComponent(window.location.origin + window.location.pathname)}`;
    }
  };

  const currentLangName = ALL_LANGS.find(l => l.code === currentLang)?.native || "English";

  return (
    <>
      <div className={"border-t py-6 px-4 " + (dc ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
        <div className="max-w-5xl mx-auto">
          {/* Current language */}
          <div className="flex items-center gap-2 mb-3">
            <Globe className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} />
            <span className={"text-xs font-medium " + (dc ? "text-gray-400" : "text-gray-500")}>
              {currentLangName} · <button onClick={() => setShowAll(true)} className="text-rose-500 hover:underline">Change language</button>
            </span>
          </div>

          {/* Common languages row */}
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {COMMON_LANGS.map(lang => (
              <button
                key={lang.code}
                onClick={() => switchLang(lang.code)}
                className={"text-xs transition-colors " + (currentLang === lang.code 
                  ? "font-bold text-rose-500" 
                  : (dc ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900")
                )}
              >
                {lang.native}
              </button>
            ))}
            <button onClick={() => setShowAll(true)} className={"text-xs font-medium flex items-center gap-0.5 " + (dc ? "text-rose-400 hover:text-rose-300" : "text-rose-500 hover:text-rose-600")}>
              More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* All languages modal */}
      {showAll && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAll(false)}>
          <div className={"w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")} onClick={e => e.stopPropagation()}>
            <div className={"flex items-center justify-between px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-200")}>
              <div>
                <h3 className={"text-lg font-bold " + (dc ? "text-white" : "text-gray-900")}>Select your language</h3>
                <p className={"text-xs mt-0.5 " + (dc ? "text-gray-400" : "text-gray-500")}>The page will reload in your selected language</p>
              </div>
              <button onClick={() => setShowAll(false)} className={"p-2 rounded-full " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}>
                <X className={"w-5 h-5 " + (dc ? "text-gray-400" : "text-gray-500")} />
              </button>
            </div>

            <div className={"px-6 py-3 border-b " + (dc ? "border-gray-700 bg-gray-750" : "border-gray-100 bg-gray-50")}>
              <p className={"text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Suggested languages</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 px-4 py-2">
              {COMMON_LANGS.slice(0, 4).map(lang => (
                <button key={lang.code} onClick={() => { switchLang(lang.code); setShowAll(false); }} className={"flex items-center gap-2 px-3 py-3 rounded-xl text-sm transition-all " + (currentLang === lang.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>
                  {lang.native} {currentLang === lang.code && "✓"}
                </button>
              ))}
            </div>

            <div className={"px-6 py-3 border-t border-b " + (dc ? "border-gray-700 bg-gray-750" : "border-gray-100 bg-gray-50")}>
              <p className={"text-xs font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>All languages</p>
            </div>
            <div className="overflow-y-auto max-h-[50vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 px-4 py-2">
              {ALL_LANGS.map(lang => (
                <button key={lang.code} onClick={() => { switchLang(lang.code); setShowAll(false); }} className={"flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm transition-all " + (currentLang === lang.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>
                  {lang.native}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
