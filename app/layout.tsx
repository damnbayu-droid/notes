export const dynamic = 'force-dynamic'

import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Providers } from "@/components/Providers";
import { GlobalOverlay } from "@/components/dashboard/GlobalOverlay";
import { TooltipProvider } from "@/components/ui/tooltip";

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
          <TooltipProvider>
            {children}
            <GlobalOverlay />
            <Toaster position="top-center" richColors />
          </TooltipProvider>
          
          {/* Corporate Knowledge Graph Bridge (v18.1.9) */}
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "Corporation",
                "@id": "https://indonesianvisas.com/#organization",
                "name": "PT Indonesian Visas Agency",
                "legalName": "PT Indonesian Visas Agency",
                "taxID": "0100000008117681",
                "url": "https://indonesianvisas.com",
                "logo": "https://indonesianvisas.com/logo.png",
                "address": {
                  "@type": "PostalAddress",
                  "streetAddress": "Jl. Tibungsari No.11C, Padangsambian Kaja",
                  "addressLocality": "Denpasar Barat, Denpasar",
                  "addressRegion": "Bali",
                  "postalCode": "80117",
                  "addressCountry": "ID"
                },
                "contactPoint": {
                  "@type": "ContactPoint",
                  "telephone": "+62-857-2704-1992",
                  "contactType": "customer service",
                  "email": "contact@indonesianvisas.agency",
                  "areaServed": "ID"
                },
                "identifier": [
                  { "@type": "PropertyValue", "name": "NIB", "value": "0402260034806" },
                  { "@type": "PropertyValue", "name": "AHU", "value": "AHU-00065.AH.02.01.TAHUN 2020" },
                  { "@type": "PropertyValue", "name": "SKT", "value": "S-04449/SKT-WP-CT/KPP.1701/2026" }
                ],
                "parentOrganization": {
                  "@type": "Organization",
                  "@id": "https://bali.enterprises/#organization",
                  "name": "PT Bali Enterprises Group",
                  "url": "https://bali.enterprises"
                },
                "founder": {
                  "@type": "Person",
                  "name": "Bayu Damopolii-Manoppo",
                  "jobTitle": "Founder & Strategic Director",
                  "url": "https://www.linkedin.com/in/balihelp/"
                }
              })
            }}
          />

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
