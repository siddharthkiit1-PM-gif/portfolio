import type { Metadata } from "next";
import "./globals.css";
import { ConvexAuthNextjsServerProvider } from "@convex-dev/auth/nextjs/server";
import { Providers } from "./providers";
import { AdminBar } from "@/components/admin/AdminBar";
import { SiteNav } from "@/components/nav/SiteNav";

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ConvexAuthNextjsServerProvider>
      <html lang="en" className="dark">
        <body className="antialiased bg-black text-white">
          <Providers>
            <AdminBar />
            <SiteNav />
            {children}
          </Providers>
        </body>
      </html>
    </ConvexAuthNextjsServerProvider>
  );
}
