import "./globals.css";
import type { Metadata } from "next";

export const viewport = { width: "device-width", initialScale: 1, maximumScale: 1, viewportFit: "cover" as any, userScalable: false, themeColor: "#e11d48" };

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match",
  description: "AI-powered dating platform with video-verified profiles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
