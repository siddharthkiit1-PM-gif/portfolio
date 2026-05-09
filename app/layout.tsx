import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import { AdminBar } from "@/components/admin/AdminBar";
import { SiteNav } from "@/components/nav/SiteNav";
import { SmoothScrollProvider } from "@/components/scroll/SmoothScrollProvider";

// Inter Variable: full weight axis drives the kinetic hero text breath.
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
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
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
