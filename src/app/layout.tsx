import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { ScoringNavigationProvider } from "@/components/layout/ScoringNavigation";
import { SITE_ORIGIN } from "@/lib/site-origin";
import SwRegister from "./sw-register";

const inter = localFont({
  src: "./fonts/Inter-Latin-Variable.woff2",
  variable: "--font-inter",
  weight: "100 900",
  style: "normal",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: "Panara",
  description:
    "Lacak dan hitung skor latihan panahan Anda dengan mudah — rambahan, skor target, dan status kelulusan.",
};

export const viewport: Viewport = {
  themeColor: "#101c17",
  viewportFit: "cover",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${inter.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col transition-colors duration-300">
        <ScoringNavigationProvider>
          <Header />
          {children}
        </ScoringNavigationProvider>
        <SwRegister />
      </body>
    </html>
  );
}
