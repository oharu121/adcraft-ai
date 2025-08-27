import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: "AdCraft AI - AI Video Generator",
  description: "Transform text prompts into professional video content using cutting-edge AI technology. Built for AI Agent Hackathon 2025.",
  keywords: ["AI", "video generation", "artificial intelligence", "video content", "automation"],
  authors: [{ name: "AdCraft AI Team" }],
  creator: "AdCraft AI",
  publisher: "AdCraft AI",
  robots: "index, follow",
  manifest: "/manifest.json",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://adcraft-ai.com",
    siteName: "AdCraft AI",
    title: "AdCraft AI - AI Video Generator",
    description: "Transform text prompts into professional video content using cutting-edge AI technology.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "AdCraft AI - AI Video Generator",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "AdCraft AI - AI Video Generator",
    description: "Transform text prompts into professional video content using cutting-edge AI technology.",
    images: ["/og-image.jpg"],
  },
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({
  children,
}: RootLayoutProps) {
  return (
    <html className="scroll-smooth" data-scroll-behavior="smooth">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-slate-50`}
      >
        {children}
      </body>
    </html>
  );
}
