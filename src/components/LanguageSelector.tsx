"use client";
import { useState, useEffect, useCallback } from "react";
import { Globe, X, ChevronRight } from "lucide-react";

const COMMON_LANGS = [
  { code: "en", name: "English" },
  { code: "fr", name: "Français" },
  { code: "es", name: "Español" },
  { code: "pt", name: "Português" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ar", name: "العربية" },
  { code: "hi", name: "हिन्दी" },
  { code: "zh-CN", name: "中文" },
  { code: "ja", name: "日本語" },
];

const ALL_LANGS = [
  ...COMMON_LANGS,
  { code: "ko", name: "한국어" },
  { code: "ru", name: "Русский" },
  { code: "tr", name: "Türkçe" },
  { code: "nl", name: "Nederlands" },
  { code: "pl", name: "Polski" },
  { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" },
  { code: "no", name: "Norsk" },
  { code: "fi", name: "Suomi" },
  { code: "el", name: "Ελληνικά" },
  { code: "cs", name: "Čeština" },
  { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" },
  { code: "th", name: "ไทย" },
  { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Bahasa Indonesia" },
  { code: "ms", name: "Bahasa Melayu" },
  { code: "tl", name: "Filipino" },
  { code: "sw", name: "Kiswahili" },
  { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yorùbá" },
  { code: "ig", name: "Igbo" },
  { code: "am", name: "አማርኛ" },
  { code: "uk", name: "Українська" },
  { code: "bg", name: "Български" },
  { code: "he", name: "עברית" },
  { code: "ur", name: "اردو" },
  { code: "bn", name: "বাংলা" },
  { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
];

export default function LanguageSelector({ dark }: { dark?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [loaded, setLoaded] = useState(false);
  const dc = dark;

  // Load Google Translate widget
  useEffect(() => {
    const saved = localStorage.getItem("ch_lang");
    if (saved) setCurrentLang(saved);

    // Add Google Translate meta and script
    if (!document.getElementById("gt-script")) {
      // Add the hidden div for Google Translate
      const gtDiv = document.createElement("div");
      gtDiv.id = "google_translate_element";
      gtDiv.style.display = "none";
      document.body.appendChild(gtDiv);

      (window as any).googleTranslateElementInit = () => {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: "en",
          includedLanguages: ALL_LANGS.map(l => l.code).join(","),
          autoDisplay: false,
          layout: (window as any).google.translate.TranslateElement?.InlineLayout?.SIMPLE
        }, "google_translate_element");
        setLoaded(true);
      };

      const script = document.createElement("script");
      script.id = "gt-script";
      script.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(script);
    } else {
      setLoaded(true);
    }
  }, []);

  const switchLang = useCallback((code: string) => {
    setCurrentLang(code);
    setShowAll(false);
    localStorage.setItem("ch_lang", code);

    if (code === "en") {
      // Reset to English
      const frame = document.querySelector(".goog-te-banner-frame") as HTMLIFrameElement;
      if (frame) {
        const btn = frame.contentDocument?.querySelector(".goog-close-link") as HTMLElement;
        if (btn) btn.click();
      }
      // Also try via cookie
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
      document.cookie = "googtrans=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; domain=." + window.location.hostname;
      window.location.reload();
      return;
    }

    // Trigger Google Translate by selecting the language in the hidden widget
    const doTranslate = () => {
      const select = document.querySelector("#google_translate_element select") as HTMLSelectElement;
      if (select) {
        select.value = code;
        select.dispatchEvent(new Event("change"));
      }
    };

    if (loaded) {
      doTranslate();
    } else {
      // Wait for widget to load
      const check = setInterval(() => {
        const select = document.querySelector("#google_translate_element select") as HTMLSelectElement;
        if (select) { clearInterval(check); select.value = code; select.dispatchEvent(new Event("change")); }
      }, 500);
      setTimeout(() => clearInterval(check), 10000);
    }
  }, [loaded]);

  // Auto-apply saved language on load
  useEffect(() => {
    if (!loaded) return;
    const saved = localStorage.getItem("ch_lang");
    if (saved && saved !== "en") {
      const timer = setTimeout(() => {
        const select = document.querySelector("#google_translate_element select") as HTMLSelectElement;
        if (select && select.value !== saved) {
          select.value = saved;
          select.dispatchEvent(new Event("change"));
        }
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [loaded]);

  const currentName = ALL_LANGS.find(l => l.code === currentLang)?.name || "English";

  return (
    <>
      <div className={"border-t py-5 px-4 " + (dc ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
        <div className="max-w-5xl mx-auto">
          <div className="flex items-center gap-2 mb-3">
            <Globe className={"w-4 h-4 " + (dc ? "text-gray-500" : "text-gray-400")} />
            <span className={"text-xs font-medium " + (dc ? "text-gray-400" : "text-gray-500")}>{currentName}</span>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1.5">
            {COMMON_LANGS.map(lang => (
              <button key={lang.code} onClick={() => switchLang(lang.code)} className={"text-xs transition-colors " + (currentLang === lang.code ? "font-bold text-rose-500" : (dc ? "text-gray-400 hover:text-white" : "text-gray-500 hover:text-gray-900"))}>{lang.name}</button>
            ))}
            <button onClick={() => setShowAll(true)} className={"text-xs font-medium flex items-center gap-0.5 " + (dc ? "text-rose-400" : "text-rose-500")}>
              More <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {showAll && (
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setShowAll(false)}>
          <div className={"w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")} onClick={e => e.stopPropagation()}>
            <div className={"flex items-center justify-between px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-200")}>
              <div>
                <h3 className={"text-lg font-bold " + (dc ? "text-white" : "text-gray-900")}>Select your language</h3>
                <p className={"text-xs mt-0.5 " + (dc ? "text-gray-400" : "text-gray-500")}>The page will translate automatically</p>
              </div>
              <button onClick={() => setShowAll(false)} className={"p-2 rounded-full " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><X className={"w-5 h-5 " + (dc ? "text-gray-400" : "text-gray-500")} /></button>
            </div>

            <div className={"px-6 py-2 border-b " + (dc ? "border-gray-700 bg-gray-750" : "border-gray-100 bg-gray-50")}>
              <p className={"text-[10px] font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Suggested</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 px-4 py-1">
              {COMMON_LANGS.slice(0, 4).map(lang => (
                <button key={lang.code} onClick={() => switchLang(lang.code)} className={"px-3 py-2.5 rounded-xl text-sm text-left transition-all " + (currentLang === lang.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>{lang.name} {currentLang === lang.code && "✓"}</button>
              ))}
            </div>

            <div className={"px-6 py-2 border-t border-b " + (dc ? "border-gray-700 bg-gray-750" : "border-gray-100 bg-gray-50")}>
              <p className={"text-[10px] font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>All languages</p>
            </div>
            <div className="overflow-y-auto max-h-[50vh] grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 px-4 py-1">
              {ALL_LANGS.map(lang => (
                <button key={lang.code} onClick={() => switchLang(lang.code)} className={"px-3 py-2 rounded-xl text-sm text-left transition-all " + (currentLang === lang.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>{lang.name}</button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hide Google Translate's default UI */}
      <style jsx global>{`
        .goog-te-banner-frame { display: none !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .skiptranslate { display: none !important; }
        body { top: 0 !important; }
        .goog-te-gadget { font-size: 0 !important; }
        #google_translate_element { display: none !important; }
        .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
        .VIpgJd-ZVi9od-l4eHX-hSRGPd { display: none !important; }
      `}</style>
    </>
  );
}
