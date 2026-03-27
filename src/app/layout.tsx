import "./globals.css";
import type { Metadata } from "next";
import ClientWrapper from "@/components/ClientWrapper";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match 💕",
  description: "ConnectHub is the world's most exciting dating platform. Meet real people, make meaningful connections, video chat, and find love. Join millions finding their perfect match!",
  metadataBase: new URL("https://connecthub.love"),
  keywords: ["dating", "dating app", "find love", "meet people", "relationships", "matchmaking", "video dating", "ConnectHub"],
  authors: [{ name: "ConnectHub Team" }],
  creator: "ConnectHub",
  publisher: "ConnectHub",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://connecthub.love",
    title: "ConnectHub — Find Your Perfect Match 💕",
    description: "Meet real people, make meaningful connections, and find love on ConnectHub. Video dating, AI matching, and a vibrant community await you!",
    siteName: "ConnectHub",
    images: [
      {
        url: "https://connecthub.love/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "ConnectHub - Find Your Perfect Match",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ConnectHub — Find Your Perfect Match 💕",
    description: "The dating app where real connections happen. Join ConnectHub today!",
    images: ["https://connecthub.love/og-image.jpg"],
    creator: "@connecthublove",
  },
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  verification: {
    google: "",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#e11d48" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className="bg-white text-gray-900 font-sans antialiased min-h-screen">
        <ClientWrapper>{children}</ClientWrapper>
      </body>
    </html>
  );
}
