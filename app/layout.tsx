export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { GlobalOverlay } from "@/components/dashboard/GlobalOverlay";

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-plus-jakarta",
  weight: ["400", "500", "600", "700", "800"],
  display: 'swap',
});

export const metadata: Metadata = {
  other: {
    'preconnect': ['https://dfxhfutflhnxjjpbqscj.supabase.co', 'https://fonts.googleapis.com', 'https://fonts.gstatic.com'],
  },
  title: "Smart Notes | Secure, AI-Powered Intelligence System",
  description: "Experience the next generation of knowledge management. Secure, encrypted, and pre-indexed for AI-readability. MINI GITHUB logic for your personal and community notes.",
  metadataBase: new URL("https://notes.biz.id"),
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon.webp", type: "image/webp" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ],
  },
  openGraph: {
    title: "Smart Notes | Neural Knowledge Hub",
    description: "Military-grade intelligence suite for personal and shared notes.",
    url: "https://notes.biz.id",
    siteName: "Smart Notes Intelligence",
    images: [
      {
        url: "/og-image.webp",
        width: 1200,
        height: 630,
        alt: "Smart Notes Intelligence Suite Dashboard",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Smart Notes | Neural Knowledge Hub",
    description: "Experience the next generation of knowledge management.",
    images: ["/og-image.webp"],
  },
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${plusJakartaSans.variable} font-sans antialiased bg-background text-foreground`}
        suppressHydrationWarning
      >
        <Providers>
          {children}
          <GlobalOverlay />
          <Toaster position="top-center" richColors />
          {/* Neural Bridge: PWA Service Worker Registration */}
          <script dangerouslySetInnerHTML={{ __html: `
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(reg) {
                  // Handshake successful
                }, function(err) {
                  // Handshake failed
                });
              });
            }
          `}} />
        </Providers>
      </body>
    </html>
  );
}
