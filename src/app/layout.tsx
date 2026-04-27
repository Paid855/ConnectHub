import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match",
  description: "Meet real people, make meaningful connections, and find love on ConnectHub.",
  keywords: "dating,dating app,find love,meet people,relationships,ConnectHub",
  openGraph: {
    title: "ConnectHub — Find Your Perfect Match",
    description: "The dating app where real connections happen. Join ConnectHub today!",
    url: "https://connecthub.love",
    siteName: "ConnectHub",
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectHub — Find Your Perfect Match",
    description: "The dating app where real connections happen.",
  },
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon.ico", sizes: "48x48" },
    ],
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png",
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
      <body className="bg-white text-gray-900 antialiased min-h-screen overflow-x-hidden" style={{ fontFamily: "'Inter',system-ui,sans-serif" }}>
        {children}
        <Script id="gt-init" strategy="afterInteractive">
          {`function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'en,es,fr,pt,de,ar,hi,zh-CN,ja,ko,tr,ru,it,sw,yo,ig,zu,af,ha',layout:google.translate.TranslateElement.InlineLayout.SIMPLE,autoDisplay:false},'google_translate_element')}`}
        </Script>
        <Script src="https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  );
}
