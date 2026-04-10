import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match",
  description: "Meet real people, make meaningful connections, and find love on ConnectHub.",
  metadataBase: new URL("https://connecthub.love"),
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
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen">
        <ClientWrapper>{children}</ClientWrapper>
        <div id="google_translate_element" className="notranslate" />
        <Script id="gt-init" strategy="afterInteractive">{`function googleTranslateElementInit(){new google.translate.TranslateElement({pageLanguage:'en',includedLanguages:'en,es,fr,pt,de,ar,hi,zh-CN,sw,yo,ja,ko,tr,ru,it,nl,pl,vi,th,id,ms,tl,sv,da,no,fi,ro,uk,el,he,bn,ta,ur,am,ha,ig,zu,af',layout:google.translate.TranslateElement.InlineLayout.SIMPLE,autoDisplay:false},'google_translate_element')}`}</Script>
        <Script src="//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit" strategy="afterInteractive" />
      </body>
    </html>
  );
}
