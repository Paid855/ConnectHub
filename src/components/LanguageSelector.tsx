"use client";
import { useEffect, useRef } from "react";

export default function LanguageSelector({ dark }: { dark?: boolean }) {
  const dc = dark;
  const loaded = useRef(false);

  useEffect(() => {
    if (loaded.current) return;
    loaded.current = true;

    // Create the Google Translate element
    if (!document.getElementById("gte")) {
      const d = document.createElement("div");
      d.id = "gte";
      document.getElementById("gt-container")?.appendChild(d);
    }

    // Define callback
    (window as any).googleTranslateElementInit = () => {
      try {
        new (window as any).google.translate.TranslateElement({
          pageLanguage: "en",
          includedLanguages: "en,fr,es,pt,de,it,ar,hi,zh-CN,ja,ko,ru,tr,nl,pl,sv,el,th,vi,id,sw,ha,yo,uk,bn,am,ur,ta,te",
          layout: (window as any).google.translate.TranslateElement.InlineLayout.HORIZONTAL,
          autoDisplay: false,
        }, "gte");
      } catch {}
    };

    // Load script
    if (!document.getElementById("gt-script")) {
      const s = document.createElement("script");
      s.id = "gt-script";
      s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit";
      document.body.appendChild(s);
    } else {
      // Script already loaded, reinitialize
      if ((window as any).google?.translate) {
        (window as any).googleTranslateElementInit();
      }
    }
  }, []);

  return (
    <>
      <div className={"border-t py-4 px-4 " + (dc ? "border-gray-700 bg-gray-900" : "border-gray-200 bg-gray-50")}>
        <div className="max-w-5xl mx-auto flex items-center gap-3 flex-wrap">
          <span className={"text-xs font-medium " + (dc ? "text-gray-400" : "text-gray-500")}>🌐 Language:</span>
          <div id="gt-container" className="gt-wrapper" />
        </div>
      </div>

      <style jsx global>{`
        /* Hide Google Translate top banner */
        .goog-te-banner-frame { display: none !important; }
        body { top: 0 !important; }
        body > .skiptranslate:first-child { display: none !important; }
        #goog-gt-tt, .goog-te-balloon-frame { display: none !important; }
        .VIpgJd-ZVi9od-ORHb-OEVmcd { display: none !important; }
        .VIpgJd-ZVi9od-l4eHX-hSRGPd { display: none !important; }

        /* Style the Google Translate dropdown */
        .gt-wrapper .goog-te-gadget { font-family: inherit !important; }
        .gt-wrapper .goog-te-gadget-simple {
          background: ${dc ? '#1f2937' : '#f9fafb'} !important;
          border: 1px solid ${dc ? '#374151' : '#e5e7eb'} !important;
          border-radius: 12px !important;
          padding: 6px 12px !important;
          font-size: 13px !important;
          cursor: pointer !important;
          display: inline-flex !important;
          align-items: center !important;
        }
        .gt-wrapper .goog-te-gadget-simple span {
          color: ${dc ? '#d1d5db' : '#374151'} !important;
          font-size: 13px !important;
        }
        .gt-wrapper .goog-te-gadget-simple .goog-te-menu-value span:first-child {
          font-weight: 600 !important;
        }
        .gt-wrapper .goog-te-gadget-icon { display: none !important; }
        .gt-wrapper .goog-te-gadget-simple img { display: none !important; }
        .gt-wrapper .goog-te-combo {
          background: ${dc ? '#1f2937' : '#f9fafb'} !important;
          border: 1px solid ${dc ? '#374151' : '#e5e7eb'} !important;
          border-radius: 12px !important;
          padding: 8px 14px !important;
          font-size: 13px !important;
          color: ${dc ? '#d1d5db' : '#374151'} !important;
          cursor: pointer !important;
          outline: none !important;
          font-family: inherit !important;
          min-width: 160px !important;
        }
        .gt-wrapper .goog-te-combo:hover {
          border-color: #f43f5e !important;
        }
        .gt-wrapper .goog-te-gadget { color: transparent !important; font-size: 0 !important; }
        .gt-wrapper .goog-te-gadget > span { display: none !important; }
      `}</style>
    </>
  );
}
