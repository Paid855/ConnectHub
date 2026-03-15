import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "ConnectHub — Find Your Perfect Match",
  description: "AI-powered dating platform with video-verified profiles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-white text-gray-900 antialiased min-h-screen overflow-x-hidden">
        {children}
      </body>
    </html>
  );
}
