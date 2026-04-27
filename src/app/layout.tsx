import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match",
  description: "Meet real people, make meaningful connections, and find love on ConnectHub.",
  metadataBase: new URL("https://connecthub.love"),
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    apple: "/apple-touch-icon.png",
    shortcut: "/favicon.ico",
  },
  keywords: ["dating", "dating app", "find love", "meet people", "relationships", "ConnectHub"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://connecthub.love",
    title: "ConnectHub — Find Your Perfect Match",
    description: "The dating app where real connections happen. Join ConnectHub today!",
    siteName: "ConnectHub",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectHub — Find Your Perfect Match",
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
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Playfair+Display:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{__html: `if("serviceWorker" in navigator){window.addEventListener("load",()=>{navigator.serviceWorker.register("/sw.js")})}`}} />
      </head>
      <body className="bg-white text-gray-900 antialiased min-h-screen overflow-x-hidden" style={{fontFamily:"'Inter',system-ui,sans-serif"}}>
        <ClientWrapper>{children}</ClientWrapper>

        {/* Google Translate engine. The visible language buttons are rendered by components/LanguageSelector.tsx. */}
        <div id="google_translate_element" className="google-translate-engine" aria-hidden="true" />
        <Script
          id="google-translate-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.googleTranslateElementInit = function () {
                if (!window.google || !window.google.translate) return;

                new window.google.translate.TranslateElement({
                  pageLanguage: 'en',
                  includedLanguages: 'en,fr,ff,es,de,id,it,pt,ar,ha,yo,ig,sw,zh-CN,hi,ru,tr,nl,pl',
                  layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                  autoDisplay: false
                }, 'google_translate_element');
              };
            `,
          }}
        />
        <Script
          id="google-translate-script"
          strategy="afterInteractive"
          src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
        />
      </body>
    </html>
  );
}
