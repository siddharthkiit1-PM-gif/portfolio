import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Siddharth Agrawal — Portfolio",
  description: "Product manager and builder.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased bg-black text-white">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
