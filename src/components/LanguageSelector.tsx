"use client";
import { useState, useEffect } from "react";
import { Globe, X, ChevronRight, Loader2 } from "lucide-react";

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
  { code: "ko", name: "한국어" }, { code: "ru", name: "Русский" }, { code: "tr", name: "Türkçe" },
  { code: "nl", name: "Nederlands" }, { code: "pl", name: "Polski" }, { code: "sv", name: "Svenska" },
  { code: "da", name: "Dansk" }, { code: "no", name: "Norsk" }, { code: "fi", name: "Suomi" },
  { code: "el", name: "Ελληνικά" }, { code: "cs", name: "Čeština" }, { code: "ro", name: "Română" },
  { code: "hu", name: "Magyar" }, { code: "th", name: "ไทย" }, { code: "vi", name: "Tiếng Việt" },
  { code: "id", name: "Bahasa Indonesia" }, { code: "ms", name: "Bahasa Melayu" },
  { code: "tl", name: "Filipino" }, { code: "sw", name: "Kiswahili" }, { code: "ha", name: "Hausa" },
  { code: "yo", name: "Yorùbá" }, { code: "ig", name: "Igbo" }, { code: "am", name: "አማርኛ" },
  { code: "uk", name: "Українська" }, { code: "bg", name: "Български" }, { code: "he", name: "עברית" },
  { code: "ur", name: "اردو" }, { code: "bn", name: "বাংলা" }, { code: "ta", name: "தமிழ்" },
  { code: "te", name: "తెలుగు" },
];

// Translate all text nodes on the page using the free Google Translate API
async function translatePage(targetLang: string) {
  if (targetLang === "en") return;
  
  // Collect all visible text
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode: (node) => {
      const parent = node.parentElement;
      if (!parent) return NodeFilter.FILTER_REJECT;
      if (parent.closest(".notranslate")) return NodeFilter.FILTER_REJECT;
      if (parent.tagName === "SCRIPT" || parent.tagName === "STYLE" || parent.tagName === "TEXTAREA" || parent.tagName === "INPUT") return NodeFilter.FILTER_REJECT;
      if (!node.textContent?.trim()) return NodeFilter.FILTER_REJECT;
      return NodeFilter.FILTER_ACCEPT;
    }
  });

  const textNodes: { node: Text; original: string }[] = [];
  let node;
  while (node = walker.nextNode()) {
    const text = node.textContent?.trim();
    if (text && text.length > 1 && !/^[0-9.,\-+%$€£¥]+$/.test(text)) {
      textNodes.push({ node: node as Text, original: text });
    }
  }

  // Batch translate in chunks of 50
  const batchSize = 50;
  for (let i = 0; i < textNodes.length; i += batchSize) {
    const batch = textNodes.slice(i, i + batchSize);
    const texts = batch.map(t => t.original);
    
    try {
      const q = texts.map(t => encodeURIComponent(t)).join("&q=");
      const res = await fetch(
        `https://translate.googleapis.com/translate_a/t?client=gtx&sl=en&tl=${targetLang}&q=${q}`,
        { headers: { "Content-Type": "application/json" } }
      );
      
      if (!res.ok) {
        // Fallback: translate one by one
        for (const item of batch) {
          try {
            const r2 = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(item.original)}`);
            const d2 = await r2.json();
            if (d2?.[0]?.[0]?.[0]) {
              item.node.textContent = item.node.textContent!.replace(item.original, d2[0][0][0]);
            }
          } catch {}
        }
        continue;
      }
      
      const data = await res.json();
      if (Array.isArray(data)) {
        data.forEach((translated: any, idx: number) => {
          const text = typeof translated === "string" ? translated : translated?.[0];
          if (text && batch[idx]) {
            batch[idx].node.textContent = batch[idx].node.textContent!.replace(batch[idx].original, text);
          }
        });
      }
    } catch {
      // Single translation fallback
      for (const item of batch) {
        try {
          const r = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=${targetLang}&dt=t&q=${encodeURIComponent(item.original)}`);
          const d = await r.json();
          if (d?.[0]?.[0]?.[0]) {
            item.node.textContent = item.node.textContent!.replace(item.original, d[0][0][0]);
          }
        } catch {}
      }
    }
  }
}

export default function LanguageSelector({ dark }: { dark?: boolean }) {
  const [showAll, setShowAll] = useState(false);
  const [currentLang, setCurrentLang] = useState("en");
  const [translating, setTranslating] = useState(false);
  const dc = dark;

  useEffect(() => {
    const saved = localStorage.getItem("ch_lang") || "en";
    setCurrentLang(saved);
    if (saved !== "en") {
      // Auto-translate on page load
      setTranslating(true);
      setTimeout(() => {
        translatePage(saved).then(() => setTranslating(false)).catch(() => setTranslating(false));
      }, 1000);
    }
  }, []);

  const switchLang = async (code: string) => {
    setCurrentLang(code);
    setShowAll(false);
    localStorage.setItem("ch_lang", code);

    if (code === "en") {
      localStorage.removeItem("ch_lang");
      window.location.reload(); // Reload to get original English
      return;
    }

    setTranslating(true);
    await translatePage(code);
    setTranslating(false);
  };

  const currentName = ALL_LANGS.find(l => l.code === currentLang)?.name || "English";

  return (
    <>
      {/* Translating indicator */}
      {translating && (
        <div className="fixed top-0 left-0 right-0 z-[9999] bg-gradient-to-r from-rose-500 to-pink-500 text-white text-center py-1.5 text-xs font-bold flex items-center justify-center gap-2">
          <Loader2 className="w-3 h-3 animate-spin" /> Translating page...
        </div>
      )}

      <div className={"border-t py-5 px-4 notranslate " + (dc ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
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
        <div className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 notranslate" onClick={() => setShowAll(false)}>
          <div className={"w-full max-w-2xl max-h-[80vh] rounded-2xl shadow-2xl overflow-hidden " + (dc ? "bg-gray-800" : "bg-white")} onClick={e => e.stopPropagation()}>
            <div className={"flex items-center justify-between px-6 py-4 border-b " + (dc ? "border-gray-700" : "border-gray-200")}>
              <div>
                <h3 className={"text-lg font-bold " + (dc ? "text-white" : "text-gray-900")}>Select your language</h3>
                <p className={"text-xs mt-0.5 " + (dc ? "text-gray-400" : "text-gray-500")}>Page text will be translated instantly</p>
              </div>
              <button onClick={() => setShowAll(false)} className={"p-2 rounded-full " + (dc ? "hover:bg-gray-700" : "hover:bg-gray-100")}><X className={"w-5 h-5 " + (dc ? "text-gray-400" : "text-gray-500")} /></button>
            </div>
            <div className={"px-6 py-2 border-b " + (dc ? "border-gray-700" : "border-gray-100 bg-gray-50")}>
              <p className={"text-[10px] font-bold uppercase tracking-wider " + (dc ? "text-gray-500" : "text-gray-400")}>Suggested</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 px-4 py-1">
              {COMMON_LANGS.slice(0, 4).map(lang => (
                <button key={lang.code} onClick={() => switchLang(lang.code)} className={"px-3 py-2.5 rounded-xl text-sm text-left transition-all " + (currentLang === lang.code ? (dc ? "bg-rose-500/20 text-rose-400 font-bold" : "bg-rose-50 text-rose-600 font-bold") : (dc ? "text-gray-300 hover:bg-gray-700" : "text-gray-700 hover:bg-gray-50"))}>{lang.name} {currentLang === lang.code && "✓"}</button>
              ))}
            </div>
            <div className={"px-6 py-2 border-t border-b " + (dc ? "border-gray-700" : "border-gray-100 bg-gray-50")}>
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
    </>
  );
}
