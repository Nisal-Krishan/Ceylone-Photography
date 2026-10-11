import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AppNav } from "@/components/AppNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ceylon Camera Center — POS & Rentals",
  description: "Point of sale, rental billing and inventory for Ceylon Camera Center.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-zinc-950 font-sans text-zinc-100 antialiased print:bg-white print:text-black">
        <AppNav />
        <main>{children}</main>
      </body>
    </html>
  );
}
