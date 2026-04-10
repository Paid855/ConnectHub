import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match 💕",
  description: "Meet real people, make meaningful connections, and find love on ConnectHub.",
  metadataBase: new URL("https://connecthub.love"),
  keywords: ["dating", "dating app", "find love", "meet people", "relationships", "ConnectHub"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://connecthub.love",
    title: "ConnectHub — Find Your Perfect Match 💕",
    description: "The dating app where real connections happen. Join ConnectHub today!",
    siteName: "ConnectHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectHub — Find Your Perfect Match 💕",
    description: "The dating app where real connections happen.",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e11d48" />
        <meta name="google-site-verification" content="C4a3Fnhsqxc4fYxSdg2urqEkOHYwYrrF7-L1nmdLdzI" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen">
        {children}

        <div id="google_translate_element" className="notranslate" />

        <Script id="gt-init" strategy="afterInteractive">{`
          function googleTranslateElementInit(){
            new google.translate.TranslateElement({
              pageLanguage:'en',
              includedLanguages:'en,es,fr,pt,de,ar,hi,zh-CN,sw,yo,ja,ko,tr,ru,it,nl,pl,vi,th,id,ms,tl,sv,da,no,fi,ro,uk,el,he,bn,ta,ur,am,ha,ig,zu,af',
              layout:google.translate.TranslateElement.InlineLayout.SIMPLE,
              autoDisplay:false
            },'google_translate_element');
          }
        `}</Script>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />

        <style>{`
          .goog-te-banner-frame{display:none!important}
          body{top:0!important;position:static!important}
          .skiptranslate>iframe{display:none!important;height:0!important;width:0!important}
          #goog-gt-tt,.goog-te-balloon-frame{display:none!important}
          .goog-text-highlight{background:none!important;box-shadow:none!important}
          .goog-te-gadget{font-size:0!important;margin:0!important}
          .goog-te-gadget>span{display:none!important}
          .goog-te-gadget img{display:none!important}
          .goog-te-gadget .goog-te-combo{padding:8px 14px;border-radius:10px;border:1px solid #e5e7eb;font-size:13px;font-family:-apple-system,BlinkMacSystemFont,sans-serif;color:#374151;background:white;cursor:pointer;outline:none;min-width:140px}
          .goog-te-gadget .goog-te-combo:hover{border-color:#f43f5e}
          .goog-te-gadget .goog-te-combo:focus{border-color:#f43f5e;box-shadow:0 0 0 3px rgba(244,63,94,0.15)}
          #google_translate_element{position:fixed;bottom:80px;left:12px;z-index:99999;background:white;border-radius:14px;padding:6px 10px;box-shadow:0 4px 24px rgba(0,0,0,0.12);border:1px solid #e5e7eb}
          @media(min-width:1024px){#google_translate_element{bottom:16px}}
        `}</style>
      </body>
    </html>
  );
}
