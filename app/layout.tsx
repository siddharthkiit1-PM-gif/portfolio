import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import { AdminBar } from "@/components/admin/AdminBar";
import { SiteNav } from "@/components/nav/SiteNav";
import { SmoothScrollProvider } from "@/components/scroll/SmoothScrollProvider";
import { SITE_URL } from "@/lib/site";

// Inter Variable: full weight axis drives the kinetic hero text breath.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const DESCRIPTION =
  "Siddharth Agrawal — AI product builder. Spec to ship, end to end: each project carries the problem, the people, and what worked.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Siddharth Agrawal — AI Product Builder",
    template: "%s — Siddharth Agrawal",
  },
  description: DESCRIPTION,
  applicationName: "Siddharth Agrawal Portfolio",
  authors: [{ name: "Siddharth Agrawal" }],
  creator: "Siddharth Agrawal",
  keywords: [
    "Siddharth Agrawal",
    "Product Manager",
    "AI Product Builder",
    "Portfolio",
    "Bengaluru",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    url: SITE_URL,
    title: "Siddharth Agrawal — AI Product Builder",
    description: DESCRIPTION,
    siteName: "Siddharth Agrawal",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "Siddharth Agrawal — AI Product Builder",
    description: DESCRIPTION,
  },
  robots: { index: true, follow: true },
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Siddharth Agrawal",
  url: SITE_URL,
  jobTitle: "Product Manager · AI Product Builder",
  address: { "@type": "PostalAddress", addressLocality: "Bengaluru", addressCountry: "IN" },
  sameAs: ["https://www.linkedin.com/in/siddharthagrawal18/"],
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className={`dark ${inter.variable}`}>
        <body className="antialiased bg-black text-white">
          <Providers>
            <AdminBar />
            <SmoothScrollProvider />
            <SiteNav />
            {children}
          </Providers>
          <Script
            id="person-jsonld"
            type="application/ld+json"
            strategy="afterInteractive"
          >
            {JSON.stringify(personJsonLd)}
          </Script>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
