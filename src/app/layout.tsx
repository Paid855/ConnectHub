import "./globals.css";
import type { Metadata } from "next";

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
        <meta name="google-site-verification" content="PASTE_YOUR_GOOGLE_CODE_HERE" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen">
        {children}
      </body>
    </html>
  );
}
